## 1. Speech Output Domain Models

- [x] 1.1 Add typed models for TTS requests, voice settings, stream events, playback status, cancellation reasons, and latency metrics.
- [x] 1.2 Define a TTS provider interface that supports local Web Speech, cloud streaming TTS, mock providers, cancellation, and provider capability checks.
- [x] 1.3 Define dialogue response segment types so AI answers can be spoken incrementally from full-text or streaming-text sources.

## 2. TTS Provider Implementations

- [x] 2.1 Implement a Web Speech API provider using `speechSynthesis` with language, voice, rate, pitch, start, end, error, and cancel handling.
- [x] 2.2 Implement a mock streaming TTS provider for deterministic tests of chunked audio or utterance events.
- [x] 2.3 Add a cloud streaming TTS provider adapter interface or placeholder that can consume provider-specific streaming audio when configured.
- [x] 2.4 Add provider selection logic based on runtime support, language support, network state, and configured quality preference.

## 3. Streaming Speech Controller

- [x] 3.1 Implement a speech response controller that buffers speakable answer segments and starts playback as soon as the first segment is ready.
- [x] 3.2 Track turn-level timestamps from user speech/ASR commit through first AI segment, first TTS playback, and completion.
- [x] 3.3 Support cancelling active playback when the user says a stop command, starts a new dialogue turn, or the component unmounts.
- [x] 3.4 Prevent stale TTS output from speaking after a newer dialogue turn has superseded it.
- [x] 3.5 Add tests for streaming start, full-answer fallback, cancellation, stale-turn suppression, and latency metric recording.

## 4. Dialogue and UI Wiring

- [x] 4.1 Wire AI dialogue answers, visual answers, and gesture acknowledgements through the speech response controller.
- [x] 4.2 Expose UI state for TTS provider, speaking status, fallback status, cancellation, and measured response latency.
- [x] 4.3 Update the interface to show when the system is listening, thinking, speaking, or unable to synthesize speech.
- [x] 4.4 Preserve weak-network/offline behavior by using local TTS when available and avoiding cloud-only TTS during unavailable network states.
- [x] 4.5 Add component tests for spoken response status, cancellation via local stop command, and weak-network fallback behavior.

## 5. Latency and Quality Verification

- [x] 5.1 Add a latency budget test or harness that verifies user speech to first response remains under 3 seconds in the mocked fast path, with a target threshold documented for <2.5 seconds.
- [x] 5.2 Add ASR quiet-environment evaluation fixtures or test utilities that calculate word accuracy and assert the configured >95% acceptance target.
- [x] 5.3 Add a TTS quality acceptance artifact or mockable evaluation gate documenting that the selected voice/provider reaches MOS >4.0.
- [x] 5.4 Add tests that verify streaming TTS begins before the full response is complete when streaming answer segments are available.
- [x] 5.5 Run lint, unit tests, and build to verify the implementation.
