import { readBackendClientConfig } from '../ai/backendClient'

export type AppRoute = 'assist' | 'admin'

export function readAppRoute(pathname = window.location.pathname): AppRoute {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return normalized === '/admin' ? 'admin' : 'assist'
}

export function isOperatorAvailable(
  env: Record<string, string | undefined> = import.meta.env,
): boolean {
  return readBackendClientConfig(env) !== null
}

export function isDebugMode(
  env: Record<string, string | boolean | undefined> = import.meta.env,
  search = window.location.search,
): boolean {
  if (env.DEV) {
    return true
  }

  return new URLSearchParams(search).has('debug')
}

export function navigateToRoute(route: AppRoute): void {
  const path = route === 'admin' ? '/admin' : '/'
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
