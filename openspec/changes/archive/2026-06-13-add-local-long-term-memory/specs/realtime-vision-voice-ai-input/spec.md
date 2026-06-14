## MODIFIED Requirements

### Requirement: Continuous multi-turn visual dialogue context
The system SHALL support continuous multi-turn dialogue and remember recently mentioned objects, scenes, gestures, and topics for follow-up turns. Before each dialogue turn, the system SHALL also retrieve relevant local long-term memories for the active user and include only the scoped memory context needed for the turn while preserving cloud access restrictions.

#### Scenario: Follow-up references previous object
- **WHEN** the system identifies an object in one dialogue turn and the user asks a follow-up question that refers to "it" or "这个"
- **THEN** the system resolves the follow-up against the recently mentioned object context

#### Scenario: Context is updated after each multimodal answer
- **WHEN** the system produces a multimodal answer about an object, scene, gesture, or topic
- **THEN** the system stores the relevant structured context for later dialogue turns

#### Scenario: Dialogue turn includes relevant local long-term memories
- **WHEN** the user starts a dialogue turn and relevant local long-term memories exist for the active user
- **THEN** the system appends concise relevant memory context to prompt construction before generating the answer

#### Scenario: Cloud-bound turn excludes unauthorized long-term memory
- **WHEN** a dialogue turn requires cloud processing and the user has not explicitly authorized cloud access to long-term memory
- **THEN** the system excludes long-term memory context from the cloud-bound request
