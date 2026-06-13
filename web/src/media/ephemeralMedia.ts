import type { SampledVideoFrame } from '../types'

export function releaseSampledVideoFrame(frame: SampledVideoFrame | null): void {
  if (!frame) {
    return
  }

  ;(frame as { blob: Blob | null }).blob = null
}

export function withEphemeralFrame<T>(
  frame: SampledVideoFrame | null,
  processor: (frame: SampledVideoFrame | null) => T,
): T {
  try {
    return processor(frame)
  } finally {
    releaseSampledVideoFrame(frame)
  }
}

export async function withEphemeralFrameAsync<T>(
  frame: SampledVideoFrame | null,
  processor: (frame: SampledVideoFrame | null) => Promise<T>,
): Promise<T> {
  try {
    return await processor(frame)
  } finally {
    releaseSampledVideoFrame(frame)
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
