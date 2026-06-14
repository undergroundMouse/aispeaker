import { loadServerEnvFile } from './loadServerEnv.js'
import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { loadServerConfig } from './config.js'
import { SqliteStore } from './db/store.js'
import { attachAsrStreamWebSocket } from './routes/asrStream.js'
import { attachOmniRealtimeWebSocket } from './routes/omniRealtimeProxy.js'
import { attachRealtimeSessionWebSocket } from './routes/realtimeSession.js'

loadServerEnvFile()

const config = loadServerConfig()
const store = new SqliteStore(config.databasePath)
const app = createApp(config, store)

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Control plane listening on http://localhost:${info.port}`)
})

attachAsrStreamWebSocket(server, config)
attachOmniRealtimeWebSocket(server, config)
attachRealtimeSessionWebSocket(server, config)

process.on('SIGINT', () => {
  store.close()
  process.exit(0)
})
