# hybrid-visual-orchestration

Function-call orchestration layer that preserves visual accuracy while Qwen-Omni Realtime handles spoken interaction.

## ADDED Requirements

### Requirement: Hybrid visual orchestrator
The system SHALL provide a hybrid visual orchestrator that exposes structured tools for local vision, custom objects, memory, and cloud visual verification to the active Omni Realtime session.

#### Scenario: Orchestrator registers visual tools on session start
- **WHEN** hybrid Omni dialogue mode starts with camera or vision context available
- **THEN** the orchestrator registers tools for local vision lookup, custom object match, memory retrieval, and cloud visual verification

#### Scenario: Non-visual utterance bypasses VL verification
- **WHEN** the user asks a non-visual question such as a greeting or command
- **THEN** the orchestrator does not invoke cloud visual verification and allows Omni to respond directly

### Requirement: Local-first visual routing
The hybrid orchestrator SHALL consult local custom objects and the vision world model before invoking cloud visual verification.

#### Scenario: Custom object match short-circuits cloud verification
- **WHEN** a taught custom object matches the current frame with sufficient local confidence
- **THEN** the orchestrator returns the custom object name as structured hints to Omni without invoking cloud VLM

#### Scenario: High local confidence uses hints only
- **WHEN** local vision confidence exceeds configured thresholds for a visual question
- **THEN** the orchestrator injects structured local hints and regions into Omni context without a synchronous cloud VLM call

### Requirement: Async cloud visual verification
The hybrid orchestrator SHALL invoke the existing server-side Qwen visual-language provider asynchronously when local confidence is insufficient for object-identification or complex visual questions.

#### Scenario: Low confidence triggers VL verification
- **WHEN** the user asks a visual identification question and local confidence is below the configured threshold
- **THEN** the orchestrator invokes `POST /api/v1/cloud/visual-answer` asynchronously and maps the response into structured hints with normalized regions

#### Scenario: Verification preserves uncertainty constraint
- **WHEN** cloud visual verification returns an uncertain object answer matching phrases such as "看不清楚"
- **THEN** the orchestrator instructs Omni to speak the uncertain answer and marks evidence as unavailable in the Assist UI

### Requirement: Structured evidence for Assist UI
The hybrid orchestrator SHALL maintain a structured `VisualAnswer` for the Assist surface even when Omni produces natural spoken language.

#### Scenario: Evidence overlay updates from orchestrator result
- **WHEN** cloud or local visual verification produces region evidence
- **THEN** the Assist surface renders evidence highlights from the orchestrator structured result independent of Omni transcript wording

#### Scenario: Async correction updates evidence without blocking speech
- **WHEN** async cloud verification completes after Omni begins speaking and the verified answer differs materially
- **THEN** the Assist UI updates structured evidence and transcript text and MAY request a brief spoken correction according to product policy

### Requirement: Conversation memory and long-term memory tool access
The hybrid orchestrator SHALL inject scoped conversation memory and authorized long-term memory into Omni session context and tool responses.

#### Scenario: Follow-up pronoun resolved from conversation memory
- **WHEN** the user asks a follow-up referring to a previously mentioned object or scene
- **THEN** the orchestrator resolves the reference from conversation memory before generating hints for Omni

#### Scenario: Cloud memory excluded without consent
- **WHEN** cloud memory access consent is disabled
- **THEN** the orchestrator does not include long-term memory content in cloud verification requests or Omni system context beyond locally stored memories
