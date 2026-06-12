# voice-conversation-input

## Purpose

Enable microphone-based voice input for natural conversation, including manual press-to-talk and optional wake-triggered listening, with speech recognition handoff and privacy-conscious handling of audio data.

## Requirements

### Requirement: Microphone Capture Lifecycle
The system SHALL allow the user to enable and disable microphone capture for voice conversation input.

#### Scenario: User enables microphone capture
- **WHEN** the user starts voice input and grants microphone permission
- **THEN** the system SHALL acquire an audio MediaStream and publish an active voice input state

#### Scenario: User disables microphone capture
- **WHEN** the user stops voice input
- **THEN** the system SHALL stop all microphone tracks and publish an inactive voice input state

#### Scenario: Microphone permission is denied
- **WHEN** the browser rejects microphone permission
- **THEN** the system SHALL publish a permission-denied voice error state with a retry path

### Requirement: Manual Press-To-Talk Trigger
The system SHALL provide a manual trigger that records user speech only while the user intentionally starts a voice turn.

#### Scenario: User starts press-to-talk
- **WHEN** the user activates the manual voice trigger
- **THEN** the system SHALL enter a recording state and capture speech for the current turn

#### Scenario: User ends press-to-talk
- **WHEN** the user releases or stops the manual voice trigger
- **THEN** the system SHALL stop recording the current turn and submit captured audio for transcription

### Requirement: Voice Wake Trigger
The system SHALL support an optional voice wake trigger that starts a conversation turn after a configured wake phrase or wake signal is detected.

#### Scenario: Wake trigger is enabled
- **WHEN** the user enables wake listening
- **THEN** the system SHALL show that wake listening is active and monitor microphone input for the configured wake signal

#### Scenario: Wake signal is detected
- **WHEN** the configured wake signal is detected
- **THEN** the system SHALL enter recording state for a new conversation turn

#### Scenario: Wake trigger is unavailable
- **WHEN** wake detection is unsupported or fails to initialize
- **THEN** the system SHALL report the wake trigger as unavailable while keeping manual press-to-talk available

### Requirement: Speech Recognition Handoff
The system SHALL convert captured user speech into transcript events for downstream conversation handling.

#### Scenario: Final transcript is produced
- **WHEN** speech recognition completes for a captured voice turn
- **THEN** the system SHALL publish a final transcript containing the recognized user text and turn metadata

#### Scenario: Speech cannot be recognized
- **WHEN** speech recognition returns no usable text or fails
- **THEN** the system SHALL publish a transcription error state and avoid submitting an empty conversation turn

### Requirement: Conversation Turn Creation
The system SHALL create a user conversation turn from each non-empty final voice transcript.

#### Scenario: Voice transcript is submitted
- **WHEN** a final voice transcript contains non-empty user text
- **THEN** the system SHALL emit a user conversation turn event and move the conversation flow from listening toward thinking

#### Scenario: Multiple voice turns occur
- **WHEN** the user completes multiple voice turns in sequence
- **THEN** the system SHALL preserve each turn's ordering using turn metadata

### Requirement: Voice Privacy And Visibility
The system SHALL make microphone activity visible and SHALL NOT persist raw audio by default.

#### Scenario: Microphone is listening or recording
- **WHEN** the microphone is wake-listening, recording, or transcribing
- **THEN** the system SHALL display the current voice input state to the user

#### Scenario: Voice input is processed
- **WHEN** captured speech is transcribed or submitted as a conversation turn
- **THEN** the system SHALL avoid writing raw audio data to localStorage, IndexedDB, or remote endpoints unless a later explicit capability requires it
