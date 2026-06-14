## Why

The existing real-time vision and voice input capability can capture speech, process dialogue turns, and produce textual AI answers, but it does not yet require AI responses to be spoken back to the user. For a natural hands-free experience, answers need low-latency synthesized voice output that starts quickly and sounds fluent.

This change adds streaming text-to-speech behavior and measurable latency and quality targets for the full speech-to-answer loop.

## What Changes

- Add natural AI response playback through TTS for every voice dialogue answer that should be spoken.
- Add a streaming TTS path using Web Speech API or cloud streaming TTS so audio can begin before the full response is complete.
- Add an end-to-end latency requirement from user speech to received response, targeting under 3 seconds with an implementation goal below 2.5 seconds.
- Add quality requirements for ASR word accuracy in quiet environments and TTS naturalness MOS.
- Add response state handling for speaking, interruption, fallback, and weak-network behavior.

## Capabilities

### New Capabilities

### Modified Capabilities

- `realtime-vision-voice-ai-input`: Extend the real-time voice dialogue path with natural streaming TTS output, latency budgets, ASR/TTS quality targets, and spoken-response lifecycle handling.

## Impact

- Affects dialogue orchestration, AI response streaming, TTS provider integration, ASR result handling, latency measurement, audio playback state, local command interruption behavior, and UI status display.
- May require browser Web Speech API support checks and an injectable cloud streaming TTS adapter for environments where Web Speech quality or streaming support is insufficient.
- Requires tests or measurement harnesses that can validate latency budget accounting, streaming playback start, ASR accuracy fixtures, and TTS naturalness scoring acceptance gates.
