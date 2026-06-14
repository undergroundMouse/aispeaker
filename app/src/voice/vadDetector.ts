export interface VadState {
  active: boolean
  speechDetected: boolean
  silenceDurationMs: number
}

export interface VadDetectorOptions {
  speechThreshold?: number
  silenceEndpointMs?: number
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
}

export class VadDetector {
  private readonly speechThreshold: number
  private readonly silenceEndpointMs: number
  private readonly onSpeechStart?: () => void
  private readonly onSpeechEnd?: () => void
  private speechDetected = false
  private silenceStartedAt: number | null = null

  constructor(options: VadDetectorOptions = {}) {
    this.speechThreshold = options.speechThreshold ?? 0.02
    this.silenceEndpointMs = options.silenceEndpointMs ?? 600
    this.onSpeechStart = options.onSpeechStart
    this.onSpeechEnd = options.onSpeechEnd
  }

  processRms(rms: number): VadState {
    const now = Date.now()
    if (rms >= this.speechThreshold) {
      if (!this.speechDetected) {
        this.speechDetected = true
        this.onSpeechStart?.()
      }
      this.silenceStartedAt = null
      return { active: true, speechDetected: true, silenceDurationMs: 0 }
    }

    if (this.speechDetected) {
      if (this.silenceStartedAt === null) {
        this.silenceStartedAt = now
      }
      const silenceDurationMs = now - this.silenceStartedAt
      if (silenceDurationMs >= this.silenceEndpointMs) {
        this.speechDetected = false
        this.silenceStartedAt = null
        this.onSpeechEnd?.()
        return { active: false, speechDetected: false, silenceDurationMs }
      }
      return { active: true, speechDetected: false, silenceDurationMs }
    }

    return { active: false, speechDetected: false, silenceDurationMs: 0 }
  }

  isSpeechActive(): boolean {
    return this.speechDetected
  }
}

export function computeRms(samples: Float32Array): number {
  if (samples.length === 0) {
    return 0
  }

  let sum = 0
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i]! * samples[i]!
  }
  return Math.sqrt(sum / samples.length)
}
