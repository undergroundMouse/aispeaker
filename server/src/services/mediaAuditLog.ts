export interface MediaAuditEntry {
  sessionId: string
  mediaClass: 'video' | 'audio' | 'vision-delta'
  transmittedAt: number
  redacted: boolean
}

const auditLog: MediaAuditEntry[] = []

export function logMediaAudit(entry: Omit<MediaAuditEntry, 'transmittedAt'>): void {
  auditLog.push({ ...entry, transmittedAt: Date.now() })
  if (auditLog.length > 500) {
    auditLog.splice(0, auditLog.length - 500)
  }
}

export function getMediaAuditLog(sessionId?: string): MediaAuditEntry[] {
  return sessionId ? auditLog.filter((e) => e.sessionId === sessionId) : [...auditLog]
}

export function redactForLog(text: string, maxLen = 80): string {
  if (text.length <= maxLen) {
    return text
  }
  return `${text.slice(0, maxLen)}…[redacted]`
}
