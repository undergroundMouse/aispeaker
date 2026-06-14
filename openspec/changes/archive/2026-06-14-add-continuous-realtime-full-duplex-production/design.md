## Context

The app currently uses turn-based dialogue: `useRealtimeVisionVoice` → PTT → `SpeechCaptureController` → `handleTranscript` → `MultimodalDialogueService.handleTurn` with `lastFrame`. Server exposes HTTP visual-answer and a separate ASR WebSocket. Cost governance exists via `CloudGateway` but `shouldUseCloud` is not wired into routing.

## Goals / Non-Goals

**Goals:**
- Low-latency WebSocket unified session (audio + video + events)
- True full-duplex: ASR and TTS parallel with barge-in
- Level 3 vision: tracking, OCR, gestures, scene delta, multi-frame context
- Adaptive edge-cloud routing with budget/network/privacy
- Production quality gates, privacy governance, ops reliability

**Non-Goals:**
- WebRTC peer connections (use WebSocket only)
- Removing PTT fallback path
- Replacing Qwen as primary cloud VLM

## Decisions

### D1: WebSocket session transport over WebRTC
**Choice:** Extend existing `asrStream` pattern into `/api/v1/realtime/session` unified gateway.
**Rationale:** Reuses Hono upgrade, device auth, and existing PCM streaming; simpler than WebRTC signaling.
**Alternative rejected:** WebRTC — higher complexity for marginal gain at current scale.

### D2: True full-duplex with AEC + barge-in state machine
**Choice:** `FullDuplexController` states: `Idle | Listening | Speaking | BargeIn | Recovering`. ASR never stops during TTS; VAD triggers barge-in.
**Rationale:** User requirement for true full-duplex.
**Mitigation:** Web Audio AEC processor + reduced ASR sensitivity during TTS playback.

### D3: Level 3 vision as client-side world model + server aggregation
**Choice:** `VisionWorldModel` maintains ring buffer, `ObjectTracker`, OCR/gesture providers; sends `vision.delta` over WS; server `ContinuousVisionService` merges for VLM context.
**Rationale:** Reduces bandwidth (delta vs full frames); enables temporal questions.

### D4: Adaptive routing in dedicated router
**Choice:** `AdaptiveEdgeCloudRouter` consumes `shouldUseCloud`, network, budget, privacy; outputs `RouteTier` + `FramePolicy`.
**Rationale:** Centralizes decisions currently scattered in `multimodalDialogue` and unused flags.

### D5: Feature-flag dual-track migration
**Choice:** `VITE_REALTIME_SESSION_MODE` defaults off; legacy turn path unchanged until flag enabled.
**Rationale:** Safe rollout; PTT remains fallback on WS failure.

## Risks / Trade-offs

- [Browser AEC unreliable] → WASM AEC fallback + server echo reference + barge-in confidence threshold
- [Level 3 compute on mobile] → Adaptive sampling tiers; track bbox without full frame upload
- [WS video bandwidth] → vision.delta preferred over raw frames; JPEG quality adaptive
- [Scope] → Phased tasks with per-phase acceptance; specs define full target

## Migration Plan

1. Ship WS session + feature flag (off by default)
2. Enable full-duplex in staging
3. Enable Level 3 vision tier
4. Enable adaptive routing
5. Turn on quality CI gates
6. Default session mode on after soak pass

Rollback: disable feature flags → legacy PTT path.

## Open Questions

- Cloud TTS provider selection (reuse Qwen speech or separate vendor) — default to WS streaming stub with configurable endpoint.
