## ADDED Requirements

### Requirement: Confidence-based cloud routing
The system SHALL route visual and dialogue requests to cloud providers only when local confidence is insufficient, using `shouldUseCloud` as a routing signal.

#### Scenario: Local high confidence short-circuits cloud
- **WHEN** local vision confidence exceeds configured thresholds and the user asks a visual question
- **THEN** the system answers locally without invoking cloud VLM

#### Scenario: Low confidence invokes cloud
- **WHEN** `shouldUseCloud` is true and network and privacy permit
- **THEN** the system invokes cloud VLM with structured vision context

### Requirement: Network-aware degradation
The system SHALL degrade to local-only processing when network state is weak or offline.

#### Scenario: Weak network blocks cloud VLM
- **WHEN** network state is weak or offline
- **THEN** the system does not invoke cloud VLM and surfaces an appropriate message for complex requests

### Requirement: Budget tier frame policy
The system SHALL reduce frame rate, resolution, and model tier when daily budget pressure is high.

#### Scenario: Budget tier limits frames
- **WHEN** projected daily spend exceeds the configured budget tier threshold
- **THEN** the router selects a reduced frame policy and lower model tier

### Requirement: Cloud call reduction target
The system SHALL achieve at least 70% cloud call reduction against the baseline fixture set through local short-circuiting.

#### Scenario: Baseline fixture meets reduction target
- **WHEN** the edge-cloud routing evaluation runs against the versioned baseline fixture set
- **THEN** measured cloud invocation reduction is at least 70%
