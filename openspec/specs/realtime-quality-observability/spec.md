# realtime-quality-observability

Production quality gates and observability for realtime session mode including WER, MOS, latency, and soak tests.

## Requirements

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
The system SHALL meet p95 end-to-end latency below 800ms for hybrid Omni first-audio timing, p95 below 3 seconds for legacy session-mode turns, and p99 below 5 seconds for legacy session-mode turns.

#### Scenario: Hybrid p95 first-audio passes
- **WHEN** the hybrid latency harness evaluates Omni dialogue turns
- **THEN** p95 speech-endpoint to first-assistant-audio latency is below 800ms

#### Scenario: Legacy p95 latency passes
- **WHEN** the legacy latency harness evaluates session-mode turns
- **THEN** p95 end-to-end latency is below 3 seconds

### Requirement: Hybrid Omni fluency latency gate
The system SHALL measure and gate hybrid Omni dialogue latency as speech-endpoint to first assistant audio, targeting p95 below 800ms on the configured hybrid fluency fixture.

#### Scenario: Hybrid first-audio latency passes
- **WHEN** the hybrid fluency fixture is evaluated under normal network conditions
- **THEN** p95 speech-endpoint to first-assistant-audio latency is below 800ms

### Requirement: Hybrid visual accuracy preservation gate
The system SHALL evaluate hybrid Omni dialogue mode against the existing visual accuracy fixtures and SHALL require that common-object, OCR, and temporal visual question metrics remain within configured thresholds when verification tools are enabled.

#### Scenario: Hybrid mode common-object accuracy passes
- **WHEN** the common-object evaluation fixture runs in hybrid Omni mode
- **THEN** measured accuracy remains at or above 85%

#### Scenario: Hybrid mode temporal visual question accuracy passes
- **WHEN** the temporal visual question fixture runs in hybrid Omni mode
- **THEN** measured accuracy remains at or above 80%

### Requirement: Hybrid barge-in and soak gates
The system SHALL apply the existing interrupt success and 30-minute soak gates to hybrid Omni Realtime sessions.

#### Scenario: Hybrid interrupt fixture passes
- **WHEN** barge-in scenarios are evaluated in hybrid Omni mode
- **THEN** interrupt success rate exceeds 90%

#### Scenario: Hybrid soak test passes
- **WHEN** a 30-minute hybrid Omni session soak test runs
- **THEN** no crash or unbounded memory growth is detected

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
