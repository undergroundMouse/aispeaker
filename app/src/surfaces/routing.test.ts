import { describe, expect, it } from 'vitest'
import { isDebugMode, isOperatorAvailable, readAppRoute } from './routing'

describe('routing', () => {
  it('reads assist and admin routes from pathname', () => {
    expect(readAppRoute('/')).toBe('assist')
    expect(readAppRoute('/admin')).toBe('admin')
    expect(readAppRoute('/admin/')).toBe('admin')
  })

  it('hides operator integration when backend url is missing', () => {
    expect(isOperatorAvailable({})).toBe(false)
    expect(
      isOperatorAvailable({
        VITE_BACKEND_BASE_URL: 'http://localhost:3000',
      }),
    ).toBe(true)
  })

  it('hides debug mode in production without debug query', () => {
    expect(isDebugMode({ PROD: true, DEV: false }, '')).toBe(false)
    expect(isDebugMode({ PROD: true, DEV: false }, '?debug=1')).toBe(true)
    expect(isDebugMode({ PROD: false, DEV: true }, '')).toBe(true)
  })
})
