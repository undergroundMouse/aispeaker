## Why

The assistant needs a hands-free and low-friction way to capture user speech so users can start and continue natural conversations without relying only on typed input. This is needed now because real-time media input is already being introduced, and voice input is the core interaction path for an AI speaker experience.

## What Changes

- Add microphone permission and capture support for user speech input.
- Add two conversation start paths: configurable voice wake trigger and manual press-to-talk trigger.
- Convert captured speech into conversation turns that can be sent to the existing or planned dialogue pipeline.
- Surface microphone, listening, wake, recording, transcribing, speaking, and error states in the UI/event model.
- Ensure microphone capture is explicit, stoppable, and does not persist raw audio unless a later feature explicitly adds storage.

## Capabilities

### New Capabilities
- `voice-conversation-input`: Covers microphone capture, wake or key-triggered listening, speech recognition handoff, and natural conversation turn creation from user voice.

### Modified Capabilities

## Impact

- Affects browser media permission flow, microphone stream lifecycle, input controls, event bus contracts, conversation state management, and UI status indicators.
- May introduce speech recognition and wake detection adapters, with local or cloud implementations selected during design.
- Requires privacy-conscious handling of audio buffers and clear user controls for enabling, disabling, and retrying voice input.
