# Tasks

## Phase 1 — Realtime Session Transport

- [x] 1.1 Add shared session protocol types in `shared/src/realtimeSession.ts`
- [x] 1.2 Implement `app/src/realtime/sessionProtocol.ts` message codecs
- [x] 1.3 Implement `app/src/realtime/realtimeSessionClient.ts` with heartbeat, reconnect, resume
- [x] 1.4 Implement `server/src/services/sessionStateStore.ts`
- [x] 1.5 Implement `server/src/routes/realtimeSession.ts` WebSocket gateway
- [x] 1.6 Register realtime session route in `server/src/index.ts`
- [x] 1.7 Add feature flags in `app/src/config/featureFlags.ts`
- [x] 1.8 Integrate session client into `useRealtimeVisionVoice` dual-track mode
- [x] 1.9 Add client and server tests for session lifecycle

## Phase 2 — True Full-Duplex Voice

- [x] 2.1 Implement `app/src/voice/vadDetector.ts`
- [x] 2.2 Implement `app/src/voice/aecProcessor.ts`
- [x] 2.3 Implement `app/src/voice/fullDuplexController.ts` state machine
- [x] 2.4 Implement `app/src/voice/cloudStreamingTtsProvider.ts` (real WS TTS)
- [x] 2.5 Update `speechResponseController.ts` for full-duplex barge-in
- [x] 2.6 Implement `server/src/services/fullDuplexOrchestrator.ts`
- [x] 2.7 Wire wake word to continuous ASR in session mode
- [x] 2.8 Add full-duplex and barge-in tests

## Phase 3 — Level 3 Continuous Vision World Model

- [x] 3.1 Implement `app/src/vision/visionWorldModel.ts` ring buffer
- [x] 3.2 Implement `app/src/vision/objectTracker.ts`
- [x] 3.3 Implement `app/src/vision/ocrProvider.ts` and `gestureActionProvider.ts`
- [x] 3.4 Replace `MockLocalVisionAnalyzer` with `ContinuousVisionAnalyzer` using world model
- [x] 3.5 Upgrade `videoFrameSampler.ts` adaptive sampling tiers
- [x] 3.6 Implement `server/src/services/continuousVisionService.ts`
- [x] 3.7 Extend visual answer service for structured vision context
- [x] 3.8 Update `CameraStage` / `VisualEvidenceOverlay` for tracks and OCR
- [x] 3.9 Add vision world model tests

## Phase 4 — Adaptive Edge-Cloud Routing

- [x] 4.1 Implement `app/src/routing/adaptiveEdgeCloudRouter.ts`
- [x] 4.2 Wire `shouldUseCloud` into `multimodalDialogue.ts` routing
- [x] 4.3 Extend `cloudGateway.ts` session-level token and tier limits
- [x] 4.4 Extend `edgeCloudMetrics.ts` for session cloud reduction
- [x] 4.5 Add routing tests and fixture validation

## Phase 5 — Production Quality Gates

- [x] 5.1 Add `app/src/evaluation/` fixtures and harnesses
- [x] 5.2 Extend `voiceQuality.test.ts`, `objectAccuracy.test.ts`
- [x] 5.3 Add interrupt, latency, tracking, soak evaluation tests
- [x] 5.4 Add server WS session integration tests

## Phase 6 — Privacy, Security, Compliance

- [x] 6.1 Implement WSS enforcement in session client
- [x] 6.2 Implement `server/src/services/mediaAuditLog.ts`
- [x] 6.3 Implement log redaction utilities
- [x] 6.4 Extend `SettingsDrawer` authorization lifecycle UI
- [x] 6.5 Add session TTL cleanup in session store

## Phase 7 — Operations & Reliability

- [x] 7.1 Implement `server/src/observability/metrics.ts`
- [x] 7.2 Implement `server/src/observability/circuitBreaker.ts`
- [x] 7.3 Extend `OperatorDashboard` session and circuit breaker UI
- [x] 7.4 Add session health admin API endpoints
- [x] 7.5 Add `docs/RUNBOOK_REALTIME_SESSION.md`
