## MODIFIED Requirements

### Requirement: Microphone capture and conversation triggering
The system SHALL capture user speech through the microphone, recognize spoken input through the Assist ASR pipeline on push-to-talk, and support both voice wake-up and push-to-talk triggering for natural dialogue.

#### Scenario: Push-to-talk starts dialogue
- **WHEN** the user presses the configured push-to-talk control and speaks
- **THEN** the system captures microphone audio, streams interim transcript text to the Assist dialogue panel, and starts a dialogue turn from the final recognized transcript when push-to-talk ends

#### Scenario: Voice wake-up starts dialogue
- **WHEN** voice wake-up is enabled and the local wake trigger is detected
- **THEN** the system starts listening for the user's dialogue utterance through the microphone

### Requirement: Assist talk controls placement
The Assist surface SHALL place push-to-talk and object-selection controls in the left vision column beneath the camera preview.

#### Scenario: Push-to-talk is reachable without opening Settings
- **WHEN** the Assist surface is active and microphone capture is authorized
- **THEN** the user can start and stop push-to-talk from the left vision column controls without opening Settings or debug panels

#### Scenario: Object selection hint is available during teaching
- **WHEN** no object region is selected on the Assist surface
- **THEN** the UI provides a visible hint that the user may tap the preview or use a select-object control before teaching a custom object

### Requirement: Streaming speech synthesis
The system SHALL stream AI response text into speakable segments and SHALL cancel active speech output when a new dialogue turn starts or when the user interrupts playback through push-to-talk.

#### Scenario: Assistant response streams into TTS
- **WHEN** the dialogue pipeline produces one or more response segments for a turn
- **THEN** the system feeds those segments into the active TTS provider without waiting for the full response to finish when streaming is supported

#### Scenario: Active speech is cancelled on new turn
- **WHEN** the user issues a supported stop command or starts a new dialogue turn while TTS playback is active
- **THEN** the system cancels the current TTS playback and updates the speaking state

#### Scenario: Push-to-talk cancels active TTS before ASR
- **WHEN** the user starts push-to-talk while TTS playback is active
- **THEN** the system cancels TTS, begins ASR capture, and does not play assistant audio until the committed user transcript is processed

### Requirement: Streaming caption presentation on Assist
The client SHALL surface non-final `DialogueResponseSegment` events and user ASR transcript updates to the Assist dialogue panel so both user and assistant text can update while the active dialogue turn is still in progress.

#### Scenario: User transcript updates during ASR
- **WHEN** the ASR provider emits interim transcript text during an active push-to-talk session
- **THEN** the Assist dialogue panel updates the user transcript area before the final ASR result arrives

#### Scenario: Caption updates on partial assistant segment
- **WHEN** the dialogue pipeline emits a non-final response segment for the active turn
- **THEN** the Assist dialogue panel updates the assistant line for that turn before the final segment arrives

#### Scenario: Caption finalizes on last segment
- **WHEN** the dialogue pipeline emits the final response segment for a turn
- **THEN** the Assist dialogue panel marks that turn assistant text as final and retains it in session history

### Requirement: ASR and TTS quality targets
The system SHALL achieve more than 95% ASR word accuracy in quiet environments through the Assist-visible ASR pipeline and a TTS naturalness MOS greater than 4.0 for the selected spoken-output provider.

#### Scenario: Quiet-environment ASR accuracy is evaluated
- **WHEN** the ASR pipeline is tested against the configured quiet-environment utterance fixture
- **THEN** the measured word accuracy is greater than 95%

#### Scenario: TTS naturalness is accepted
- **WHEN** the selected TTS voice or provider is evaluated for naturalness
- **THEN** the accepted MOS score is greater than 4.0

#### Scenario: Quality result is below target
- **WHEN** ASR accuracy or TTS MOS evaluation falls below the configured target
- **THEN** the system marks the quality gate as failed and reports which metric did not meet the requirement
