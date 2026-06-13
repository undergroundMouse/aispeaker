# ephemeral-media-privacy

## Purpose

Define consent-gated media capture, in-memory-only video and audio processing, immediate discard after use, and prohibition of permanent raw media storage for AI input pipelines.

## Requirements

### Requirement: Explicit authorization for media capture and cloud transmission
The system SHALL require explicit user authorization before starting camera capture, microphone capture, or transmitting raw video or audio frames to cloud services.

#### Scenario: Capture starts only after authorization
- **WHEN** the user has not granted explicit media capture authorization
- **THEN** the system does not start camera or microphone capture for AI processing

#### Scenario: Cloud transmission requires authorization
- **WHEN** a dialogue turn would send raw video or audio to a cloud model and the user has not authorized cloud media transmission
- **THEN** the system MUST NOT transmit raw video or audio to cloud services

#### Scenario: Authorization is revoked
- **WHEN** the user revokes media capture or cloud transmission authorization
- **THEN** the system stops new capture or cloud transmission that depends on the revoked authorization

### Requirement: Ephemeral in-memory video and audio processing
The system SHALL process video and audio only in transient in-memory buffers and SHALL NOT permanently store raw video or audio data on disk, in IndexedDB, or in cloud object storage.

#### Scenario: Raw media is discarded after processing
- **WHEN** a sampled video frame or microphone audio segment has been processed for the current dialogue turn or proactive pipeline step
- **THEN** the system releases the raw media buffer and does not retain the raw media beyond the processing lifecycle

#### Scenario: No permanent raw media persistence
- **WHEN** video or audio is captured for AI input
- **THEN** the system MUST NOT write raw video or audio recordings to persistent local storage or upload them for archival

#### Scenario: Retry does not persist raw media
- **WHEN** a cloud request retry occurs for a turn that included video or audio context
- **THEN** the system reuses only the in-memory payload available for that turn and still discards raw media after processing completes or fails

### Requirement: User-visible media privacy state
The system SHALL expose the current media capture and cloud transmission authorization state in settings or an equivalent privacy surface.

#### Scenario: User views media privacy settings
- **WHEN** the user opens media privacy settings
- **THEN** the system shows whether camera capture, microphone capture, and cloud media transmission are authorized

#### Scenario: User disables cloud media transmission
- **WHEN** the user disables cloud media transmission in settings
- **THEN** subsequent cloud-bound turns exclude raw video and audio even if local capture remains enabled
