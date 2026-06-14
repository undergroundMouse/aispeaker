# Tasks

## Phase 1 — Omni Realtime Voice Spike

- [x] 1.1 Add shared Omni Realtime protocol types in `shared/src/omniRealtimeSession.ts`
- [x] 1.2 Add server config fields `QWEN_OMNI_REALTIME_MODEL`, `QWEN_OMNI_REALTIME_BASE_URL`, default voice, and VAD mode in `server/src/config.ts`
- [x] 1.3 Implement `server/src/providers/qwenOmniRealtime.ts` upstream WebSocket client
- [x] 1.4 Implement `server/src/routes/omniRealtimeProxy.ts` device-auth WebSocket relay
- [x] 1.5 Register Omni proxy route in `server/src/index.ts` with circuit breaker and metrics
- [x] 1.6 Implement `app/src/realtime/omniRealtimeClient.ts` with connect, PCM streaming, audio playback, reconnect
- [x] 1.7 Add `VITE_HYBRID_OMNI_DIALOGUE` feature flag in `app/src/config/featureFlags.ts`
- [x] 1.8 Integrate Omni client into `useRealtimeVisionVoice` behind feature flag (audio-only spike path)
- [x] 1.9 Add server and client tests for Omni session connect, auth failure, and audio relay lifecycle
- [x] 1.10 Document DashScope Omni Realtime activation and env setup in `server/.env.example` and runbook

## Phase 2 — Hybrid Visual Orchestration

- [x] 2.1 Implement `app/src/orchestration/hybridVisualOrchestrator.ts` with tool registry and routing tier resolution
- [x] 2.2 Extract reusable visual/memory/local handlers from `MultimodalDialogueService` into orchestrator-callable tools
- [x] 2.3 Wire orchestrator to local `VisionWorldModel`, custom object store, and conversation memory
- [x] 2.4 Implement Omni session context injection for `vision.delta` summaries and key-frame upload scheduler
- [x] 2.5 Extend `AdaptiveEdgeCloudRouter` with `omni-direct`, `local-hints`, `vl-verify`, and `local-only` tiers
- [x] 2.6 Connect orchestrator function calls to existing `POST /api/v1/cloud/visual-answer` for async VL verification
- [x] 2.7 Sync structured `VisualAnswer` and evidence overlay in Assist UI while Omni speaks
- [x] 2.8 Add orchestrator unit tests for tier selection, custom object short-circuit, and async verify flow

## Phase 3 — Full Assist Integration and Fallback

- [x] 3.1 Replace primary session voice path in hybrid mode: disable Paraformer-primary and stub TTS when Omni active
- [x] 3.2 Wire wake word and continuous listening to Omni session instead of legacy session ASR
- [x] 3.3 Implement fallback chain: Omni failure → legacy `/api/v1/realtime/session` → push-to-talk turn path
- [x] 3.4 Surface Omni interim/final transcripts and assistant text in Assist dialogue panel
- [x] 3.5 Implement async VL correction policy (UI update vs spoken correction) and document in settings/dev flag
- [x] 3.6 Update `SettingsDrawer` to show hybrid mode status and fallback reason when applicable
- [x] 3.7 Add integration tests for wake word, barge-in, and fallback transitions

## Phase 4 — Governance, Observability, and Quality Gates

- [x] 4.1 Extend `CloudGateway` and telemetry store for Omni session duration and token accounting
- [x] 4.2 Extend operator dashboard with Omni session usage, circuit breaker state, and separate VLM verify costs
- [x] 4.3 Add hybrid fluency fixture and p95 first-audio evaluation harness in `app/src/evaluation/`
- [x] 4.4 Run hybrid mode against existing object, OCR, and temporal visual fixtures; fix orchestrator gaps
- [x] 4.5 Add hybrid barge-in and 30-minute soak tests
- [x] 4.6 Extend `docs/RUNBOOK_REALTIME_SESSION.md` with Omni proxy ops, rollback, and allowlist notes
- [x] 4.7 Staging soak checklist and feature-flag rollout plan before optional default-on
