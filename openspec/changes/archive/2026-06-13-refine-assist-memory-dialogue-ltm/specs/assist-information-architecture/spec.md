## MODIFIED Requirements

### Requirement: Settings drawer surface
The client SHALL expose settings only through a single settings button on the Assist chrome that opens the settings drawer for privacy authorization and dialogue preferences. Memory authorization toggles SHALL remain in Settings; learned-object and long-term-memory data lists SHALL NOT be rendered in the settings drawer.

#### Scenario: Settings opens from a single button
- **WHEN** a user taps the settings button on the Assist surface
- **THEN** the settings drawer opens and reveals privacy, dialogue, and memory authorization controls without learned-object or long-term-memory lists

#### Scenario: Dialogue panel does not host settings forms
- **WHEN** the default Assist surface is active
- **THEN** privacy, memory authorization, and dialogue preference forms are not rendered inline inside the right dialogue panel

#### Scenario: Privacy controls are grouped in Settings
- **WHEN** a user opens Settings
- **THEN** camera capture, microphone capture, and cloud media transmission consent toggles are grouped under a privacy section

#### Scenario: Memory authorization is grouped in Settings
- **WHEN** a user opens Settings
- **THEN** cloud long-term memory access and optional cloud summary sync consent toggles are grouped under a memory authorization section

#### Scenario: Dialogue preferences are grouped in Settings
- **WHEN** a user opens Settings
- **THEN** watch-only mode and proactive prompt enablement are available under a dialogue preferences section

### Requirement: Conversation strip presentation
The Assist surface SHALL present user-visible dialogue through a dedicated right-side dialogue panel that supports user speech-to-text, assistant streaming replies, scrollable turn history, and role-distinct styling while keeping proactive prompts outside the assistant reply stream. Every committed voice transcript, including local commands and teaching outcomes, SHALL appear in the dialogue history for that session.

#### Scenario: User transcript appears in dialogue panel
- **WHEN** push-to-talk capture produces interim or final user transcript text
- **THEN** the dialogue panel displays that user transcript in a dedicated user area distinct from assistant replies

#### Scenario: Local command appears in dialogue panel
- **WHEN** the user commits a recognized local voice command such as a language switch or custom-object forget command
- **THEN** the dialogue panel records the user transcript and the mapped system or assistant reply for that command in the session history

#### Scenario: Teaching outcome appears in dialogue panel
- **WHEN** a custom-object teaching attempt completes with a success or failure message
- **THEN** the dialogue panel records the user teaching transcript and the resulting assistant or system reply in the session history

#### Scenario: Assistant answer appears in dialogue panel
- **WHEN** a dialogue turn completes with a speakable visual answer
- **THEN** the dialogue panel displays the answer text with an assistant role distinct from system warnings

#### Scenario: Assistant text streams before final completion
- **WHEN** the dialogue pipeline emits non-final response segments for the active turn
- **THEN** the dialogue panel updates the assistant line for that turn without waiting for the final segment

#### Scenario: Recent turn history is scrollable
- **WHEN** more than one completed dialogue turn exists in the current session
- **THEN** the dialogue panel allows the user to scroll to earlier turns within the retained session history

#### Scenario: System failures use distinct presentation
- **WHEN** a dialogue turn fails due to weak network or daily budget exhaustion
- **THEN** the UI presents the failure with visually distinct system styling in or adjacent to the dialogue panel

#### Scenario: Proactive prompt does not occupy assistant reply stream
- **WHEN** the system speaks or queues a proactive prompt while the Assist surface is active
- **THEN** the proactive prompt text is shown in a dedicated proactive banner and is not rendered as an assistant dialogue entry

## ADDED Requirements

### Requirement: Memory surface separation
The client SHALL expose learned custom objects and long-term memory data management on a dedicated Memory surface at `/memory` that is separate from the Settings drawer and the default Assist view.

#### Scenario: Memory route is isolated
- **WHEN** a user opens the Memory surface
- **THEN** the UI shows learned-object and long-term-memory lists with export, delete, and forget-all controls without rendering the Assist camera stage or engineering debug panels

#### Scenario: Memory lists are not shown in Settings
- **WHEN** a user opens Settings
- **THEN** learned-object and long-term-memory list controls are not rendered in the settings drawer

#### Scenario: Memory entry is available from Assist chrome
- **WHEN** the default Assist surface is active
- **THEN** the user can navigate to the Memory surface from a dedicated memory entry control in the Assist chrome

#### Scenario: Memory health badge uses memory entry
- **WHEN** long-term memory is unavailable or stale memories require review
- **THEN** the Assist chrome shows the warning badge on the memory entry control rather than on the settings button

#### Scenario: Memory surface returns to Assist
- **WHEN** a user activates back navigation on the Memory surface
- **THEN** the client returns to the default Assist route

## REMOVED Requirements

### Requirement: Development debug surface
**Reason**: Engineering debug tooling must not appear in the product UI for judges or end users.
**Migration**: Use automated tests, Operator telemetry, and browser developer tools for engineering diagnostics. No user-facing replacement local-processing page is provided.
