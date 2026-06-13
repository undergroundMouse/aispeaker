import type {
  LongTermMemoryConsentSettings,
  LongTermMemoryCreateInput,
  LongTermMemoryRecord,
  LongTermMemoryRetrievalInput,
  LongTermMemoryStore,
  LongTermMemoryStoreStatus,
  LongTermMemorySyncSummary,
  LongTermMemoryType,
} from '../types'
import { normalizePhrase } from '../voice/localCommands'

const DATABASE_NAME = 'realtime-vision-long-term-memory'
const DATABASE_VERSION = 1
const STORE_NAME = 'longTermMemories'
const DEFAULT_USER_ID = 'local-user'
const MAX_ACTIVE_MEMORIES = 200
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000
const DEFAULT_LIMIT = 5
const ENCRYPTION_PREFIX = 'ltm:v1:'

export interface LongTermMemoryDriver {
  load: () => Promise<PersistedLongTermMemoryRecord[]>
  save: (records: PersistedLongTermMemoryRecord[]) => Promise<void>
}

interface PersistedLongTermMemoryRecord {
  id: string
  userId: string
  encryptedPayload: string
  createdAt: number
  updatedAt: number
  lastUsedAt: number
}

export class IndexedDbLongTermMemoryDriver implements LongTermMemoryDriver {
  private databasePromise: Promise<IDBDatabase> | null = null

  async load(): Promise<PersistedLongTermMemoryRecord[]> {
    const database = await this.openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).getAll()
      request.onsuccess = () => resolve(request.result as PersistedLongTermMemoryRecord[])
      request.onerror = () => reject(request.error ?? new Error('Unable to read long-term memory.'))
    })
  }

  async save(records: PersistedLongTermMemoryRecord[]): Promise<void> {
    const database = await this.openDatabase()

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const clearRequest = store.clear()

      clearRequest.onerror = () => reject(clearRequest.error ?? new Error('Unable to clear long-term memory.'))
      clearRequest.onsuccess = () => {
        for (const record of records) {
          store.put(record)
        }
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to persist long-term memory.'))
    })
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) {
      return this.databasePromise
    }

    this.databasePromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is unavailable.'))
        return
      }

      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Unable to open long-term memory database.'))
    })

    return this.databasePromise
  }
}

export class InMemoryLongTermMemoryDriver implements LongTermMemoryDriver {
  private records: PersistedLongTermMemoryRecord[]

  constructor(records: PersistedLongTermMemoryRecord[] = []) {
    this.records = [...records]
  }

  async load(): Promise<PersistedLongTermMemoryRecord[]> {
    return this.records.map((record) => ({ ...record }))
  }

  async save(records: PersistedLongTermMemoryRecord[]): Promise<void> {
    this.records = records.map((record) => ({ ...record }))
  }
}

export class UnavailableLongTermMemoryStore implements LongTermMemoryStore {
  async create(): Promise<LongTermMemoryRecord> {
    throw new Error('Local long-term memory is unavailable.')
  }

  async correct(): Promise<LongTermMemoryRecord | null> {
    return null
  }

  async list(): Promise<LongTermMemoryRecord[]> {
    return []
  }

  async delete(): Promise<boolean> {
    return false
  }

  async forgetAll(): Promise<void> {}

  async retrieveRelevant(): Promise<LongTermMemoryRecord[]> {
    return []
  }

  async reinforce(): Promise<void> {}

  async weakenStale(): Promise<LongTermMemoryRecord[]> {
    return []
  }

  async createSyncSummaries(): Promise<LongTermMemorySyncSummary[]> {
    return []
  }

  isAvailable(): boolean {
    return false
  }

  getStatus(): LongTermMemoryStoreStatus {
    return { available: false, message: 'Local long-term memory is unavailable.' }
  }
}

export class LocalLongTermMemoryStore implements LongTermMemoryStore {
  private records: LongTermMemoryRecord[] = []
  private initialized = false
  private status: LongTermMemoryStoreStatus = { available: true, message: null }
  private readonly driver: LongTermMemoryDriver
  private readonly encryptionKey: string

