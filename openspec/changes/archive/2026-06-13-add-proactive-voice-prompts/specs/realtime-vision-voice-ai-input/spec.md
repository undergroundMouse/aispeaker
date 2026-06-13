## ADDED Requirements

### Requirement: Proactive visual voice prompts
The system SHALL proactively provide short spoken prompts when live video shows noteworthy targets or state changes that are useful, safety-relevant, optimizable, or reminder-worthy.

#### Scenario: Left-behind phone is detected
- **WHEN** the local vision pipeline detects that a phone previously visible in the scene has left the camera view and the proactive prompt gates pass
- **THEN** the system speaks a brief prompt such as "似乎手机不在画面里了，可能需要留意一下"

#### Scenario: Unattended stove flame is detected
- **WHEN** the local vision pipeline detects an active stove flame and no attending person is detected by the configured local rule
- **THEN** the system treats the prompt as an urgent safety prompt and speaks a brief warning

#### Scenario: Risky scissor use is detected
- **WHEN** the local vision pipeline detects scissors near a user's fingers with confidence above the configured threshold
- **THEN** the system speaks a brief caution prompt such as "使用剪刀时可能需要小心手指"

#### Scenario: Useful event appears in energy-saving mode
- **WHEN** watch-only energy-saving mode is active, no dialogue is in progress, and a useful configured event such as a delivery person at the door is detected
- **THEN** the system may proactively speak a short useful prompt such as "快递员似乎在门口"

### Requirement: Proactive prompt local-first triggering
The system SHALL trigger at least 90% of proactive prompts from a local rules engine and edge-side object detection without producing cloud costs.

#### Scenario: Local rule triggers proactive prompt
- **WHEN** a configured proactive prompt rule matches local detector signals with sufficient confidence
- **THEN** the system decides whether to prompt locally without sending the frame or rule evaluation to cloud processing

#### Scenario: Local trigger ratio is measured
- **WHEN** proactive prompt telemetry is summarized for an evaluation session
- **THEN** at least 90% of emitted proactive prompts are attributed to the local rules engine plus edge-side detection path

### Requirement: Continuous local TensorFlow.js detection for proactive prompts
The system SHALL continuously run a local TensorFlow.js-compatible object detection pipeline while camera capture is active and proactive prompts are enabled.

#### Scenario: Object detection feeds rules engine
- **WHEN** camera capture is active and proactive prompts are enabled
- **THEN** the system provides local object detection signals with labels, confidence scores, regions, and timestamps to the proactive rules engine

#### Scenario: State-change rule evaluates object history
- **WHEN** the rules engine evaluates a state-change rule such as "object leaves view"
- **THEN** the system uses recent local detection history to determine whether the rule matched

#### Scenario: Dangerous action rule evaluates posture
- **WHEN** the rules engine evaluates a dangerous action rule such as risky scissor use
- **THEN** the system uses local object and posture/action signals to determine whether the rule matched

### Requirement: Proactive prompt gating and rate limits
The system SHALL apply multiple gates before speaking a proactive prompt, including target confidence greater than 90%, no repeat of the same prompt within 30 seconds, session average no more than one proactive prompt per minute, and a configurable daily prompt cap.

#### Scenario: Low confidence prompt is suppressed
- **WHEN** a proactive rule matches but the target confidence is 90% or lower
- **THEN** the system does not speak the proactive prompt

#### Scenario: Duplicate prompt is suppressed within cooldown
- **WHEN** the same proactive prompt was spoken less than 30 seconds ago
- **THEN** the system does not repeat that prompt

#### Scenario: Session rate limit is enforced
- **WHEN** speaking a non-urgent proactive prompt would make the session average exceed one proactive prompt per minute
- **THEN** the system suppresses or delays the prompt

#### Scenario: Daily prompt cap is reached
- **WHEN** the configured daily proactive prompt cap has already been reached
- **THEN** the system does not speak additional non-urgent proactive prompts that day

### Requirement: Voice control and persistence for proactive prompts
The system SHALL allow users to control proactive prompts through local voice commands and SHALL persist the proactive prompt switch state in `localStorage`.

#### Scenario: User disables proactive prompts by voice
- **WHEN** the user says "闭嘴，别主动说话"
- **THEN** the system recognizes the command locally, disables proactive prompts, and persists the disabled state in `localStorage`

#### Scenario: User increases reminders by voice
- **WHEN** the user says "多提醒我"
- **THEN** the system recognizes the command locally, enables proactive prompts or increases reminder intensity, and persists the updated state in `localStorage`

#### Scenario: Proactive state is restored
- **WHEN** the app starts after a proactive prompt switch state was saved
- **THEN** the system restores that state from `localStorage`

### Requirement: Proactive prompt speech queueing and interruption
The system SHALL queue proactive prompts while the user is speaking and SHALL allow urgent safety prompts to interrupt when configured as urgent.

#### Scenario: Non-urgent prompt waits for user speech
- **WHEN** a non-urgent proactive prompt is accepted while the user is speaking
- **THEN** the system queues the prompt instead of immediately speaking over the user

#### Scenario: Urgent safety prompt interrupts
- **WHEN** an urgent safety proactive prompt such as an unattended flame warning is accepted while the user is speaking or TTS is active
- **THEN** the system may interrupt the active speech path and speak the urgent prompt

### Requirement: Uncertainty wording and correction feedback
The system SHALL include uncertainty wording in proactive prompts and SHALL use user correction feedback to reduce future false triggers for similar prompts.

#### Scenario: Proactive prompt uses uncertain wording
- **WHEN** the system speaks a proactive prompt
- **THEN** the prompt includes uncertainty wording such as "似乎" or "可能需要"

#### Scenario: User marks prompt as wrong
- **WHEN** the user says "错了" after a proactive prompt
- **THEN** the system records local feedback for the recent prompt rule and lowers the likelihood of repeating similar false triggers

### Requirement: Local sensitive information filtering for proactive prompts
The system SHALL locally filter sensitive OCR content before proactive speech and MUST NOT speak continuous digit strings detected by OCR.

#### Scenario: Continuous digits are detected
- **WHEN** local OCR detects continuous digits in the region relevant to a proactive prompt
- **THEN** the system suppresses the sensitive string and does not read the digits aloud

#### Scenario: Sensitive prompt depends on OCR string
- **WHEN** a proactive prompt would require speaking a sensitive OCR string to be useful
- **THEN** the system suppresses that proactive prompt locally
