## Context

The current app is a React/Vite prototype for real-time camera and microphone input, local voice commands, weak-network fallback, multimodal dialogue orchestration, and visual answers. It can derive AI responses from speech and live visual context, but the response surface is still primarily textual.

FR-16 through FR-19 add the spoken output layer and measurable voice-loop performance. The design needs to convert AI answer text into natural audio quickly, support streaming where possible, and preserve local/offline fallback behavior.

## Goals / Non-Goals

**Goals:**

- Speak AI dialogue answers through TTS in the active interaction language.
- Start TTS playback incrementally as response text becomes available, rather than waiting for a full final answer when streaming output exists.
- Track end-to-end latency from the end of user speech, or committed ASR transcript, to first audible response.
- Support Web Speech API and a cloud streaming TTS provider behind a common interface.
- Add measurable ASR and TTS quality gates for quiet-environment recognition and naturalness.
- Allow user interruption, stop commands, and new dialogue turns to cancel current speech.

**Non-Goals:**

- Training or fine-tuning a custom TTS model.
- Guaranteeing MOS scoring directly inside the browser at runtime.
- Replacing existing microphone capture, local command matching, or visual-language routing.
- Providing production billing, quota, or credential management for every possible cloud TTS vendor.

## Decisions

1. Introduce a TTS provider abstraction with streaming events.

   The dialogue path should depend on an interface such as `speak(request): AsyncIterable<TtsEvent>` or equivalent callbacks. Events should represent playback start, audio chunks or utterance boundaries, completion, cancellation, and errors. A Web Speech adapter can use `speechSynthesis` where available, while a cloud adapter can stream audio chunks.

   Alternative considered: call `speechSynthesis.speak()` directly from the React component. That is quick, but it makes latency tracking, cancellation, cloud fallback, and tests harder.

2. Treat response text as streamable segments.

   The AI response service should expose answer text in chunks or sentence-like segments when possible. TTS should begin after the first speakable segment instead of waiting for the entire answer. If the AI provider only returns a full answer, the same TTS interface should still speak that final text.

   Alternative considered: only synthesize after a complete answer. That is simpler, but it conflicts with the <3 second response target for longer answers.

3. Measure latency as a first-class dialogue metric.

   Each dialogue turn should record timestamps for speech capture start/end, ASR transcript committed, AI response first token/segment, TTS request start, first audible playback, and completion. The primary acceptance metric is user speech to received response under 3 seconds, with an implementation target below 2.5 seconds.

   Alternative considered: measure only total processing time after transcript. That would miss ASR and playback startup delays visible to the user.

4. Use provider selection based on capability and network state.

   Web Speech API should be the default browser-local option when it is available and meets language support needs. Cloud streaming TTS may be selected when configured for better naturalness or streaming audio quality. During weak-network states, the system should avoid cloud-only TTS and either use local Web Speech or show/speak the existing fallback if local speech synthesis is available.

   Alternative considered: always use cloud TTS for quality. That improves consistency but increases latency risk and breaks offline/weak-network behavior.

5. Keep quality targets testable through fixtures and evaluation hooks.

   ASR accuracy over 95% in quiet environments should be verified with a fixed utterance fixture or harness comparing transcripts to expected text. TTS MOS above 4.0 should be represented as an acceptance gate for the selected voice/provider, documented through evaluation data or a mockable score source in automated tests.

   Alternative considered: rely only on manual listening. Manual checks are useful, but they are not enough for regression protection.

## Risks / Trade-offs

- Web Speech voices vary by OS/browser, so naturalness and language quality may differ across Chrome, Edge, and Electron.
- Cloud streaming TTS can improve naturalness but may add network latency, credentials, cost, and provider-specific streaming formats.
- Starting playback too early can sound choppy if text chunks are too small; segment buffering should favor phrase or sentence boundaries.
- Measuring "first audible playback" is approximate in browser tests; implementation may need to use provider events plus playback callbacks as a practical proxy.
- TTS playback can conflict with microphone capture and cause ASR echo; the system may need echo suppression, half-duplex behavior, or temporary ASR pause during playback.

## Migration Plan

1. Add typed TTS request, event, provider, voice settings, and latency metric models without changing current dialogue behavior.
2. Implement Web Speech and mock streaming TTS providers behind the common interface.
3. Add a response speech controller that queues streamable answer segments, starts playback, tracks latency, and supports cancellation.
4. Wire AI dialogue responses and gesture acknowledgements through the speech controller.
5. Add UI state for listening, thinking, speaking, cancelled, TTS fallback, and latency metrics.
6. Add ASR/TTS evaluation fixtures and tests for latency budget accounting, streaming start, cancellation, and provider fallback.
7. Roll back by disabling spoken output while preserving textual answers and existing media capture behavior.

## Open Questions

- Which cloud streaming TTS provider should be configured first if Web Speech does not meet MOS or streaming needs?
- What exact quiet-environment ASR fixture set should define the >95% word accuracy gate?
- Who owns formal MOS scoring for the selected TTS voice/provider, and how often should it be refreshed?
- Should TTS playback pause ASR listening entirely, or should full-duplex barge-in remain available for stop commands?