  constructor(
    driver: LongTermMemoryDriver = new IndexedDbLongTermMemoryDriver(),
    encryptionKey = 'local-device-memory-key',
  ) {
    this.driver = driver
    this.encryptionKey = encryptionKey
  }

  async create(
    userId: string,
    input: LongTermMemoryCreateInput,
    now = Date.now(),
  ): Promise<LongTermMemoryRecord> {
    await this.ensureInitialized()
    this.assertAvailable()

    const existing = findCorrectableMemory(this.records, userId, input)
    if (existing) {
      const corrected = mergeMemory(existing, input, now)
      this.records = this.records.map((record) => (record.id === corrected.id ? corrected : record))
      await this.enforceRetention(userId)
      await this.persist()
      return corrected
    }

    const record: LongTermMemoryRecord = {
      id: createMemoryId(input.type, input.summary, now),
      userId,
      type: input.type,
      summary: input.summary.trim(),
      details: input.details?.trim(),
      subject: input.subject?.trim(),
      value: input.value?.trim(),
      tags: normalizeTags(input.tags ?? []),
      strength: 1,
      syncEligible: input.syncEligible ?? false,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    }

    this.records = [record, ...this.records]
    await this.enforceRetention(userId)
    await this.persist()
    return record
  }

  async correct(
    userId: string,
    id: string,
    input: Partial<LongTermMemoryCreateInput>,
    now = Date.now(),
  ): Promise<LongTermMemoryRecord | null> {
    await this.ensureInitialized()
    this.assertAvailable()

    const current = this.records.find((record) => record.userId === userId && record.id === id)
    if (!current) {
      return null
    }

    const corrected = mergeMemory(current, input, now)
    this.records = this.records.map((record) => (record.id === id ? corrected : record))
    await this.persist()
    return corrected
  }

  async list(userId: string): Promise<LongTermMemoryRecord[]> {
    await this.ensureInitialized()
    if (!this.status.available) {
      return []
    }

    return this.records
      .filter((record) => record.userId === userId)
      .sort((left, right) => right.lastUsedAt - left.lastUsedAt)
      .map(cloneMemory)
  }

  async delete(userId: string, id: string): Promise<boolean> {
    await this.ensureInitialized()
    this.assertAvailable()

    const before = this.records.length
    this.records = this.records.filter((record) => !(record.userId === userId && record.id === id))
    await this.persist()
    return this.records.length !== before
  }

  async forgetAll(userId: string): Promise<void> {
    await this.ensureInitialized()
    this.assertAvailable()

    this.records = this.records.filter((record) => record.userId !== userId)
    await this.persist()
  }

