import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer, type WebSocket } from 'ws'
import type { ServerConfig } from '../config.js'
import type { ClientSessionMessage } from '@ai/shared'
import { ParaformerRealtimeAsrSession } from '../providers/paraformerRealtimeAsr.js'
import { SessionStateStore } from '../services/sessionStateStore.js'
import { ContinuousVisionService, FullDuplexOrchestrator } from '../services/fullDuplexOrchestrator.js'
import { getCircuitBreaker } from '../observability/circuitBreaker.js'
import { recordProviderMetric } from '../observability/metrics.js'

type UpgradeServer = {
  on(
    event: 'upgrade',
    listener: (request: IncomingMessage, socket: Duplex, head: Buffer) => void,
  ): unknown
}

const sessionStore = new SessionStateStore()

export function getSessionStateStore(): SessionStateStore {
  return sessionStore
}

export function attachRealtimeSessionWebSocket(server: UpgradeServer, config: ServerConfig): void {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    if (url.pathname !== '/api/v1/realtime/session') {
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
    let sessionId: string | null = null
    let asrSession: ParaformerRealtimeAsrSession | null = null
    const visionService = new ContinuousVisionService()

    const sendJson = (payload: unknown) => {
      if (clientSocket.readyState === clientSocket.OPEN) {
        clientSocket.send(JSON.stringify(payload))
      }
    }

    const orchestrator = new FullDuplexOrchestrator({
      onAsrInterim: (text, confidence) => sendJson({ type: 'asr.interim', text, confidence }),
      onAsrFinal: (text, turnId) => sendJson({ type: 'asr.final', text, turnId }),
      onTtsChunk: (seq, audioBase64) => sendJson({ type: 'tts.chunk', seq, audioBase64 }),
      onTtsEnd: (turnId) => sendJson({ type: 'tts.end', turnId }),
    })

    clientSocket.on('message', async (data, isBinary) => {
      if (isBinary) {
        asrSession?.sendAudio(
          data instanceof ArrayBuffer ? Buffer.from(data) : Buffer.from(data as ArrayLike<number>),
        )
        return
      }

      const message = JSON.parse(data.toString()) as ClientSessionMessage

      if (message.type === 'session.start') {
        const breaker = getCircuitBreaker('asr')
        if (!breaker.allowRequest()) {
          sendJson({
            type: 'session.error',
            payload: { code: 'circuit-open', message: 'ASR circuit breaker open.', recoverable: true },
          })
          return
        }

        const record = sessionStore.create(message.payload.conversationId, message.payload.language)
        sessionId = record.sessionId

        if (config.qwenApiKey) {
          try {
            asrSession = new ParaformerRealtimeAsrSession({
              apiKey: config.qwenApiKey,
              model: config.qwenAsrModel,
              language: message.payload.language === 'en' ? 'en' : 'zh',
            })
            await asrSession.start((event) => {
              if (event.type === 'interim') {
                orchestrator.emitAsrInterim(event.text)
              }
              if (event.type === 'final') {
                orchestrator.emitAsrFinal(event.text)
              }
            })
            breaker.recordSuccess()
            recordProviderMetric('asr', true, 0)
          } catch {
            breaker.recordFailure()
            recordProviderMetric('asr', false, 0)
          }
        }

        sendJson({
          type: 'session.ready',
          payload: { sessionId: record.sessionId, resumeToken: record.resumeToken },
        })
        sendJson({
          type: 'route.decision',
          payload: { tier: 'edge-first', framePolicy: 'normal', reason: 'session-start', estimatedCost: 0 },
        })
        return
      }

      if (message.type === 'session.resume') {
        const record = sessionStore.getByResumeToken(message.payload.resumeToken)
        if (!record) {
          sendJson({
            type: 'session.error',
            payload: { code: 'resume-expired', message: 'Session resume token expired.', recoverable: false },
          })
          return
        }

        sessionId = record.sessionId
        sessionStore.update(sessionId, { lastAckSeq: message.payload.lastAckSeq })
        sendJson({
          type: 'session.ready',
          payload: { sessionId: record.sessionId, resumeToken: record.resumeToken },
        })
        return
      }

      if (message.type === 'vision.delta' && sessionId) {
        const merged = visionService.ingestDelta(message.delta)
        sessionStore.update(sessionId, { visionState: merged, lastAckSeq: message.seq })
        sendJson({ type: 'ack', seq: message.seq })
        if (message.delta.trackedObjects.length > 0) {
          sendJson({
            type: 'vision.hint',
            regions: message.delta.trackedObjects.map((t) => t.region),
          })
        }
        return
      }

      if (message.type === 'audio.chunk' && sessionId) {
        sessionStore.update(sessionId, { lastAckSeq: message.seq })
        sendJson({ type: 'ack', seq: message.seq })
        return
      }

      if (message.type === 'barge-in') {
        orchestrator.handleBargeIn()
        return
      }

      if (message.type === 'heartbeat') {
        sendJson({ type: 'heartbeat', at: Date.now() })
        return
      }

      if (message.type === 'ack' && sessionId) {
        sessionStore.update(sessionId, { lastAckSeq: message.seq })
      }
    })

    clientSocket.on('close', () => {
      asrSession?.close()
      asrSession = null
    })
  })

  setInterval(() => sessionStore.purgeExpired(), 60_000)
}
