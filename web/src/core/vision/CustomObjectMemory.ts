import type { ThumbnailFrame } from '../media/types'
import type {
  CustomObjectFeatureExtractor,
  CustomObjectFeatureVector,
  CustomObjectRecord,
  CustomObjectRegionMetadata,
  CustomObjectSearchResult,
  CustomObjectStore,
  VisionCandidate,
  VisionRegion,
} from './types'

const STORAGE_KEY = 'aispeaker.custom-objects.v1'
const VECTOR_MODEL = 'prototype-region-hash-v1'
const VECTOR_DIMENSIONS = 8

export const DEFAULT_CUSTOM_OBJECT_THRESHOLD = 0.92

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
    { threshold = DEFAULT_CUSTOM_OBJECT_THRESHOLD, limit = 1 }: { threshold?: number; limit?: number } = {},
  ): Promise<CustomObjectSearchResult[]> {
    return this.records
      .flatMap((record) =>
        record.vectors.map((storedVector) => ({
          record,
          similarity: cosineSimilarity(vector.values, storedVector.values),
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
    const [latest] = [...this.records].sort((left, right) => right.createdAt - left.createdAt)
    if (!latest) return null

    await this.delete(latest.id)
    return latest
  }

  isAvailable(): boolean {
    return true
  }

  private readRecords(): CustomObjectRecord[] {
    if (!this.storage) return []

    try {
      const raw = this.storage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CustomObjectRecord[]) : []
    } catch {
      return []
    }
  }

  private writeRecords(): void {
    if (!this.storage) return

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.records))
    } catch {
      // The in-memory copy remains usable if local storage is blocked or full.
    }
  }
}

export class PrototypeCustomObjectFeatureExtractor implements CustomObjectFeatureExtractor {
  readonly model = VECTOR_MODEL

  isAvailable(): boolean {
    return true
  }

  async extract({
    frame,
    region,
  }: {
    frame: ThumbnailFrame
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
      values: hashToUnitVector(seed, VECTOR_DIMENSIONS),
      model: this.model,
      dimensions: VECTOR_DIMENSIONS,
    }
  }
}

export function parseCustomObjectTeachingName(transcript: string): string | null {
  const normalized = transcript.trim()
  const patterns = [
    /(?:记住|学习|认识)(?:这个|这个物体|它)?(?:叫|名字叫)\s*(.+)$/u,
    /(?:remember|learn)\s+(?:this|that|this object|that object)?\s*(?:as|called|named)\s+(.+)$/iu,
    /(?:call|name)\s+(?:this|that|this object|that object)\s+(.+)$/iu,
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    const name = match?.[1]?.trim().replace(/[，。！？,.!?]+$/u, '')
    if (name) return name
  }

  return null
}

export async function createCustomObjectRecord({
  name,
  frame,
  region,
  store,
  extractor,
  source = 'voice-region-teaching',
}: {
  name: string
  frame: ThumbnailFrame
  region: VisionRegion
  store: CustomObjectStore
  extractor: CustomObjectFeatureExtractor
  source?: CustomObjectRecord['source']
}): Promise<CustomObjectRecord> {
  const vector = await extractor.extract({ frame, region, nameHint: name })
  return store.insert({
    name,
    vectors: [vector],
    region: toRegionMetadata(region, frame),
    source,
  })
}

export async function findCustomObjectCandidate({
  frame,
  region,
  store,
  extractor,
  threshold = DEFAULT_CUSTOM_OBJECT_THRESHOLD,
}: {
  frame: ThumbnailFrame | null
  region?: VisionRegion
  store: CustomObjectStore
  extractor: CustomObjectFeatureExtractor
  threshold?: number
}): Promise<VisionCandidate | null> {
  if (!frame || !store.isAvailable() || !extractor.isAvailable()) return null

  const vector = await extractor.extract({ frame, region })
  const [match] = await store.search(vector, { threshold, limit: 1 })
  if (!match) return null

  return {
    label: match.record.name,
    confidence: match.similarity,
    region: match.record.region,
    source: 'custom-object-memory',
    customObjectId: match.record.id,
  }
}

function toRegionMetadata(region: VisionRegion, frame: ThumbnailFrame): CustomObjectRegionMetadata {
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
  const normalizedName = name.trim().toLocaleLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/giu, '-')
  return `custom-object-${normalizedName || 'object'}-${createdAt}`
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

  if (leftMagnitude === 0 || rightMagnitude === 0) return 0
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
