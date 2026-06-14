# cloud-gateway-cost-governance

## ADDED Requirements

### Requirement: Omni Realtime session usage accounting
The authoritative cloud gateway SHALL record Omni Realtime session usage separately from HTTP visual-language requests, including session duration, estimated audio input duration, estimated audio output duration, and token usage when reported by the provider.

#### Scenario: Omni session telemetry is stored per conversation
- **WHEN** a hybrid Omni Realtime session processes one or more dialogue turns for a conversation
- **THEN** the gateway stores conversation-level Omni usage metadata alongside existing HTTP VLM telemetry

#### Scenario: Budget enforcement applies to Omni sessions
- **WHEN** projected daily spend including Omni session usage exceeds the configured daily budget cap
- **THEN** the gateway blocks new Omni session creation or schedules degraded routing according to budget policy before opening additional upstream sessions

### Requirement: Separate cost visibility for Omni and VLM
The operations admin backend SHALL expose separate aggregated cost and usage fields for Omni Realtime sessions and HTTP visual-language verification calls.

#### Scenario: Operator dashboard shows Omni usage
- **WHEN** an authorized operator views conversation cost details
- **THEN** the Operator surface distinguishes Omni session usage from visual verification HTTP usage
