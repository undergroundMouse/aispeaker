# backend-control-plane

Server-side control plane for authoritative cloud visual-language execution, telemetry, and operations administration.

## Requirements

### Requirement: Backend control plane service
The system SHALL provide a deployable backend control plane service that exposes HTTP APIs for cloud visual-language execution and operations administration.

#### Scenario: Service health is observable
- **WHEN** the backend control plane is running
- **THEN** operators can verify service health through a health endpoint without requiring client media permissions

#### Scenario: Device and admin APIs are separated
- **WHEN** the backend control plane receives a request
- **THEN** cloud execution routes and operations admin routes use separate URL namespaces and authorization rules

### Requirement: Device cloud visual answer API
The backend SHALL expose `POST /api/v1/cloud/visual-answer` as the production entry point for cloud-bound visual-language requests initiated by an authorized client.

#### Scenario: Authorized client submits a cloud visual turn
- **WHEN** an authorized client sends transcript, language, consent flags, optional frame payload, and local vision hints for a cloud-required turn
- **THEN** the backend validates the request, executes the server-side cloud gateway pipeline, and returns a normalized visual answer payload

#### Scenario: Unauthorized client is rejected
- **WHEN** a request to `/api/v1/cloud/visual-answer` lacks valid device credentials
- **THEN** the backend returns an authorization failure without calling the upstream visual-language provider

#### Scenario: Cloud media consent is enforced server-side
- **WHEN** a request includes a frame but `cloudMediaTransmission` consent is false
- **THEN** the backend rejects frame transmission and does not forward image bytes to the upstream provider

### Requirement: Server-side secret management
The backend SHALL store cloud provider credentials only in server environment configuration and MUST NOT require browser-exposed model API keys for production cloud execution.

#### Scenario: Qwen credentials are server-only
- **WHEN** the backend invokes Qwen3-VL through the configured upstream provider
- **THEN** it reads provider credentials from server environment variables rather than from client-supplied headers or query parameters

#### Scenario: Client configuration documents backend URL only
- **WHEN** a developer configures the client for production cloud execution
- **THEN** client environment documentation lists the backend base URL and device credentials but not `VITE_QWEN_API_KEY`

### Requirement: Ephemeral server handling of frame payloads
The backend SHALL treat incoming frame payloads as ephemeral request inputs and MUST NOT persist raw image bytes after the visual-language request completes.

#### Scenario: Frame is not stored after answer
- **WHEN** the backend processes a cloud visual answer request that includes a frame
- **THEN** it uses the frame only for the upstream provider call and does not write the raw image to durable storage

#### Scenario: Telemetry records omit raw media
- **WHEN** the backend records telemetry for a cloud visual answer request
- **THEN** it stores token and cost metadata without storing the submitted frame payload

### Requirement: Backend persistence for governance data
The backend SHALL persist conversation telemetry, daily spend totals, and budget configuration in a durable datastore instead of in-memory maps.

#### Scenario: Conversation telemetry survives process restart
- **WHEN** a cloud visual answer request completes and the backend process restarts
- **THEN** previously recorded conversation telemetry remains available through the operations admin API

#### Scenario: Daily spend survives process restart
- **WHEN** the backend records daily spend for the active budget date and the process restarts
- **THEN** the accumulated daily spend remains available for budget enforcement

### Requirement: Phased migration to server authority
The system SHALL support a shadow-mode migration before making the backend the sole authority for cloud budget enforcement and telemetry writes.

#### Scenario: Shadow mode records server telemetry without blocking client
- **WHEN** shadow mode is enabled during migration
- **THEN** the client may continue local gateway enforcement while the backend also records comparable telemetry for validation

#### Scenario: Authority flip moves enforcement to server
- **WHEN** migration authority flip is enabled
- **THEN** the client relies on backend responses for budget blocking and authoritative telemetry updates
