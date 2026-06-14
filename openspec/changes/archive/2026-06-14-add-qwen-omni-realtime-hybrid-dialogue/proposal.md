## Why

The current realtime session path stitches together Paraformer ASR, turn-based HTTP visual-language calls, and browser or stub TTS. Users experience accurate transcription but unnatural, high-latency dialogue. Qwen-Omni Realtime can deliver native audio-in/audio-out fluency with built-in VAD and barge-in, but alone it cannot guarantee the structured visual accuracy, evidence overlays, local custom-object recognition, and uncertainty constraints already required by the product specs.

## What Changes

- Add a server-proxied **Qwen-Omni Realtime** session as the primary dialogue transport when hybrid mode is enabled.
- Add a **hybrid visual orchestration** layer that keeps `qwen-vl-plus` and the local vision world model as accuracy/enrichment backends invoked asynchronously via function calling.
- Replace Paraformer + stub TTS as the primary session voice path with Omni native streaming audio output.
- Inject vision context into Omni sessions via key frames plus structured `vision.delta` summaries rather than raw full-frame upload.
- Extend adaptive routing to choose among `omni-direct`, `local-hints`, and `vl-verification` tiers.
- Extend cost governance and observability for Omni session token/audio duration accounting.
- Preserve PTT + legacy pipeline session as fallback when Omni is unavailable, unconfigured, or circuit-open.
- **BREAKING**: When `VITE_HYBRID_OMNI_DIALOGUE=true`, primary Assist dialogue no longer blocks on `MultimodalDialogueService.handleTurn` HTTP round-trips; that service becomes a tool orchestrator.

## Capabilities

### New Capabilities

- `qwen-omni-realtime-session`: Server-proxied Qwen-Omni Realtime WebSocket/WebRTC session, credential isolation, session config, streaming audio I/O, and client adapter.
- `hybrid-visual-orchestration`: Function-call tool layer that routes visual questions to local world model, custom objects, and Qwen-VL verification while Omni handles spoken interaction.

### Modified Capabilities

- `realtime-session-transport`: Add Omni Realtime proxy transport alongside legacy custom session protocol; tighten first-audio latency budget for hybrid mode.
- `full-duplex-voice-interaction`: Primary full-duplex path uses Omni native audio and server VAD; legacy stitched ASR/TTS becomes fallback only.
- `realtime-asr-input`: Add hybrid-mode requirement that ASR is delegated to Omni Realtime in primary path; retain PTT/Web Speech/Paraformer fallback.
- `adaptive-edge-cloud-routing`: Add hybrid routing tiers for Omni-direct, local-hints injection, and async VL verification.
- `qwen-cloud-visual-language`: Reframe cloud VLM as structured visual verification/enrichment invoked by orchestrator, not primary spoken dialogue generator.
- `realtime-vision-voice-ai-input`: Primary dialogue path becomes hybrid Omni session with preserved visual accuracy gates.
- `cloud-gateway-cost-governance`: Account for Omni Realtime session usage separately from HTTP VLM calls.
- `backend-control-plane`: Add Omni Realtime proxy gateway, session admin visibility, and configuration surface.
- `realtime-quality-observability`: Add hybrid fluency and visual-accuracy evaluation gates for Omni primary path.

## Impact

- Client: new `app/src/realtime/omniRealtimeClient.ts`, `app/src/orchestration/hybridVisualOrchestrator.ts`; refactor `useRealtimeVisionVoice`, `MultimodalDialogueService`, feature flags.
- Server: new `server/src/routes/omniRealtimeProxy.ts`, `server/src/providers/qwenOmniRealtime.ts`, `server/src/services/hybridDialogueOrchestrator.ts`; extend config, metrics, circuit breaker.
- Shared: Omni session event types and tool schemas in `shared/`.
- Ops: new feature flag `VITE_HYBRID_OMNI_DIALOGUE`, runbook updates, operator dashboard Omni session metrics.
- External: DashScope Qwen-Omni Realtime API (`qwen3.5-omni-plus-realtime` default); account allowlist may be required for WebRTC.
