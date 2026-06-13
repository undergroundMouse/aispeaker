## Context

The current realtime vision and voice specification already covers camera and microphone capture, local simple voice commands, object identification, local edge-side preprocessing, cloud visual-language fallback, and bilingual spoken responses. FR-20 through FR-26 add a privacy-sensitive personalization layer: users can teach the AI new object names in the moment, the AI remembers those names locally, and later visual questions prefer local custom-object matches before cloud processing.

This change crosses the live camera UI, local speech command handling, local vision preprocessing, object-identification routing, persistence, and privacy boundaries. The design assumes a client-side app running in Chrome, Edge, or Electron with WebRTC media capture and a local storage layer available in the runtime.

## Goals / Non-Goals

**Goals:**
- Let users teach a custom object by combining a voice-provided name with a selected region from the current camera frame.
- Keep teaching, feature extraction, vector persistence, matching, forgetting, and undo entirely local.
- Prefer local custom-object recognition before cloud visual-language calls.
- Provide both voice commands and UI management for forgetting objects and undoing the last teaching action.
- Make the storage boundary explicit so custom object feature vectors and teaching metadata are never uploaded.

**Non-Goals:**
- Training or fine-tuning a cloud model with user objects.
- Synchronizing custom object memories across devices.
- Guaranteeing recognition of every object instance, viewpoint, or lighting condition from a single teaching example.
- Replacing common-object recognition; custom-object matching augments the existing visual question answering flow.

## Decisions

### Use Local Embedding + Vector Retrieval Instead Of Model Fine-Tuning

Teaching stores one or more embeddings extracted from the selected object region and associates them with a user-provided name. At recognition time, the current object crop is embedded locally and compared against the local vector database.

Alternatives considered:
- Cloud model fine-tuning: rejected because it violates the local-only privacy and cost constraints.
- Storing only image thumbnails and doing image comparison later: rejected because it is slower, more storage-heavy, and less aligned with nearest-neighbor recognition.

### Introduce A Local Custom Object Store Adapter

Add a persistence adapter around LanceDB, sqlite-vss, or another local vector-capable backend. The adapter owns custom object records, vector inserts, similarity search, delete operations, and the teaching history needed for undo.

Alternatives considered:
- Directly coupling UI code to the selected database: rejected to keep the database implementation replaceable.
- Storing vectors in plain localStorage: rejected because vector search and deletion semantics become unreliable at meaningful scale.

### Route Object Identification Through Local Custom Matching First

For object-name questions and ambiguous "what is this" flows, the pipeline first checks custom object embeddings. A high-confidence match returns the custom name directly. If no match is found and local/common-object confidence is low, the system may call the cloud visual-language model and then ask whether to remember the object locally.

Alternatives considered:
- Always call cloud first and then override with custom names: rejected because it increases latency, cost, and privacy exposure.
- Only run custom matching after a specific "custom object" command: rejected because users expect remembered names to work naturally in later visual questions.

### Treat Forget And Undo As Local Commands

Commands such as "忘记那个物体", "forget that object", "撤销最后一次教学", and "undo last teaching" are handled by the local command layer. If the command refers to "that object", the system resolves it against the most recent custom-object match or selected object context; otherwise the UI list can be used for explicit selection.

Alternatives considered:
- Send management commands through normal dialogue: rejected because these commands must work offline and must not require cloud processing.
- Support only UI management: rejected because FR-22 and FR-26 require voice management.

## Risks / Trade-offs

- Single-example teaching may produce false positives or false negatives -> Use configurable similarity thresholds, allow multiple embeddings per object over time, and expose clear forget/undo controls.
- Local embedding models may vary by runtime capability -> Encapsulate feature extraction behind a local extractor interface and report teaching unavailable if no supported extractor is present.
- Local vector database support differs between browser and Electron targets -> Keep a storage adapter boundary and choose the strongest available local backend per runtime.
- Region selection can be imprecise -> Preserve selected bounding boxes with learned records and let users retry or undo the last teaching action.
- Custom names may conflict with common object names -> Prefer exact custom matches above threshold, but include confidence and source metadata in the recognition result for debugging and UI explanation.

## Migration Plan

1. Add local feature extraction and vector store adapter interfaces without changing existing cloud routes.
2. Add custom object teaching UI and local voice command mappings.
3. Insert custom-object retrieval before the existing object-identification fallback path.
4. Add list, delete, and undo management actions.
5. Add privacy and offline tests confirming teaching and management do not create cloud requests.

Rollback is straightforward before data migration: disable the custom-object routing hook and management UI. Existing local custom object records can remain unused until the feature is re-enabled or can be deleted through the local store adapter.

## Open Questions

- Which local vector backend should be the default for the initial implementation target: LanceDB, sqlite-vss, or a lightweight in-process fallback for browser-only builds?
- Which local embedding model is available in the target runtime, and what embedding dimensionality and similarity threshold should be used for the first quality gate?
- Should the UI allow multiple teaching examples for the same custom object name in the first release, or reserve that for a later improvement?
