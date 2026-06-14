import type { Context, Next } from 'hono'

export function createDeviceAuth(expectedToken: string) {
  return async (context: Context, next: Next) => {
    const header = context.req.header('Authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    if (!token || token !== expectedToken) {
      return context.json({ error: 'Unauthorized device' }, 401)
    }
    await next()
  }
}

export function createAdminAuth(expectedToken: string) {
  return async (context: Context, next: Next) => {
    const header = context.req.header('Authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    if (!token || token !== expectedToken) {
      return context.json({ error: 'Unauthorized admin' }, 401)
    }
    await next()
  }
}
