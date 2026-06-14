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

### Requirement: Realtime session WebSocket gateway
The backend SHALL expose a WebSocket gateway at `/api/v1/realtime/session` for continuous realtime dialogue sessions.

#### Scenario: Session WebSocket authenticated
- **WHEN** a client connects to `/api/v1/realtime/session` with a valid device token
- **THEN** the backend accepts the WebSocket upgrade and initializes session state

#### Scenario: Session admin visibility
- **WHEN** an authorized operator requests session health from the operations admin API
- **THEN** the backend returns active session count and circuit breaker state

### Requirement: Omni Realtime proxy gateway
The backend control plane SHALL expose an authenticated WebSocket upgrade route at `/api/v1/realtime/omni` that proxies Qwen-Omni Realtime sessions for authorized clients.

#### Scenario: Device route is separated from admin routes
- **WHEN** the backend receives a request to `/api/v1/realtime/omni`
- **THEN** it applies device credential authorization and does not expose operations admin credentials on the same route namespace

#### Scenario: Omni upstream credentials are server-only
- **WHEN** the Omni proxy opens an upstream DashScope connection
- **THEN** it reads Omni credentials and model configuration from server environment variables only

### Requirement: Omni session configuration surface
The backend SHALL support server environment configuration for Omni Realtime model id, base WebSocket URL, default voice, and turn-detection mode used by the proxy gateway.

#### Scenario: Default Omni model is configurable
- **WHEN** `QWEN_OMNI_REALTIME_MODEL` is not set
- **THEN** the backend defaults to `qwen3.5-omni-plus-realtime`

#### Scenario: Invalid Omni configuration fails safely
- **WHEN** required Omni credentials are missing and a client requests an Omni session
- **THEN** the backend returns a recoverable session error and does not attempt an upstream connection

### Requirement: Omni session observability for operators
The backend SHALL expose session health and failure metrics for Omni Realtime proxy connections to the operations admin API.

#### Scenario: Operator can inspect Omni circuit state
- **WHEN** an authorized operator requests backend health or session metrics
- **THEN** the response includes Omni proxy circuit breaker state and recent failure counts
