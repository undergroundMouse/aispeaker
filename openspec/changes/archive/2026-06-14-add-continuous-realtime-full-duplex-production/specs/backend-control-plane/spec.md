## ADDED Requirements

### Requirement: Realtime session WebSocket gateway
The backend SHALL expose a WebSocket gateway at `/api/v1/realtime/session` for continuous realtime dialogue sessions.

#### Scenario: Session WebSocket authenticated
- **WHEN** a client connects to `/api/v1/realtime/session` with a valid device token
- **THEN** the backend accepts the WebSocket upgrade and initializes session state

#### Scenario: Session admin visibility
- **WHEN** an authorized operator requests session health from the operations admin API
- **THEN** the backend returns active session count and circuit breaker state
