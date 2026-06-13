import { useEffect, useState } from 'react'
import { type AppRoute, readAppRoute } from './routing'

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => readAppRoute())

  useEffect(() => {
    const handlePopState = () => setRoute(readAppRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return route
}
