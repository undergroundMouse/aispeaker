import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { ServerConfig } from './config.js'
import type { SqliteStore } from './db/store.js'
import { createAdminAuth, createDeviceAuth } from './middleware/auth.js'
import { OperationsAdminService } from './services/operationsAdminService.js'
import { VisualAnswerService } from './services/visualAnswerService.js'
import type { CloudVisualAnswerRequest } from '@ai/shared'

export function createApp(config: ServerConfig, store: SqliteStore): Hono {
  const app = new Hono()
  const visualAnswerService = new VisualAnswerService(store, config)
  const operationsAdmin = new OperationsAdminService(store, config.adminApiToken)

  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) {
          return config.corsOrigins[0] ?? 'http://localhost:5173'
        }

        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return origin
        }

        return config.corsOrigins.includes(origin) ? origin : config.corsOrigins[0] ?? 'http://localhost:5173'
      },
      allowHeaders: ['Authorization', 'Content-Type'],
    }),
  )

  app.get('/health', (context) => context.json({ status: 'ok' }))

  app.post('/api/v1/cloud/visual-answer', createDeviceAuth(config.deviceApiToken), async (context) => {
    const body = (await context.req.json()) as CloudVisualAnswerRequest
    const result = await visualAnswerService.handle(body)
    const status = result.ok
      ? 200
      : result.reason === 'budget-exceeded'
        ? 402
        : result.reason === 'provider-error'
          ? 400
          : 503
    return context.json(result, status)
  })

  const admin = new Hono()
  admin.use('*', createAdminAuth(config.adminApiToken))

  admin.get('/conversations', (context) => {
    const token = context.req.header('Authorization')!.slice(7)
    return context.json(operationsAdmin.listConversations(token))
  })

  admin.get('/conversations/:conversationId', (context) => {
    const token = context.req.header('Authorization')!.slice(7)
    const record = operationsAdmin.getConversation(token, context.req.param('conversationId'))
    if (!record) {
      return context.json({ error: 'Not found' }, 404)
    }
    return context.json(record)
  })

  admin.get('/budget', (context) => {
    const token = context.req.header('Authorization')!.slice(7)
    return context.json(operationsAdmin.getBudgetConfig(token))
  })

  admin.put('/budget', async (context) => {
    const token = context.req.header('Authorization')!.slice(7)
    const body = (await context.req.json()) as { dailyBudgetCap: number | null }
    return context.json(operationsAdmin.setDailyBudgetCap(token, body.dailyBudgetCap ?? null))
  })

  admin.get('/daily-spend', (context) => {
    const token = context.req.header('Authorization')!.slice(7)
    return context.json({ amount: operationsAdmin.getDailySpend(token) })
  })

  app.route('/api/v1/admin', admin)

  return app
}
