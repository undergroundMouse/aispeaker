## ADDED Requirements

### Requirement: ASR provider abstraction
The client SHALL recognize user speech through an `AsrProvider` abstraction that can emit streaming recognition events for an active capture session.

#### Scenario: Web Speech provider is selected by default
- **WHEN** the browser exposes Speech Recognition APIs and microphone capture is authorized
- **THEN** the client selects a Web Speech ASR provider for push-to-talk capture

#### Scenario: ASR provider is unavailable
- **WHEN** no supported ASR provider is available for the active browser and language
- **THEN** the client surfaces an unavailable speech-recognition state in the Assist dialogue panel and does not submit a dialogue turn without a committed transcript

### Requirement: Streaming push-to-talk capture
The client SHALL start ASR capture when the user begins push-to-talk and SHALL stream interim transcript updates to the Assist dialogue panel until the user releases push-to-talk.

#### Scenario: Interim transcript updates while holding talk
- **WHEN** the user holds push-to-talk and the ASR provider emits interim recognition results
- **THEN** the Assist dialogue panel updates the user transcript area with the interim text before final recognition completes

#### Scenario: Final transcript commits on release
- **WHEN** the user releases push-to-talk and the ASR provider emits a final recognition result
- **THEN** the client commits that final transcript to the dialogue pipeline and records `transcriptCommittedAt`

#### Scenario: Short utterance fallback uses last interim
- **WHEN** the user releases push-to-talk before a final ASR result arrives within the configured finalize window
- **THEN** the client may commit the latest interim transcript if it is non-empty and meets the configured confidence threshold

### Requirement: Half-duplex speech IO
The system SHALL operate ASR and TTS in half-duplex mode and SHALL NOT run ASR listening concurrently with active TTS playback unless the user explicitly starts push-to-talk.

#### Scenario: Push-to-talk interrupts TTS
- **WHEN** the user starts push-to-talk while TTS is speaking
- **THEN** the system cancels the active TTS playback, starts ASR capture, and shows interim transcript text in the Assist dialogue panel

#### Scenario: TTS does not start during active ASR
- **WHEN** the user is holding push-to-talk and ASR capture is active
- **THEN** the system does not start TTS for a new assistant response until ASR commits the final transcript for that turn

#### Scenario: No ambient ASR during playback
- **WHEN** TTS is speaking and the user is not holding push-to-talk
- **THEN** the system does not run ASR listening

### Requirement: Assist-visible user transcript presentation
The Assist surface SHALL present user speech recognition output in the right-side dialogue panel rather than only through development debug tools.

#### Scenario: User transcript is visible during capture
- **WHEN** push-to-talk capture is active on the default Assist surface
- **THEN** the user can read the current interim or final transcript in the dialogue panel without opening the debug surface

#### Scenario: Debug simulator does not replace Assist ASR
- **WHEN** the default Assist surface is active in production mode
- **THEN** dialogue turns are committed from push-to-talk ASR results rather than from the debug transcript simulator

### Requirement: Quiet-environment ASR quality gate
The client ASR pipeline SHALL support evaluation against the configured quiet-environment utterance fixture and SHALL meet the greater-than-95% word accuracy acceptance target for that fixture.

#### Scenario: Quiet-environment fixture passes
- **WHEN** the ASR pipeline is evaluated against the quiet-environment utterance fixture
- **THEN** the measured word accuracy is greater than 95%

#### Scenario: Quiet-environment fixture fails
- **WHEN** the ASR pipeline evaluation falls below the configured accuracy target
- **THEN** the quality gate is marked failed and reports which utterances did not meet the target
