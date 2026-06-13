// @vitest-environment jsdom
import './test/resizeObserver'
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

async function submitChat(text: string) {
  const input = await screen.findByLabelText(/输入消息|Message/)
  fireEvent.change(input, { target: { value: text } })
  const form = input.closest('form')
  expect(form).toBeTruthy()
  fireEvent.submit(form!)
}

async function openSettings() {
  fireEvent.click(screen.getByLabelText('设置'))
}

async function openMemoryPage() {
  fireEvent.click(screen.getByLabelText(/我的记忆|My memory/))
  await screen.findByRole('heading', { name: /我的记忆|My memory/ })
}

async function waitForMediaReady() {
  const button = await screen.findByText(/按住说话|Hold to talk/)
  await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false))
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
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders assist shell without debug panel or operator chrome', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '实时视觉语音 AI 输入' })).toBeTruthy()
    expect(screen.queryByText('展开调试面板')).toBeNull()
    expect(screen.queryByText('运营台')).toBeNull()
    expect(screen.getByLabelText('我的记忆')).toBeTruthy()
    expect(screen.getByLabelText('设置')).toBeTruthy()
  })

  it('processes local commands through dialogue panel chat input', async () => {
    render(<App />)

    await submitChat('switch to English')
    expect(await screen.findByText('Switched to English.')).toBeTruthy()
    expect(screen.getByText('switch to English')).toBeTruthy()
  })

  it('starts push-to-talk dialogue from the microphone control', async () => {
    render(<App />)

    await waitForMediaReady()
    fireEvent.pointerDown(screen.getByText('按住说话'), { pointerId: 1, pointerType: 'mouse' })

    expect(await screen.findByText('你好')).toBeTruthy()
  })

  it('commits push-to-talk transcript through ASR on release', async () => {
    render(<App />)

    await waitForMediaReady()
    fireEvent.pointerDown(screen.getByText('按住说话'), { pointerId: 1, pointerType: 'mouse' })
    await screen.findByText('你好')
    fireEvent.pointerUp(screen.getByText('松开结束'), { pointerId: 1, pointerType: 'mouse' })

    expect(await screen.findByText('你好。')).toBeTruthy()
    expect(screen.getByText('你好')).toBeTruthy()
  })

  it('renders split assist layout without overlay talk FAB', () => {
    const { container } = render(<App />)

    expect(container.querySelector('.assist-shell--split')).toBeTruthy()
    expect(container.querySelector('.talk-fab')).toBeNull()
  })

  it('returns from memory page back to assist without blanking the camera stage', async () => {
    const { container } = render(<App />)

    await openMemoryPage()
    fireEvent.click(screen.getByLabelText('返回 Assist'))

    expect(await screen.findByLabelText('我的记忆')).toBeTruthy()
    expect(container.querySelector('.assist-shell--split')).toBeTruthy()
    expect(container.querySelector('.preview-video')).toBeTruthy()
  })

  it('shows retry feedback for complex requests during weak network', async () => {
    const localCommands = await import('./voice/localCommands')
    vi.spyOn(localCommands, 'canRouteComplexRequest').mockReturnValue(false)

    render(<App />)

    await submitChat('what is this')

    expect((await screen.findAllByText(/网络不佳|网络不稳定|Network is poor|Network is unstable/)).length).toBeGreaterThan(0)
  })

  it('shows multimodal answer in dialogue panel', async () => {
    render(<App />)

    await submitChat('tell me what is in the room')

    expect(await screen.findByText(/云端视觉模型|cloud visual model/i)).toBeTruthy()
    expect(screen.getByText('tell me what is in the room')).toBeTruthy()
  })

  it('cancels active speech state from the local stop command', async () => {
    render(<App />)

    await submitChat('tell me what is in the room')
    await screen.findByText(/云端视觉模型|cloud visual model/i)

    await submitChat('stop')
    expect(await screen.findByText('已停止对话。')).toBeTruthy()
    expect(screen.getByText('stop')).toBeTruthy()
  })

  it('teaches and manages a custom object from memory page', async () => {
    render(<App />)

    await waitForMediaReady()

    fireEvent.click(screen.getByText('框选中央物体'))
    expect(screen.getByText('已选择画面中央物体区域。', { selector: '.camera-feedback' })).toBeTruthy()

    fireEvent.click(screen.getByText('取消框选'))
    expect(screen.getByText('已取消框选。', { selector: '.camera-feedback' })).toBeTruthy()
    expect(screen.queryByText('取消框选')).toBeNull()

    fireEvent.click(screen.getByText('框选中央物体'))
    expect(screen.getByText('已选择画面中央物体区域。', { selector: '.camera-feedback' })).toBeTruthy()

    await submitChat('记住这个叫小红杯')
    expect(await screen.findByText('记住这个叫小红杯')).toBeTruthy()

    await openMemoryPage()
    expect(screen.getAllByText('小红杯').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText('忘记'))
    expect(await screen.findByText(/框选物体并说/)).toBeTruthy()
  })

  it('starts with empty long-term memories and creates one from explicit intent', async () => {
    render(<App />)

    await openMemoryPage()
    expect(screen.getByText('暂无长期记忆')).toBeTruthy()

    window.history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await submitChat('我喜欢红色')
    await screen.findByText('我喜欢红色')

    await openMemoryPage()
    expect(await screen.findByText(/用户喜欢红色/)).toBeTruthy()
  })

  it('short-circuits explicit remember requests into local memory', async () => {
    render(<App />)

    await submitChat('帮我记住钥匙在门口柜子')

    expect((await screen.findAllByText('已记住。')).length).toBeGreaterThan(0)
    expect(screen.queryByText(/云端视觉模型|cloud visual model/i)).toBeNull()

    await openMemoryPage()
    expect(await screen.findByText(/钥匙在门口柜子/)).toBeTruthy()
  })

  it('manages long-term memories on memory page', async () => {
    render(<App />)

    await submitChat('我喜欢红色')
    await screen.findByText('我喜欢红色')

    await openMemoryPage()
    expect(await screen.findByText(/用户喜欢红色/)).toBeTruthy()

    fireEvent.click(screen.getAllByText('删除')[0])
    expect(await screen.findByText('暂无长期记忆')).toBeTruthy()
  })

  it('toggles long-term memory authorization in settings only', async () => {
    render(<App />)

    await openSettings()
    expect(screen.getByText('记忆授权')).toBeTruthy()
    expect(screen.queryByText(/条本地加密记忆/)).toBeNull()

    fireEvent.click(screen.getByLabelText('允许云端访问相关长期记忆'))
    fireEvent.click(screen.getByLabelText('启用仅摘要云端记忆同步'))

    expect((screen.getByLabelText('允许云端访问相关长期记忆') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('启用仅摘要云端记忆同步') as HTMLInputElement).checked).toBe(true)
  })

  it('handles proactive voice controls through dialogue panel', async () => {
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

    expect(screen.queryByText('展开调试面板')).toBeNull()

    await submitChat('多提醒我')
    expect(await screen.findByText('我会多提醒你。')).toBeTruthy()

    await submitChat('闭嘴，别主动说话')
    expect(await screen.findByText('已关闭主动提示。')).toBeTruthy()
  })

  it('navigates to memory route from assist chrome', async () => {
    render(<App />)

    await openMemoryPage()
    expect(window.location.pathname).toBe('/memory')

    fireEvent.click(screen.getByText('返回 Assist'))
    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
    })
  })
})
