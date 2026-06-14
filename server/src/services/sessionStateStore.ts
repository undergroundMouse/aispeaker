import type { AppLanguage, VisionDelta } from '@ai/shared'

const SESSION_RESUME_TTL_MS = 300_000

export interface SessionRecord {
  sessionId: string
  conversationId: string
  resumeToken: string
  language: AppLanguage
  lastAckSeq: number
  partialTranscript: string
  visionState: VisionDelta | null
  createdAt: number
  updatedAt: number
  expiresAt: number
}

export class SessionStateStore {
  private readonly sessions = new Map<string, SessionRecord>()
  private readonly resumeIndex = new Map<string, string>()

  create(conversationId: string, language: AppLanguage): SessionRecord {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const resumeToken = `resume-${sessionId}`
    const now = Date.now()
    const record: SessionRecord = {
      sessionId,
      conversationId,
      resumeToken,
      language,
      lastAckSeq: 0,
      partialTranscript: '',
      visionState: null,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + SESSION_RESUME_TTL_MS,
    }
    this.sessions.set(sessionId, record)
    this.resumeIndex.set(resumeToken, sessionId)
    return record
  }

  get(sessionId: string): SessionRecord | null {
    const record = this.sessions.get(sessionId)
    if (!record) {
      return null
    }

    if (record.expiresAt < Date.now()) {
      this.remove(sessionId)
      return null
    }

    return record
  }

  getByResumeToken(resumeToken: string): SessionRecord | null {
    const sessionId = this.resumeIndex.get(resumeToken)
    if (!sessionId) {
      return null
    }

    return this.get(sessionId)
  }

  update(sessionId: string, patch: Partial<Pick<SessionRecord, 'lastAckSeq' | 'partialTranscript' | 'visionState'>>): SessionRecord | null {
    const record = this.get(sessionId)
    if (!record) {
      return null
    }

    Object.assign(record, patch, { updatedAt: Date.now(), expiresAt: Date.now() + SESSION_RESUME_TTL_MS })
    return record
  }

  remove(sessionId: string): void {
    const record = this.sessions.get(sessionId)
    if (record) {
      this.resumeIndex.delete(record.resumeToken)
    }
    this.sessions.delete(sessionId)
  }

  purgeExpired(): number {
    const now = Date.now()
    let removed = 0
    for (const [sessionId, record] of this.sessions) {
      if (record.expiresAt < now) {
        this.remove(sessionId)
        removed += 1
      }
    }
    return removed
  }

  countActive(): number {
    this.purgeExpired()
    return this.sessions.size
  }
}
