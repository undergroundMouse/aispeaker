import { randomUUID } from 'node:crypto'
import WebSocket from 'ws'

const DASHSCOPE_WS_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference'

interface DashScopeHeader {
  action?: string
  task_id?: string
  event?: string
}

interface DashScopeSentence {
  text?: string
  sentence_end?: boolean
}

interface DashScopeMessage {
  header?: DashScopeHeader
  payload?: {
    output?: {
      sentence?: DashScopeSentence
    }
  }
}

export interface ParaformerRealtimeAsrOptions {
  apiKey: string
  model: string
  language: 'zh' | 'en'
}

export class ParaformerRealtimeAsrSession {
  private readonly taskId = randomUUID()
  private readonly finalizedSentences: string[] = []
  private latestPartial = ''
  private socket: WebSocket | null = null
  private ready = false
  private finished = false

  constructor(private readonly options: ParaformerRealtimeAsrOptions) {}

  async start(onResult: (event: { type: 'interim' | 'final'; text: string }) => void): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.socket = new WebSocket(DASHSCOPE_WS_URL, {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'X-DashScope-DataInspection': 'enable',
        },
      })

      this.socket.on('open', () => {
        this.sendJson({
          header: {
            action: 'run-task',
            task_id: this.taskId,
            streaming: 'duplex',
          },
          payload: {
            task_group: 'audio',
            task: 'asr',
            function: 'recognition',
            model: this.options.model,
            parameters: {
              format: 'pcm',
              sample_rate: 16_000,
              language_hints: [this.options.language === 'zh' ? 'zh' : 'en'],
            },
            input: {},
          },
        })
      })

      this.socket.on('message', (data, isBinary) => {
        if (isBinary) {
          return
        }

        const message = JSON.parse(data.toString()) as DashScopeMessage
        const event = message.header?.event

        if (event === 'task-started') {
          this.ready = true
          resolve()
          return
        }

        if (event === 'result-generated') {
          const sentence = message.payload?.output?.sentence
          const text = sentence?.text ?? ''
          if (!text) {
            return
          }

          if (sentence?.sentence_end) {
            this.finalizedSentences.push(text)
            this.latestPartial = ''
            onResult({ type: 'final', text: this.getTranscript() })
          } else {
            this.latestPartial = text
            onResult({ type: 'interim', text: this.getTranscript() })
          }
          return
        }

        if (event === 'task-finished') {
          this.finished = true
        }

        if (event === 'task-failed') {
          reject(new Error('DashScope ASR task failed.'))
        }
      })

      this.socket.on('error', (error) => {
        reject(error)
      })
    })
  }

  sendAudio(chunk: Buffer): void {
    if (!this.ready || this.finished || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    this.socket.send(chunk)
  }

  async finish(): Promise<string> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return this.getTranscript()
    }

    this.sendJson({
      header: {
        action: 'finish-task',
        task_id: this.taskId,
        streaming: 'duplex',
      },
      payload: {
        input: {},
      },
    })

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 1_500)
      this.socket?.once('message', (data, isBinary) => {
        if (isBinary) {
          return
        }

        const message = JSON.parse(data.toString()) as DashScopeMessage
        if (message.header?.event === 'task-finished') {
          clearTimeout(timeout)
          resolve()
        }
      })
    })

    this.socket.close()
    this.socket = null
    return this.getTranscript()
  }

  close(): void {
    this.socket?.close()
    this.socket = null
  }

  private getTranscript(): string {
    return `${this.finalizedSentences.join('')}${this.latestPartial}`.trim()
  }

  private sendJson(payload: unknown): void {
    this.socket?.send(JSON.stringify(payload))
  }
}
