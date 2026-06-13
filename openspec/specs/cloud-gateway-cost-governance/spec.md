# cloud-gateway-cost-governance

Authoritative server-side cloud gateway token estimation, retry policy, telemetry, budget enforcement, and operations admin visibility.

## Requirements

### Requirement: Pre-request token estimation at gateway
The system SHALL estimate token usage for each cloud request before sending it and SHALL accumulate estimated tokens at the authoritative gateway layer for the request lifecycle.

#### Scenario: Text request is estimated before send
- **WHEN** a cloud request containing text prompt content reaches the gateway
- **THEN** the gateway computes an estimated input token count for the text payload before forwarding the request

#### Scenario: Image request uses 1024px edge rule
- **WHEN** a cloud request includes an image and the gateway estimates image tokens
- **THEN** the gateway counts the image as 85 tokens per 1024 pixel edge according to the normalized image dimensions sent upstream

#### Scenario: Estimated tokens are accumulated
- **WHEN** one or more cloud requests are processed for a conversation turn
- **THEN** the gateway accumulates the estimated token totals for those requests in the conversation telemetry record

### Requirement: Cloud request retry with failure messaging
The system SHALL retry retryable cloud request failures up to 2 times and SHALL show "网络不佳，请重试" when all attempts fail due to transport or retryable provider errors.

#### Scenario: Retryable failure is retried
- **WHEN** a cloud request fails with a retryable transport or server error and fewer than 2 retries have been attempted
- **THEN** the gateway retries the request up to the maximum of 2 retries

#### Scenario: Retries are exhausted
- **WHEN** a cloud request still fails after 2 retries
- **THEN** the system returns a failure result to the client and shows "网络不佳，请重试"

#### Scenario: Non-retryable failure does not loop
- **WHEN** a cloud request fails with a non-retryable client or authorization error
- **THEN** the gateway does not retry the request and returns the failure without exceeding the retry limit

### Requirement: Per-conversation token and cost telemetry
The system SHALL record per-conversation estimated token usage, actual token usage when available, and cost estimates in the authoritative backend datastore for operations review.

#### Scenario: Conversation telemetry is stored
- **WHEN** a dialogue turn finishes cloud processing through the backend control plane
- **THEN** the system stores conversation-level token and cost estimate records accessible to the operations backend

#### Scenario: Actual usage refines estimates
- **WHEN** the cloud provider returns actual token usage for a completed request
- **THEN** the gateway updates the conversation telemetry with actual usage alongside the pre-request estimate

### Requirement: Operations admin cost visibility
The operations admin backend SHALL expose HTTP APIs that allow authorized operators to view token consumption and cost estimates for each conversation. The client SHALL present that cost visibility on the dedicated Operator surface and SHALL NOT require operators to use the default Assist debug layout to review conversation spend.

#### Scenario: Operator views conversation cost
- **WHEN** an authorized operator requests a conversation record from the operations admin API on the Operator surface
- **THEN** the backend returns estimated tokens, actual tokens when available, and the cost estimate for that conversation

#### Scenario: Unauthorized operator is blocked
- **WHEN** a user without operations admin authorization requests conversation cost telemetry
- **THEN** the backend denies access to token and cost records

#### Scenario: Daily spend summary is visible on Operator surface
- **WHEN** an authorized operator opens the Operator surface with backend integration enabled
- **THEN** the UI shows the current daily spend summary alongside conversation telemetry

### Requirement: Operator budget controls placement
The client SHALL expose daily budget cap read and update controls only on the Operator surface.

#### Scenario: Budget cap controls are not on Assist
- **WHEN** a user opens the default Assist surface
- **THEN** daily budget cap configuration buttons are not rendered in the primary assist layout

#### Scenario: Operator can update budget cap from Operator surface
- **WHEN** an authorized operator updates the daily budget cap from the Operator surface
- **THEN** the client sends the update to the backend admin API and reflects the new cap in the Operator view

### Requirement: Daily cloud budget cap
The system SHALL support configuring a daily budget cap through the operations admin backend and SHALL block new cloud requests on the authoritative gateway when the configured cap would be exceeded.

#### Scenario: Budget cap is configured
- **WHEN** an authorized operator sets a daily budget cap through the operations admin API
- **THEN** the backend gateway enforces that cap for subsequent cloud requests on that day

#### Scenario: Request exceeds remaining budget
- **WHEN** a new cloud request would exceed the remaining daily budget
- **THEN** the gateway blocks the request and returns a budget-exceeded result without sending it to the cloud provider

#### Scenario: Budget resets daily
- **WHEN** a new calendar budget day begins
- **THEN** the gateway resets the accumulated daily spend counter according to the configured budget window

### Requirement: Distinct budget failure messaging
The system SHALL return a user-visible budget-specific failure message when a cloud request is blocked by daily budget enforcement.

#### Scenario: Budget block does not masquerade as network failure
- **WHEN** a cloud request is rejected because the daily budget cap would be exceeded
- **THEN** the client receives a budget-exceeded reason and a message distinct from "网络不佳，请重试"
