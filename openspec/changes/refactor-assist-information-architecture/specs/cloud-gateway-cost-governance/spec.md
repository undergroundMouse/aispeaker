## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Operator budget controls placement
The client SHALL expose daily budget cap read and update controls only on the Operator surface.

#### Scenario: Budget cap controls are not on Assist
- **WHEN** a user opens the default Assist surface
- **THEN** daily budget cap configuration buttons are not rendered in the primary assist layout

#### Scenario: Operator can update budget cap from Operator surface
- **WHEN** an authorized operator updates the daily budget cap from the Operator surface
- **THEN** the client sends the update to the backend admin API and reflects the new cap in the Operator view
