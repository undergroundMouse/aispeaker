# realtime-asr-input

Assist-visible automatic speech recognition for push-to-talk capture with half-duplex TTS coordination.

## Requirements

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
The system SHALL operate ASR and TTS in half-duplex mode when using push-to-talk fallback. In realtime session mode with full duplex enabled, the system SHALL run ASR and TTS concurrently with barge-in support.

#### Scenario: Push-to-talk interrupts TTS
- **WHEN** the user starts push-to-talk while TTS is speaking in fallback mode
- **THEN** the system cancels the active TTS playback, starts ASR capture, and shows interim transcript text in the Assist dialogue panel

#### Scenario: TTS does not start during active ASR in fallback mode
- **WHEN** the user is holding push-to-talk and ASR capture is active in fallback mode
- **THEN** the system does not start TTS for a new assistant response until ASR commits the final transcript for that turn

#### Scenario: Full duplex in session mode
- **WHEN** realtime session mode with full duplex is enabled and TTS is speaking
- **THEN** ASR remains active and barge-in can interrupt TTS without requiring push-to-talk

#### Scenario: No ambient ASR during playback in fallback mode
- **WHEN** TTS is speaking in push-to-talk fallback mode and the user is not holding push-to-talk
- **THEN** the system does not run ASR listening

### Requirement: Continuous session ASR
The client SHALL stream microphone audio over the realtime WebSocket session for continuous ASR when session mode is active.

#### Scenario: Audio chunks streamed in session mode
- **WHEN** realtime session mode is active and microphone capture is authorized
- **THEN** the client streams `audio.chunk` messages with sequence numbers to the session gateway

#### Scenario: Interim results in session mode
- **WHEN** the session gateway emits `asr.interim` events
- **THEN** the Assist dialogue panel updates the user transcript area with interim text

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

### Requirement: Hybrid Omni ASR delegation
When hybrid Omni dialogue mode is enabled, the system SHALL delegate speech recognition for the primary dialogue path to Qwen-Omni Realtime and SHALL expose interim and final user transcripts to the Assist dialogue panel.

#### Scenario: Interim transcript from Omni session
- **WHEN** hybrid Omni dialogue mode is active and the user is speaking
- **THEN** the Assist dialogue panel updates the user transcript area with interim text derived from Omni input transcription events when available

#### Scenario: Final transcript committed on Omni turn completion
- **WHEN** Omni Realtime completes a user turn in hybrid mode
- **THEN** the client commits the final user transcript to the dialogue panel and conversation memory

### Requirement: Legacy ASR fallback preservation
The system SHALL retain Web Speech, Paraformer, and push-to-talk ASR providers as fallback paths when hybrid Omni dialogue mode is disabled or unavailable.

#### Scenario: PTT fallback when Omni unavailable
- **WHEN** hybrid Omni dialogue mode is enabled but the Omni session cannot be established
- **THEN** the client falls back to push-to-talk or legacy session ASR without losing Assist speech input entirely
