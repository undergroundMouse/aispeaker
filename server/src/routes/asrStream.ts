import type { Server } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import type { ServerConfig } from '../config.js'
import { ParaformerRealtimeAsrSession } from '../providers/paraformerRealtimeAsr.js'

type ClientStartMessage = {
  type: 'start'
  turnId: string
  language: 'zh' | 'en'
}

type ClientStopMessage = {
  type: 'stop'
}

type ClientMessage = ClientStartMessage | ClientStopMessage | { type: string }

export function attachAsrStreamWebSocket(server: Server, config: ServerConfig): void {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    if (url.pathname !== '/api/v1/cloud/asr/stream') {
      return
    }

    const token = url.searchParams.get('token')?.trim()
    if (!token || token !== config.deviceApiToken) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    wss.handleUpgrade(request, socket, head, (clientSocket) => {
      wss.emit('connection', clientSocket, request)
    })
  })

  wss.on('connection', (clientSocket: WebSocket) => {
    let session: ParaformerRealtimeAsrSession | null = null
    let stopping = false

    const sendJson = (payload: unknown) => {
      if (clientSocket.readyState === clientSocket.OPEN) {
        clientSocket.send(JSON.stringify(payload))
      }
    }

    clientSocket.on('message', async (data, isBinary) => {
      if (isBinary) {
        session?.sendAudio(Buffer.from(data))
        return
      }

      const message = JSON.parse(data.toString()) as ClientMessage

      if (message.type === 'start') {
        if (!config.qwenApiKey) {
          sendJson({ type: 'error', message: 'Cloud speech recognition is not configured.' })
          clientSocket.close()
          return
        }

        try {
          session = new ParaformerRealtimeAsrSession({
            apiKey: config.qwenApiKey,
            model: config.qwenAsrModel,
            language: message.language === 'en' ? 'en' : 'zh',
          })

          await session.start((event) => {
            sendJson({ type: event.type, text: event.text })
          })
          sendJson({ type: 'ready' })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Cloud speech recognition failed.'
          sendJson({ type: 'error', message: errorMessage })
          clientSocket.close()
        }
        return
      }

      if (message.type === 'stop') {
        if (stopping) {
          return
        }

        stopping = true
        try {
          const transcript = (await session?.finish()) ?? ''
          sendJson({ type: 'ended', transcript })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Cloud speech recognition failed.'
          sendJson({ type: 'error', message: errorMessage })
        } finally {
          session?.close()
          session = null
          clientSocket.close()
        }
      }
    })

    clientSocket.on('close', () => {
      session?.close()
      session = null
    })
  })
}
