import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadServerEnvFile } from './loadServerEnv.js'

describe('loadServerEnvFile', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('overwrites existing env values from server .env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'server-env-test-'))
    writeFileSync(
      join(dir, '.env'),
      ['QWEN_API_KEY=test-key-from-file', 'QWEN_MODEL=qwen-vl-plus'].join('\n'),
      'utf8',
    )

    process.env.QWEN_API_KEY = ''
    loadServerEnvFile(dir)

    expect(process.env.QWEN_API_KEY).toBe('test-key-from-file')
    expect(process.env.QWEN_MODEL).toBe('qwen-vl-plus')
  })
})
