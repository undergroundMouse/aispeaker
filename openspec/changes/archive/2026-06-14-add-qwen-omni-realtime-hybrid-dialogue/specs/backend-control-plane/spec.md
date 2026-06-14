# backend-control-plane

## ADDED Requirements

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
