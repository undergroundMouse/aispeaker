// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AssistShell } from './AssistShell'

const baseProps = {
  language: 'zh' as const,
  videoRef: { current: null },
  cameraStream: null,
  cameraStatus: 'ready',
  mediaStatus: 'ready',
  microphoneStatus: 'ready',
  networkState: 'online',
  speechStatus: 'idle',
  asrState: {
    status: 'idle' as const,
    provider: null,
    currentTurnId: null,
    interimText: '',
    finalText: '',
    errorMessage: null,
  },
  activeVisualEvidence: null,
  selectedObjectRegion: null,
  captionTurns: [],
  proactiveBanner: { visible: false, text: '', promptId: null },
  systemToast: { visible: false, message: '', variant: 'generic' as const },
  memoryBadgeCount: 0,
  interactionFeedback: { kind: 'none' as const },
  isPushToTalkActive: false,
  chatInputText: '',
  onChatInputChange: vi.fn(),
  onChatInputSubmit: vi.fn(),
  onDismissSystemToast: vi.fn(),
  onOpenMemory: vi.fn(),
  onOpenSettings: vi.fn(),
  onOpenPrivacySettings: vi.fn(),
  onSelectFromPointer: vi.fn(),
  onStartPushToTalk: vi.fn(),
  onStopPushToTalk: vi.fn(),
  onSelectCenteredObject: vi.fn(),
  onClearSelectedObject: vi.fn(),
}

describe('AssistShell split layout', () => {
  afterEach(() => cleanup())

  it('renders split columns with talk controls and dialogue panel', () => {
    const { container } = render(<AssistShell {...baseProps} />)

    expect(container.querySelector('.assist-shell--split')).toBeTruthy()
    expect(container.querySelector('.assist-split-layout')).toBeTruthy()
    expect(screen.getByText('按住说话')).toBeTruthy()
    expect(screen.getByText('开始说话后，AI 回复会显示在这里。')).toBeTruthy()
    expect(screen.getByLabelText('输入消息')).toBeTruthy()
  })

  it('exposes permissions settings button in dialogue panel', () => {
    render(<AssistShell {...baseProps} />)

    expect(screen.getByText('权限设置')).toBeTruthy()
  })

  it('exposes memory and settings chrome buttons', () => {
    render(<AssistShell {...baseProps} />)

    expect(screen.getByLabelText('我的记忆')).toBeTruthy()
    expect(screen.getByLabelText('设置')).toBeTruthy()
    expect(screen.queryByText('设置每日预算上限')).toBeNull()
  })
})
