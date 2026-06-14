## ADDED Requirements

### Requirement: Continuous voice activity detection
The system SHALL run voice activity detection on the microphone stream during an active realtime session without requiring push-to-talk.

#### Scenario: Speech detected automatically
- **WHEN** the user speaks during an active session and VAD detects voice activity
- **THEN** the system begins ASR capture without manual push-to-talk

#### Scenario: Endpoint detected
- **WHEN** the user stops speaking and VAD detects silence beyond the endpoint threshold
- **THEN** the system commits the utterance for dialogue processing

### Requirement: Acoustic echo cancellation
The system SHALL apply acoustic echo cancellation so TTS playback is not transcribed as user speech.

#### Scenario: TTS echo suppressed
- **WHEN** TTS is playing and the user is not speaking
- **THEN** ASR does not produce transcript from TTS audio with error rate below 5%

### Requirement: True full-duplex ASR and TTS
The system SHALL run ASR listening concurrently with TTS playback in session mode.

#### Scenario: ASR active during TTS
- **WHEN** the assistant is speaking via TTS in session mode
- **THEN** ASR capture remains active for barge-in detection

### Requirement: Barge-in interruption
The system SHALL allow the user to interrupt TTS by speaking, cancelling playback and starting a new turn.

#### Scenario: User interrupts assistant
- **WHEN** the user speaks while TTS is active and barge-in confidence exceeds threshold
- **THEN** the system cancels TTS, processes the new utterance, and achieves interrupt success rate above 90%

### Requirement: Streaming cloud TTS
The system SHALL support streaming TTS over the realtime session when cloud TTS is configured.

#### Scenario: First audio within budget
- **WHEN** the assistant response requires speech in session mode
- **THEN** TTS first-audio arrives within 800ms of response generation start

### Requirement: Wake word triggers continuous capture
The system SHALL connect wake-word detection to continuous ASR capture in session mode.

#### Scenario: Wake word starts listening
- **WHEN** wake word is detected in session mode
- **THEN** the system activates continuous ASR without requiring push-to-talk
