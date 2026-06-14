## ADDED Requirements

### Requirement: Committed voice transcripts appear in dialogue history
The client SHALL present every committed push-to-talk or wake-trigger transcript and its mapped reply in the Assist dialogue panel history, including local commands, teaching outcomes, network failures, and multimodal answers.

#### Scenario: Local command turn is visible in dialogue panel
- **WHEN** the user commits a recognized local command through voice input
- **THEN** the dialogue panel shows the user transcript and the command outcome text as a completed turn

#### Scenario: Teaching turn is visible in dialogue panel
- **WHEN** the user commits a custom-object teaching transcript
- **THEN** the dialogue panel shows the teaching transcript and the teaching result message as a completed turn

#### Scenario: Multimodal answer turn remains visible in dialogue panel
- **WHEN** the user commits a dialogue transcript that produces a multimodal visual answer
- **THEN** the dialogue panel shows the user transcript and assistant answer as a completed turn

### Requirement: Cloud visual-language memory candidates
The backend cloud visual-language path SHALL support optional structured memory candidates in the same Qwen3-VL response used for visual answers so the client can persist durable long-term memories without a second model call.

#### Scenario: Cloud response includes memory candidates
- **WHEN** a cloud visual-language turn identifies durable user-specific facts such as preferences, habits, or usual object locations
- **THEN** the normalized visual answer payload may include zero or more memory candidates with type, summary, and optional subject, value, and tags fields

#### Scenario: Unauthorized cloud memory stays local
- **WHEN** memory candidates are returned from a cloud visual-language response
- **THEN** the client persists them only in local encrypted long-term memory and does not upload raw encrypted memory records

#### Scenario: Memory candidates respect cloud memory authorization
- **WHEN** a cloud-bound request is constructed and the user has not authorized cloud access to long-term memory
- **THEN** existing long-term memory context is excluded from the cloud request while newly returned memory candidates may still be persisted locally after the turn completes

## MODIFIED Requirements

### Requirement: Simple local command recognition
The system SHALL recognize a configured set of simple Chinese and English command phrases locally, including custom object memory management commands, and SHALL trigger their mapped actions without cloud processing. Recognized local commands SHALL still be recorded in the Assist dialogue panel as completed voice turns.

#### Scenario: Local command is recognized without cloud processing
- **WHEN** the user says a configured local command phrase
- **THEN** the system recognizes the phrase locally, executes the mapped action without cloud processing, and records the command transcript and outcome in the dialogue panel

#### Scenario: Local custom object forget command is recognized
- **WHEN** the user says a configured custom object management phrase such as "忘记那个物体" or "forget that object"
- **THEN** the system recognizes the phrase locally and routes it to the custom object forget action without sending the command to cloud processing

#### Scenario: Local custom object undo command is recognized
- **WHEN** the user says a configured custom object management phrase such as "撤销最后一次教学" or "undo last teaching"
- **THEN** the system recognizes the phrase locally and routes it to the undo-last-teaching action without sending the command to cloud processing
