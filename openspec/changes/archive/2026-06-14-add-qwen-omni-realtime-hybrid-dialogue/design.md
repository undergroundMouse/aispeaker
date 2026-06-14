## Context

The product already ships a custom WebSocket realtime session (`/api/v1/realtime/session`) with Paraformer ASR, vision delta ingestion, and a stub TTS orchestrator. Dialogue generation still flows through `MultimodalDialogueService.handleTurn` → HTTP `POST /api/v1/cloud/visual-answer` → browser TTS. This produces turn-based latency and weak conversational fluency despite continuous ASR.

Qwen-Omni Realtime (`qwen3.5-omni-plus-realtime`) supports native streaming audio input/output, server VAD, semantic barge-in, and optional image/video frame input over WebSocket or WebRTC. It is the best fit for the existing DashScope stack but is not a drop-in replacement for the structured visual pipeline built around `qwen-vl-plus`, local custom objects, evidence regions, and evaluation fixtures.

## Goals / Non-Goals

**Goals:**
- Primary Assist dialogue uses Qwen-Omni Realtime for natural, low-latency, interruptible voice interaction.
- Preserve existing visual accuracy requirements: common-object ≥85%, OCR recall ≥85%, temporal questions ≥80%, uncertainty phrase "看不清楚", evidence overlay regions.
- Keep local custom-object learning, long-term memory consent, budget governance, and privacy controls intact.
- Server holds Omni credentials; client never sees upstream API keys.
- Safe rollout via feature flag with automatic fallback to legacy pipeline session.

**Non-Goals:**
- Replacing `qwen-vl-plus` as the structured visual verification model.
- GPT-4o Realtime integration (no native vision in Realtime API; out of region stack).
- Removing PTT or legacy `/api/v1/realtime/session` in this change.
- Full WebRTC in browser v1 unless latency testing proves WebSocket insufficient.
- Rewriting Level 3 vision world model; it becomes an orchestration input.

## Decisions

### D1: Hybrid architecture — Omni for fluency, VL for accuracy
**Choice:** Qwen-Omni Realtime owns the live conversation loop (audio in/out, turn-taking). A new `HybridVisualOrchestrator` exposes function tools that call existing local vision, custom-object store, and `VisualAnswerService` / `qwen-vl-plus` asynchronously.
**Rationale:** Single end-to-end model cannot guarantee structured `VisualAnswer` regions and evaluation gates; hybrid preserves both fluency and accuracy.
**Alternative rejected:** Pure Omni Realtime — simpler but fails visual accuracy and evidence requirements.
**Alternative rejected:** Keep stitched Paraformer + HTTP + TTS — already proven insufficient for fluency.

### D2: Server-side Omni proxy over direct client upstream
**Choice:** Add `/api/v1/realtime/omni` WebSocket upgrade on the backend control plane. Server opens upstream DashScope Omni Realtime connection using `QWEN_API_KEY` and relays events bidirectionally after device-token auth.
**Rationale:** Matches existing backend-control-plane pattern; enables centralized budget, audit, and circuit breaker.
**Alternative rejected:** Client-direct DashScope — leaks credentials and bypasses governance.

### D3: WebSocket first, WebRTC optional phase 2
**Choice:** Phase 1 uses WebSocket relay with PCM16 16kHz/24kHz per DashScope docs. Evaluate WebRTC (`/api/v1/realtime/omni/webrtc`) only if p95 first-audio exceeds 800ms in staging.
**Rationale:** Reuses existing Hono upgrade infrastructure; WebRTC adds SDP signaling complexity and allowlist dependency.
**Alternative rejected:** WebRTC-only — higher integration cost before proving need.

### D4: Vision injection strategy — key frames + structured hints, not raw 5fps upload
**Choice:** Client sends to Omni session:
1. Low-rate key frames (adaptive 0.5–2 fps based on `FramePolicy`).
2. Textual `vision.delta` summaries (tracks, OCR snippets, scene change) via session context update or tool result injection.
3. On visual question detection, orchestrator prefetches VL verification in parallel and injects structured hints before Omni finalizes spoken answer when possible.
**Rationale:** Controls bandwidth/cost; leverages existing `VisionWorldModel` investment.
**Alternative rejected:** Continuous full-resolution frame stream to Omni — expensive and redundant with local world model.

