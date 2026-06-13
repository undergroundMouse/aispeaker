## 1. Data Model and Local Persistence

- [x] 1.1 Define long-term memory types, metadata, consent settings, and retrieval result types in the app type layer.
- [x] 1.2 Implement an IndexedDB-backed long-term memory repository scoped by active user profile.
- [x] 1.3 Add local encryption and decryption for memory payloads before IndexedDB persistence.
- [x] 1.4 Handle unavailable, corrupted, or undecryptable local memory storage with a fail-closed user-visible state.

## 2. Memory Lifecycle

- [x] 2.1 Implement create, update, correction, delete-one, list, and forget-all operations for long-term memories.
- [x] 2.2 Track last-used time, usage strength, memory type, tags, and optional sync eligibility for each memory.
- [x] 2.3 Apply reinforcement when a memory is used and merge corrections into the existing active fact where possible.
- [x] 2.4 Enforce the per-user 200 active memory cap with LRU-based eviction.
- [x] 2.5 Add maintenance logic that weakens memories unused for more than 30 days.

## 3. Dialogue Retrieval and Prompt Integration

- [x] 3.1 Implement local relevance retrieval for current voice text, visual context, and recent dialogue context.
- [x] 3.2 Add concise long-term memory context formatting for prompt construction.
- [x] 3.3 Integrate local memory retrieval before each multimodal dialogue turn.
- [x] 3.4 Update cloud request construction so unauthorized turns exclude long-term memory context.
- [x] 3.5 Add authorized complex-reasoning path that includes only scoped relevant memory context.

## 4. Privacy, Consent, and Optional Sync

- [x] 4.1 Add explicit settings for cloud long-term-memory access and optional cloud summary synchronization.
- [x] 4.2 Ensure cloud memory authorization is revocable and checked for every cloud-bound request.
- [x] 4.3 Implement summary-only sync payload generation that excludes raw encrypted records, feature vectors, object crops, and deleted memories.
- [x] 4.4 Stop summary sync and keep all memory data local when the user disables sync.

## 5. User Interface and Review Flows

- [x] 5.1 Add a long-term memory management UI that lists memory summaries, types, last-used times, and delete controls.
- [x] 5.2 Add individual memory deletion behavior from the management UI.
- [x] 5.3 Add a one-click forget control with confirmation and active-user-only deletion.
- [x] 5.4 Add periodic review prompts that let the user keep, edit, or delete stale memories.
- [x] 5.5 Surface local memory unavailable and memory cloud-access states clearly in the UI.

## 6. Tests and Validation

- [x] 6.1 Add repository tests for encrypted local persistence, user scoping, unavailable storage, listing, deletion, and forget-all.
- [x] 6.2 Add lifecycle tests for reinforcement, correction, 30-day weakening, and 200-memory LRU eviction.
- [x] 6.3 Add dialogue tests for local retrieval, prompt injection, no-match behavior, and cloud exclusion without authorization.
- [x] 6.4 Add consent and sync tests for authorization revocation, scoped authorized memory inclusion, and summary-only sync payloads.
- [x] 6.5 Add UI tests for viewing memories, deleting one memory, one-click forget, review prompts, and unavailable-memory states.
