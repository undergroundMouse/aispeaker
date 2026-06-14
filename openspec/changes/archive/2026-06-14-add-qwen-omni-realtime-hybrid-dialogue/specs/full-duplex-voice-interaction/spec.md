# full-duplex-voice-interaction

## ADDED Requirements

### Requirement: Omni native full-duplex primary path
When hybrid Omni dialogue mode is enabled, the system SHALL use Qwen-Omni Realtime native audio input and output as the primary full-duplex voice path with server-side turn detection and barge-in.

#### Scenario: Omni handles concurrent listen and speak
- **WHEN** hybrid Omni dialogue mode is active and the assistant is speaking
- **THEN** the Omni session remains open for user audio input and supports barge-in without requiring a separate client ASR and TTS pipeline

#### Scenario: Barge-in success in hybrid mode
- **WHEN** the user speaks during assistant audio playback in hybrid Omni mode
- **THEN** the system interrupts assistant playback and begins processing the new utterance with interrupt success rate above 90% on evaluation fixtures

## MODIFIED Requirements

### Requirement: Streaming cloud TTS
The system SHALL support streaming assistant audio over the realtime session. In hybrid Omni dialogue mode, assistant audio SHALL be produced by Qwen-Omni Realtime native output. In legacy session mode, the system SHALL use configured cloud or browser TTS providers when Omni is not active.

#### Scenario: Hybrid mode uses Omni native audio output
- **WHEN** hybrid Omni dialogue mode is active and the assistant responds with speech
- **THEN** assistant audio is streamed from the Omni Realtime session and first audio arrives within 800ms p95 of response start

#### Scenario: Legacy mode uses configured TTS fallback
- **WHEN** hybrid Omni dialogue mode is disabled and the assistant response requires speech in legacy session mode
- **THEN** TTS first-audio arrives within 800ms of response generation start using the configured TTS provider
