# adaptive-edge-cloud-routing

Adaptive edge-cloud routing using local confidence, network state, budget pressure, and privacy consent.

## Requirements

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

### Requirement: Hybrid Omni routing tiers
The adaptive edge-cloud router SHALL support hybrid routing tiers that choose among Omni-direct response, local-hints injection, and async cloud visual verification based on utterance type, local confidence, network state, budget pressure, and privacy consent.

#### Scenario: Omni-direct tier for non-visual dialogue
- **WHEN** the routed utterance is not a visual question and hybrid Omni mode is active
- **THEN** the router selects the `omni-direct` tier and does not schedule cloud VLM verification

#### Scenario: Local-hints tier for high-confidence visual questions
- **WHEN** the utterance is a visual question, local confidence exceeds thresholds, and cloud media is authorized or unnecessary
- **THEN** the router selects the `local-hints` tier and injects local vision summaries without synchronous cloud VLM

#### Scenario: VL-verify tier for low-confidence visual questions
- **WHEN** the utterance is a visual question and local confidence is insufficient
- **THEN** the router selects the `vl-verify` tier and schedules async cloud visual verification while allowing Omni to begin spoken response when configured

#### Scenario: Local-only tier under privacy or offline constraints
- **WHEN** network state is offline or cloud media transmission is not authorized for a cloud-required visual question
- **THEN** the router selects the `local-only` tier and blocks cloud VLM verification

### Requirement: Hybrid frame policy for Omni vision input
The router SHALL map hybrid routing tiers and budget pressure to Omni key-frame upload rate separately from legacy session frame policies.

#### Scenario: Active dialogue increases Omni key-frame rate
- **WHEN** a hybrid Omni dialogue turn is active
- **THEN** the router increases key-frame upload rate toward the configured active tier without exceeding budget-derived caps

#### Scenario: Budget pressure reduces Omni key-frame rate
- **WHEN** daily budget pressure exceeds the configured threshold in hybrid mode
- **THEN** the router reduces Omni key-frame upload rate to the minimal tier while preserving local vision world model updates
