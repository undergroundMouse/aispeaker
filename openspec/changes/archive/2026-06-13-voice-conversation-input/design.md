## Context

The current web app is a Vite + React frontend with a core bootstrap singleton, an event bus, video-only `MediaStreamManager`, frame sampling, and a minimal `ConversationManager` state model. Voice input should fit into this existing browser-first architecture while keeping microphone lifecycle, speech recognition, wake detection, and conversation turn creation explicit and testable.

Microphone access requires HTTPS or localhost and a user permission grant. Browser speech recognition support varies, so the implementation needs adapter boundaries for transcription and wake detection rather than hard-wiring a single vendor or browser API through UI code.

## Goals / Non-Goals

**Goals:**
- Capture user speech through the browser microphone with clear permission, active, stopped, and error states.
- Support both manual press-to-talk and configurable wake-triggered listening.
- Turn recognized speech into conversation turn events that can drive the assistant dialogue flow.
- Preserve privacy by stopping tracks when disabled and avoiding persistence of raw audio by default.
- Reuse the existing `eventBus`, `appCore`, and `ConversationManager` patterns.

**Non-Goals:**
- Implement final LLM response generation, TTS playback, or cloud account configuration.
- Persist recordings, transcripts, or conversation history beyond in-memory runtime state.
- Guarantee universal offline wake-word recognition in the first implementation.
- Merge audio and video capture into a single media manager unless a later change requires synchronized AV capture.

## Decisions

### Add a dedicated voice input core

Create a `VoiceInputManager` under `src/core/voice/` to own microphone `getUserMedia({ audio })`, audio track cleanup, and voice state emission. This keeps audio behavior independent from the existing video-only `MediaStreamManager`, whose constraints and lifecycle are tuned for camera preview and frame sampling.

Alternative considered: expand `MediaStreamManager` to manage both camera and microphone. That would reduce the number of classes but couple camera preview state to conversation input, making it harder to disable video while keeping voice active.

### Model voice lifecycle as typed events

Extend shared types with voice states such as `disabled`, `permission-requested`, `wake-listening`, `recording`, `transcribing`, `ready`, and `error`, plus events for state changes, partial transcripts, final transcripts, and submitted conversation turns. UI components and the conversation manager should subscribe to these events rather than polling implementation objects.

Alternative considered: keep voice state local to React components. That would be faster for a prototype but would not support downstream AI, logging-free privacy checks, or wake detection modules cleanly.

### Use pluggable adapters for wake and transcription

Define `WakeDetector` and `SpeechRecognitionAdapter` interfaces. The initial implementation can use browser capabilities where available and provide deterministic stubs or manual fallback behavior where unavailable. The UI must expose press-to-talk regardless of wake support so the feature remains usable on browsers without a wake engine.

Alternative considered: add a concrete cloud speech SDK immediately. That could improve recognition quality but adds credentials, network, privacy, and dependency decisions before the app has stable voice contracts.

### Drive conversation state from finalized speech

When a final transcript is available, the voice input pipeline emits a conversation turn event and asks `ConversationManager` to move through `listening` and `thinking` states. The existing state enum can be extended only if implementation discovers a state that is user-visible and not representable today.

Alternative considered: send transcripts directly from the recognition adapter to a future AI service. That would bypass the app's central conversation state and make it harder to coordinate camera sampling, UI status, and retries.

## Risks / Trade-offs

- Browser speech APIs differ or may be unavailable -> keep recognition behind an adapter and maintain press-to-talk plus clear unsupported-state UI.
- Always-on wake listening can create privacy concerns -> require explicit enablement, visible wake-listening status, and immediate stop controls.
- Wake detection may consume CPU on low-end devices -> make wake mode optional and allow manual trigger as the reliable baseline.
- Microphone permissions can fail or be revoked during a session -> map permission/device errors into stable user-facing voice error codes and retry paths.
- Conversation state can become inconsistent across camera and voice features -> route state changes through `ConversationManager` and shared events.

## Migration Plan

1. Add voice types, events, manager, and adapter interfaces without changing camera behavior.
2. Wire the voice manager into `appCore` and add toolbar controls/status for wake and press-to-talk.
3. Connect final transcripts to conversation turn events and `ConversationManager`.
4. Verify permission grant, denial, stop, wake fallback, press-to-talk, and transcript submission flows.
5. Rollback is isolated: remove voice bootstrap wiring and UI controls; existing camera capture remains unchanged.

## Open Questions

- Which production speech recognition backend should replace or supplement browser-native recognition?
- What wake phrase should be used by default, and should it be configurable in the first implementation?
- Should assistant response playback later use the same conversation state enum or add a dedicated audio output capability?
