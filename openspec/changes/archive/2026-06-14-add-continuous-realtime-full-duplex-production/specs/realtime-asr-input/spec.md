## MODIFIED Requirements

### Requirement: Half-duplex speech IO
The system SHALL operate ASR and TTS in half-duplex mode when using push-to-talk fallback. In realtime session mode with full duplex enabled, the system SHALL run ASR and TTS concurrently with barge-in support.

#### Scenario: Push-to-talk interrupts TTS
- **WHEN** the user starts push-to-talk while TTS is speaking in fallback mode
- **THEN** the system cancels the active TTS playback, starts ASR capture, and shows interim transcript text in the Assist dialogue panel

#### Scenario: TTS does not start during active ASR in fallback mode
- **WHEN** the user is holding push-to-talk and ASR capture is active in fallback mode
- **THEN** the system does not start TTS for a new assistant response until ASR commits the final transcript for that turn

#### Scenario: Full duplex in session mode
- **WHEN** realtime session mode with full duplex is enabled and TTS is speaking
- **THEN** ASR remains active and barge-in can interrupt TTS without requiring push-to-talk

## ADDED Requirements

### Requirement: Continuous session ASR
The client SHALL stream microphone audio over the realtime WebSocket session for continuous ASR when session mode is active.

#### Scenario: Audio chunks streamed in session mode
- **WHEN** realtime session mode is active and microphone capture is authorized
- **THEN** the client streams `audio.chunk` messages with sequence numbers to the session gateway

#### Scenario: Interim results in session mode
- **WHEN** the session gateway emits `asr.interim` events
- **THEN** the Assist dialogue panel updates the user transcript area with interim text
