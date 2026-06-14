import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Reload server/.env on tsx restart. */
export function loadServerEnvFile(envDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')): void {
  const envPath = resolve(envDir, '.env')
  if (!existsSync(envPath)) {
    return
  }

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    process.env[key] = value
  }
}
