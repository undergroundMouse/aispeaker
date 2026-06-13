## Why

The Assist surface currently uses a full-bleed voice-companion overlay where dialogue captions float over the camera and push-to-talk relies on a hardcoded transcript rather than real speech recognition. Users need a clearer desktop layout with a smaller camera stage, a dedicated right-side speech-to-text and dialogue panel, and settings exposed only through a single button that opens the existing drawer. The project already defines ASR quality targets but has no Assist-visible ASR pipeline; implementing streaming recognition with a half-duplex TTS policy closes that gap.

## What Changes

- Reshape Assist from full-bleed overlay to a **split layout**: ~55% left camera and controls, ~45% right dialogue panel on desktop; single-column stacking on narrow viewports.
- Introduce a right-side **DialoguePanel** with a user speech-to-text area (interim + final), assistant streaming replies, and scrollable turn history.
- Keep **settings as a single ⚙ button** that opens the existing `SettingsDrawer`; do not add inline settings to the right panel.
- Add a new **realtime ASR input** capability with `AsrProvider` abstraction, Web Speech recognition for Phase 1 interim/final streaming on push-to-talk, and half-duplex coordination with TTS (push-to-talk cancels playback before listening).
- Remove dependence on `App.tsx` hardcoded transcript and Debug-only transcript simulation for normal Assist dialogue submission.
- Relocate talk and object-selection controls under the left camera stage; retire the centered Talk FAB from the default Assist layout.
- Preserve camera selection, evidence highlights, proactive prompts, system toasts, Operator surface, and Debug surface behavior outside the primary dialogue column.
- **Out of scope for Phase 1:** cloud streaming ASR backend, full-duplex barge-in during TTS, dedicated mobile one-handed redesign.

## Capabilities

### New Capabilities

- `realtime-asr-input`: Streaming ASR provider model, push-to-talk capture lifecycle, interim/final transcript events, half-duplex TTS interaction, Assist-visible user transcript presentation, and quiet-environment accuracy evaluation integration.

### Modified Capabilities

- `assist-information-architecture`: Change Assist default layout from overlay to split panel; move dialogue presentation to the right column; settings entry remains a single button; update talk-control and proactive-banner placement requirements.
- `realtime-vision-voice-ai-input`: Bind microphone push-to-talk to real ASR commit, add half-duplex speech IO rules, and route Assist transcript display through the dialogue panel instead of debug simulation.

## Impact

- Client UI: refactor `AssistShell`, replace overlay `CaptionLayer` placement with `DialoguePanel`, update `App.css` grid layout, demote/remove `TalkFab` from default Assist.
- Client voice layer: new `app/src/voice/asrProviders.ts`, `SpeechCaptureController`, ASR types/events; integrate into `useRealtimeVisionVoice` and remove hardcoded transcript wiring from `App.tsx`.
- Presentation: extend `useAssistPresentation` or adjacent module with `AsrTranscriptState` for interim/final user text in the right panel.
- Tests: ASR provider unit tests, half-duplex lifecycle tests, DialoguePanel streaming UI tests, quiet-environment fixture gate, updated `App.test.tsx` expectations.
- Server: no Phase 1 API changes; cloud ASR deferred to a follow-up change.
- Specs: new `realtime-asr-input` capability; deltas to assist layout and voice-input requirements.
