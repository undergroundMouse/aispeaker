## 1. Local Storage And Feature Extraction

- [x] 1.1 Add a local custom object data model for object id, user-defined name, feature vectors, selected region metadata, timestamps, and source metadata.
- [x] 1.2 Implement a local custom object store adapter with insert, similarity search, list, delete, and delete-last-teaching operations.
- [x] 1.3 Integrate the selected local vector backend or a runtime-specific adapter for LanceDB, sqlite-vss, or the chosen local equivalent.
- [x] 1.4 Add a local feature extraction interface for selected object regions and current recognition crops.
- [x] 1.5 Handle unavailable local extractor or vector database states with user-visible local-memory-unavailable errors.

## 2. Teaching Flow

- [x] 2.1 Add UI support for selecting or drawing a bounding region on the current camera frame.
- [x] 2.2 Parse teaching utterances that provide custom names, such as "记住这个叫..." and equivalent English phrases.
- [x] 2.3 Combine selected region, current frame, and spoken name into a local teaching action.
- [x] 2.4 Persist taught object vectors and metadata locally after successful feature extraction.
- [x] 2.5 Add prompts for missing region, missing frame, missing name, and successful teaching confirmation.
- [x] 2.6 Ensure teaching works offline when the local extractor and vector database are available.

## 3. Recognition Routing

- [x] 3.1 Insert local custom object vector search before generic object recognition and cloud visual-language fallback for object-name questions.
- [x] 3.2 Return user-defined custom object names when local similarity meets the configured threshold.
- [x] 3.3 Include local custom memory source metadata and matched object id in recognition results.
- [x] 3.4 Continue to existing common-object or cloud fallback when no custom object match is confident.
- [x] 3.5 Add remember-this-object prompting only after local custom matching fails and cloud recognition was needed.

## 4. Voice And UI Management

- [x] 4.1 Add local command mappings for "忘记那个物体", "forget that object", "撤销最后一次教学", and "undo last teaching".
- [x] 4.2 Resolve "that object" forget commands from recent custom-object recognition or selected-object context.
- [x] 4.3 Delete referenced custom object records and vectors from the local vector database.
- [x] 4.4 Implement undo-last-teaching by deleting the most recent successful teaching record.
- [x] 4.5 Add a learned custom object list UI with local-only list and delete actions.
- [x] 4.6 Keep the learned object list updated after teaching, deletion, forgetting, or undo.

## 5. Privacy, Offline, And Quality Verification

- [x] 5.1 Add tests proving teaching, listing, forgetting, deleting, and undoing custom objects do not create cloud requests.
- [x] 5.2 Add tests for local custom recognition priority over cloud visual-language processing.
- [x] 5.3 Add tests for no-match fallback to common-object recognition or cloud recognition when network conditions allow.
- [x] 5.4 Add tests for offline teaching and offline management command behavior.
- [x] 5.5 Add tests for unresolved forget commands and empty undo history prompts.
- [x] 5.6 Validate existing common-object accuracy tests still meet the 85% requirement after routing changes.
