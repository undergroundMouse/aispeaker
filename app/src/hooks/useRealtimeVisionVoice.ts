import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatSpeechCaptureError, getMessages } from '../i18n'
import { InMemoryOperationsAdmin } from '../admin/operationsAdmin'
import { emptyConversationMemory } from '../ai/conversationMemory'
import {
  LocalCustomObjectStore,
  PrototypeCustomObjectFeatureExtractor,
  downloadCustomObjectExport,
  exportCustomObjects,
  getCustomObjectMemoryMessage,
  parseTeachingName,
  teachCustomObject,
} from '../ai/customObjects'
import {
  extractLocalMemoryCandidates,
  getMemoryCandidatesFromAnswer,
  parseExplicitMemoryIntent,
  persistDialogueMemoryCandidates,
  shouldSkipDialogueMemoryPersistence,
} from '../ai/dialogueMemory'
import {
  LocalLongTermMemoryStore,
  downloadLongTermMemoryExport,
  exportLongTermMemories,
  getLongTermMemoryReviewPrompt,
} from '../ai/longTermMemory'
import { createEdgeCloudMetricsSession, recordCloudRoutingOutcome } from '../ai/edgeCloudMetrics'
import { MockLocalVisionAnalyzer, isVisualQuestion } from '../ai/localVision'
import { MultimodalDialogueService } from '../ai/multimodalDialogue'
import { createCloudVisualLanguageProvider } from '../ai/createCloudVisualLanguageProvider'
import {
  getAdminDailySpend,
  listAdminConversations,
  readBackendClientConfig,
  setAdminBudget,
} from '../ai/backendClient'
import { CloudGateway, GatewayCloudVisualLanguageProvider } from '../gateway/cloudGateway'
import { InMemoryConversationTelemetryStore } from '../gateway/conversationTelemetry'
import {
  evaluateProactivePromptPolicy,
  loadProactivePromptState,
  createProactiveLocalDetector,
  ProactiveObservationHistory,
  ProactiveRulesEngine,
  recordProactivePromptFeedback,
  recordProactivePromptSpoken,
  saveProactivePromptState,
  setProactivePromptsEnabled,
  setProactiveReminderIntensity,
} from '../ai/proactivePrompts'
import { VideoFrameSampler } from '../ai/videoFrameSampler'
import { buildSpeakableAnswerText, createActiveVisualEvidence, isVisualEvidenceExpired } from '../ai/visualEvidence'
import { releaseSampledVideoFrame } from '../media/ephemeralMedia'
import { emptyMediaCaptureState, requestMediaCapture, stopMediaCapture } from '../media/mediaCapture'
import {
  loadMediaPrivacyConsent,
  saveMediaPrivacyConsent,
} from '../media/mediaPrivacy'
import { deriveNetworkState } from '../network/networkState'
import type {
  AppLanguage,
  AsrCaptureResult,
  AsrCaptureState,
  ConversationMemoryState,
  ConversationTelemetryRecord,
  CustomObjectRecord,
  DialogueEvent,
  DialogueResponseSegment,
  LocalCommandMatch,
  LongTermMemoryConsentSettings,
  LongTermMemoryRecord,
  LongTermMemoryStoreStatus,
  LocalVisionSignals,
  MediaCaptureState,
  MediaPrivacyConsent,
  NetworkState,
  ProactivePromptCandidate,
  ProactivePromptState,
  SampledVideoFrame,
  SamplingMode,
  SpeechPlaybackState,
  VisualAnswer,
  VoiceLatencyMetrics,
  VisionRegion,
  ActiveVisualEvidence,
} from '../types'
import { getWatchOnlySamplingMode } from '../watchOnly'
import { SpeechResponseController } from '../voice/speechResponseController'
import {
  canRouteComplexRequest,
  matchLocalCommand,
  normalizePhrase,
} from '../voice/localCommands'
import {
  getOfflineCloudMessage,
  getWeakNetworkCloudMessage,
} from '../voice/cloudFailureMessages'
import { detectSystemFailureVariant } from '../surfaces/conversationEntry'
import { CloudStreamingTtsProvider, WebSpeechTtsProvider } from '../voice/ttsProviders'
import { MockAsrProvider, WebSpeechAsrProvider, CloudStreamingAsrProvider } from '../voice/asrProviders'
import { SpeechCaptureController } from '../voice/speechCaptureController'
import { buildStreamingPreviewSegments } from '../surfaces/assist/buildCaptionTurns'

interface WakeDetector {
  start: (onWake: () => void) => void
  stop: () => void
}

interface UseRealtimeVisionVoiceOptions {
  wakeDetector?: WakeDetector
}

const ACTIVE_USER_ID = 'local-user'

