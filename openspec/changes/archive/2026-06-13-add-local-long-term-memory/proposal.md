## Why

The assistant needs to remember durable user preferences, object locations, and habitual actions across sessions while preserving the local-first privacy boundary already established for learned objects. This enables more personal multimodal interactions without silently exposing sensitive long-term memory to cloud services.

## What Changes

- Add a local long-term memory store per user for preferences, common object locations, habit/action patterns, and other durable interaction facts.
- Let memories evolve over time through usage, reinforcement, decay, and deletion so responses can become personalized without becoming stale.
- Add user controls to view memories, delete individual memories, trigger one-click forget, review stale memories, and disable optional cloud summary sync.
- Enforce local-only encrypted IndexedDB persistence by default, with cloud access only after explicit user authorization and only when complex reasoning needs relevant memory context.
- Add retrieval behavior that loads relevant local memories before each dialogue turn and appends only scoped memory context to the prompt.
- Keep the memory set bounded with LRU eviction at 200 retained memories, automatic weakening after 30 unused days, and optional cloud synchronization of necessary summaries only.

## Capabilities

### New Capabilities
- `local-long-term-memory`: Defines local encrypted long-term user memory, memory retrieval for dialogue prompts, memory evolution, user memory management, privacy authorization, LRU retention, optional summary sync, and forgetting/review flows.

### Modified Capabilities
- `realtime-vision-voice-ai-input`: Dialogue prompt construction changes to include relevant locally retrieved long-term memories before each conversation turn while preserving cloud access restrictions.

## Impact

- Affected app areas: local storage, dialogue prompt assembly, multimodal context retrieval, privacy/consent settings, memory management UI, and scheduled maintenance/decay routines.
- Data storage: introduces encrypted IndexedDB records for long-term memories and metadata such as user scope, tags, last-used time, usage strength, and optional sync eligibility.
- Cloud boundary: cloud services must not receive raw long-term memory unless the user explicitly authorizes access for a complex reasoning flow; optional cloud sync is limited to necessary summaries and can be disabled.
