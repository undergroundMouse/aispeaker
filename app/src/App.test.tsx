// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('./ai/createCloudVisualLanguageProvider', async () => {
  const { MockCloudVisualLanguageProvider } = await import('./ai/cloudVisualLanguage')
  return {
    createCloudVisualLanguageProvider: () => ({
      provider: new MockCloudVisualLanguageProvider(),
      kind: 'mock' as const,
      authorityMode: 'client' as const,
      useClientGateway: true,
    }),
  }
})

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

async function expandDebugPanel() {
  fireEvent.click(screen.getByText('展开调试面板'))
}

async function openSettings() {
  fireEvent.click(screen.getByText('设置'))
}

describe('App', () => {
  beforeEach(() => {
    mockSupportedMediaDevices()
    vi.stubGlobal('indexedDB', new IDBFactory())
    vi.stubGlobal('IDBKeyRange', IDBKeyRange)
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders assist shell and processes local commands through debug panel', async () => {
    render(<App />)

    expect(screen.getByText('实时视觉语音 AI 输入')).toBeTruthy()
    expect(screen.queryByText('设置每日预算上限 $0.01')).toBeNull()

    await expandDebugPanel()
    await waitFor(() => {
      expect(screen.getAllByText('ready').length).toBeGreaterThanOrEqual(3)
    })

    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: 'switch to English' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText('Realtime Vision Voice AI Input')).toBeTruthy()
    expect(screen.getByText('Switched to English.')).toBeTruthy()
  })

  it('starts push-to-talk dialogue from the microphone control', async () => {
    render(<App />)

    await expandDebugPanel()
    await screen.findByText('Media devices initialized.')
    fireEvent.mouseDown(screen.getByText('按住说话'))

    expect(screen.getByText('Listening...')).toBeTruthy()
  })

  it('shows retry feedback for complex requests during weak network', async () => {
    render(<App />)

    await expandDebugPanel()
    fireEvent.click(screen.getByText('模拟弱网'))
    await waitFor(() => {
      expect(screen.getByText('weak')).toBeTruthy()
    })

    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: 'tell me what is in the room' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText('网络不佳，请重试')).toBeTruthy()
  })

  it('shows transcript-driven multimodal answer state in debug panel', async () => {
    render(<App />)

    await expandDebugPanel()
    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: 'tell me what is in the room' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText(/cloud\/general/)).toBeTruthy()
    expect(screen.getByText(/Objects: 0, scenes: 0, gestures: 0/)).toBeTruthy()
    expect(await screen.findByText(/No supported TTS provider is available/)).toBeTruthy()
    expect(screen.getAllByText('unavailable').length).toBeGreaterThan(0)
  })

  it('cancels active speech state from the local stop command', async () => {
    render(<App />)

    await expandDebugPanel()
    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: 'tell me what is in the room' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText(/No supported TTS provider is available/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: 'stop' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText('已停止对话。')).toBeTruthy()
    expect(screen.getAllByText('cancelled').length).toBeGreaterThan(0)
  })

  it('teaches and manages a custom object from settings', async () => {
    render(<App />)

    await expandDebugPanel()
    await screen.findByText('Media devices initialized.')

    fireEvent.click(screen.getByText('框选中央物体'))
    expect(screen.getByText('已选择画面中央物体区域。')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: '记住这个叫小红杯' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText('已记住 小红杯。')).toBeTruthy()

    await openSettings()
    expect(screen.getAllByText('小红杯').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText('忘记'))
    expect(await screen.findByText('已删除已学物体。')).toBeTruthy()
    expect(screen.getAllByText('暂无已学物体').length).toBeGreaterThan(0)
  })

  it('shows and manages local long-term memories in settings', async () => {
    render(<App />)

    await openSettings()
    expect(await screen.findByText(/User likes red objects/)).toBeTruthy()
    expect(screen.getByText(/2 条本地加密记忆/)).toBeTruthy()

    fireEvent.click(screen.getAllByText('删除')[0])
    expect(await screen.findByText('已删除长期记忆。')).toBeTruthy()
    expect(screen.getByText(/1 条本地加密记忆/)).toBeTruthy()

    fireEvent.click(screen.getByText('忘记全部长期记忆'))
    expect(await screen.findByText('已忘记所有长期记忆。')).toBeTruthy()
    expect(screen.getByText('暂无长期记忆')).toBeTruthy()
  })

  it('toggles long-term memory cloud controls in settings', async () => {
    render(<App />)

    await openSettings()
    expect(await screen.findByText(/云端访问：关闭/)).toBeTruthy()
    fireEvent.click(screen.getByLabelText('允许云端访问相关长期记忆'))
    fireEvent.click(screen.getByLabelText('启用仅摘要云端记忆同步'))

    expect(screen.getByText(/云端访问：已授权/)).toBeTruthy()
    expect(screen.getByText(/摘要同步：开/)).toBeTruthy()
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

    expect(await screen.findByText(/主动提醒: 关/)).toBeTruthy()

    await expandDebugPanel()
    expect(screen.getByText(/Daily 3\/12, intensity: normal/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: '多提醒我' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText('我会多提醒你。')).toBeTruthy()
    expect(screen.getByText(/Daily 3\/40, intensity: more/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: '闭嘴，别主动说话' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText('已关闭主动提示。')).toBeTruthy()
    expect(screen.getByText(/主动提醒: 关/)).toBeTruthy()
  })

  it('keeps dialogue processing available when proactive prompts are disabled', async () => {
    render(<App />)

    await expandDebugPanel()
    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: '闭嘴，别主动说话' },
    })
    fireEvent.click(screen.getByText('处理转写'))
    expect(await screen.findByText('已关闭主动提示。')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('语音转写模拟器'), {
      target: { value: 'tell me what is in the room' },
    })
    fireEvent.click(screen.getByText('处理转写'))

    expect(await screen.findByText(/cloud\/general/)).toBeTruthy()
  })

})
