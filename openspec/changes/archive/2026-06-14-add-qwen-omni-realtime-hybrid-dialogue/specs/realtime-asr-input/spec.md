# realtime-asr-input

## ADDED Requirements

### Requirement: Hybrid Omni ASR delegation
When hybrid Omni dialogue mode is enabled, the system SHALL delegate speech recognition for the primary dialogue path to Qwen-Omni Realtime and SHALL expose interim and final user transcripts to the Assist dialogue panel.

#### Scenario: Interim transcript from Omni session
- **WHEN** hybrid Omni dialogue mode is active and the user is speaking
- **THEN** the Assist dialogue panel updates the user transcript area with interim text derived from Omni input transcription events when available

#### Scenario: Final transcript committed on Omni turn completion
- **WHEN** Omni Realtime completes a user turn in hybrid mode
- **THEN** the client commits the final user transcript to the dialogue panel and conversation memory

### Requirement: Legacy ASR fallback preservation
The system SHALL retain Web Speech, Paraformer, and push-to-talk ASR providers as fallback paths when hybrid Omni dialogue mode is disabled or unavailable.

#### Scenario: PTT fallback when Omni unavailable
- **WHEN** hybrid Omni dialogue mode is enabled but the Omni session cannot be established
- **THEN** the client falls back to push-to-talk or legacy session ASR without losing Assist speech input entirely
