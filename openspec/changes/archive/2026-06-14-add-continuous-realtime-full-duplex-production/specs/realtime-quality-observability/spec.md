## ADDED Requirements

### Requirement: ASR word error rate gate
The system SHALL maintain ASR word error rate below 5% in quiet environments on the configured evaluation fixture.

#### Scenario: Quiet environment WER passes
- **WHEN** ASR is evaluated against the quiet-environment fixture
- **THEN** measured word error rate is below 5%

### Requirement: TTS naturalness gate
The system SHALL maintain TTS naturalness MOS above 4.0 for the selected spoken-output provider.

#### Scenario: TTS MOS passes
- **WHEN** TTS provider is evaluated for naturalness
- **THEN** measured MOS is above 4.0

### Requirement: Latency percentile gates
The system SHALL meet p95 end-to-end latency below 3 seconds and p99 below 5 seconds in session mode.

#### Scenario: p95 latency passes
- **WHEN** latency harness evaluates session-mode turns
- **THEN** p95 end-to-end latency is below 3 seconds

### Requirement: Interrupt success gate
The system SHALL achieve barge-in interrupt success rate above 90% on the interrupt evaluation fixture.

#### Scenario: Interrupt fixture passes
- **WHEN** barge-in scenarios are evaluated
- **THEN** interrupt success rate exceeds 90%

### Requirement: Soak test stability
The system SHALL complete 30-minute continuous session soak tests without memory leaks or crashes.

#### Scenario: Soak test passes
- **WHEN** a 30-minute session soak test runs
- **THEN** no crash or unbounded memory growth is detected
