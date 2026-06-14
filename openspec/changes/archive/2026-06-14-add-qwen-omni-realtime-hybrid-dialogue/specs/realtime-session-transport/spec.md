# realtime-session-transport

## ADDED Requirements

### Requirement: Omni Realtime proxy transport
The system SHALL support an Omni Realtime proxy transport at `/api/v1/realtime/omni` as the primary session transport when hybrid Omni dialogue mode is enabled.

#### Scenario: Hybrid mode selects Omni transport
- **WHEN** hybrid Omni dialogue mode is enabled and backend configuration is valid
- **THEN** the client establishes its primary realtime dialogue session through the Omni proxy transport instead of the legacy custom session protocol

#### Scenario: Legacy transport remains available
- **WHEN** hybrid Omni dialogue mode is disabled or Omni connection fails
- **THEN** the client MAY use the legacy `/api/v1/realtime/session` transport without losing Assist functionality

## MODIFIED Requirements

### Requirement: End-to-end latency budget
The system SHALL target p95 first-response latency below 800ms for hybrid Omni dialogue turns measured as speech-endpoint to first assistant audio, and SHALL target p95 below 2.5 seconds for legacy session-based dialogue turns.

#### Scenario: Hybrid Omni latency is measured per turn
- **WHEN** a hybrid Omni dialogue turn produces assistant audio
- **THEN** the system records speech-endpoint to first-audio latency separately from legacy session dialogue latency

#### Scenario: Legacy latency remains measured per turn
- **WHEN** a dialogue turn completes in legacy session mode
- **THEN** the system records end-to-end latency metrics including speech-to-first-response timing
