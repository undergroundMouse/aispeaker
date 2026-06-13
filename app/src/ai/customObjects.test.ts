import { describe, expect, it, vi } from 'vitest'
import type { SampledVideoFrame, VisionRegion } from '../types'
import {
  LocalCustomObjectStore,
  PrototypeCustomObjectFeatureExtractor,
  UnavailableCustomObjectStore,
  getCustomObjectMemoryMessage,
  parseTeachingName,
  searchCustomObjects,
  teachCustomObject,
} from './customObjects'

const frame: SampledVideoFrame = {
  blob: new Blob(['frame']),
  capturedAt: 1,
  width: 640,
  height: 480,
  mode: 'normal',
}

const region: VisionRegion = {
  x: 0.3,
  y: 0.25,
  width: 0.4,
  height: 0.5,
}

describe('customObjects', () => {
  it('parses Chinese and English teaching utterances', () => {
    expect(parseTeachingName('记住这个叫小红杯')).toBe('小红杯')
    expect(parseTeachingName('remember this as travel mug')).toBe('travel mug')
    expect(parseTeachingName('what is this')).toBeNull()
  })

  it('stores, searches, lists, deletes, and undoes local custom objects', async () => {
    const store = new LocalCustomObjectStore(null)
    const extractor = new PrototypeCustomObjectFeatureExtractor()

    const teaching = await teachCustomObject({
      transcript: '记住这个叫小红杯',
      frame,
      region,
      store,
      extractor,
      language: 'zh',
    })

    expect(teaching.status).toBe('stored')
    expect(teaching.record?.name).toBe('小红杯')
    expect(await store.list()).toHaveLength(1)

    const match = await searchCustomObjects({ frame, region, store, extractor })
    expect(match?.record.name).toBe('小红杯')

    const undone = await store.deleteLastTeaching()
    expect(undone?.name).toBe('小红杯')
    expect(await store.list()).toHaveLength(0)
  })

  it('returns local-memory-unavailable without cloud side effects', async () => {
    const extractor = new PrototypeCustomObjectFeatureExtractor()
    const insertSpy = vi.spyOn(UnavailableCustomObjectStore.prototype, 'insert')

    const result = await teachCustomObject({
      transcript: 'remember this as mug',
      frame,
      region,
      store: new UnavailableCustomObjectStore(),
      extractor,
      language: 'en',
    })

    expect(result.status).toBe('memory-unavailable')
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it('prompts for missing teaching inputs and empty undo state', async () => {
    const store = new LocalCustomObjectStore(null)
    const extractor = new PrototypeCustomObjectFeatureExtractor()

    await expect(
      teachCustomObject({
        transcript: 'remember this as mug',
        frame: null,
        region,
        store,
        extractor,
        language: 'en',
      }),
    ).resolves.toMatchObject({ status: 'missing-frame' })

    await expect(
      teachCustomObject({
        transcript: 'remember this as mug',
        frame,
        region: null,
        store,
        extractor,
        language: 'en',
      }),
    ).resolves.toMatchObject({ status: 'missing-region' })

    await expect(
      teachCustomObject({
        transcript: 'what is this',
        frame,
        region,
        store,
        extractor,
        language: 'en',
      }),
    ).resolves.toMatchObject({ status: 'missing-name' })

    expect(getCustomObjectMemoryMessage('zh', 'none')).toBe('没有可撤销的教学记录。')
  })
})
