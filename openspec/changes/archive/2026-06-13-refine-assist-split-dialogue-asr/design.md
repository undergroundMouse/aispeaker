## Context

`refine-assist-voice-companion-ui` established a full-viewport overlay Assist with `CaptionLayer`, `TalkFab`, and `useAssistPresentation` for assistant streaming text. Dialogue submission still uses a hardcoded `transcript` string from `App.tsx`; the Debug panel retains a transcript simulator for engineering use only. Specs already require ASR word accuracy above 95% in quiet environments and latency metrics including `transcriptCommittedAt`, but no `AsrProvider` exists. TTS uses a provider pattern (`WebSpeechTtsProvider`, `CloudStreamingTtsProvider`) via `SpeechResponseController`.

Users now want a split desktop layout: smaller camera on the left, speech-to-text plus dialogue on the right, settings as a single button, and real streaming ASR on push-to-talk with half-duplex audio policy.

## Goals / Non-Goals

**Goals:**

- Present Assist as a split layout (~55/45) with camera and controls on the left and `DialoguePanel` on the right.
- Stream interim and final user transcripts into the right panel during push-to-talk using Web Speech API in Phase 1.
- Commit the final ASR transcript into the existing `handleTranscript` dialogue pipeline on push-to-talk release.
- Enforce half-duplex speech IO: no concurrent ASR and TTS; push-to-talk cancels active TTS before listening.
- Keep settings access limited to a single ⚙ button opening `SettingsDrawer`.
- Preserve assistant streaming captions, proactive banner, system toasts, camera interaction feedback, and responsive single-column fallback.

**Non-Goals:**

- Cloud streaming ASR or new backend `/asr` routes in Phase 1.
- Full-duplex barge-in or echo-cancellation-dependent always-on listening.
- Inline settings forms in the right dialogue column.
- Mobile-specific one-handed layout redesign beyond existing stacked fallback.

## Decisions

### 1. Split layout replaces overlay as default desktop Assist

**Decision:** Use a two-column CSS grid for desktop: left `VisionColumn` (camera, talk controls, object selection), right `DialoguePanel` (user STT, assistant replies, history). Narrow viewports stack camera then dialogue.

**Rationale:** Matches the user wireframe and separates visual input from language output without returning to the old multi-card dashboard.

**Alternatives considered:**

- Keep overlay and only add STT in a side drawer — rejected; user explicitly requested smaller camera plus right dialogue column.
- Three-column layout with separate settings column — rejected; settings remain a single button.

### 2. `DialoguePanel` composes user and assistant sub-panels

**Decision:** Right column contains `UserTranscriptPanel` (ASR interim/final, optional fallback text input) above assistant/history content migrated from `CaptionLayer`.

**Rationale:** User STT and assistant replies have different update frequencies and styling; splitting sub-panels keeps interim ASR readable without conflating roles.

### 3. `AsrProvider` mirrors `TtsProvider`

**Decision:** Introduce `AsrProvider` with `kind: 'web-speech' | 'mock'` in Phase 1 and a `SpeechCaptureController` that yields `AsrEvent` streams (`start`, `interim`, `final`, `end`, `error`).

**Rationale:** Reuses the proven provider-selection pattern and keeps cloud ASR addition isolated to a future provider implementation.

**Alternatives considered:**

- Inline `webkitSpeechRecognition` inside the hook — rejected; harder to test and extend.

### 4. Web Speech API for Phase 1 streaming ASR

**Decision:** `WebSpeechAsrProvider` uses browser `SpeechRecognition` / `webkitSpeechRecognition` with `interimResults: true` and `continuous: true` for the active push-to-talk session.

**Rationale:** Fastest path to visible streaming STT without backend work; aligns with existing `WebSpeechTtsProvider` dependency on browser speech APIs.

**Alternatives considered:**

- Cloud ASR first — rejected for Phase 1 scope and latency/cost complexity.

### 5. Half-duplex speech IO

**Decision:**

- R1: Do not run ASR while TTS is speaking unless the user holds push-to-talk.
- R2: On push-to-talk start, `speechController.cancel('user-interrupt')`, then start ASR.
- R3: Proactive prompt playback follows the same cancel-then-listen rule.
- R4: Do not start TTS for a new assistant response until ASR has committed the final transcript for the active turn.

**Rationale:** Avoids speaker-to-microphone echo without requiring AEC in the prototype.

**Alternatives considered:**

- Full-duplex with stop-command listening during TTS — deferred.

### 6. Push-to-talk owns transcript commit

**Decision:** Remove `App.tsx` hardcoded `transcript` state for dialogue submission. `stopPushToTalk` reads the final ASR result from `SpeechCaptureController` and calls `handleTranscript(finalText)`.

**Rationale:** Makes Assist dialogue path depend on real capture state instead of debug/manual strings.

**Note:** Debug transcript simulator remains in `DebugPanel` for engineering override only.

### 7. Settings remain drawer-only via single button

**Decision:** Top chrome exposes only ⚙ (plus optional network ambient dot). No settings sections in `DialoguePanel`.

**Rationale:** Matches user requirement and reuses existing `SettingsDrawer` with minimal churn.

### 8. Proactive banner moves to dialogue column header

**Decision:** Render `ProactiveBanner` at the top of the right `DialoguePanel` instead of over the camera.

**Rationale:** Keeps the left vision column focused on camera and controls; proactive text stays near conversation context.

## Risks / Trade-offs

- **[Risk] Safari / unsupported browsers lack SpeechRecognition** → Mitigation: provider capability check, user-visible unavailable state, optional mock provider in tests, keep Debug simulator.
- **[Risk] Interim Chinese text flicker without word boundaries** → Mitigation: style interim differently; only replace user line on `final` when possible.
- **[Risk] Short push-to-talk releases before final ASR** → Mitigation: on stop, await short finalization timeout; fall back to last interim if confidence threshold met.
- **[Risk] Layout regression from overlay to split** → Mitigation: update Assist component tests and preserve mobile stacked CSS.
- **[Risk] Half-duplex feels less natural than barge-in** → Mitigation: explicit UI copy that holding talk interrupts assistant speech.

## Migration Plan

1. **ASR foundation:** Add types, `WebSpeechAsrProvider`, `SpeechCaptureController`, half-duplex integration in hook.
2. **Dialogue panel:** Build `DialoguePanel` + `UserTranscriptPanel`; wire ASR and assistant streaming state.
3. **Split layout:** Refactor `AssistShell` grid; move controls under camera; keep ⚙ settings button.
4. **Cleanup:** Remove hardcoded transcript from `App.tsx` default path; update tests and i18n.
5. **Verify:** Run ASR fixture accuracy gate, half-duplex tests, Assist layout tests.

Rollback: feature-flag split layout to previous overlay components if needed; ASR controller is additive and can be bypassed with mock provider during rollback.

## Open Questions

- Whether to expose a collapsed manual text input in `UserTranscriptPanel` when ASR is unavailable (default proposal: **yes**, secondary fallback).
- Exact desktop ratio tuning between 55/45 and 60/40 after implementation review (default proposal: **55/45**).