### D5: Async VL verification without blocking first spoken response
**Choice:** For visual questions:
- **Fast path:** Omni responds immediately using local hints if confidence ≥ threshold.
- **Verify path:** Trigger async `qwen-vl-plus` call; if result contradicts or increases confidence, Omni receives a correction context item and may revise or the UI updates evidence overlay while speech continues.
**Rationale:** Fluency requires not waiting for HTTP VLM on every turn; accuracy recovered asynchronously.
**Alternative rejected:** Synchronous VL before any speech — reintroduces turn-based latency.

### D6: `MultimodalDialogueService` becomes tool backend, not primary loop
**Choice:** Extract visual/memory/local command handlers into callable tools used by `HybridVisualOrchestrator`. Legacy `handleTurn` remains for PTT fallback and tests.
**Rationale:** Minimizes rewrite while changing primary runtime path.
**Alternative rejected:** Delete `MultimodalDialogueService` — too disruptive for one change.

### D7: Feature flag dual-track migration
**Choice:** `VITE_HYBRID_OMNI_DIALOGUE` defaults `false`. When `false`, existing `VITE_REALTIME_SESSION_MODE` behavior unchanged. When `true`, session client prefers Omni proxy; on failure falls back to legacy session + PTT path.
**Rationale:** Safe rollout consistent with prior realtime change.
**Alternative rejected:** Immediate default-on — too risky before soak.

### D8: Default model and config
**Choice:**
- `QWEN_OMNI_REALTIME_MODEL=qwen3.5-omni-plus-realtime`
- `QWEN_OMNI_REALTIME_BASE_URL=wss://dashscope.aliyuncs.com/api-ws/v1/realtime` (domestic) with env override for intl endpoint
- Keep `QWEN_MODEL=qwen-vl-plus` for verification
**Rationale:** Aligns with DashScope docs and existing server config pattern.

## Architecture

```
┌─────────────── Client ───────────────┐
│ useRealtimeVisionVoice               │
│   ├─ OmniRealtimeClient (primary)    │
│   ├─ HybridVisualOrchestrator        │
│   │     ├─ local vision world model  │
│   │     ├─ custom object store       │
│   │     └─ HTTP visual-answer tool   │
│   └─ Legacy session client (fallback)│
└───────────────┬──────────────────────┘
                │ WSS /api/v1/realtime/omni
                ▼
┌─────────────── Server ───────────────┐
│ omniRealtimeProxy                    │
│   ├─ device token auth               │
│   ├─ CloudGateway / budget           │
│   ├─ circuit breaker                 │
│   └─ upstream DashScope Omni WS      │
│                                      │
│ visualAnswerService (on tool call)   │
│   └─ qwen-vl-plus verification       │
└──────────────────────────────────────┘
```

## Routing tiers (Hybrid)

| Tier | Trigger | Omni behavior | VL call |
|------|---------|---------------|---------|
| `omni-direct` | Non-visual chitchat/command | Answer directly | None |
| `local-hints` | Visual Q + high local confidence | Speak using injected hints | None |
| `vl-verify` | Visual Q + low confidence or object ID | Speak provisional answer; async verify | Yes |
| `local-only` | Offline / privacy denied | Tools local only | Blocked |

## Risks / Trade-offs

- [Omni Realtime allowlist / quota] → Feature flag fallback; staging spike before default-on; document DashScope activation steps in runbook.
- [Spoken answer diverges from verified VisualAnswer] → UI always renders structured evidence from orchestrator; transcript panel shows verified result; correction injection policy documented.
- [Higher session cost than HTTP turns] → Separate Omni budget counters; adaptive frame policy; local short-circuit before VL verify.
- [Dual-model complexity] → Centralize in `HybridVisualOrchestrator`; integration tests for each tier.
- [Legacy session duplication] → Mark legacy transport deprecated in docs; converge later after soak.

## Migration Plan

1. **Phase 1 — Omni voice spike:** Server proxy + client audio loop only (no camera). Validate latency, barge-in, Chinese fluency.
2. **Phase 2 — Vision injection:** Key frames + vision.delta context; function tools wired to local world model.
3. **Phase 3 — VL verification:** Async `qwen-vl-plus` tool, evidence overlay sync, evaluation fixtures.
4. **Phase 4 — Ops & default:** Metrics, dashboard, runbook, staging soak, optional default flag flip.

Rollback: set `VITE_HYBRID_OMNI_DIALOGUE=false` → legacy session + PTT path.

## Open Questions

- Confirm DashScope account has Omni Realtime access (WebSocket minimum; WebRTC if needed in phase 2).
- Choose default Omni voice persona / language lock for bilingual Assist.
- Decide correction UX when async VL contradicts spoken answer (silent UI update vs spoken correction).
