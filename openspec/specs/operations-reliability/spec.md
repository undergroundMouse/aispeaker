# operations-reliability

Operations reliability for realtime sessions including metrics, circuit breakers, feature flags, and operator monitoring.

## Requirements

### Requirement: Provider success and latency metrics
The system SHALL expose metrics for ASR, VLM, and TTS success rates and latency histograms.

#### Scenario: Metrics recorded per provider call
- **WHEN** a cloud provider call completes in session mode
- **THEN** success/failure and latency are recorded in observability metrics

### Requirement: Circuit breaker degradation
The system SHALL trip a circuit breaker after consecutive provider failures and degrade to local fallback.

#### Scenario: Circuit opens on failures
- **WHEN** a provider fails consecutively beyond the configured threshold
- **THEN** the circuit breaker opens and subsequent requests use local fallback until recovery

### Requirement: Feature flags for rollout
The system SHALL support feature flags for realtime session mode, full duplex, and Level 3 vision.

#### Scenario: Flags control session mode
- **WHEN** `VITE_REALTIME_SESSION_MODE` is disabled
- **THEN** the client uses legacy turn-based dialogue as the primary path

### Requirement: Operator session monitoring
The system SHALL expose realtime session health and circuit breaker state on the Operator surface.

#### Scenario: Operator views session health
- **WHEN** an authorized operator opens the Operator dashboard
- **THEN** active session count, circuit breaker state, and quality metrics are visible
