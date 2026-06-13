import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { loadServerConfig } from './config.js'
import { SqliteStore } from './db/store.js'

const config = loadServerConfig()
const store = new SqliteStore(config.databasePath)
const app = createApp(config, store)

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Control plane listening on http://localhost:${info.port}`)
})

process.on('SIGINT', () => {
  store.close()
  process.exit(0)
})
