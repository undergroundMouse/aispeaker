import { useCallback, useEffect, useMemo, useState } from 'react'
import { appCore } from '../core/bootstrap'
import { eventBus } from '../core/event-bus'
import { LANGUAGE_EVENTS, type LanguageChangedPayload } from '../core/i18n/LanguageStore'
import { getMessages } from '../core/i18n/messages'
import { MEDIA_EVENTS, type ConversationState, type StreamState } from '../core/media/types'
import {
  NETWORK_EVENTS,
  type NetworkRetryPrompt,
  type NetworkStatePayload,
} from '../core/network/types'
import {
  LOCAL_COMMAND_EVENTS,
  VOICE_EVENTS,
  type LocalCommandResult,
  type VoiceInputState,
  type VoiceTranscript,
} from '../core/voice/types'
import {
  CUSTOM_OBJECT_EVENTS,
  type CustomObjectRecognizedPayload,
  type CustomObjectRecord,
  type CustomObjectRegionSelectedPayload,
  type LongTermMemoryRecord,
  type VisionRegion,
} from '../core/vision/types'

const ACTIVE_USER_ID = 'local-user'

export function Toolbar() {
  const [language, setLanguage] = useState(appCore.languageStore.getLanguage())
  const [streamState, setStreamState] = useState<StreamState>(
    appCore.mediaStreamManager.getState(),
  )
  const [conversationState, setConversationState] = useState<ConversationState>(
    appCore.conversationManager.getState(),
  )
  const [voiceState, setVoiceState] = useState<VoiceInputState>(
    appCore.voiceInputManager.getState(),
  )
  const [lastTranscript, setLastTranscript] = useState('')
  const [localCommandMessage, setLocalCommandMessage] = useState('')
  const [networkState, setNetworkState] = useState(appCore.networkMonitor.getState())
  const [retryMessage, setRetryMessage] = useState('')
  const [frameCount, setFrameCount] = useState(0)
  const [customObjectName, setCustomObjectName] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<VisionRegion | null>(null)
  const [learnedObjects, setLearnedObjects] = useState<CustomObjectRecord[]>([])
  const [customObjectMessage, setCustomObjectMessage] = useState('')
  const [longTermMemories, setLongTermMemories] = useState<LongTermMemoryRecord[]>([])
  const [longTermMemoryMessage, setLongTermMemoryMessage] = useState('')
  const [cloudMemoryAccess, setCloudMemoryAccessState] = useState(
    appCore.cloudGateway.getLongTermMemoryConsent().cloudMemoryAccess,
  )
  const [cloudSummarySync, setCloudSummarySyncState] = useState(
    appCore.cloudGateway.getLongTermMemoryConsent().cloudSummarySync,
  )
  const text = useMemo(() => getMessages(language), [language])

  const refreshLearnedObjects = useCallback(async () => {
    setLearnedObjects(await appCore.cloudGateway.listCustomObjects())
  }, [])

  const refreshLongTermMemories = useCallback(async () => {
    const store = appCore.cloudGateway.getLongTermMemoryStore()
    const memories = await store.list(ACTIVE_USER_ID)
    setLongTermMemories(memories)
    const status = store.getStatus()
    setLongTermMemoryMessage(status.available ? '' : status.message ?? 'Local long-term memory is unavailable.')
  }, [])

  useEffect(() => {
    const unsubStream = eventBus.on<StreamState>(MEDIA_EVENTS.STREAM_STATE, setStreamState)
    const unsubFrames = eventBus.on(MEDIA_EVENTS.FRAME_RAW, () => {
      setFrameCount((n) => n + 1)
    })
    const unsubVoice = eventBus.on<VoiceInputState>(VOICE_EVENTS.STATE, setVoiceState)
    const unsubTranscript = eventBus.on<VoiceTranscript>(
      VOICE_EVENTS.TRANSCRIPT_FINAL,
      (payload) => setLastTranscript(payload.text),
    )
    const unsubLocalCommand = eventBus.on<LocalCommandResult>(
      LOCAL_COMMAND_EVENTS.EXECUTED,
      (payload) => setLocalCommandMessage(payload.message),
    )
    const unsubNetwork = eventBus.on<NetworkStatePayload>(NETWORK_EVENTS.STATE, (payload) => {
      setNetworkState(payload.state)
    })
    const unsubRetry = eventBus.on<NetworkRetryPrompt>(NETWORK_EVENTS.RETRY_PROMPT, (payload) => {
      setRetryMessage(payload.message)
    })
    const unsubLanguage = eventBus.on<LanguageChangedPayload>(LANGUAGE_EVENTS.CHANGED, (payload) => {
      setLanguage(payload.language)
      setRetryMessage('')
    })
    const unsubRegion = eventBus.on<CustomObjectRegionSelectedPayload>(
      CUSTOM_OBJECT_EVENTS.REGION_SELECTED,
      (payload) => {
        setSelectedRegion(payload.region)
        setCustomObjectMessage('已选择物体区域。')
      },
    )
    const unsubRecognized = eventBus.on<CustomObjectRecognizedPayload>(
      CUSTOM_OBJECT_EVENTS.RECOGNIZED,
      (payload) => {
        setCustomObjectMessage(payload.answer)
      },
    )
    const refreshTimer = window.setTimeout(() => {
      void refreshLongTermMemories()
    }, 0)
    return () => {
      window.clearTimeout(refreshTimer)
      unsubStream()
      unsubFrames()
      unsubVoice()
      unsubTranscript()
      unsubLocalCommand()
      unsubNetwork()
      unsubRetry()
      unsubLanguage()
      unsubRegion()
      unsubRecognized()
    }
  }, [refreshLongTermMemories])

  const cameraOn = streamState.status === 'active' || streamState.status === 'starting'
  const voiceOn = voiceState.status !== 'disabled'

  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      appCore.mediaStreamManager.stop()
    } else {
      try {
        await appCore.mediaStreamManager.start()
      } catch {
        // error state emitted by manager
      }
    }
  }, [cameraOn])

  const toggleVoice = useCallback(async () => {
    if (voiceOn) {
      appCore.voiceInputManager.disable()
    } else {
      try {
        await appCore.voiceInputManager.enable()
      } catch {
        // error state emitted by manager
      }
    }
  }, [voiceOn])

  const toggleWake = useCallback(async () => {
    if (voiceState.wakeEnabled) {
      appCore.voiceInputManager.disableWake()
      return
    }
    await appCore.voiceInputManager.enableWake()
  }, [voiceState.wakeEnabled])

  const startTalk = useCallback(() => {
    appCore.voiceInputManager.startPressToTalk()
  }, [])

  const stopTalk = useCallback(() => {
    appCore.voiceInputManager.stopPressToTalk()
  }, [])

  const cycleConversation = useCallback(() => {
    const order: ConversationState[] = ['idle', 'listening', 'thinking', 'speaking']
    const idx = order.indexOf(conversationState)
    const next = order[(idx + 1) % order.length]
    appCore.conversationManager.setState(next)
    setConversationState(next)
  }, [conversationState])

  const teachCustomObject = useCallback(async () => {
    if (!selectedRegion || !customObjectName.trim()) {
      setCustomObjectMessage('请先框选物体并输入名称。')
      return
    }

    const record = await appCore.cloudGateway.teachCustomObject(
      customObjectName,
      selectedRegion,
    )
    if (!record) {
      setCustomObjectMessage('暂无可用画面，请先打开摄像头。')
      return
    }

    setCustomObjectMessage(`已记住 ${record.name}。`)
    setCustomObjectName('')
    await refreshLearnedObjects()
  }, [customObjectName, refreshLearnedObjects, selectedRegion])

  const deleteCustomObject = useCallback(
    async (id: string) => {
      await appCore.cloudGateway.deleteCustomObject(id)
      setCustomObjectMessage('已删除已学物体。')
      await refreshLearnedObjects()
    },
    [refreshLearnedObjects],
  )

  const deleteLongTermMemory = useCallback(
    async (id: string) => {
      await appCore.cloudGateway.getLongTermMemoryStore().delete(ACTIVE_USER_ID, id)
      setLongTermMemoryMessage('已删除长期记忆。')
      await refreshLongTermMemories()
    },
    [refreshLongTermMemories],
  )

  const forgetAllLongTermMemories = useCallback(async () => {
    await appCore.cloudGateway.getLongTermMemoryStore().forgetAll(ACTIVE_USER_ID)
    setLongTermMemoryMessage('已忘记所有长期记忆。')
    await refreshLongTermMemories()
  }, [refreshLongTermMemories])

  const setCloudMemoryAccess = useCallback(
    (enabled: boolean) => {
      const next = { cloudMemoryAccess: enabled, cloudSummarySync }
      appCore.cloudGateway.setLongTermMemoryConsent(next)
      setCloudMemoryAccessState(enabled)
    },
    [cloudSummarySync],
  )

  const setCloudSummarySync = useCallback(
    (enabled: boolean) => {
      const next = { cloudMemoryAccess, cloudSummarySync: enabled }
      appCore.cloudGateway.setLongTermMemoryConsent(next)
      setCloudSummarySyncState(enabled)
    },
    [cloudMemoryAccess],
  )

  const voiceStatusLabel =
    voiceState.error?.message ??
    ({
      disabled: text.voiceDisabled,
      'permission-requested': text.voicePermission,
      ready: text.voiceReady,
      'wake-listening': text.voiceWake,
      recording: text.voiceRecording,
      transcribing: text.voiceTranscribing,
      error: text.voiceError,
    }[voiceState.status] ?? voiceState.status)

  return (
    <header className="toolbar">
      <h1 className="toolbar__title">{text.title}</h1>
      <div className="toolbar__actions">
        <button type="button" className="toolbar__btn" onClick={toggleCamera}>
          {cameraOn ? text.cameraOn : text.cameraOff}
        </button>
        <button type="button" className="toolbar__btn" onClick={toggleVoice}>
          {voiceOn ? text.voiceOn : text.voiceOff}
        </button>
        <button
          type="button"
          className="toolbar__btn toolbar__btn--secondary"
          onClick={toggleWake}
          disabled={!voiceOn}
        >
          {voiceState.wakeEnabled ? text.wakeOn : text.wakeOff}
        </button>
        <button
          type="button"
          className={`toolbar__btn toolbar__btn--talk${voiceState.status === 'recording' ? ' toolbar__btn--talk-active' : ''}`}
          disabled={!voiceOn || voiceState.status === 'transcribing'}
          onMouseDown={startTalk}
          onMouseUp={stopTalk}
          onMouseLeave={stopTalk}
          onTouchStart={startTalk}
          onTouchEnd={stopTalk}
        >
          {voiceState.status === 'recording' ? text.talkStop : text.talkStart}
        </button>
        <button type="button" className="toolbar__btn toolbar__btn--secondary" onClick={cycleConversation}>
          {text.conversation}: {conversationState}
        </button>
        <button
          type="button"
          className="toolbar__btn toolbar__btn--secondary"
          onClick={() => appCore.cloudGateway.simulateWeakNetwork()}
        >
          {text.simulateWeak}
        </button>
        <span className="toolbar__stats">
          {text.network}: {networkState}
        </span>
        <span className="toolbar__stats">
          {text.voice}: {voiceStatusLabel}
        </span>
        {lastTranscript && (
          <span className="toolbar__stats toolbar__stats--transcript">
            {text.recent}: {lastTranscript}
          </span>
        )}
        {localCommandMessage && (
          <span className="toolbar__stats toolbar__stats--local">
            {text.local}: {localCommandMessage}
          </span>
        )}
        {retryMessage && (
          <span className="toolbar__stats toolbar__stats--retry">{retryMessage}</span>
        )}
        {customObjectMessage && (
          <span className="toolbar__stats toolbar__stats--local">{customObjectMessage}</span>
        )}
        <span className="toolbar__stats">
          {text.frames}: {frameCount}
        </span>
        <div className="toolbar__custom-object">
          <input
            value={customObjectName}
            onChange={(event) => setCustomObjectName(event.target.value)}
            placeholder="给已框选物体命名"
          />
          <button
            type="button"
            className="toolbar__btn toolbar__btn--secondary"
            onClick={teachCustomObject}
          >
            记住物体
          </button>
          <span className="toolbar__stats">
            已学物体: {learnedObjects.length}
          </span>
          {learnedObjects.map((object) => (
            <button
              key={object.id}
              type="button"
              className="toolbar__btn toolbar__btn--secondary"
              onClick={() => void deleteCustomObject(object.id)}
            >
              忘记 {object.name}
            </button>
          ))}
        </div>
        <div className="toolbar__memory">
          <label className="toolbar__check">
            <input
              type="checkbox"
              checked={cloudMemoryAccess}
              onChange={(event) => setCloudMemoryAccess(event.target.checked)}
            />
            允许云端使用相关长期记忆
          </label>
          <label className="toolbar__check">
            <input
              type="checkbox"
              checked={cloudSummarySync}
              onChange={(event) => setCloudSummarySync(event.target.checked)}
            />
            同步必要摘要
          </label>
          <span className="toolbar__stats">长期记忆: {longTermMemories.length}</span>
          <button
            type="button"
            className="toolbar__btn toolbar__btn--secondary"
            onClick={forgetAllLongTermMemories}
            disabled={longTermMemories.length === 0}
          >
            一键遗忘
          </button>
          {longTermMemoryMessage && (
            <span className="toolbar__stats toolbar__stats--local">{longTermMemoryMessage}</span>
          )}
          {longTermMemories.map((memory) => (
            <button
              key={memory.id}
              type="button"
              className="toolbar__btn toolbar__btn--secondary toolbar__btn--memory"
              title={`${memory.type}, last used ${new Date(memory.lastUsedAt).toLocaleDateString()}`}
              onClick={() => void deleteLongTermMemory(memory.id)}
            >
              删除 {memory.summary}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
