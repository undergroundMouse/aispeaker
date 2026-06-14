## Purpose

Define the local long-term user memory requirements for storing, evolving, retrieving, reviewing, deleting, and privacy-gating durable personalized memories across sessions.

## Requirements

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

### Requirement: Local encrypted IndexedDB persistence
The system SHALL store long-term memory records only in local encrypted IndexedDB by default.

#### Scenario: Memory is stored locally
- **WHEN** a long-term memory record is created or updated
- **THEN** the system persists the encrypted memory record and metadata in local IndexedDB without uploading the raw memory to any cloud service

#### Scenario: Local memory storage is unavailable
- **WHEN** encrypted IndexedDB cannot be opened, decrypted, or written
- **THEN** the system does not create or update long-term memory and tells the user that local memory is unavailable

### Requirement: Dynamic memory evolution
The system SHALL evolve long-term memories over time using usage, reinforcement, correction, and decay signals.

#### Scenario: Memory is reinforced by use
- **WHEN** a long-term memory is retrieved and used to personalize a dialogue answer
- **THEN** the system updates the memory's last-used time and strengthens its usage score

#### Scenario: Memory is corrected by the user
- **WHEN** the user corrects a remembered preference, location, or habit
- **THEN** the system updates the existing memory instead of keeping conflicting active memories for the same fact

#### Scenario: Personalized prompt uses evolved preference
- **WHEN** the system sees a visible object that matches a strong active memory such as the user's preference for red objects
- **THEN** the system may personalize the interaction with that memory, such as noting that the object is in a color the user likes

### Requirement: Relevant memory retrieval before each dialogue turn
The system SHALL load relevant long-term memories locally before each dialogue turn and provide only the scoped memory context needed for that turn to prompt construction.

#### Scenario: Relevant memories are added to local prompt context
- **WHEN** a dialogue turn starts and local long-term memory is available
- **THEN** the system retrieves relevant memories for the current voice, visual, and recent dialogue context and appends a concise memory context to the prompt

#### Scenario: No relevant memory exists
- **WHEN** a dialogue turn starts and local retrieval finds no relevant long-term memories
- **THEN** the system continues the dialogue turn without adding long-term memory context

### Requirement: Cloud access requires explicit authorization
The system SHALL prevent cloud services from accessing long-term memory unless the user explicitly authorizes memory use for cloud reasoning and the current request requires complex reasoning.

#### Scenario: Cloud request is not authorized
- **WHEN** a dialogue turn would otherwise call a cloud model and the user has not authorized cloud access to long-term memory
- **THEN** the system MUST NOT include raw long-term memory or long-term memory summaries in the cloud request

#### Scenario: Authorized complex reasoning uses scoped memory
- **WHEN** the user has explicitly authorized cloud access to long-term memory and the current request requires complex cloud reasoning
- **THEN** the system includes only the relevant scoped memory context needed for that request

#### Scenario: Authorization is revoked
- **WHEN** the user disables cloud access to long-term memory
- **THEN** subsequent cloud requests MUST NOT include long-term memory context

### Requirement: User memory list and individual deletion
The system SHALL allow the user to view long-term memories and delete individual memories on the dedicated Memory surface.

#### Scenario: User views memory list
- **WHEN** the user opens the long-term memory management interface on the Memory surface
- **THEN** the system displays locally stored memories with understandable summaries, memory type, last-used time, and delete controls

#### Scenario: User deletes a memory
- **WHEN** the user deletes a selected memory such as "my coffee cup"
- **THEN** the system removes that memory from encrypted IndexedDB and excludes it from future retrieval, prompt context, and optional sync summaries

### Requirement: One-click forgetting
The system SHALL provide a one-click forget function that clears all long-term memories for the active user.

#### Scenario: User forgets all memories
- **WHEN** the user confirms one-click forget
- **THEN** the system deletes all long-term memories for the active user from encrypted IndexedDB and clears any pending local sync summaries for those memories

#### Scenario: Forget all does not remove other users' memories
- **WHEN** the active user confirms one-click forget on a device with multiple user profiles
- **THEN** the system deletes only the active user's long-term memories

### Requirement: LRU retention limit
The system SHALL retain at most 200 active long-term memory records per user using an LRU-based eviction policy.

#### Scenario: Memory cap is exceeded
- **WHEN** creating or updating a memory would exceed 200 active long-term memories for the user
- **THEN** the system evicts the least recently used eligible memory records until no more than 200 active memories remain

#### Scenario: Recently used memory is retained
- **WHEN** a memory has been used recently and the retention cap requires eviction
- **THEN** the system prefers retaining the recently used memory over older eligible memories

### Requirement: Optional cloud summary synchronization
The system SHALL sync only necessary long-term memory summaries to cloud services when summary sync is enabled, and SHALL allow the user to disable sync.

#### Scenario: Summary sync is enabled
- **WHEN** the user enables optional cloud summary synchronization
- **THEN** the system may sync necessary memory summaries without raw encrypted memory records, feature vectors, object crops, or deleted memories

#### Scenario: Summary sync is disabled
- **WHEN** the user disables optional cloud summary synchronization
- **THEN** the system stops sending long-term memory summaries to cloud services and keeps memory data local

### Requirement: Stale memory weakening and review prompts
The system SHALL automatically weaken memories unused for more than 30 days and periodically prompt the user to review long-term memories.

#### Scenario: Memory is unused for more than 30 days
- **WHEN** a long-term memory has not been used for more than 30 days
- **THEN** the system weakens the memory so it is less likely to be retrieved or used for personalization

#### Scenario: User is prompted to review memories
- **WHEN** the configured memory review interval is reached
- **THEN** the system prompts the user to review long-term memories and offers controls to keep, delete, or edit stale memories
