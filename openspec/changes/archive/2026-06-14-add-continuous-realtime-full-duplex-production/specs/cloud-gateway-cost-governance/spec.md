## ADDED Requirements

### Requirement: Session-level token accumulation
The cloud gateway SHALL accumulate estimated and actual tokens across all provider calls within a realtime session, not only per HTTP turn.

#### Scenario: Session tokens aggregated
- **WHEN** multiple cloud provider calls occur within one realtime session
- **THEN** the gateway aggregates token usage in session-scoped telemetry

### Requirement: Tier rate limiting under budget pressure
The cloud gateway SHALL enforce tier-based rate limits on cloud invocations when daily budget pressure exceeds configured thresholds.

#### Scenario: Tier limit blocks excess calls
- **WHEN** session-tier rate limit is exceeded due to budget pressure
- **THEN** the gateway blocks new cloud requests and returns a budget-tier result without provider invocation
