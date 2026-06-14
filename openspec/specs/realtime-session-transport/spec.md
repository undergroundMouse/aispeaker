# realtime-session-transport

Low-latency WebSocket session transport for continuous audio, video, and control events with heartbeat, reconnect, and resume.

## Requirements

### Requirement: WebSocket realtime session gateway
The system SHALL establish a low-latency WebSocket session between client and server for continuous audio, video, and control events.

#### Scenario: Session starts with authentication
- **WHEN** the client sends `session.start` with a valid device token
- **THEN** the server responds with `session.ready` including `sessionId` and `resumeToken`

#### Scenario: Invalid token is rejected
- **WHEN** the client connects without a valid device token
- **THEN** the server closes the connection with an unauthorized error

### Requirement: Heartbeat and reconnect
The system SHALL send periodic heartbeats and SHALL reconnect with exponential backoff on disconnect.

#### Scenario: Heartbeat keeps session alive
- **WHEN** the session is idle for the configured heartbeat interval
- **THEN** client and server exchange heartbeat messages to prevent timeout

#### Scenario: Reconnect within budget
- **WHEN** the WebSocket disconnects unexpectedly
- **THEN** the client attempts reconnect with exponential backoff and restores within 5 seconds under normal network

### Requirement: Session resume
The system SHALL support session resume using `resumeToken` and last acknowledged sequence.

#### Scenario: Resume after disconnect
- **WHEN** the client sends `session.resume` with a valid `resumeToken` and `lastAckSeq`
- **THEN** the server restores session state and continues from the next sequence

### Requirement: Sequence acknowledgment
The system SHALL assign monotonic sequence numbers to client messages and SHALL detect gaps.

#### Scenario: Gap detection
- **WHEN** the server receives a sequence gap in client messages
- **THEN** the server requests retransmission or reports `session.error` with recoverable flag

### Requirement: End-to-end latency budget
The system SHALL target p95 first-response latency below 800ms for hybrid Omni dialogue turns measured as speech-endpoint to first assistant audio, and SHALL target p95 below 2.5 seconds for legacy session-based dialogue turns.

#### Scenario: Hybrid Omni latency is measured per turn
- **WHEN** a hybrid Omni dialogue turn produces assistant audio
- **THEN** the system records speech-endpoint to first-audio latency separately from legacy session dialogue latency

#### Scenario: Legacy latency remains measured per turn
- **WHEN** a dialogue turn completes in legacy session mode
- **THEN** the system records end-to-end latency metrics including speech-to-first-response timing

### Requirement: Omni Realtime proxy transport
The system SHALL support an Omni Realtime proxy transport at `/api/v1/realtime/omni` as the primary session transport when hybrid Omni dialogue mode is enabled.

#### Scenario: Hybrid mode selects Omni transport
- **WHEN** hybrid Omni dialogue mode is enabled and backend configuration is valid
- **THEN** the client establishes its primary realtime dialogue session through the Omni proxy transport instead of the legacy custom session protocol

#### Scenario: Legacy transport remains available
- **WHEN** hybrid Omni dialogue mode is disabled or Omni connection fails
- **THEN** the client MAY use the legacy `/api/v1/realtime/session` transport without losing Assist functionality