  async retrieveRelevant({
    userId,
    transcript,
    visualLabels,
    recentConversationLabels,
    now = Date.now(),
    limit = DEFAULT_LIMIT,
  }: LongTermMemoryRetrievalInput): Promise<LongTermMemoryRecord[]> {
    await this.ensureInitialized()
    if (!this.status.available) {
      return []
    }

    const queryTokens = tokenize([transcript, ...visualLabels, ...recentConversationLabels].join(' '))
    const scored = this.records
      .filter((record) => record.userId === userId)
      .map((record) => ({ record, score: scoreMemory(record, queryTokens, now) }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || right.record.lastUsedAt - left.record.lastUsedAt)
      .slice(0, limit)
      .map(({ record }) => cloneMemory(record))

    if (scored.length > 0) {
      await this.reinforce(
        userId,
        scored.map((record) => record.id),
        now,
      )
    }

    return scored
  }

  async reinforce(userId: string, ids: string[], now = Date.now()): Promise<void> {
    await this.ensureInitialized()
    this.assertAvailable()

    const idSet = new Set(ids)
    this.records = this.records.map((record) =>
      record.userId === userId && idSet.has(record.id)
        ? {
            ...record,
            strength: clampStrength(record.strength + 0.2),
            lastUsedAt: now,
            updatedAt: now,
            weakenedAt: undefined,
          }
        : record,
    )
    await this.persist()
  }

  async weakenStale(userId: string, now = Date.now()): Promise<LongTermMemoryRecord[]> {
    await this.ensureInitialized()
    this.assertAvailable()

    const weakened: LongTermMemoryRecord[] = []
    this.records = this.records.map((record) => {
      if (record.userId !== userId || now - record.lastUsedAt <= STALE_AFTER_MS) {
        return record
      }

      const updated = {
        ...record,
        strength: clampStrength(record.strength * 0.5),
        updatedAt: now,
        weakenedAt: now,
      }
      weakened.push(cloneMemory(updated))
      return updated
    })
    await this.persist()
    return weakened
  }

  async createSyncSummaries(
    userId: string,
    consent: LongTermMemoryConsentSettings,
  ): Promise<LongTermMemorySyncSummary[]> {
    await this.ensureInitialized()
    if (!this.status.available || !consent.cloudSummarySync) {
      return []
    }

    return this.records
      .filter((record) => record.userId === userId && record.syncEligible)
      .sort((left, right) => right.strength - left.strength || right.lastUsedAt - left.lastUsedAt)
      .slice(0, 20)
      .map((record) => ({
        id: record.id,
        type: record.type,
        summary: record.summary,
        tags: [...record.tags],
        lastUsedAt: record.lastUsedAt,
        strength: record.strength,
      }))
  }

  isAvailable(): boolean {
    return this.status.available
  }

  getStatus(): LongTermMemoryStoreStatus {
    return { ...this.status }
  }

  private async enforceRetention(userId: string) {
    const userRecords = this.records.filter((record) => record.userId === userId)
    if (userRecords.length <= MAX_ACTIVE_MEMORIES) {
      return
    }

    const keepIds = new Set(
      userRecords
        .sort((left, right) => right.lastUsedAt - left.lastUsedAt || right.strength - left.strength)
        .slice(0, MAX_ACTIVE_MEMORIES)
        .map((record) => record.id),
    )
    this.records = this.records.filter((record) => record.userId !== userId || keepIds.has(record.id))
  }

  private async ensureInitialized() {
    if (this.initialized) {
      return
    }

    try {
      const persisted = await this.driver.load()
      this.records = persisted.map((record) => decryptMemoryRecord(record, this.encryptionKey))
      this.status = { available: true, message: null }
    } catch (error) {
      this.records = []
      this.status = {
        available: false,
        message: error instanceof Error ? error.message : 'Local long-term memory is unavailable.',
      }
    } finally {
      this.initialized = true
    }
  }

  private async persist() {
    try {
      await this.driver.save(this.records.map((record) => encryptMemoryRecord(record, this.encryptionKey)))
      this.status = { available: true, message: null }
    } catch (error) {
      this.status = {
        available: false,
        message: error instanceof Error ? error.message : 'Local long-term memory is unavailable.',
      }
      throw error
    }
  }

  private assertAvailable() {
    if (!this.status.available) {
      throw new Error(this.status.message ?? 'Local long-term memory is unavailable.')
    }
  }
}

export function createDefaultLongTermMemory(userId = DEFAULT_USER_ID, now = Date.now()): LongTermMemoryCreateInput[] {
  const defaults: LongTermMemoryCreateInput[] = [
    {
      type: 'preference',
      summary: 'User likes red objects.',
      subject: 'red objects',
      value: 'liked',
      tags: ['red', 'color', 'preference'],
      syncEligible: true,
    },
    {
      type: 'object-location',
      summary: 'The coffee cup is usually on the desk.',
      subject: 'coffee cup',
      value: 'desk',
      tags: ['coffee', 'cup', 'desk'],
    },
  ]

  return defaults.map((memory, index) => ({
    ...memory,
    details: `${memory.summary} Seeded for ${userId} at ${now + index}.`,
  }))
}

export function formatLongTermMemoryPrompt(memories: LongTermMemoryRecord[]): string {
  if (memories.length === 0) {
    return ''
  }

  return memories.map((memory) => `- ${memory.summary}`).join('\n')
}

export function getLongTermMemoryReviewPrompt(
  language: 'zh' | 'en',
  memories: LongTermMemoryRecord[],
): string | null {
  if (memories.length === 0) {
    return null
  }

  return language === 'zh'
    ? `有 ${memories.length} 条长期记忆超过 30 天未使用，建议回顾。`
    : `${memories.length} long-term memories have not been used for over 30 days. Please review them.`
}

function encryptMemoryRecord(record: LongTermMemoryRecord, key: string): PersistedLongTermMemoryRecord {
  return {
    id: record.id,
    userId: record.userId,
    encryptedPayload: encrypt(JSON.stringify(record), key),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastUsedAt: record.lastUsedAt,
  }
}

function decryptMemoryRecord(record: PersistedLongTermMemoryRecord, key: string): LongTermMemoryRecord {
  return JSON.parse(decrypt(record.encryptedPayload, key)) as LongTermMemoryRecord
}

function encrypt(value: string, key: string): string {
  return `${ENCRYPTION_PREFIX}${toBase64(xor(value, key))}`
}

function decrypt(value: string, key: string): string {
  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    throw new Error('Long-term memory payload is not encrypted.')
  }

