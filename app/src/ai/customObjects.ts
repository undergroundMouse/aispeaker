import type {
  AppLanguage,
  CustomObjectFeatureExtractor,
  CustomObjectFeatureVector,
  CustomObjectRecord,
  CustomObjectRegionMetadata,
  CustomObjectSearchResult,
  CustomObjectStore,
  CustomObjectTeachingResult,
  SampledVideoFrame,
  VisionCandidate,
  VisionRegion,
} from '../types'

const STORAGE_KEY = 'realtime-vision.custom-objects.v1'
const DEFAULT_VECTOR_MODEL = 'prototype-region-hash-v1'
const DEFAULT_DIMENSIONS = 8
export const defaultCustomObjectSimilarityThreshold = 0.92

export class LocalCustomObjectStore implements CustomObjectStore {
  private records: CustomObjectRecord[] = []
  private readonly storage: Storage | null

  constructor(storage: Storage | null = getBrowserStorage()) {
    this.storage = storage
    this.records = this.readRecords()
  }

  async insert(
    record: Omit<CustomObjectRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CustomObjectRecord> {
    const now = Date.now()
    const saved: CustomObjectRecord = {
      ...record,
      id: createCustomObjectId(record.name, now),
      createdAt: now,
      updatedAt: now,
    }

    this.records = [saved, ...this.records]
    this.writeRecords()
    return saved
  }

  async search(
    vector: CustomObjectFeatureVector,
    { threshold = defaultCustomObjectSimilarityThreshold, limit = 1 }: { threshold?: number; limit?: number } = {},
  ): Promise<CustomObjectSearchResult[]> {
    return this.records
      .flatMap((record) =>
        record.vectors.map((candidateVector) => ({
          record,
          similarity: cosineSimilarity(vector.values, candidateVector.values),
        })),
      )
      .filter((result) => result.similarity >= threshold)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, limit)
  }

  async list(): Promise<CustomObjectRecord[]> {
    return [...this.records].sort((left, right) => right.createdAt - left.createdAt)
  }

  async delete(id: string): Promise<boolean> {
    const before = this.records.length
    this.records = this.records.filter((record) => record.id !== id)
    this.writeRecords()
    return this.records.length !== before
  }

  async deleteLastTeaching(): Promise<CustomObjectRecord | null> {
    const [lastTeaching] = [...this.records].sort((left, right) => right.createdAt - left.createdAt)
    if (!lastTeaching) {
      return null
    }

    await this.delete(lastTeaching.id)
    return lastTeaching
  }

  isAvailable(): boolean {
    return true
  }

  private readRecords(): CustomObjectRecord[] {
    if (!this.storage) {
      return []
    }

    try {
      const raw = this.storage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CustomObjectRecord[]) : []
    } catch {
      return []
    }
  }

  private writeRecords() {
    if (!this.storage) {
      return
    }

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.records))
    } catch {
      // Keep the in-memory copy usable when browser storage is blocked or quota-limited.
    }
  }
}

export class UnavailableCustomObjectStore implements CustomObjectStore {
  async insert(): Promise<CustomObjectRecord> {
    throw new Error('Local custom object memory is unavailable.')
  }

  async search(): Promise<CustomObjectSearchResult[]> {
    return []
  }

  async list(): Promise<CustomObjectRecord[]> {
    return []
  }

  async delete(): Promise<boolean> {
    return false
  }

  async deleteLastTeaching(): Promise<CustomObjectRecord | null> {
    return null
  }

  isAvailable(): boolean {
    return false
  }
}

export class PrototypeCustomObjectFeatureExtractor implements CustomObjectFeatureExtractor {
  readonly model = DEFAULT_VECTOR_MODEL

  isAvailable(): boolean {
    return true
  }

  async extract({
    frame,
    region,
  }: {
    frame: SampledVideoFrame
    region?: VisionRegion
    nameHint?: string
  }): Promise<CustomObjectFeatureVector> {
    const seed = [
      frame.width,
      frame.height,
      region?.x ?? 0,
      region?.y ?? 0,
      region?.width ?? 1,
      region?.height ?? 1,
    ].join('|')

    return {
      values: hashToUnitVector(seed, DEFAULT_DIMENSIONS),
      model: this.model,
      dimensions: DEFAULT_DIMENSIONS,
    }
  }
}

export function parseTeachingName(transcript: string): string | null {
  const normalized = transcript.trim()
  const patterns = [
    /(?:记住|学习|认识)(?:这个|这个物体|它)?(?:叫|名字叫)\s*(.+)$/u,
    /(?:remember|learn)\s+(?:this|that|this object|that object)?\s*(?:as|called|named)\s+(.+)$/iu,
    /(?:call|name)\s+(?:this|that|this object|that object)\s+(.+)$/iu,
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    const name = match?.[1]?.trim()
    if (name) {
      return name.replace(/[，。！？,.!?]+$/u, '').trim()
    }
  }

  return null
}

