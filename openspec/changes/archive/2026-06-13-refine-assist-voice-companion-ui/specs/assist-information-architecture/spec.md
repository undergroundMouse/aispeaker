## MODIFIED Requirements

### Requirement: Assist default surface
The client SHALL present an Assist surface as the default application view focused on a full-bleed live camera preview with floating caption and talk controls overlaid on the preview rather than in a separate dashboard column.

#### Scenario: User opens the application
- **WHEN** a user navigates to the default application route
- **THEN** the UI shows the live camera preview filling the Assist stage, a floating caption area for dialogue text, and a primary push-to-talk control overlaid on the preview without requiring the user to scroll past engineering debug panels or a product hero header

#### Scenario: Assist prioritizes visual stage
- **WHEN** the Assist surface is rendered on a desktop viewport
- **THEN** the camera preview occupies the dominant visual area and secondary controls do not appear in a permanent side dashboard column

#### Scenario: Assist omits marketing hero chrome
- **WHEN** the Assist surface is active after initial load
- **THEN** the UI does not render a persistent hero header with product title and subtitle above the camera stage

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
The Assist surface SHALL present user-visible dialogue through a floating caption layer over the camera preview that supports multiple recent turns, streaming assistant text, and role-distinct styling while keeping proactive prompts outside the caption stream.

#### Scenario: Assistant answer appears in caption layer
- **WHEN** a dialogue turn completes with a speakable visual answer
- **THEN** the caption layer displays the answer text with an assistant role distinct from system warnings

#### Scenario: Assistant text streams before final completion
- **WHEN** the dialogue pipeline emits non-final response segments for the active turn
- **THEN** the caption layer updates the assistant line for that turn without waiting for the final segment

#### Scenario: Recent turn history is scrollable
- **WHEN** more than one completed dialogue turn exists in the current session
- **THEN** the caption layer allows the user to scroll to earlier turns within the retained session history

#### Scenario: System failures use distinct presentation
- **WHEN** a dialogue turn fails due to weak network or daily budget exhaustion
- **THEN** the UI presents the failure with visually distinct system styling and does not replace an unrelated prior assistant answer without user context

#### Scenario: Proactive prompt does not occupy caption stream
- **WHEN** the system speaks or queues a proactive prompt while the Assist surface is active
- **THEN** the proactive prompt text is shown in a dedicated proactive banner and is not rendered as an assistant caption entry

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

### Requirement: Development debug surface
The client SHALL expose engineering runtime debug information only through a development debug surface that is hidden from production builds by default and is not rendered inside the default Assist overlay stack.

#### Scenario: Debug panel is available in development
- **WHEN** the client runs in a development build or debug mode is explicitly enabled
- **THEN** engineering fields such as runtime state, frame metadata, latency metrics, and transcript simulation are available in a debug surface separate from the Assist caption and talk overlays

#### Scenario: Debug panel is hidden in production
- **WHEN** the client runs in a production build without debug mode enabled
- **THEN** engineering debug cards and transcript simulation controls are not rendered in the default UI

### Requirement: Assist surface internationalization
User-facing labels on the Assist and Settings surfaces SHALL use the application i18n message catalog for Chinese and English.

#### Scenario: Assist chrome respects active language
- **WHEN** the active application language is Chinese
- **THEN** Assist surface labels for settings entry, talk controls, caption placeholders, proactive banner actions, and ambient status indicators render in Chinese

#### Scenario: Settings section labels respect active language
- **WHEN** the active application language is English
- **THEN** Settings privacy, dialogue, and memory section headings render in English

## ADDED Requirements

### Requirement: Proactive banner presentation
The Assist surface SHALL render proactive prompts in a dedicated proactive banner overlay that is visually and structurally separate from the caption layer.

#### Scenario: Proactive banner appears for active prompt
- **WHEN** the system queues or speaks a proactive prompt on the Assist surface
- **THEN** the proactive banner displays the prompt text with proactive styling above the caption layer

#### Scenario: Proactive banner dismisses on user talk
- **WHEN** the user starts push-to-talk while a proactive banner is visible
- **THEN** the proactive banner hides before the new user turn caption is shown

### Requirement: Talk FAB placement
The Assist surface SHALL provide push-to-talk through a floating action control centered over the lower camera stage.

#### Scenario: Talk FAB is always reachable
- **WHEN** the Assist surface is active and microphone capture is authorized
- **THEN** the user can start and stop push-to-talk from the floating talk control without opening Settings or debug panels

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
