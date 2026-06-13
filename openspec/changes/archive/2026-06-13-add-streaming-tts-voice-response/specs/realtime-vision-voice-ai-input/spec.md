## ADDED Requirements

### Requirement: Natural AI response text-to-speech
The system SHALL synthesize AI dialogue responses through TTS and provide natural, fluent spoken feedback to the user.

#### Scenario: AI answer is spoken to the user
- **WHEN** the system produces an AI dialogue answer for a voice-initiated turn
- **THEN** the system speaks the answer through TTS in the active interaction language

#### Scenario: Gesture acknowledgement is spoken
- **WHEN** the system recognizes a configured gesture or body action that requires an acknowledgement
- **THEN** the system provides the acknowledgement through synthesized speech

#### Scenario: TTS is unavailable
- **WHEN** no supported TTS provider is available in the current runtime
- **THEN** the system keeps the textual AI answer visible and shows that spoken output is unavailable

### Requirement: End-to-end voice response latency
The system SHALL keep the end-to-end latency from user speech to received AI response under 3 seconds, with an implementation target below 2.5 seconds.

#### Scenario: Voice response meets latency budget
- **WHEN** the user finishes speaking a supported dialogue utterance under normal network and device conditions
- **THEN** the system starts delivering the AI response to the user within 3 seconds

#### Scenario: Latency metrics are recorded
- **WHEN** a voice dialogue turn is processed
- **THEN** the system records timing metrics for speech capture, ASR transcript commit, AI response generation, TTS start, first playback, and response completion

#### Scenario: Latency target is reported
- **WHEN** latency metrics are available for a dialogue turn
- **THEN** the system reports whether the turn met the 3 second requirement and the below-2.5-second implementation target

### Requirement: Streaming speech synthesis
The system SHALL use streaming speech synthesis through Web Speech API or a cloud TTS stream to improve response speed.

#### Scenario: TTS begins from first speakable segment
- **WHEN** the AI response is produced as streamed text segments
- **THEN** the system begins TTS playback after the first speakable segment is available without waiting for the full final answer

#### Scenario: Full-answer TTS fallback
- **WHEN** the AI provider only returns a complete final answer instead of streamed segments
- **THEN** the system synthesizes the complete answer through the same TTS lifecycle

#### Scenario: Weak-network TTS fallback
- **WHEN** cloud streaming TTS is configured but the system is offline or in a weak-network state
- **THEN** the system uses an available local TTS provider such as Web Speech API or reports that spoken output is unavailable

#### Scenario: User interrupts speech output
- **WHEN** the user issues a supported stop command or starts a new dialogue turn while TTS playback is active
- **THEN** the system cancels the current TTS playback and updates the speaking state

### Requirement: ASR and TTS quality targets
The system SHALL achieve more than 95% ASR word accuracy in quiet environments and a TTS naturalness MOS greater than 4.0 for the selected spoken-output provider.

#### Scenario: Quiet-environment ASR accuracy is evaluated
- **WHEN** the ASR pipeline is tested against the configured quiet-environment utterance fixture
- **THEN** the measured word accuracy is greater than 95%

#### Scenario: TTS naturalness is accepted
- **WHEN** the selected TTS voice or provider is evaluated for naturalness
- **THEN** the accepted MOS score is greater than 4.0

#### Scenario: Quality result is below target
- **WHEN** ASR accuracy or TTS MOS evaluation falls below the configured target
- **THEN** the system marks the quality gate as failed and reports which metric did not meet the requirement
