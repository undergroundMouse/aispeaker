import { describe, expect, it } from 'vitest'
import { isOperatorAvailable, readAppRoute } from './routing'

describe('routing', () => {
  it('reads assist, memory, and admin routes from pathname', () => {
    expect(readAppRoute('/')).toBe('assist')
    expect(readAppRoute('/memory')).toBe('memory')
    expect(readAppRoute('/memory/')).toBe('memory')
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
})
