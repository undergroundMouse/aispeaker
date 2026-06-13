// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

class MockMediaStream {
  private readonly videoTracks: MediaStreamTrack[]
  private readonly audioTracks: MediaStreamTrack[]

  constructor(tracks: MediaStreamTrack[] = []) {
    this.videoTracks = tracks.filter((track) => track.kind === 'video')
    this.audioTracks = tracks.filter((track) => track.kind === 'audio')
  }

  getVideoTracks() {
    return this.videoTracks
  }

  getAudioTracks() {
    return this.audioTracks
  }

  getTracks() {
    return [...this.videoTracks, ...this.audioTracks]
  }
}

function createTrack(kind: 'audio' | 'video'): MediaStreamTrack {
  return {
    kind,
    readyState: 'live',
    stop: vi.fn(),
  } as unknown as MediaStreamTrack
}

function mockSupportedMediaDevices() {
  vi.stubGlobal('MediaStream', MockMediaStream)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn((constraints: MediaStreamConstraints) => {
        if (constraints.video) {
          return Promise.resolve(new MockMediaStream([createTrack('video')]))
        }

        return Promise.resolve(new MockMediaStream([createTrack('audio')]))
      }),
    },
  })
}

describe('App', () => {
  beforeEach(() => {
    mockSupportedMediaDevices()
    vi.stubGlobal('indexedDB', new IDBFactory())
    vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders startup media state and processes local commands', async () => {
    render(<App />)

    expect(screen.getByText('实时视觉语音 AI 输入')).toBeTruthy()

    await waitFor(() => {
      expect(screen.getAllByText('ready').length).toBeGreaterThanOrEqual(3)
    })

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: 'switch to English' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText('Realtime Vision Voice AI Input')).toBeTruthy()
    expect(screen.getByText('Switched to English.')).toBeTruthy()
  })

  it('starts push-to-talk dialogue from the microphone control', async () => {
    render(<App />)

    await screen.findByText('Media devices initialized.')
    fireEvent.mouseDown(screen.getByText('按住说话'))

    expect(screen.getByText('Listening...')).toBeTruthy()
  })

  it('shows retry feedback for complex requests during weak network', async () => {
    render(<App />)

    fireEvent.click(screen.getByText('Simulate weak network'))
    await waitFor(() => {
      expect(screen.getByText('weak')).toBeTruthy()
    })

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: 'tell me what is in the room' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText('网络不佳，请重试')).toBeTruthy()
  })

  it('shows transcript-driven multimodal answer state', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: 'tell me what is in the room' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText(/cloud\/general/)).toBeTruthy()
    expect(screen.getByText(/Objects: 0, scenes: 0, gestures: 0/)).toBeTruthy()
    expect(await screen.findByText(/No supported TTS provider is available/)).toBeTruthy()
    expect(screen.getAllByText('unavailable').length).toBeGreaterThan(0)
  })

  it('cancels active speech state from the local stop command', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: 'tell me what is in the room' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText(/No supported TTS provider is available/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: 'stop' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText('已停止对话。')).toBeTruthy()
    expect(screen.getAllByText('cancelled').length).toBeGreaterThan(0)
  })

  it('teaches and manages a custom object locally', async () => {
    render(<App />)

    await screen.findByText('Media devices initialized.')

    fireEvent.click(screen.getByText('Select center object'))
    expect(screen.getByText('已选择画面中央物体区域。')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: '记住这个叫小红杯' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText('已记住 小红杯。')).toBeTruthy()
    expect(screen.getByText('小红杯')).toBeTruthy()

    fireEvent.click(screen.getByText('Forget'))
    expect(await screen.findByText('已删除已学物体。')).toBeTruthy()
    expect(screen.getByText('No custom objects learned')).toBeTruthy()
  })

  it('shows and manages local long-term memories', async () => {
    render(<App />)

    expect(await screen.findByText(/User likes red objects/)).toBeTruthy()
    expect(screen.getByText(/2 local encrypted memories/)).toBeTruthy()

    fireEvent.click(screen.getAllByText('Delete')[0])
    expect(await screen.findByText('已删除长期记忆。')).toBeTruthy()
    expect(screen.getByText(/1 local encrypted memories/)).toBeTruthy()

    fireEvent.click(screen.getByText('Forget all long-term memories'))
    expect(await screen.findByText('已忘记所有长期记忆。')).toBeTruthy()
    expect(screen.getByText('No long-term memories stored')).toBeTruthy()
  })

  it('toggles long-term memory cloud controls', async () => {
    render(<App />)

    expect(await screen.findByText(/cloud access: off, summary sync: off/)).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Allow cloud access to relevant long-term memory'))
    fireEvent.click(screen.getByLabelText('Enable summary-only cloud memory sync'))

    expect(screen.getByText(/cloud access: authorized, summary sync: on/)).toBeTruthy()
  })

  it('restores proactive prompt state and handles proactive voice controls', async () => {
    localStorage.setItem(
      'proactive-prompt-state-v1',
      JSON.stringify({
        settings: {
          enabled: false,
          reminderIntensity: 'normal',
          dailyCap: 12,
        },
        counters: {
          date: new Date().toISOString().slice(0, 10),
          dailyCount: 3,
          sessionStartedAt: Date.now(),
          spokenAt: [],
          lastPromptAtByKey: {},
        },
        feedback: [],
      }),
    )

    render(<App />)

    expect(await screen.findByText('off')).toBeTruthy()
    expect(screen.getByText(/Daily 3\/12, intensity: normal/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: '多提醒我' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText('我会多提醒你。')).toBeTruthy()
    expect(screen.getByText(/Daily 3\/40, intensity: more/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: '闭嘴，别主动说话' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText('已关闭主动提示。')).toBeTruthy()
    expect(screen.getByText('off')).toBeTruthy()
  })

  it('keeps dialogue processing available when proactive prompts are disabled', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: '闭嘴，别主动说话' },
    })
    fireEvent.click(screen.getByText('Process transcript'))
    expect(await screen.findByText('已关闭主动提示。')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Voice transcript simulator'), {
      target: { value: 'tell me what is in the room' },
    })
    fireEvent.click(screen.getByText('Process transcript'))

    expect(await screen.findByText(/cloud\/general/)).toBeTruthy()
  })
})