export function useRealtimeVisionVoice({ wakeDetector }: UseRealtimeVisionVoiceOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const samplerRef = useRef<VideoFrameSampler | null>(null)
  const [customObjectStore] = useState(() => new LocalCustomObjectStore())
  const [customObjectFeatureExtractor] = useState(() => new PrototypeCustomObjectFeatureExtractor())
  const [longTermMemoryStore] = useState(() => new LocalLongTermMemoryStore())
  const [telemetryStore] = useState(() => new InMemoryConversationTelemetryStore())
  const [cloudGateway] = useState(() => new CloudGateway({ telemetryStore }))
  const [operationsAdmin] = useState(
    () => new InMemoryOperationsAdmin(telemetryStore, 'ops-admin-token'),
  )
  const conversationIdRef = useRef(`conversation-${Date.now()}`)
  const mediaPrivacyConsentRef = useRef<MediaPrivacyConsent>(loadMediaPrivacyConsent())
  const longTermMemoryConsentRef = useRef<LongTermMemoryConsentSettings>({
    cloudMemoryAccess: false,
    cloudSummarySync: false,
  })
  const [edgeCloudMetrics, setEdgeCloudMetrics] = useState(createEdgeCloudMetricsSession)
  const [conversationTelemetry, setConversationTelemetry] = useState<ConversationTelemetryRecord[]>([])
  const [dailySpend, setDailySpend] = useState(0)
  const [mediaPrivacyConsent, setMediaPrivacyConsent] = useState<MediaPrivacyConsent>(() => {
    const consent = loadMediaPrivacyConsent()
    mediaPrivacyConsentRef.current = consent
    return consent
  })
  const backendConfig = useMemo(() => readBackendClientConfig(), [])
  const mediaStateRef = useRef<MediaCaptureState>(emptyMediaCaptureState())
  const [cloudProviderSetup] = useState(() =>
    createCloudVisualLanguageProvider(import.meta.env, () => ({
      conversationId: conversationIdRef.current,
      consent: {
        cloudMediaTransmission: mediaPrivacyConsentRef.current.cloudMediaTransmission,
        cloudMemoryAccess: longTermMemoryConsentRef.current.cloudMemoryAccess,
      },
    })),
  )
  const [dialogueService] = useState(
    () =>
      new MultimodalDialogueService({
        localVisionAnalyzer: new MockLocalVisionAnalyzer(),
        customObjectStore,
        customObjectFeatureExtractor,
        cloudProvider: cloudProviderSetup.useClientGateway
          ? new GatewayCloudVisualLanguageProvider(
              cloudProviderSetup.provider,
              cloudGateway,
              () => ({ conversationId: conversationIdRef.current }),
              cloudProviderSetup.extractActualTokens
                ? () => cloudProviderSetup.extractActualTokens?.(cloudProviderSetup.provider)
                : undefined,
            )
          : cloudProviderSetup.provider,
        onCloudRoutingOutcome: (outcome) => {
          setEdgeCloudMetrics((session) => recordCloudRoutingOutcome(session, outcome))
        },
      }),
  )
  const [speechController] = useState(
    () =>
      new SpeechResponseController([
        new CloudStreamingTtsProvider(false),
        new WebSpeechTtsProvider(),
      ]),
  )
  const preferMockAsr = import.meta.env.MODE === 'test'
  const [speechCaptureController] = useState(
    () =>
      new SpeechCaptureController([
        new CloudStreamingAsrProvider({
          getBackendConfig: () => backendConfig,
          getMicrophoneStream: () => mediaStateRef.current.microphoneStream,
          isEnabled: () => mediaPrivacyConsentRef.current.microphoneCapture,
        }),
        new WebSpeechAsrProvider(),
        new MockAsrProvider(preferMockAsr ? '你好' : ''),
      ]),
  )
  const lastCaptureRef = useRef<AsrCaptureResult | null>(null)
  const lastProactiveEvaluationAtRef = useRef(0)
  const proactivePromptInFlightRef = useRef(false)
  const PROACTIVE_EVAL_INTERVAL_MS = 5_000
  const [proactiveDetector] = useState(() => createProactiveLocalDetector())
  const [proactiveRulesEngine] = useState(() => new ProactiveRulesEngine())
  const [proactiveObservationHistory] = useState(() => new ProactiveObservationHistory())
  const [mediaState, setMediaState] = useState<MediaCaptureState>(() => ({
    ...emptyMediaCaptureState(),
    status: 'initializing',
  }))
  const [language, setLanguage] = useState<AppLanguage>('zh')
  const [networkState, setNetworkState] = useState<NetworkState>(() =>
    deriveNetworkState({ online: navigator.onLine }),
  )
  const [watchOnly, setWatchOnly] = useState(true)
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false)
  const [lastDialogueAt, setLastDialogueAt] = useState<number | null>(null)
  const [lastCommand, setLastCommand] = useState<LocalCommandMatch | null>(null)
  const [lastDialogueEvent, setLastDialogueEvent] = useState<DialogueEvent | null>(null)
  const [lastFrame, setLastFrame] = useState<SampledVideoFrame | null>(null)
  const [lastVisualAnswer, setLastVisualAnswer] = useState<VisualAnswer | null>(null)
  const [activeVisualEvidence, setActiveVisualEvidence] = useState<ActiveVisualEvidence | null>(null)
  const [lastLocalVision, setLastLocalVision] = useState<LocalVisionSignals | null>(null)
  const [proactivePromptState, setProactivePromptState] = useState<ProactivePromptState>(() =>
    loadProactivePromptState(),
  )
  const [lastProactivePrompt, setLastProactivePrompt] = useState<ProactivePromptCandidate | null>(null)
  const [proactiveDetectorStatus, setProactiveDetectorStatus] = useState(() => proactiveDetector.getStatus())
  const [selectedObjectRegion, setSelectedObjectRegion] = useState<VisionRegion | null>(null)
  const [learnedCustomObjects, setLearnedCustomObjects] = useState<CustomObjectRecord[]>([])
  const [longTermMemories, setLongTermMemories] = useState<LongTermMemoryRecord[]>([])
  const [staleLongTermMemories, setStaleLongTermMemories] = useState<LongTermMemoryRecord[]>([])
  const [longTermMemoryStatus, setLongTermMemoryStatus] = useState<LongTermMemoryStoreStatus>(() =>
    longTermMemoryStore.getStatus(),
  )
  const [longTermMemoryConsent, setLongTermMemoryConsent] = useState<LongTermMemoryConsentSettings>(() => {
    const consent = { cloudMemoryAccess: false, cloudSummarySync: false }
    longTermMemoryConsentRef.current = consent
    return consent
  })
  const [lastCustomObjectMatchId, setLastCustomObjectMatchId] = useState<string | null>(null)
  const [conversationMemory, setConversationMemory] = useState<ConversationMemoryState>(() =>
    emptyConversationMemory(),
  )
  const [feedback, setFeedback] = useState<string>('')
  const [dialogueSegments, setDialogueSegments] = useState<DialogueResponseSegment[]>([])
  const [asrState, setAsrState] = useState<AsrCaptureState>(() => speechCaptureController.getState())
  const [speechState, setSpeechState] = useState<SpeechPlaybackState>({
    status: 'idle',
    provider: null,
    currentTurnId: null,
    fallbackUsed: false,
    errorMessage: null,
    cancellationReason: null,
  })
  const [latencyMetrics, setLatencyMetrics] = useState<VoiceLatencyMetrics | null>(null)
  const [lastCloudRequestFailedAt, setLastCloudRequestFailedAt] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  const samplingMode = useMemo<SamplingMode>(() => {
    if (mediaState.cameraStatus !== 'ready') {
      return 'paused'
    }

    return getWatchOnlySamplingMode({
      enabled: watchOnly,
      lastDialogueAt,
      now: tick,
    })
  }, [lastDialogueAt, mediaState.cameraStatus, tick, watchOnly])

  const startDialogue = useCallback((trigger: DialogueEvent['trigger']) => {
    const startedAt = Date.now()
    const turnId = `turn-${startedAt}`
    setLastDialogueAt(startedAt)
    setLastDialogueEvent({ trigger, startedAt })
    const text = getMessages(language)
    const listeningText =
      trigger === 'push-to-talk'
        ? text.pushToTalkListening
        : language === 'zh'
          ? '已检测到唤醒词。'
          : 'Wake trigger detected.'
    setFeedback(listeningText)
    setDialogueSegments(buildStreamingPreviewSegments(turnId, listeningText, false))
  }, [language])

  const refreshLearnedCustomObjects = useCallback(async () => {
    setLearnedCustomObjects(await customObjectStore.list())
  }, [customObjectStore])

  const refreshLongTermMemories = useCallback(async () => {
    const memories = await longTermMemoryStore.list(ACTIVE_USER_ID)
    setLongTermMemories(memories)
    setLongTermMemoryStatus(longTermMemoryStore.getStatus())
  }, [longTermMemoryStore])

  useEffect(() => {
    let disposed = false

    requestMediaCapture(undefined, mediaPrivacyConsent, {
      onMicrophoneReady: ({ microphoneStatus, microphoneStream }) => {
        if (disposed) {
          stopMediaCapture({ ...emptyMediaCaptureState(), microphoneStream })
          return
        }

        setMediaState((previous) => {
          const stream = new MediaStream([
            ...(previous.cameraStream?.getVideoTracks() ?? []),
            ...(microphoneStream?.getAudioTracks() ?? []),
          ])
          const next = {
            ...previous,
            microphoneStatus,
            microphoneStream,
            stream,
            status:
              microphoneStatus === 'ready' || previous.cameraStatus === 'ready'
                ? ('ready' as const)
                : previous.status,
          }
          mediaStateRef.current = next
          return next
        })
      },
    }).then((state) => {
      if (disposed) {
        stopMediaCapture(state)
        return
      }

      setMediaState(state)
      mediaStateRef.current = state
      setFeedback(state.errorMessage ?? '')
    })

    return () => {
      disposed = true
      setMediaState((state) => {
        stopMediaCapture(state)
        const emptyState = emptyMediaCaptureState()
        mediaStateRef.current = emptyState
        return emptyState
      })
    }
  }, [mediaPrivacyConsent])

  useEffect(() => {
    let disposed = false

    customObjectStore.list().then((records) => {
      if (!disposed) {
        setLearnedCustomObjects(records)
      }
    })

    return () => {
      disposed = true
    }
  }, [customObjectStore])

  useEffect(() => {
    let disposed = false

    async function initializeLongTermMemory() {
      if (!disposed) {
        await refreshLongTermMemories()
      }
    }

    initializeLongTermMemory()

    return () => {
      disposed = true
    }
  }, [longTermMemoryStore, refreshLongTermMemories])

  useEffect(() => {
    let disposed = false

    async function weakenStaleMemories() {
      if (!longTermMemoryStore.isAvailable() || longTermMemories.length === 0) {
        return
      }

      const weakened = await longTermMemoryStore.weakenStale(ACTIVE_USER_ID)
      if (!disposed) {
        setStaleLongTermMemories(weakened)
        if (weakened.length > 0) {
          setFeedback((current) => getLongTermMemoryReviewPrompt(language, weakened) ?? current)
        }
        await refreshLongTermMemories()
      }
    }

    weakenStaleMemories()

    return () => {
      disposed = true
    }
  }, [language, longTermMemories.length, longTermMemoryStore, refreshLongTermMemories])

  useEffect(() => {
    const updateNetworkState = () => {
      setNetworkState(
        deriveNetworkState({
          online: navigator.onLine,
          lastCloudRequestFailedAt,
        }),
      )
    }

    updateNetworkState()
    window.addEventListener('online', updateNetworkState)
    window.addEventListener('offline', updateNetworkState)

    return () => {
      window.removeEventListener('online', updateNetworkState)
      window.removeEventListener('offline', updateNetworkState)
    }
  }, [lastCloudRequestFailedAt])

  useEffect(() => {
    if (!wakeDetector) {
      return
    }

    wakeDetector.start(() => startDialogue('wake-word'))

    return () => wakeDetector.stop()
  }, [startDialogue, wakeDetector])

  useEffect(() => {
    const intervalId = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!videoRef.current || mediaState.cameraStatus !== 'ready') {
      samplerRef.current?.stop()
      samplerRef.current = null
      return
    }

    samplerRef.current =
      samplerRef.current ??
      new VideoFrameSampler({
        video: videoRef.current,
        onFrame: (frame) => {
          setLastFrame((previous) => {
            releaseSampledVideoFrame(previous)
            return frame
          })
        },
      })

    samplerRef.current.setMode(samplingMode)

    return () => {
      samplerRef.current?.stop()
    }
  }, [mediaState.cameraStatus, samplingMode])

  const startPushToTalk = useCallback(() => {
    if (mediaStateRef.current.microphoneStatus !== 'ready') {
      setFeedback(getMessages(language).microphoneUnavailable)
      return
    }

    speechController.cancel('user-interrupt')
    setIsPushToTalkActive(true)
    startDialogue('push-to-talk')
    const turnId = `turn-${Date.now()}`
    speechCaptureController.start({ turnId, language, preferMock: preferMockAsr })
  }, [
    language,
    preferMockAsr,
    speechCaptureController,
    speechController,
    startDialogue,
  ])

  const ensureCurrentFrame = useCallback(() => {
    if (lastFrame || mediaState.cameraStatus !== 'ready') {
      return
    }

    const fallbackFrame = createFallbackFrame(mediaState.cameraStatus, samplingMode, videoRef.current)
    if (fallbackFrame) {
      setLastFrame(fallbackFrame)
    }
  }, [lastFrame, mediaState.cameraStatus, samplingMode])

  const selectCenteredObjectRegion = useCallback(() => {
    ensureCurrentFrame()
    setSelectedObjectRegion({
      x: 0.3,
      y: 0.25,
      width: 0.4,
      height: 0.5,
      label: 'selected object',
    })
    setFeedback(language === 'zh' ? '已选择画面中央物体区域。' : 'Selected the center object region.')
  }, [ensureCurrentFrame, language])

  const clearSelectedObjectRegion = useCallback(() => {
    setSelectedObjectRegion(null)
    setFeedback(language === 'zh' ? '已取消框选。' : 'Selection cleared.')
  }, [language])

  const selectObjectRegionFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const video = videoRef.current
      if (!video) {
        return
      }

      ensureCurrentFrame()
      const bounds = video.getBoundingClientRect()
      const centerX = (clientX - bounds.left) / bounds.width
      const centerY = (clientY - bounds.top) / bounds.height
      const width = 0.28
      const height = 0.28
      setSelectedObjectRegion({
        x: clamp(centerX - width / 2),
        y: clamp(centerY - height / 2),
        width,
        height,
        label: 'selected object',
      })
      setFeedback(language === 'zh' ? '已框选物体区域。' : 'Selected object region.')
    },
    [ensureCurrentFrame, language],
  )

  const deleteLearnedCustomObject = useCallback(
    async (id: string) => {
      const deleted = await customObjectStore.delete(id)
      if (deleted) {
        await refreshLearnedCustomObjects()
        if (lastCustomObjectMatchId === id) {
          setLastCustomObjectMatchId(null)
        }
        setFeedback(language === 'zh' ? '已删除已学物体。' : 'Deleted learned object.')
      }
    },
    [customObjectStore, language, lastCustomObjectMatchId, refreshLearnedCustomObjects],
  )

  const undoLastTeaching = useCallback(async (): Promise<string> => {
    const deleted = await customObjectStore.deleteLastTeaching()
    await refreshLearnedCustomObjects()
    if (deleted?.id === lastCustomObjectMatchId) {
      setLastCustomObjectMatchId(null)
    }
    return getCustomObjectMemoryMessage(language, deleted ? 'undo' : 'none')
  }, [customObjectStore, language, lastCustomObjectMatchId, refreshLearnedCustomObjects])

  const recordDialogueTurn = useCallback(
    ({
      transcript,
      reply,
      committedAt,
      trigger = 'push-to-talk',
    }: {
      transcript: string
      reply: string
      committedAt: number
      trigger?: DialogueEvent['trigger']
    }) => {
      const turnId = `turn-${committedAt}`
      setFeedback(reply)
      setDialogueSegments(buildStreamingPreviewSegments(turnId, reply, true))
      setLastDialogueEvent({
        trigger,
        transcript,
        startedAt: committedAt,
      })
    },
    [],
  )

  const persistTurnMemories = useCallback(
    async (transcript: string, answer: VisualAnswer) => {
      if (shouldSkipDialogueMemoryPersistence({ transcript, answer })) {
        return
      }

      const cloudCandidates = getMemoryCandidatesFromAnswer(answer)
      const localCandidates = extractLocalMemoryCandidates(transcript, language)
      const candidates = cloudCandidates.length > 0 ? cloudCandidates : localCandidates

      await persistDialogueMemoryCandidates({
        store: longTermMemoryStore,
        userId: ACTIVE_USER_ID,
        candidates,
      })
      await refreshLongTermMemories()
    },
    [language, longTermMemoryStore, refreshLongTermMemories],
  )

  const deleteLongTermMemory = useCallback(
    async (id: string) => {
      const deleted = await longTermMemoryStore.delete(ACTIVE_USER_ID, id)
      await refreshLongTermMemories()
      if (deleted) {
        setStaleLongTermMemories((memories) => memories.filter((memory) => memory.id !== id))
        setFeedback(language === 'zh' ? '已删除长期记忆。' : 'Deleted long-term memory.')
      }
    },
    [language, longTermMemoryStore, refreshLongTermMemories],
  )

  const forgetAllLongTermMemories = useCallback(async () => {
    await longTermMemoryStore.forgetAll(ACTIVE_USER_ID)
    setStaleLongTermMemories([])
    await refreshLongTermMemories()
    setFeedback(language === 'zh' ? '已忘记所有长期记忆。' : 'Forgot all long-term memories.')
  }, [language, longTermMemoryStore, refreshLongTermMemories])

  const setCloudMemoryAccess = useCallback((enabled: boolean) => {
    setLongTermMemoryConsent((consent) => {
      const next = { ...consent, cloudMemoryAccess: enabled }
      longTermMemoryConsentRef.current = next
      return next
    })
  }, [])

  const setCloudSummarySync = useCallback((enabled: boolean) => {
    setLongTermMemoryConsent((consent) => ({ ...consent, cloudSummarySync: enabled }))
  }, [])

  const setCameraCaptureConsent = useCallback((enabled: boolean) => {
    setMediaPrivacyConsent((consent) => {
      const next = saveMediaPrivacyConsent({ ...consent, cameraCapture: enabled })
      mediaPrivacyConsentRef.current = next
      return next
    })
  }, [])

  const setMicrophoneCaptureConsent = useCallback((enabled: boolean) => {
    setMediaPrivacyConsent((consent) => {
      const next = saveMediaPrivacyConsent({ ...consent, microphoneCapture: enabled })
      mediaPrivacyConsentRef.current = next
      return next
    })
  }, [])

  const setCloudMediaTransmissionConsent = useCallback((enabled: boolean) => {
    setMediaPrivacyConsent((consent) => {
      const next = saveMediaPrivacyConsent({ ...consent, cloudMediaTransmission: enabled })
      mediaPrivacyConsentRef.current = next
      return next
    })
  }, [])

  const exportLongTermMemoriesToFile = useCallback(async () => {
    const payload = await exportLongTermMemories(longTermMemoryStore, ACTIVE_USER_ID)
    downloadLongTermMemoryExport(payload)
    setFeedback(language === 'zh' ? '已导出长期记忆。' : 'Exported long-term memories.')
  }, [language, longTermMemoryStore])

  const exportCustomObjectsToFile = useCallback(async () => {
    const payload = await exportCustomObjects(customObjectStore)
    downloadCustomObjectExport(payload)
    setFeedback(language === 'zh' ? '已导出已学物体。' : 'Exported learned custom objects.')
  }, [customObjectStore, language])

  const refreshConversationTelemetry = useCallback(async () => {
    if (backendConfig && cloudProviderSetup.authorityMode !== 'client') {
      try {
        const [records, spend] = await Promise.all([
          listAdminConversations(backendConfig),
          getAdminDailySpend(backendConfig),
        ])
        setConversationTelemetry(records)
        setDailySpend(spend)
        return
      } catch {
        setFeedback('Failed to refresh server telemetry.')
      }
    }

    setConversationTelemetry(telemetryStore.list())
    setDailySpend(operationsAdmin.getDailySpend('ops-admin-token'))
  }, [backendConfig, cloudProviderSetup.authorityMode, operationsAdmin, telemetryStore])

  const setDailyBudgetCap = useCallback(
    async (cap: number | null) => {
      if (backendConfig && cloudProviderSetup.authorityMode !== 'client') {
        await setAdminBudget(backendConfig, { dailyBudgetCap: cap })
        if (cloudProviderSetup.useClientGateway) {
          cloudGateway.setDailyBudgetCap(cap)
        }
        await refreshConversationTelemetry()
        return
      }

      operationsAdmin.setDailyBudgetCap('ops-admin-token', cap)
      cloudGateway.setDailyBudgetCap(cap)
      await refreshConversationTelemetry()
    },
    [
      backendConfig,
      cloudGateway,
      cloudProviderSetup.authorityMode,
      cloudProviderSetup.useClientGateway,
      operationsAdmin,
      refreshConversationTelemetry,
    ],
  )

  const updateProactivePromptState = useCallback((updater: (state: ProactivePromptState) => ProactivePromptState) => {
    setProactivePromptState((state) => saveProactivePromptState(updater(state)))
  }, [])

  const executeLocalCommand = useCallback(
    async (match: LocalCommandMatch): Promise<string> => {
      const { command } = match

      if (command.action === 'switch-language' && command.targetLanguage) {
        setLanguage(command.targetLanguage)
        return command.targetLanguage === 'zh' ? '已切换到中文。' : 'Switched to English.'
      }

      if (command.action === 'stop-dialogue') {
        speechController.cancel('stop-command')
        setActiveVisualEvidence(null)
        setSpeechState((state) => ({
          ...state,
          status: 'cancelled',
          cancellationReason: 'stop-command',
        }))
        setLastDialogueAt(null)
        return language === 'zh' ? '已停止对话。' : 'Dialogue stopped.'
      }

      if (command.action === 'disable-proactive-prompts') {
        updateProactivePromptState((state) => setProactivePromptsEnabled(state, false))
        return language === 'zh' ? '已关闭主动提示。' : 'Proactive prompts are off.'
      }

      if (command.action === 'increase-proactive-prompts') {
        updateProactivePromptState((state) => setProactiveReminderIntensity(state, 'more'))
        return language === 'zh' ? '我会多提醒你。' : 'I will remind you more.'
      }

      if (command.action === 'proactive-prompt-wrong') {
        if (!lastProactivePrompt) {
          return language === 'zh' ? '没有可纠正的主动提示。' : 'There is no proactive prompt to correct.'
        }

        updateProactivePromptState((state) =>
          recordProactivePromptFeedback(state, {
            ruleId: lastProactivePrompt.ruleId,
            promptKey: lastProactivePrompt.promptKey,
            labels: lastProactivePrompt.labels,
          }),
        )
        return language === 'zh' ? '收到，我会减少类似提醒。' : 'Got it. I will reduce similar reminders.'
      }

      if (command.action === 'forget-custom-object') {
        if (!lastCustomObjectMatchId) {
          return getCustomObjectMemoryMessage(language, 'unresolved')
        }

        await customObjectStore.delete(lastCustomObjectMatchId)
        await refreshLearnedCustomObjects()
        setLastCustomObjectMatchId(null)
        return getCustomObjectMemoryMessage(language, 'forgot')
      }

      if (command.action === 'undo-custom-object-teaching') {
        return undoLastTeaching()
      }

      if (command.action === 'take-photo') {
        return language === 'zh' ? '已触发拍照。' : 'Photo capture triggered.'
      }

      if (command.action === 'goodbye') {
        return language === 'zh' ? '再见。' : 'Goodbye.'
      }

      return language === 'zh' ? '你好。' : 'Hello.'
    },
    [
      customObjectStore,
      language,
      lastCustomObjectMatchId,
      lastProactivePrompt,
      refreshLearnedCustomObjects,
      speechController,
      updateProactivePromptState,
      undoLastTeaching,
    ],
  )

  const speakFeedback = useCallback(
    async ({
      turnId,
      text,
      transcriptCommittedAt,
      speechCaptureStartedAt,
      speechCaptureEndedAt,
    }: {
      turnId: string
      text: string
      transcriptCommittedAt: number
      speechCaptureStartedAt?: number
      speechCaptureEndedAt?: number
    }) => {
      const result = await speechController.speakResponse({
        turnId,
        segments: buildStreamingPreviewSegments(turnId, text, true),
        language,
        networkState,
        speechCaptureStartedAt,
        speechCaptureEndedAt,
        transcriptCommittedAt,
      })

      setDialogueSegments(buildStreamingPreviewSegments(turnId, text, true))

      setSpeechState(result.state)
      setLatencyMetrics(result.metrics)
    },
    [language, networkState, speechController],
  )

  const speakProactivePrompt = useCallback(
    async (prompt: ProactivePromptCandidate, options?: { recordSpoken?: boolean }) => {
      const result = await speechController.speakProactivePrompt({
        prompt,
        language,
        networkState,
        userSpeaking: isPushToTalkActive,
      })

      setLastProactivePrompt(prompt)
      setFeedback(prompt.text)
      if (options?.recordSpoken !== false) {
        updateProactivePromptState((state) => recordProactivePromptSpoken(state, prompt.promptKey, prompt.createdAt))
      }

      if (result.speechResult) {
        setSpeechState(result.speechResult.state)
        setLatencyMetrics(result.speechResult.metrics)
      }
    },
    [isPushToTalkActive, language, networkState, speechController, updateProactivePromptState],
  )

  useEffect(() => {
    let disposed = false

    async function evaluateProactivePrompt() {
      if (!lastFrame || !proactivePromptState.settings.enabled) {
        return
      }

      const now = Date.now()
      if (proactivePromptInFlightRef.current) {
        return
      }
      if (now - lastProactiveEvaluationAtRef.current < PROACTIVE_EVAL_INTERVAL_MS) {
        return
      }
      lastProactiveEvaluationAtRef.current = now

      const detection = await proactiveDetector.detect(lastFrame)
      if (disposed) {
        return
      }

      setProactiveDetectorStatus(detection.status)
      proactiveObservationHistory.add(detection)

      const matches = proactiveRulesEngine.evaluate({
        detection,
        history: proactiveObservationHistory,
        language,
        now: detection.capturedAt,
        state: proactivePromptState,
      })

      const accepted = matches
        .map((match) =>
          evaluateProactivePromptPolicy({
            match,
            state: proactivePromptState,
            now: detection.capturedAt,
            userSpeaking: isPushToTalkActive,
          }),
        )
        .find((result) => result.accepted && result.candidate)

      if (!accepted?.candidate) {
        return
      }

      proactivePromptInFlightRef.current = true
      updateProactivePromptState((state) =>
        recordProactivePromptSpoken(state, accepted.candidate!.promptKey, accepted.candidate!.createdAt),
      )

      try {
        await speakProactivePrompt(accepted.candidate, { recordSpoken: false })
      } finally {
        proactivePromptInFlightRef.current = false
      }
    }

    evaluateProactivePrompt()

    return () => {
      disposed = true
    }
  }, [
    isPushToTalkActive,
    language,
    lastFrame,
    proactiveDetector,
    proactiveObservationHistory,
    proactivePromptState,
    proactiveRulesEngine,
    speakProactivePrompt,
  ])

  useEffect(() => {
    if (isPushToTalkActive || speechController.getQueuedProactivePromptCount() === 0) {
      return
    }

    let disposed = false
    speechController
      .flushProactivePromptQueue({
        language,
        networkState,
      })
      .then((results) => {
        if (disposed) {
          return
        }

        const latest = results[results.length - 1]
        if (latest?.speechResult) {
          setSpeechState(latest.speechResult.state)
          setLatencyMetrics(latest.speechResult.metrics)
        }
      })

    return () => {
      disposed = true
    }
  }, [isPushToTalkActive, language, networkState, speechController])

  useEffect(() => {
    if (!activeVisualEvidence) {
      return
    }

    const remaining = activeVisualEvidence.expiresAt - Date.now()
    if (remaining <= 0) {
      setActiveVisualEvidence(null)
      return
    }

    const timer = window.setTimeout(() => {
      setActiveVisualEvidence((current) =>
        current && isVisualEvidenceExpired(current) ? null : current,
      )
    }, remaining)

    return () => window.clearTimeout(timer)
  }, [activeVisualEvidence])

  const markCloudRequestFailed = useCallback(() => {
    setLastCloudRequestFailedAt(Date.now())
  }, [])

  const handleTranscript = useCallback(
    async (transcript: string) => {
      const capture = lastCaptureRef.current
      const transcriptCommittedAt = capture?.committedAt ?? Date.now()
      const turnId = `turn-${transcriptCommittedAt}`
      lastCaptureRef.current = null
      setActiveVisualEvidence(null)
      setLastDialogueEvent({
        trigger: 'push-to-talk',
        transcript,
        startedAt: transcriptCommittedAt,
      })
      const pendingText = language === 'zh' ? '正在处理...' : 'Processing...'
      setFeedback(pendingText)
      setDialogueSegments(buildStreamingPreviewSegments(turnId, pendingText, false))

      const match = matchLocalCommand(transcript)

      if (match) {
        setLastCommand(match)
        const reply = await executeLocalCommand(match)
        recordDialogueTurn({ transcript, reply, committedAt: transcriptCommittedAt })
        return
      }

      if (parseTeachingName(transcript)) {
        const teaching = await teachCustomObject({
          transcript,
          frame: lastFrame ?? createFallbackFrame(mediaState.cameraStatus, samplingMode, videoRef.current),
          region: selectedObjectRegion,
          store: customObjectStore,
          extractor: customObjectFeatureExtractor,
          language,
        })
        recordDialogueTurn({
          transcript,
          reply: teaching.message,
          committedAt: transcriptCommittedAt,
        })

        if (teaching.record) {
          setLastCustomObjectMatchId(teaching.record.id)
          await refreshLearnedCustomObjects()
        }

        return
      }

      const explicitMemory = parseExplicitMemoryIntent(transcript, language)
      if (explicitMemory) {
        if (!longTermMemoryStore.isAvailable()) {
          recordDialogueTurn({
            transcript,
            reply: getMessages(language).longTermMemoryUnavailable,
            committedAt: transcriptCommittedAt,
          })
          return
        }

        const memory = await longTermMemoryStore.create(ACTIVE_USER_ID, explicitMemory)
        setLongTermMemories((memories) => [memory, ...memories.filter((entry) => entry.id !== memory.id)])
        setLongTermMemoryStatus(longTermMemoryStore.getStatus())
        void refreshLongTermMemories()
        recordDialogueTurn({
          transcript,
          reply: language === 'zh' ? '已记住。' : 'Remembered.',
          committedAt: transcriptCommittedAt,
        })
        return
      }

      if (
        !canRouteComplexRequest(networkState) &&
        !lastFrame &&
        isVisualQuestion(normalizePhrase(transcript))
      ) {
        const message =
          networkState === 'offline'
            ? getOfflineCloudMessage(language)
            : getWeakNetworkCloudMessage(language)
        recordDialogueTurn({
          transcript,
          reply: message,
          committedAt: transcriptCommittedAt,
        })
        return
      }

      const analyzingText =
        lastFrame || mediaState.cameraStatus === 'ready'
          ? language === 'zh'
            ? '正在分析语音和画面...'
            : 'Analyzing voice and video...'
          : language === 'zh'
            ? '正在思考...'
            : 'Thinking...'
      setFeedback(analyzingText)
      setDialogueSegments(buildStreamingPreviewSegments(turnId, analyzingText, false))

      const result = await dialogueService.handleTurn({
        transcript,
        frame: lastFrame,
        selectedObjectRegion,
        networkState,
        language,
        memory: conversationMemory,
        mediaPrivacy: mediaPrivacyConsent,
        conversationId: conversationIdRef.current,
        longTermMemory: {
          userId: ACTIVE_USER_ID,
          store: longTermMemoryStore,
          consent: longTermMemoryConsent,
        },
      })

      refreshConversationTelemetry()

      setLastVisualAnswer(result.answer)
      setActiveVisualEvidence(createActiveVisualEvidence(result.answer, transcriptCommittedAt))
      setLastLocalVision(result.localVision)
      setConversationMemory(result.memory)
      await persistTurnMemories(transcript, result.answer)
      setLastCustomObjectMatchId(
        result.answer.referencedEntities.find((entity) => entity.customObjectId)?.customObjectId ?? null,
      )
      setFeedback(result.answer.answer)
      setDialogueSegments(buildStreamingPreviewSegments(turnId, result.answer.answer, true))
      if (result.answer.kind === 'network-error' && detectSystemFailureVariant(result.answer.answer, language) === 'network') {
        markCloudRequestFailed()
      }
      if (result.answer.requiresSpeech) {
        await speakFeedback({
          turnId,
          text: buildSpeakableAnswerText(result.answer),
          transcriptCommittedAt,
          speechCaptureStartedAt: capture?.speechCaptureStartedAt,
          speechCaptureEndedAt: capture?.speechCaptureEndedAt,
        })
      }
    },
    [
      conversationMemory,
      customObjectFeatureExtractor,
      customObjectStore,
      dialogueService,
      executeLocalCommand,
      language,
      lastFrame,
      longTermMemoryConsent,
      longTermMemoryStore,
      markCloudRequestFailed,
      mediaPrivacyConsent,
      mediaState.cameraStatus,
      networkState,
      persistTurnMemories,
      recordDialogueTurn,
      refreshConversationTelemetry,
      refreshLearnedCustomObjects,
      samplingMode,
      selectedObjectRegion,
      speakFeedback,
    ],
  )

  const stopPushToTalk = useCallback(async () => {
    setIsPushToTalkActive(false)
    const result = await speechCaptureController.stop()
    if (!result?.transcript) {
      const text = getMessages(language)
      const errorMessage = speechCaptureController.getLastErrorMessage()
      setFeedback(formatSpeechCaptureError(errorMessage, text))
      setDialogueSegments([])
      return
    }

    lastCaptureRef.current = result
    void handleTranscript(result.transcript)
  }, [handleTranscript, language, speechCaptureController])

  useEffect(() => {
    speechCaptureController.setStateListener(setAsrState)
    return () => speechCaptureController.setStateListener(null)
  }, [speechCaptureController])

  useEffect(() => {
    return () => {
      speechController.cancel('unmount')
    }
  }, [speechController])

  return {
    videoRef,
    mediaState,
    language,
    networkState,
    watchOnly,
    samplingMode,
    isPushToTalkActive,
    lastCommand,
    lastDialogueEvent,
    lastFrame,
    lastVisualAnswer,
    activeVisualEvidence,
    lastLocalVision,
    proactivePromptState,
    lastProactivePrompt,
    proactiveDetectorStatus,
    selectedObjectRegion,
    learnedCustomObjects,
    longTermMemories,
    staleLongTermMemories,
    longTermMemoryStatus,
    longTermMemoryConsent,
    lastCustomObjectMatchId,
    conversationMemory,
    feedback,
    dialogueSegments,
    asrState,
    speechState,
    latencyMetrics,
    mediaPrivacyConsent,
    edgeCloudMetrics,
    conversationTelemetry,
    cloudProviderKind: cloudProviderSetup.kind,
    dailySpend,
    setWatchOnly,
    setLanguage,
    startPushToTalk,
    stopPushToTalk,
    handleTranscript,
    selectCenteredObjectRegion,
    clearSelectedObjectRegion,
    selectObjectRegionFromPointer,
    deleteLearnedCustomObject,
    undoLastTeaching,
    deleteLongTermMemory,
    forgetAllLongTermMemories,
    exportLongTermMemoriesToFile,
    exportCustomObjectsToFile,
    setCloudMemoryAccess,
    setCloudSummarySync,
    setCameraCaptureConsent,
    setMicrophoneCaptureConsent,
    setCloudMediaTransmissionConsent,
    setDailyBudgetCap,
    listConversationTelemetry: () => operationsAdmin.listConversations('ops-admin-token'),
    getDailySpend: () => dailySpend,
    markCloudRequestFailed,
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function createFallbackFrame(
  cameraStatus: MediaCaptureState['cameraStatus'],
  samplingMode: SamplingMode,
  video: HTMLVideoElement | null,
): SampledVideoFrame | null {
  if (cameraStatus !== 'ready') {
    return null
  }

  return {
    blob: new Blob(['local-frame'], { type: 'image/jpeg' }),
    capturedAt: Date.now(),
    width: video?.videoWidth || 640,
    height: video?.videoHeight || 480,
    mode: samplingMode === 'paused' ? 'normal' : samplingMode,
  }
}
