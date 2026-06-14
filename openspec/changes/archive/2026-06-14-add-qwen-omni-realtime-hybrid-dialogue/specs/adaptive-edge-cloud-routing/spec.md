# adaptive-edge-cloud-routing

## ADDED Requirements

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
