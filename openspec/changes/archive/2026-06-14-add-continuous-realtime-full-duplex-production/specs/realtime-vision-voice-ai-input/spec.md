## ADDED Requirements

### Requirement: Session-based primary dialogue path
The system SHALL use the realtime WebSocket session as the primary dialogue path when `VITE_REALTIME_SESSION_MODE` is enabled, integrating continuous vision and full-duplex voice.

#### Scenario: Session mode handles dialogue turns
- **WHEN** realtime session mode is enabled and the user speaks
- **THEN** the system processes the turn through the session orchestrator with vision world model context rather than single-frame `handleTurn` only

#### Scenario: Legacy fallback on session failure
- **WHEN** realtime session connection fails or feature flag is disabled
- **THEN** the system falls back to push-to-talk turn-based dialogue without blocking the user

### Requirement: Level 3 vision context in dialogue
The system SHALL supply multi-frame vision world model context including tracks, OCR, gestures, and scene deltas to dialogue processing in session mode.

#### Scenario: Vision delta included in turn
- **WHEN** a dialogue turn is processed in session mode
- **THEN** the orchestrator receives structured vision.delta context rather than only the most recent single frame
