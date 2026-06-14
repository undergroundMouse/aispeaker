# realtime-vision-voice-ai-input

## ADDED Requirements

### Requirement: Hybrid Omni primary dialogue path
When hybrid Omni dialogue mode is enabled, the Assist surface SHALL use the Qwen-Omni Realtime hybrid session as the primary dialogue path for microphone-driven conversation while preserving camera preview and visual evidence presentation.

#### Scenario: Wake word starts hybrid Omni session listening
- **WHEN** voice wake-up is enabled, hybrid Omni dialogue mode is active, and the wake trigger is detected
- **THEN** the system activates the Omni Realtime session for continuous speech input without requiring push-to-talk

#### Scenario: Assist dialogue panel shows Omni transcripts
- **WHEN** hybrid Omni dialogue mode is active and the user or assistant speaks
- **THEN** the Assist dialogue panel shows user and assistant transcript text derived from the Omni session alongside any structured visual evidence from the orchestrator

#### Scenario: Visual accuracy gates remain enforced in hybrid mode
- **WHEN** hybrid Omni dialogue mode is active and visual evaluation fixtures are executed
- **THEN** common-object accuracy, OCR recall, temporal visual question accuracy, and uncertainty-answer constraints remain satisfied through the hybrid visual orchestrator and verification backend

### Requirement: Hybrid mode feature flag
The system SHALL gate hybrid Omni dialogue behind `VITE_HYBRID_OMNI_DIALOGUE` defaulting to disabled and SHALL preserve the existing push-to-talk and legacy session paths when the flag is disabled.

#### Scenario: Flag disabled preserves legacy behavior
- **WHEN** `VITE_HYBRID_OMNI_DIALOGUE` is not enabled
- **THEN** the Assist surface continues to use the existing turn-based or legacy session dialogue path as configured

#### Scenario: Flag enabled selects hybrid path
- **WHEN** `VITE_HYBRID_OMNI_DIALOGUE` is enabled and backend Omni configuration is valid
- **THEN** the Assist surface initializes the Omni Realtime hybrid session as the primary dialogue transport