  return xor(fromBase64(value.slice(ENCRYPTION_PREFIX.length)), key)
}

function xor(value: string, key: string): string {
  return Array.from(value, (character, index) =>
    String.fromCharCode(character.charCodeAt(0) ^ key.charCodeAt(index % key.length)),
  ).join('')
}

function toBase64(value: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(value)))
}

function fromBase64(value: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(value), (character) => character.charCodeAt(0)))
}

function findCorrectableMemory(
  records: LongTermMemoryRecord[],
  userId: string,
  input: Partial<LongTermMemoryCreateInput>,
): LongTermMemoryRecord | null {
  const subject = input.subject?.trim().toLocaleLowerCase()
  if (!subject) {
    return null
  }

  return (
    records.find(
      (record) =>
        record.userId === userId &&
        record.type === input.type &&
        record.subject?.trim().toLocaleLowerCase() === subject,
    ) ?? null
  )
}

function mergeMemory(
  current: LongTermMemoryRecord,
  input: Partial<LongTermMemoryCreateInput>,
  now: number,
): LongTermMemoryRecord {
  return {
    ...current,
    type: input.type ?? current.type,
    summary: input.summary?.trim() ?? current.summary,
    details: input.details?.trim() ?? current.details,
    subject: input.subject?.trim() ?? current.subject,
    value: input.value?.trim() ?? current.value,
    tags: normalizeTags(input.tags ?? current.tags),
    syncEligible: input.syncEligible ?? current.syncEligible,
    strength: clampStrength(current.strength + 0.3),
    updatedAt: now,
    lastUsedAt: now,
    weakenedAt: undefined,
  }
}

function scoreMemory(record: LongTermMemoryRecord, queryTokens: Set<string>, now: number): number {
  const memoryTokens = tokenize(
    [record.summary, record.details, record.subject, record.value, ...record.tags].filter(Boolean).join(' '),
  )
  const overlap = [...queryTokens].filter((token) => memoryTokens.has(token)).length
  const stalePenalty = record.weakenedAt ? 0.4 : 1
  const recency = Math.max(0, 1 - (now - record.lastUsedAt) / STALE_AFTER_MS)
  return (overlap * 2 + record.strength + recency) * stalePenalty
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalizePhrase(value)
      .split(/[\s,，。.!?;；:："'“”‘’()（）/\\-]+/u)
      .map((token) => token.trim())
      .filter(Boolean),
  )
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLocaleLowerCase()).filter(Boolean))]
}

function clampStrength(value: number): number {
  return Math.max(0.1, Math.min(5, value))
}

function cloneMemory(record: LongTermMemoryRecord): LongTermMemoryRecord {
  return { ...record, tags: [...record.tags] }
}

function createMemoryId(type: LongTermMemoryType, summary: string, now: number): string {
  const normalized = normalizePhrase(summary).replace(/[^a-z0-9\u4e00-\u9fff]+/giu, '-')
  return `long-term-${type}-${normalized || 'memory'}-${now}`
}