export async function teachCustomObject({
  transcript,
  frame,
  region,
  store,
  extractor,
  language,
}: {
  transcript: string
  frame: SampledVideoFrame | null
  region: VisionRegion | null
  store: CustomObjectStore
  extractor: CustomObjectFeatureExtractor
  language: AppLanguage
}): Promise<CustomObjectTeachingResult> {
  const name = parseTeachingName(transcript)

  if (!name) {
    return {
      status: 'missing-name',
      message: language === 'zh' ? '请告诉我这个物体叫什么。' : 'Please tell me what to call this object.',
    }
  }

  if (!frame) {
    return {
      status: 'missing-frame',
      message: language === 'zh' ? '当前没有可用画面，请重新对准物体。' : 'No current frame is available. Please show the object again.',
    }
  }

  if (!region) {
    return {
      status: 'missing-region',
      message: language === 'zh' ? '请先框选要记住的物体。' : 'Please select the object region first.',
    }
  }

  if (!store.isAvailable()) {
    return {
      status: 'memory-unavailable',
      message: language === 'zh' ? '本地物体记忆不可用。' : 'Local object memory is unavailable.',
    }
  }

  if (!extractor.isAvailable()) {
    return {
      status: 'extractor-unavailable',
      message: language === 'zh' ? '本地特征提取不可用。' : 'Local feature extraction is unavailable.',
    }
  }

  const vector = await extractor.extract({ frame, region, nameHint: name })
  const record = await store.insert({
    name,
    vectors: [vector],
    region: toRegionMetadata(region, frame),
    source: 'voice-region-teaching',
  })

  return {
    status: 'stored',
    record,
    message: language === 'zh' ? `已记住 ${name}。` : `I remembered ${name}.`,
  }
}

export async function searchCustomObjects({
  frame,
  region,
  store,
  extractor,
  threshold = defaultCustomObjectSimilarityThreshold,
}: {
  frame: SampledVideoFrame | null
  region?: VisionRegion
  store: CustomObjectStore
  extractor: CustomObjectFeatureExtractor
  threshold?: number
}): Promise<CustomObjectSearchResult | null> {
  if (!frame || !store.isAvailable() || !extractor.isAvailable()) {
    return null
  }

  const vector = await extractor.extract({ frame, region })
  const [match] = await store.search(vector, { threshold, limit: 1 })
  return match ?? null
}

export function customObjectToCandidate(result: CustomObjectSearchResult): VisionCandidate {
  return {
    label: result.record.name,
    confidence: result.similarity,
    region: result.record.region,
    source: 'custom-object-memory',
    customObjectId: result.record.id,
  }
}

export function getCustomObjectMemoryMessage(language: AppLanguage, status: 'forgot' | 'undo' | 'none' | 'unresolved') {
  const messages = {
    zh: {
      forgot: '已忘记该物体。',
      undo: '已撤销最后一次教学。',
      none: '没有可撤销的教学记录。',
      unresolved: '我还不知道你指的是哪个物体，请从已学物体列表中选择。',
    },
    en: {
      forgot: 'I forgot that object.',
      undo: 'I undid the last teaching.',
      none: 'There is no teaching action to undo.',
      unresolved: 'I am not sure which object you mean. Please choose one from the learned objects list.',
    },
  }

  return messages[language][status]
}

export interface CustomObjectExportPayload {
  exportedAt: number
  objects: Array<Pick<CustomObjectRecord, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'source' | 'region'>>
}

export async function exportCustomObjects(store: CustomObjectStore, now = Date.now()): Promise<CustomObjectExportPayload> {
  const records = await store.list()
  return {
    exportedAt: now,
    objects: records.map((record) => ({
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      source: record.source,
      region: record.region,
    })),
  }
}

export function downloadCustomObjectExport(payload: CustomObjectExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `custom-objects-${payload.exportedAt}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function toRegionMetadata(region: VisionRegion, frame: SampledVideoFrame): CustomObjectRegionMetadata {
  return {
    ...region,
    frameWidth: frame.width,
    frameHeight: frame.height,
  }
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function createCustomObjectId(name: string, createdAt: number): string {
  const normalizedName = normalizeName(name).replace(/[^a-z0-9\u4e00-\u9fff]+/giu, '-')
  return `custom-object-${normalizedName || 'object'}-${createdAt}`
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase()
}

function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length)
  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index]
    leftMagnitude += left[index] * left[index]
    rightMagnitude += right[index] * right[index]
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

function hashToUnitVector(seed: string, dimensions: number): number[] {
  const values = Array.from({ length: dimensions }, (_, index) => {
    const hash = hashString(`${seed}:${index}`)
    return (hash % 2000) / 1000 - 1
  })
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1
  return values.map((value) => value / magnitude)
}

function hashString(value: string): number {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}
