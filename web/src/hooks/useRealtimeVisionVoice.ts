import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { emptyConversationMemory } from '../ai/conversationMemory'
import {
  LocalCustomObjectStore,
  PrototypeCustomObjectFeatureExtractor,
  getCustomObjectMemoryMessage,
  parseTeachingName,
  teachCustomObject,
} from '../ai/customObjects'
import {
  LocalLongTermMemoryStore,
  createDefaultLongTermMemory,
  getLongTermMemoryReviewPrompt,
} from '../ai/longTermMemory'
import { MockLocalVisionAnalyzer } from '../ai/localVision'
import { MultimodalDialogueService } from '../ai/multimodalDialogue'
import {
  evaluateProactivePromptPolicy,
  loadProactivePromptState,
  MockProactiveLocalDetector,
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
import { loadMediaPrivacyConsent, saveMediaPrivacyConsent } from '../media/mediaPrivacy'
import { deriveNetworkState } from '../network/networkState'
import type {
  AppLanguage,
  ConversationMemoryState,
  CustomObjectRecord,
  DialogueEvent,
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
import { SpeechResponseController, createDialogueSegment } from '../voice/speechResponseController'
import {
  canRouteComplexRequest,
  getNetworkRetryMessage,
  matchLocalCommand,
} from '../voice/localCommands'
import { CloudStreamingTtsProvider, WebSpeechTtsProvider } from '../voice/ttsProviders'

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
  const [dialogueService] = useState(
    () =>
      new MultimodalDialogueService({
        localVisionAnalyzer: new MockLocalVisionAnalyzer(),
        customObjectStore,
        customObjectFeatureExtractor,
      }),
  )
  const [speechController] = useState(
    () =>
      new SpeechResponseController([
        new CloudStreamingTtsProvider(false),
        new WebSpeechTtsProvider(),
      ]),
  )
  const [proactiveDetector] = useState(() => new MockProactiveLocalDetector())
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
  const [longTermMemoryConsent, setLongTermMemoryConsent] = useState<LongTermMemoryConsentSettings>({
    cloudMemoryAccess: false,
    cloudSummarySync: false,
  })
  const [lastCustomObjectMatchId, setLastCustomObjectMatchId] = useState<string | null>(null)
  const [conversationMemory, setConversationMemory] = useState<ConversationMemoryState>(() =>
    emptyConversationMemory(),
  )
  const [feedback, setFeedback] = useState<string>('Initializing media devices...')
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
  const [mediaPrivacyConsent, setMediaPrivacyConsent] = useState<MediaPrivacyConsent>(() => loadMediaPrivacyConsent())
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
    setLastDialogueAt(startedAt)
    setLastDialogueEvent({ trigger, startedAt })
    setFeedback(trigger === 'push-to-talk' ? 'Listening...' : 'Wake trigger detected.')
  }, [])

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

    requestMediaCapture(undefined, mediaPrivacyConsent).then((state) => {
      if (disposed) {
        stopMediaCapture(state)
        return
      }

      setMediaState(state)
      setFeedback(state.errorMessage ?? 'Media devices initialized.')
    })

    return () => {
      disposed = true
      setMediaState((state) => {
        stopMediaCapture(state)
        return emptyMediaCaptureState()
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
      const existing = await longTermMemoryStore.list(ACTIVE_USER_ID)
      if (disposed) {
        return
      }

      if (longTermMemoryStore.isAvailable() && existing.length === 0) {
        for (const memory of createDefaultLongTermMemory(ACTIVE_USER_ID)) {
          await longTermMemoryStore.create(ACTIVE_USER_ID, memory)
        }
      }

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
    if (!videoRef.current) {
      return
    }

    videoRef.current.srcObject = mediaState.cameraStream
  }, [mediaState.cameraStream])

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
    if (mediaState.microphoneStatus !== 'ready') {
      setFeedback('Microphone is unavailable.')
      return
    }

    setIsPushToTalkActive(true)
    startDialogue('push-to-talk')
  }, [mediaState.microphoneStatus, startDialogue])

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

  const undoLastTeaching = useCallback(async () => {
    const deleted = await customObjectStore.deleteLastTeaching()
    await refreshLearnedCustomObjects()
    setFeedback(
      getCustomObjectMemoryMessage(language, deleted ? 'undo' : 'none'),
    )
    if (deleted?.id === lastCustomObjectMatchId) {
      setLastCustomObjectMatchId(null)
    }
  }, [customObjectStore, language, lastCustomObjectMatchId, refreshLearnedCustomObjects])

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
    setLongTermMemoryConsent((consent) => ({ ...consent, cloudMemoryAccess: enabled }))
  }, [])

  const setCloudSummarySync = useCallback((enabled: boolean) => {
    setLongTermMemoryConsent((consent) => ({ ...consent, cloudSummarySync: enabled }))
  }, [])

  const setCameraCaptureConsent = useCallback((enabled: boolean) => {
    setMediaPrivacyConsent((consent) => saveMediaPrivacyConsent({ ...consent, cameraCapture: enabled }))
  }, [])

  const setMicrophoneCaptureConsent = useCallback((enabled: boolean) => {
    setMediaPrivacyConsent((consent) => saveMediaPrivacyConsent({ ...consent, microphoneCapture: enabled }))
  }, [])

  const setCloudMediaTransmissionConsent = useCallback((enabled: boolean) => {
    setMediaPrivacyConsent((consent) => saveMediaPrivacyConsent({ ...consent, cloudMediaTransmission: enabled }))
  }, [])

  const updateProactivePromptState = useCallback((updater: (state: ProactivePromptState) => ProactivePromptState) => {
    setProactivePromptState((state) => saveProactivePromptState(updater(state)))
  }, [])

  const executeLocalCommand = useCallback(
    async (match: LocalCommandMatch) => {
      const { command } = match

      if (command.action === 'switch-language' && command.targetLanguage) {
        setLanguage(command.targetLanguage)
        const message = command.targetLanguage === 'zh' ? '已切换到中文。' : 'Switched to English.'
        setFeedback(message)
        return
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
        setFeedback(language === 'zh' ? '已停止对话。' : 'Dialogue stopped.')
        return
      }

      if (command.action === 'disable-proactive-prompts') {
        updateProactivePromptState((state) => setProactivePromptsEnabled(state, false))
        setFeedback(language === 'zh' ? '已关闭主动提示。' : 'Proactive prompts are off.')
        return
      }

      if (command.action === 'increase-proactive-prompts') {
        updateProactivePromptState((state) => setProactiveReminderIntensity(state, 'more'))
        setFeedback(language === 'zh' ? '我会多提醒你。' : 'I will remind you more.')
        return
      }

      if (command.action === 'proactive-prompt-wrong') {
        if (!lastProactivePrompt) {
          setFeedback(language === 'zh' ? '没有可纠正的主动提示。' : 'There is no proactive prompt to correct.')
          return
        }

        updateProactivePromptState((state) =>
          recordProactivePromptFeedback(state, {
            ruleId: lastProactivePrompt.ruleId,
            promptKey: lastProactivePrompt.promptKey,
            labels: lastProactivePrompt.labels,
          }),
        )
        setFeedback(language === 'zh' ? '收到，我会减少类似提醒。' : 'Got it. I will reduce similar reminders.')
        return
      }

      if (command.action === 'forget-custom-object') {
        if (!lastCustomObjectMatchId) {
          setFeedback(getCustomObjectMemoryMessage(language, 'unresolved'))
          return
        }

        await customObjectStore.delete(lastCustomObjectMatchId)
        await refreshLearnedCustomObjects()
        setLastCustomObjectMatchId(null)
        setFeedback(getCustomObjectMemoryMessage(language, 'forgot'))
        return
      }

      if (command.action === 'undo-custom-object-teaching') {
        await undoLastTeaching()
        return
      }

      if (command.action === 'take-photo') {
        setFeedback(language === 'zh' ? '已触发拍照。' : 'Photo capture triggered.')
        return
      }

      if (command.action === 'goodbye') {
        setFeedback(language === 'zh' ? '再见。' : 'Goodbye.')
        return
      }

      setFeedback(language === 'zh' ? '你好。' : 'Hello.')
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
        segments: [createDialogueSegment(turnId, text)],
        language,
        networkState,
        speechCaptureStartedAt,
        speechCaptureEndedAt,
        transcriptCommittedAt,
      })

      setSpeechState(result.state)
      setLatencyMetrics(result.metrics)
    },
    [language, networkState, speechController],
  )

  const speakProactivePrompt = useCallback(
    async (prompt: ProactivePromptCandidate) => {
      const result = await speechController.speakProactivePrompt({
        prompt,
        language,
        networkState,
        userSpeaking: isPushToTalkActive,
      })

      setLastProactivePrompt(prompt)
      setFeedback(prompt.text)
      updateProactivePromptState((state) => recordProactivePromptSpoken(state, prompt.promptKey, prompt.createdAt))

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

      if (accepted?.candidate) {
        await speakProactivePrompt(accepted.candidate)
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

  const handleTranscript = useCallback(
    async (transcript: string) => {
      const transcriptCommittedAt = Date.now()
      setActiveVisualEvidence(null)
      const match = matchLocalCommand(transcript)

      if (match) {
        setLastCommand(match)
        await executeLocalCommand(match)
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
        setFeedback(teaching.message)

        if (teaching.record) {
          setLastCustomObjectMatchId(teaching.record.id)
          await refreshLearnedCustomObjects()
        }

        return
      }

      if (!canRouteComplexRequest(networkState) && !lastFrame) {
        setFeedback(getNetworkRetryMessage(language))
        return
      }

      setFeedback(language === 'zh' ? '正在分析语音和画面...' : 'Analyzing voice and video...')

      const turnId = `turn-${transcriptCommittedAt}`
      const result = await dialogueService.handleTurn({
        transcript,
        frame: lastFrame,
        networkState,
        language,
        memory: conversationMemory,
        longTermMemory: {
          userId: ACTIVE_USER_ID,
          store: longTermMemoryStore,
          consent: longTermMemoryConsent,
        },
      })

      setLastVisualAnswer(result.answer)
      setActiveVisualEvidence(createActiveVisualEvidence(result.answer, transcriptCommittedAt))
      setLastLocalVision(result.localVision)
      setConversationMemory(result.memory)
      await refreshLongTermMemories()
      setLastCustomObjectMatchId(
        result.answer.referencedEntities.find((entity) => entity.customObjectId)?.customObjectId ?? null,
      )
      setLastDialogueEvent({
        trigger: 'push-to-talk',
        transcript,
        startedAt: transcriptCommittedAt,
      })
      setFeedback(result.answer.answer)
      if (result.answer.requiresSpeech) {
        await speakFeedback({
          turnId,
          text: buildSpeakableAnswerText(result.answer),
          transcriptCommittedAt,
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
      mediaState.cameraStatus,
      networkState,
      refreshLongTermMemories,
      refreshLearnedCustomObjects,
      samplingMode,
      selectedObjectRegion,
      speakFeedback,
    ],
  )

  const stopPushToTalk = useCallback(
    (transcript: string) => {
      setIsPushToTalkActive(false)
      handleTranscript(transcript)
    },
    [handleTranscript],
  )

  const markCloudRequestFailed = useCallback(() => {
    setLastCloudRequestFailedAt(Date.now())
  }, [])

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
    speechState,
    latencyMetrics,
    mediaPrivacyConsent,
    setWatchOnly,
    setLanguage,
    startPushToTalk,
    stopPushToTalk,
    handleTranscript,
    selectCenteredObjectRegion,
    selectObjectRegionFromPointer,
    deleteLearnedCustomObject,
    undoLastTeaching,
    deleteLongTermMemory,
    forgetAllLongTermMemories,
    setCloudMemoryAccess,
    setCloudSummarySync,
    setCameraCaptureConsent,
    setMicrophoneCaptureConsent,
    setCloudMediaTransmissionConsent,
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
