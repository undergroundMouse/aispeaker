## MODIFIED Requirements

### Requirement: Assist default surface
The client SHALL present an Assist surface as the default application view using a split layout with a reduced camera stage on the left and a dedicated dialogue panel on the right for desktop viewports.

#### Scenario: User opens the application
- **WHEN** a user navigates to the default application route on a desktop viewport
- **THEN** the UI shows a left vision column with the live camera preview and talk controls and a right dialogue column for speech-to-text and assistant responses without requiring the user to scroll past engineering debug panels

#### Scenario: Assist prioritizes dialogue readability
- **WHEN** the Assist surface is rendered on a desktop viewport
- **THEN** the camera preview occupies the left column at a reduced size relative to the full viewport and the right dialogue column remains persistently visible

#### Scenario: Assist omits marketing hero chrome
- **WHEN** the Assist surface is active after initial load
- **THEN** the UI does not render a persistent hero header with product title and subtitle above the assist layout

#### Scenario: Narrow viewport stacks columns
- **WHEN** the Assist surface is rendered on a narrow viewport
- **THEN** the vision column and dialogue column stack vertically with the camera stage above the dialogue panel

### Requirement: Conversation strip presentation
The Assist surface SHALL present user-visible dialogue through a dedicated right-side dialogue panel that supports user speech-to-text, assistant streaming replies, scrollable turn history, and role-distinct styling while keeping proactive prompts outside the assistant reply stream.

#### Scenario: User transcript appears in dialogue panel
- **WHEN** push-to-talk capture produces interim or final user transcript text
- **THEN** the dialogue panel displays that user transcript in a dedicated user area distinct from assistant replies

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

### Requirement: Settings drawer surface
The client SHALL expose settings only through a single settings button on the Assist chrome that opens the existing settings drawer or equivalent secondary surface.

#### Scenario: Settings opens from a single button
- **WHEN** a user taps the settings button on the Assist surface
- **THEN** the settings drawer opens and reveals privacy, dialogue, and memory controls

#### Scenario: Dialogue panel does not host settings forms
- **WHEN** the default Assist surface is active
- **THEN** privacy, memory, and dialogue preference forms are not rendered inline inside the right dialogue panel

#### Scenario: Privacy controls are grouped in Settings
- **WHEN** a user opens Settings
- **THEN** camera capture, microphone capture, and cloud media transmission consent toggles are grouped under a privacy section

#### Scenario: Memory controls are grouped in Settings
- **WHEN** a user opens Settings
- **THEN** learned custom objects, long-term memory lists, export actions, and cloud memory consent toggles are grouped under a memory section

#### Scenario: Dialogue preferences are grouped in Settings
- **WHEN** a user opens Settings
- **THEN** watch-only mode and proactive prompt enablement are available under a dialogue preferences section

### Requirement: Development debug surface
The client SHALL expose engineering runtime debug information only through a development debug surface that is hidden from production builds by default and is not rendered inside the default Assist dialogue panel.

#### Scenario: Debug panel is available in development
- **WHEN** the client runs in a development build or debug mode is explicitly enabled
- **THEN** engineering fields such as runtime state, frame metadata, latency metrics, and transcript simulation are available in a debug surface separate from the Assist dialogue panel

#### Scenario: Debug panel is hidden in production
- **WHEN** the client runs in a production build without debug mode enabled
- **THEN** engineering debug cards and transcript simulation controls are not rendered in the default UI

### Requirement: Assist surface internationalization
User-facing labels on the Assist and Settings surfaces SHALL use the application i18n message catalog for Chinese and English.

#### Scenario: Assist chrome respects active language
- **WHEN** the active application language is Chinese
- **THEN** Assist surface labels for settings entry, talk controls, dialogue panel placeholders, proactive banner actions, and ambient status indicators render in Chinese

#### Scenario: Settings section labels respect active language
- **WHEN** the active application language is English
- **THEN** Settings privacy, dialogue, and memory section headings render in English

### Requirement: Proactive banner presentation
The Assist surface SHALL render proactive prompts in a dedicated proactive banner within the dialogue column that is visually and structurally separate from the assistant reply stream.

#### Scenario: Proactive banner appears for active prompt
- **WHEN** the system queues or speaks a proactive prompt on the Assist surface
- **THEN** the proactive banner displays the prompt text with proactive styling at the top of the dialogue column

#### Scenario: Proactive banner dismisses on user talk
- **WHEN** the user starts push-to-talk while a proactive banner is visible
- **THEN** the proactive banner hides before the new user transcript is shown in the dialogue panel

## ADDED Requirements

### Requirement: Split dialogue panel layout
The Assist surface SHALL use a two-column split layout on desktop viewports with the vision column on the left and the dialogue panel on the right.

#### Scenario: Desktop split columns are visible together
- **WHEN** the Assist surface is rendered on a desktop viewport
- **THEN** the user can see the camera stage and the dialogue panel side by side without opening additional surfaces

### Requirement: Vision column controls
The Assist surface SHALL place push-to-talk and object-selection controls in the left vision column beneath the camera preview.

#### Scenario: Talk controls stay with the camera
- **WHEN** the Assist surface is active and microphone capture is authorized
- **THEN** the user can start and stop push-to-talk from controls located in the left vision column

## REMOVED Requirements

### Requirement: Talk FAB placement
**Reason**: Push-to-talk moves from a centered floating action button to vision-column controls in the split layout.
**Migration**: Replace `TalkFab` usage in `AssistShell` with left-column talk controls and update Assist layout tests accordingly.
