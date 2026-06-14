## Why

The current Assist experience is turn-based: push-to-talk, single-frame vision, half-duplex ASR/TTS, and mock local vision. Production-grade continuous voice-video AI requires a low-latency WebSocket session, true full-duplex speech, Level 3 visual world modeling, adaptive edge-cloud routing, and operational governance.

## What Changes

- Add a unified low-latency WebSocket realtime session layer with heartbeat, reconnect, and session resume.
- Replace half-duplex PTT as the primary path with true full-duplex voice (VAD, AEC, barge-in, streaming ASR+TTS).
- Add Level 3 continuous vision world model (tracking, OCR, gestures, scene delta, multi-frame context).
- Wire `shouldUseCloud` and budget/network/privacy signals into adaptive edge-cloud routing.
- Add production quality gates (WER, MOS, latency p95/p99, interrupt success, soak tests).
- Promote media privacy to production governance (WSS, redaction, audit, retention).
- Add operations reliability (metrics, circuit breaker, feature flags, operator dashboard).
- **BREAKING**: Primary dialogue path moves from turn-based `handleTranscript` to session-based orchestration; PTT remains as fallback.

## Capabilities

### New Capabilities

- `realtime-session-transport`: WebSocket session protocol, seq/ack, reconnect, resume, latency budgets.
- `full-duplex-voice-interaction`: VAD, AEC, barge-in, parallel ASR/TTS, wake word integration.
- `continuous-vision-world-model`: Multi-frame buffer, object tracking, OCR, gestures, scene delta.
- `adaptive-edge-cloud-routing`: Confidence-based cloud routing, tier degradation, frame policy.
- `realtime-quality-observability`: Evaluation fixtures and CI quality gates.
- `media-privacy-production-governance`: Authorization lifecycle, encryption, redaction, audit.
- `operations-reliability`: Metrics, circuit breaker, feature flags, alerts.

### Modified Capabilities

- `realtime-asr-input`: Extend from half-duplex PTT to continuous full-duplex; PTT as fallback.
- `realtime-vision-voice-ai-input`: Primary path becomes session-based Level 3 vision.
- `cloud-gateway-cost-governance`: Session-level token accumulation and tier rate limits.
- `backend-control-plane`: WebSocket realtime session gateway and session admin APIs.

## Impact

- Client: new `app/src/realtime/`, `app/src/vision/`, `app/src/routing/`, `app/src/evaluation/`; refactor `useRealtimeVisionVoice`, voice controllers, `multimodalDialogue`.
- Server: new realtime session route, session store, full-duplex orchestrator, continuous vision service, observability.
- Shared: session protocol types in `shared/`.
- Ops: Operator dashboard extensions, feature flags, runbooks.
