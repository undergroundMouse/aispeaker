## ADDED Requirements

### Requirement: WSS transport enforcement
The system SHALL use secure WebSocket (WSS) for realtime session transport in production deployments.

#### Scenario: Production requires WSS
- **WHEN** the app runs in production mode with backend configured
- **THEN** realtime session connections use WSS rather than plain WS

### Requirement: Media upload minimization
The system SHALL upload only the minimum media required for cloud processing and SHALL strip media when cloud transmission is unauthorized.

#### Scenario: Unauthorized cloud strips frames
- **WHEN** cloud media transmission is not authorized
- **THEN** raw video and audio frames are excluded from cloud requests

### Requirement: Log redaction
The system SHALL redact raw media content and sensitive transcript segments from operational logs.

#### Scenario: Logs exclude raw media
- **WHEN** session events are logged server-side
- **THEN** logs contain metadata only without raw frame or audio payloads

### Requirement: Audit trail for cloud media
The system SHALL record an audit entry when raw media is transmitted to cloud services.

#### Scenario: Cloud media transmission audited
- **WHEN** raw video or audio is sent to a cloud provider
- **THEN** the system records who, when, and what media class was transmitted

### Requirement: Retention TTL
The system SHALL enforce configurable retention TTL for session state and telemetry, discarding expired data.

#### Scenario: Expired session state discarded
- **WHEN** session state exceeds the configured TTL
- **THEN** the server removes session records and associated transient media references
