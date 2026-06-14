## ADDED Requirements

### Requirement: Dialogue-driven long-term memory creation
The system SHALL create or update durable long-term memory records from completed dialogue turns when the turn yields one or more memory candidates that represent preferences, habits, object locations, or stable facts.

#### Scenario: Cloud dialogue turn creates memory from Qwen candidates
- **WHEN** a dialogue turn completes through cloud visual-language processing and the response includes one or more valid memory candidates
- **THEN** the system persists those candidates locally through the long-term memory store without uploading raw encrypted memory records

#### Scenario: Local dialogue turn creates memory from explicit intent
- **WHEN** a dialogue turn completes locally without cloud visual-language processing and the user transcript matches a configured explicit memory-intent phrase for a durable fact
- **THEN** the system creates or updates a corresponding long-term memory record locally

#### Scenario: Teaching phrase does not create long-term memory
- **WHEN** the user speaks a custom-object teaching phrase with a selected object region
- **THEN** the system creates or updates a custom-object record and does not create a duplicate long-term memory record for the same teaching action

#### Scenario: Ephemeral Q&A does not create memory
- **WHEN** a dialogue turn is a one-off visual question such as "这是什么" without durable preference, habit, location, or fact signals
- **THEN** the system does not create a new long-term memory record for that turn

#### Scenario: Duplicate durable facts merge
- **WHEN** a new memory candidate matches an existing correctable long-term memory for the same subject and type
- **THEN** the system updates the existing memory instead of keeping conflicting active duplicates

#### Scenario: Memory list reflects dialogue-derived records
- **WHEN** the user opens the long-term memory management interface after dialogue-driven memory creation
- **THEN** the system displays the newly created or updated memory summaries with understandable type and last-used metadata

## MODIFIED Requirements

### Requirement: Per-user local long-term memory store
The system SHALL maintain a long-term memory store for each user that can persist user preferences, commonly used object locations, habitual actions, and durable interaction facts across sessions. Initial application startup SHALL NOT insert demo or seeded long-term memories when the store is empty.

#### Scenario: Memory persists across sessions
- **WHEN** the system records a durable fact such as a user preference, object location, or habitual action and the user later starts a new session
- **THEN** the system can retrieve the memory from that user's long-term memory store

#### Scenario: Memories are scoped to the current user
- **WHEN** multiple user profiles exist on the same device
- **THEN** the system only reads and writes long-term memories associated with the active user profile

#### Scenario: Empty store starts without seeded demo memories
- **WHEN** a user opens the application for the first time and no long-term memories exist for the active user
- **THEN** the long-term memory list is empty until dialogue or explicit memory-intent interaction creates records

### Requirement: User memory list and individual deletion
The system SHALL allow the user to view long-term memories and delete individual memories on the dedicated Memory surface.

#### Scenario: User views memory list
- **WHEN** the user opens the long-term memory management interface on the Memory surface
- **THEN** the system displays locally stored memories with understandable summaries, memory type, last-used time, and delete controls

#### Scenario: User deletes a memory
- **WHEN** the user deletes a selected memory such as "my coffee cup"
- **THEN** the system removes that memory from encrypted IndexedDB and excludes it from future retrieval, prompt context, and optional sync summaries
