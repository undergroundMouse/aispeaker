import { describe, expect, it } from 'vitest'
import { HybridVisualOrchestrator } from './hybridVisualOrchestrator'
import { MultimodalDialogueService } from '../ai/multimodalDialogue'
import { MockLocalVisionAnalyzer } from '../ai/localVision'

describe('HybridVisualOrchestrator', () => {
  it('builds local hints from vision delta summary', () => {
    const orchestrator = new HybridVisualOrchestrator({
      dialogueService: new MultimodalDialogueService({
        localVisionAnalyzer: new MockLocalVisionAnalyzer(),
      }),
      getFrame: () => null,
      getVisionDelta: () => ({
        trackedObjects: [{ trackId: 't1', label: 'phone', confidence: 0.9, region: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 }, lastSeenAt: Date.now() }],
        sceneChange: false,
        gestures: [],
        ocrRegions: [{ text: 'EXIT', region: { x: 0, y: 0, width: 0.1, height: 0.1 }, confidence: 0.8 }],
        frameSeq: 1,
        capturedAt: Date.now(),
      }),
    })

    const hints = orchestrator.buildLocalHints({
      transcript: '这是什么',
      language: 'zh',
      networkState: 'online',
      localVision: {
        objectCandidates: [{ label: 'phone', confidence: 0.9 }],
        sceneCandidates: [],
        gestures: [],
        analyzedAt: Date.now(),
        shouldUseCloud: false,
      },
      mediaPrivacy: { cameraCapture: true, microphoneCapture: true, cloudMediaTransmission: true },
      conversationId: 'conv-1',
      memory: { entries: [] },
    })

    expect(hints).toContain('phone')
    expect(hints).toContain('EXIT')
  })
})
