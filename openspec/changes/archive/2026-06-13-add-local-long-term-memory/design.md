## Context

The current specs already define real-time multimodal dialogue, local custom object learning, and local-only custom object vector persistence. Those memories are object-specific and primarily support recognition. FR-27 through FR-33 require a broader per-user long-term memory capability that remembers preferences, object locations, habitual actions, and other durable facts across sessions.

The design must preserve the existing local-first privacy model: long-term memory is stored locally, cloud services do not access it by default, and any cloud use is explicitly authorized and scoped. Because these memories can contain sensitive behavioral information, storage, retrieval, deletion, and decay must be treated as product and privacy surfaces, not just prompt engineering.

## Goals / Non-Goals

**Goals:**
- Store long-term memories per user in encrypted IndexedDB and keep raw memory local by default.
- Retrieve relevant memories before each dialogue turn and inject concise, scoped memory context into the prompt.
- Support memory evolution through creation, reinforcement, weakening, last-used tracking, LRU eviction, and user deletion.
- Provide user-facing memory review, individual deletion, one-click forget, optional cloud summary sync controls, and stale-memory review prompts.
- Enforce a 200-memory retention cap and weaken memories unused for more than 30 days.

**Non-Goals:**
- Replace the existing local custom object vector store or make all custom object records long-term memories.
- Build cross-device synchronization of raw memories.
- Allow cloud services to read long-term memory without explicit user authorization.
- Define a final ML ranking model for memory retrieval; the implementation can start with deterministic scoring and local embeddings/signals.

## Decisions

1. Use a separate `longTermMemories` IndexedDB store scoped by `userId`.
   - Rationale: the data model is broader than custom object vectors and needs memory-specific metadata such as type, strength, last-used time, decay state, and sync eligibility.
   - Alternative considered: reuse the custom object vector database. That would blur object recognition data with preference/habit facts and make user management harder.

2. Encrypt memory records before persistence with a local key derived from platform/user storage.
   - Rationale: memories contain personal preferences, routines, and locations, so at-rest protection is required even though storage is local.
   - Alternative considered: rely on browser storage isolation only. That is simpler but does not satisfy the requirement for encrypted local storage.

3. Retrieve memories locally before dialogue prompt assembly.
   - Rationale: FR-31 requires local loading before each conversation, and local retrieval avoids unnecessary cloud exposure.
   - Alternative considered: ask the cloud model to decide which memories are relevant. That would require sending more memory data upstream and violates the local-first boundary.

4. Gate cloud memory access behind an explicit, revocable authorization state.
   - Rationale: complex reasoning may need memory context, but raw memory should never leave the device silently.
   - Alternative considered: always send summaries to the cloud. That improves personalization but weakens privacy and conflicts with FR-30/FR-31.

5. Treat optional cloud sync as summary-only and off-switchable.
   - Rationale: FR-32 allows necessary summary sync but requires user control. Summaries should omit raw object crops, vectors, precise private locations where possible, and deleted memories.
   - Alternative considered: sync encrypted raw records. This still increases cloud data handling surface and is outside the requested scope.

6. Maintain memory health with deterministic lifecycle rules.
   - Rationale: LRU at 200 records, 30-day weakening, and review prompts are explicit product requirements and can be implemented without model-dependent behavior.
   - Alternative considered: rely on model-generated importance only. That is less predictable and harder to test.

## Risks / Trade-offs

- Sensitive memory leakage through prompts -> Mitigation: only inject top relevant local memories, redact unnecessary detail, and require authorization before including memory in cloud-bound prompts.
- Stale or incorrect personalization -> Mitigation: decay unused memories after 30 days, surface review prompts, and allow individual deletion plus one-click forget.
- IndexedDB encryption key loss or browser data clearing -> Mitigation: treat local memory as recoverable user preference data and fail closed with a clear "memory unavailable" state.
- LRU eviction may remove useful but infrequently used memories -> Mitigation: include strength/importance in eviction ordering so recently used and reinforced memories are preferred.
- UI overload from memory review -> Mitigation: group memories by type and show concise summaries, last-used time, and delete controls.
