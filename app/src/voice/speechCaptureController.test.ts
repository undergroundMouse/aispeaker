// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { AppLanguage, AsrEvent, AsrProvider, AsrProviderCapabilities, AsrRequest, TtsCancellationReason, TtsEvent, TtsProvider, TtsProviderCapabilities, TtsRequest } from '../types'
import { MockAsrProvider } from './asrProviders'
import { SpeechCaptureController } from './speechCaptureController'
import { SpeechResponseController, createDialogueSegment } from './speechResponseController'

class FailingAsrProvider implements AsrProvider {
  readonly kind: AsrProvider['kind']

  constructor(kind: AsrProvider['kind']) {
    this.kind = kind
  }

  getCapabilities(_language: AppLanguage): AsrProviderCapabilities {
    return {
      kind: this.kind,
      available: true,
      local: this.kind === 'web-speech',
      supportsInterimResults: true,
      supportsLanguage: true,
    }
  }

  startSession(request: AsrRequest, onEvent: (event: AsrEvent) => void): void {
    onEvent({
      type: 'error',
      at: Date.now(),
      provider: this.kind,
      turnId: request.turnId,
      message: `${this.kind} failed`,
    })
  }

  stopSession(): Promise<string> {
    return Promise.resolve('')
  }

  cancel(): void {}
}

class BlockingMockTtsProvider implements TtsProvider {
  readonly kind = 'mock' as const
  private cancelledReason: TtsCancellationReason | null = null
  private releaseBlockedChunk: (() => void) | null = null
  onBlocked: (() => void) | null = null

  getCapabilities(_language: AppLanguage): TtsProviderCapabilities {
    return {
      kind: this.kind,
      available: true,
      local: true,
      supportsStreaming: true,
      supportsLanguage: true,
    }
  }

  async *speak(_request: TtsRequest): AsyncIterable<TtsEvent> {
    yield { type: 'start', at: Date.now(), provider: this.kind }
    yield { type: 'first-audio', at: Date.now(), provider: this.kind }
    this.onBlocked?.()
    await new Promise<void>((resolve) => {
      this.releaseBlockedChunk = resolve
    })

    if (this.cancelledReason) {
      yield { type: 'cancel', at: Date.now(), provider: this.kind, reason: this.cancelledReason }
      this.cancelledReason = null
      return
    }

    yield { type: 'end', at: Date.now(), provider: this.kind }
  }

  cancel(reason: TtsCancellationReason): void {
    this.cancelledReason = reason
    this.releaseBlockedChunk?.()
  }
}

describe('SpeechCaptureController', () => {
  it('aggregates interim and final transcript on stop', async () => {
    const controller = new SpeechCaptureController([new MockAsrProvider('switch to english')])
    const states: string[] = []
    controller.setStateListener((state) => states.push(state.status))

    controller.start({ turnId: 'turn-1', language: 'en', preferMock: true })
    expect(states).toContain('listening')

    const result = await controller.stop()
    expect(result?.transcript).toBe('switch to english')
    expect(result?.committedAt).toBeGreaterThan(0)
    expect(states.at(-1)).toBe('idle')
  })

  it('cancels active capture without committing', async () => {
    const controller = new SpeechCaptureController([new MockAsrProvider('hello')])
    controller.start({ turnId: 'turn-1', language: 'en', preferMock: true })
    controller.cancel()

    const result = await controller.stop()
    expect(result).toBeNull()
    expect(controller.getState().status).toBe('idle')
  })

  it('falls back to the next provider when cloud streaming fails during capture', async () => {
    const controller = new SpeechCaptureController([
      new FailingAsrProvider('cloud-streaming'),
      new MockAsrProvider('fallback transcript'),
    ])
    controller.start({ turnId: 'turn-1', language: 'en' })

    expect(controller.getState().provider).toBe('mock')

    const result = await controller.stop()
    expect(result?.transcript).toBe('fallback transcript')
  })

  it('falls back when cloud streaming stays silent during capture', async () => {
    vi.useFakeTimers()

    class SilentCloudAsrProvider implements AsrProvider {
      readonly kind = 'cloud-streaming' as const

      getCapabilities(_language: AppLanguage): AsrProviderCapabilities {
        return {
          kind: this.kind,
          available: true,
          local: false,
          supportsInterimResults: true,
          supportsLanguage: true,
        }
      }

      startSession(_request: AsrRequest, onEvent: (event: AsrEvent) => void): void {
        onEvent({ type: 'start', at: Date.now(), provider: this.kind, turnId: _request.turnId })
      }

      stopSession(): Promise<string> {
        return Promise.resolve('')
      }

      cancel(): void {}
    }

    const controller = new SpeechCaptureController([
      new SilentCloudAsrProvider(),
      new MockAsrProvider('fallback transcript'),
    ])
    controller.start({ turnId: 'turn-1', language: 'en' })
    expect(controller.getState().provider).toBe('cloud-streaming')

    await vi.advanceTimersByTimeAsync(2_500)

    expect(controller.getState().provider).toBe('mock')

    const result = await controller.stop()
    expect(result?.transcript).toBe('fallback transcript')

    vi.useRealTimers()
  })
})

describe('half-duplex speech', () => {
  it('cancels active TTS with user-interrupt before ASR commit completes', async () => {
    const blockingProvider = new BlockingMockTtsProvider()
    const speechController = new SpeechResponseController([blockingProvider])
    const captureController = new SpeechCaptureController([new MockAsrProvider('stop')])
    const blocked = new Promise<void>((resolve) => {
      blockingProvider.onBlocked = resolve
    })

    const speakPromise = speechController.speakResponse({
      turnId: 'turn-tts',
      segments: [createDialogueSegment('turn-tts', '这是杯子。还有一本书。')],
      language: 'zh',
      networkState: 'online',
    })

    await blocked
    speechController.cancel('user-interrupt')
    captureController.start({ turnId: 'turn-asr', language: 'zh', preferMock: true })

    const [captureResult, speakResult] = await Promise.all([captureController.stop(), speakPromise])

    expect(captureResult?.transcript).toBe('stop')
    expect(speakResult.state.cancellationReason).toBe('user-interrupt')
  })
})
