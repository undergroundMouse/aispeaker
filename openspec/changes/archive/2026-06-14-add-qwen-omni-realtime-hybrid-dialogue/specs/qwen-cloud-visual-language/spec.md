# qwen-cloud-visual-language

## ADDED Requirements

### Requirement: Visual verification role in hybrid Omni mode
When hybrid Omni dialogue mode is enabled, the server-side Qwen visual-language provider SHALL serve as the structured visual verification and enrichment backend invoked by the hybrid visual orchestrator rather than as the primary generator of spoken assistant responses.

#### Scenario: Hybrid mode invokes VLM through orchestrator tool
- **WHEN** hybrid Omni dialogue mode is active and the orchestrator schedules cloud visual verification
- **THEN** the backend executes the existing visual answer pipeline and returns a normalized `VisualAnswer` to the orchestrator without blocking Omni session audio streaming

#### Scenario: Spoken response is not sourced from HTTP VLM alone
- **WHEN** hybrid Omni dialogue mode is active and a visual question is answered with speech
- **THEN** the spoken response is produced by the Omni Realtime session using orchestrator hints and the HTTP VLM result supplies structured evidence and verification only

#### Scenario: Legacy turn-based VLM path remains for fallback
- **WHEN** hybrid Omni dialogue mode is disabled
- **THEN** the existing client `CloudVisualLanguageProvider` turn-based visual answer path remains available unchanged
