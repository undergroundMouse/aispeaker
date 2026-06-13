# assist-information-architecture

Client information architecture for assist, settings, memory, and operator presentation.

## Requirements

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

### Requirement: Status bar indicators
The Assist surface SHALL expose ambient connectivity feedback on the default user path and SHALL NOT render a multi-pill engineering status row with cloud-path, proactive, and speech telemetry labels for regular users.

#### Scenario: Network status is visible
- **WHEN** the Assist surface is active
- **THEN** the user can see whether the application considers the network online, offline, or weak through an ambient indicator without opening a debug panel

#### Scenario: Cloud path is hidden on default Assist
- **WHEN** a regular user opens the default Assist surface
- **THEN** the UI does not display the active cloud visual-language path label in the Assist chrome

#### Scenario: Cloud path is visible on Operator surface
- **WHEN** an operator opens the Operator surface
- **THEN** the UI displays whether the active cloud visual-language path is `backend+Qwen3-VL-8B-Thinking`, direct Qwen, or `mock`

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

### Requirement: Operator surface separation
The client SHALL expose operations admin telemetry and budget controls on a dedicated Operator surface separate from the default Assist view.

#### Scenario: Operator route is isolated
- **WHEN** an authorized operator opens the Operator surface
- **THEN** the UI shows daily spend, conversation telemetry, and budget configuration controls without rendering the full engineering debug event grid

#### Scenario: Assist hides operator controls by default
- **WHEN** a regular user opens the default Assist surface
- **THEN** budget configuration buttons, per-conversation token telemetry lists, and an Operator navigation button are not shown in the primary assist layout

#### Scenario: Operator entry is hidden when admin integration is unavailable
- **WHEN** backend admin integration is not configured in the client environment
- **THEN** the Operator surface entry point is hidden from the Assist chrome

### Requirement: Assist surface internationalization
User-facing labels on the Assist and Settings surfaces SHALL use the application i18n message catalog for Chinese and English.

#### Scenario: Assist chrome respects active language
- **WHEN** the active application language is Chinese
- **THEN** Assist surface labels for settings entry, talk controls, dialogue panel placeholders, proactive banner actions, and ambient status indicators render in Chinese

#### Scenario: Settings section labels respect active language
- **WHEN** the active application language is English
- **THEN** Settings privacy, dialogue, and memory authorization section headings render in English

### Requirement: Proactive banner presentation
The Assist surface SHALL render proactive prompts in a dedicated proactive banner within the dialogue column that is visually and structurally separate from the assistant reply stream.

#### Scenario: Proactive banner appears for active prompt
- **WHEN** the system queues or speaks a proactive prompt on the Assist surface
- **THEN** the proactive banner displays the prompt text with proactive styling at the top of the dialogue column

#### Scenario: Proactive banner dismisses on user talk
- **WHEN** the user starts push-to-talk while a proactive banner is visible
- **THEN** the proactive banner hides before the new user transcript is shown in the dialogue panel

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

### Requirement: Camera interaction feedback
The Assist surface SHALL provide visible motion or toast feedback for object selection, teaching, and visual evidence highlighting on the camera preview.

#### Scenario: Object selection animates on tap
- **WHEN** the user taps the live preview to select an object region
- **THEN** the selection box appears with a brief expand or pulse animation rather than appearing instantaneously

#### Scenario: Teaching success is acknowledged
- **WHEN** a custom object teaching action completes successfully
- **THEN** the UI shows brief success feedback on or adjacent to the camera preview

#### Scenario: Teaching failure is acknowledged
- **WHEN** a custom object teaching action fails
- **THEN** the UI shows brief failure feedback without requiring the user to read an engineering debug card

#### Scenario: Evidence highlights fade in
- **WHEN** visual evidence regions become available for an image-related answer
- **THEN** the highlight boxes fade in on the Canvas overlay rather than appearing instantaneously

### Requirement: System toast presentation
The Assist surface SHALL present transient network and budget failure signals through dismissible system toasts when those failures do not need to occupy the primary caption area.

#### Scenario: Weak-network toast appears
- **WHEN** a cloud-required visual question is blocked due to weak network
- **THEN** the UI shows a transient system toast with the weak-network message

#### Scenario: Budget toast appears
- **WHEN** a cloud-required visual question is blocked due to daily budget exhaustion
- **THEN** the UI shows a transient system toast with budget-specific styling distinct from the weak-network toast
