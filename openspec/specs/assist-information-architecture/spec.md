# assist-information-architecture

Four-surface client information architecture for assist, settings, operator, and development debug presentation.

## Requirements

### Requirement: Assist default surface
The client SHALL present an Assist surface as the default application view focused on camera preview, the current AI response, and push-to-talk controls.

#### Scenario: User opens the application
- **WHEN** a user navigates to the default application route
- **THEN** the UI shows the live camera preview, a conversation response area, and a primary push-to-talk control without requiring the user to scroll past engineering debug panels

#### Scenario: Assist prioritizes visual stage
- **WHEN** the Assist surface is rendered on a desktop viewport
- **THEN** the camera preview occupies the dominant visual area relative to secondary controls

### Requirement: Status bar indicators
The Assist surface SHALL expose compact status indicators for network connectivity, active cloud visual-language path, proactive prompt enablement, and speech playback state.

#### Scenario: Network status is visible
- **WHEN** the Assist surface is active
- **THEN** the user can see whether the application considers the network online, offline, or weak without opening a debug panel

#### Scenario: Cloud path is visible to operators on Assist
- **WHEN** an operator views the Assist surface
- **THEN** the status bar shows whether the active cloud visual-language path is `backend+Qwen3-VL-8B-Thinking`, direct Qwen, or `mock`

### Requirement: Conversation strip presentation
The Assist surface SHALL present the current user-visible AI response in a dedicated conversation strip that combines answer text, optional explanation, and message role.

#### Scenario: Assistant answer appears in conversation strip
- **WHEN** a dialogue turn completes with a speakable visual answer
- **THEN** the conversation strip displays the answer text and uses an assistant role distinct from system warnings

#### Scenario: System failures use distinct strip styling
- **WHEN** a dialogue turn fails due to weak network or daily budget exhaustion
- **THEN** the conversation strip displays the failure message with a system role and visually distinct styling for each failure type

#### Scenario: Proactive prompt appears on Assist
- **WHEN** the system speaks or queues a proactive prompt while the Assist surface is active
- **THEN** the conversation strip or an adjacent proactive banner shows the prompt text with a proactive role

### Requirement: Settings drawer surface
The client SHALL provide a Settings drawer or equivalent secondary surface for privacy consent, dialogue preferences, and memory management controls.

#### Scenario: Privacy controls are grouped in Settings
- **WHEN** a user opens Settings
- **THEN** camera capture, microphone capture, and cloud media transmission consent toggles are grouped under a privacy section

#### Scenario: Memory controls are grouped in Settings
- **WHEN** a user opens Settings
- **THEN** learned custom objects, long-term memory lists, export actions, and cloud memory consent toggles are grouped under a memory section

#### Scenario: Dialogue preferences are grouped in Settings
- **WHEN** a user opens Settings
- **THEN** watch-only mode and proactive prompt enablement are available under a dialogue preferences section

### Requirement: Operator surface separation
The client SHALL expose operations admin telemetry and budget controls on a dedicated Operator surface separate from the default Assist view.

#### Scenario: Operator route is isolated
- **WHEN** an authorized operator opens the Operator surface
- **THEN** the UI shows daily spend, conversation telemetry, and budget configuration controls without rendering the full engineering debug event grid

#### Scenario: Assist hides operator controls by default
- **WHEN** a regular user opens the default Assist surface
- **THEN** budget configuration buttons and per-conversation token telemetry lists are not shown in the primary assist layout

#### Scenario: Operator entry is hidden when admin integration is unavailable
- **WHEN** backend admin integration is not configured in the client environment
- **THEN** the Operator surface entry point is hidden from the Assist chrome

### Requirement: Development debug surface
The client SHALL expose engineering runtime debug information only through a development debug surface that is hidden from production builds by default.

#### Scenario: Debug panel is available in development
- **WHEN** the client runs in a development build or debug mode is explicitly enabled
- **THEN** engineering fields such as runtime state, frame metadata, latency metrics, and transcript simulation are available in a collapsible debug panel

#### Scenario: Debug panel is hidden in production
- **WHEN** the client runs in a production build without debug mode enabled
- **THEN** engineering debug cards and transcript simulation controls are not rendered in the default UI

### Requirement: Assist surface internationalization
User-facing labels on the Assist and Settings surfaces SHALL use the application i18n message catalog for Chinese and English.

#### Scenario: Assist chrome respects active language
- **WHEN** the active application language is Chinese
- **THEN** Assist surface labels for settings entry, talk controls, and status indicators render in Chinese

#### Scenario: Settings section labels respect active language
- **WHEN** the active application language is English
- **THEN** Settings privacy, dialogue, and memory section headings render in English
