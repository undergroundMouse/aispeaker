import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer, type WebSocket } from 'ws'
import type { ClientOmniProxyMessage, ServerOmniProxyMessage } from '@ai/shared'
import type { ServerConfig } from '../config.js'
import { getCircuitBreaker } from '../observability/circuitBreaker.js'
import { recordProviderMetric } from '../observability/metrics.js'
import {
  createOmniEventId,
  optionsFromServerConfig,
  QwenOmniRealtimeSession,
  type OmniUpstreamEvent,
} from '../providers/qwenOmniRealtime.js'

type UpgradeServer = {
  on(
    event: 'upgrade',
    listener: (request: IncomingMessage, socket: Duplex, head: Buffer) => void,
  ): unknown
}

function sendJson(socket: WebSocket, payload: ServerOmniProxyMessage | Record<string, unknown>): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

function parseClientMessage(data: unknown): ClientOmniProxyMessage | null {
  try {
    return JSON.parse(String(data)) as ClientOmniProxyMessage
  } catch {
    return null
  }
}

export function attachOmniRealtimeWebSocket(server: UpgradeServer, config: ServerConfig): void {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    if (url.pathname !== '/api/v1/realtime/omni') {
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
    let upstream: QwenOmniRealtimeSession | null = null
    let bootstrapped = false

    const sendError = (code: string, message: string, recoverable: boolean) => {
      sendJson(clientSocket, {
        type: 'session.error',
        payload: { code, message, recoverable },
      })
    }

    clientSocket.on('message', async (data) => {
      const message = parseClientMessage(data)
      if (!message) {
        sendError('invalid-message', 'Invalid Omni proxy message.', false)
        return
      }

      if (message.type === 'heartbeat') {
        sendJson(clientSocket, { type: 'heartbeat', at: Date.now() })
        return
      }

      if (message.type === 'omni.event') {
        if (!upstream) {
          sendError('not-ready', 'Omni session is not bootstrapped.', true)
          return
        }

        upstream.sendEvent({
          ...message.event,
          event_id: message.event.event_id ?? createOmniEventId(),
        })
        return
      }

      if (message.type !== 'session.bootstrap') {
        sendError('unsupported-message', `Unsupported message type.`, false)
        return
      }

      if (bootstrapped) {
        sendError('already-started', 'Omni session already bootstrapped.', true)
        return
      }

      const breaker = getCircuitBreaker('omni-realtime')
      if (!breaker.allowRequest()) {
        sendError('circuit-open', 'Omni Realtime circuit breaker open.', true)
        return
      }

      const options = optionsFromServerConfig(config, message.payload.language, message.payload.instructions)
      if (!options) {
        sendError('omni-unconfigured', 'Qwen Omni Realtime is not configured on the server.', true)
        return
      }

      bootstrapped = true
      const startedAt = Date.now()

      try {
        upstream = new QwenOmniRealtimeSession(options)
        let readySent = false

        await upstream.connect((event: OmniUpstreamEvent) => {
          sendJson(clientSocket, { type: 'omni.event', event })

          if (!readySent && event.type === 'session.updated') {
            readySent = true
            sendJson(clientSocket, {
              type: 'session.ready',
              payload: {
                sessionId: upstream!.getSessionId(),
                model: options.model,
              },
            })
          }
        })

        breaker.recordSuccess()
        recordProviderMetric('omni-realtime', true, Date.now() - startedAt)

        if (!readySent) {
          sendJson(clientSocket, {
            type: 'session.ready',
            payload: {
              sessionId: upstream.getSessionId(),
              model: options.model,
            },
          })
        }
      } catch {
        bootstrapped = false
        upstream?.close()
        upstream = null
        breaker.recordFailure()
        recordProviderMetric('omni-realtime', false, Date.now() - startedAt)
        sendError('upstream-failed', 'Failed to connect to Qwen Omni Realtime.', true)
      }
    })

    clientSocket.on('close', () => {
      upstream?.close()
      upstream = null
    })
  })
}
