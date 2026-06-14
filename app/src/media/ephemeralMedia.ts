import type { SampledVideoFrame } from '../types'

export function releaseSampledVideoFrame(frame: SampledVideoFrame | null): void {
  if (!frame) {
    return
  }

  // Drop blob reference so raw media is not retained beyond processing lifecycle.
  ;(frame as { blob: Blob | null }).blob = null
}

export function cloneSampledVideoFrame(frame: SampledVideoFrame): SampledVideoFrame {
  if (!frame.blob) {
    return { ...frame }
  }

  return {
    ...frame,
    blob: frame.blob.slice(0, frame.blob.size, frame.blob.type),
  }
}

export function withEphemeralFrame<T>(
  frame: SampledVideoFrame | null,
  processor: (frame: SampledVideoFrame | null) => T,
): T {
  const ephemeralFrame = frame ? cloneSampledVideoFrame(frame) : null
  try {
    return processor(ephemeralFrame)
  } finally {
    releaseSampledVideoFrame(ephemeralFrame)
  }
}

export async function withEphemeralFrameAsync<T>(
  frame: SampledVideoFrame | null,
  processor: (frame: SampledVideoFrame | null) => Promise<T>,
): Promise<T> {
  const ephemeralFrame = frame ? cloneSampledVideoFrame(frame) : null
  try {
    return await processor(ephemeralFrame)
  } finally {
    releaseSampledVideoFrame(ephemeralFrame)
  }
}

export function stripMediaForCloud<T extends { frame?: SampledVideoFrame | null }>(
  payload: T,
  authorized: boolean,
): T {
  if (authorized) {
    return payload
  }

  return {
    ...payload,
    frame: null,
  }
}

export async function frameBlobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.includes(',') ? (result.split(',')[1] ?? '') : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read frame blob'))
    reader.readAsDataURL(blob)
  })
}
