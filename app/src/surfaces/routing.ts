import { readBackendClientConfig } from '../ai/backendClient'

export type AppRoute = 'assist' | 'memory' | 'admin'

export function readAppRoute(pathname = window.location.pathname): AppRoute {
  const normalized = pathname.replace(/\/$/, '') || '/'
  if (normalized === '/admin') {
    return 'admin'
  }
  if (normalized === '/memory') {
    return 'memory'
  }
  return 'assist'
}

export function isOperatorAvailable(
  env: Record<string, string | undefined> = import.meta.env,
): boolean {
  return readBackendClientConfig(env) !== null
}

export function navigateToRoute(route: AppRoute): void {
  const path = route === 'admin' ? '/admin' : route === 'memory' ? '/memory' : '/'
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
