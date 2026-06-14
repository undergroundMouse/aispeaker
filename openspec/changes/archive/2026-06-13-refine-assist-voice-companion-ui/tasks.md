## 1. Presentation adapter and types

- [x] 1.1 Add `ConversationTurn` and presentation types for caption history, streaming assistant text, and proactive banner state.
- [x] 1.2 Implement `useAssistPresentation` (or equivalent) to append completed turns, track streaming segments, and cap session history.
- [x] 1.3 Expose non-final `DialogueResponseSegment` events from `useRealtimeVisionVoice` to the presentation adapter without changing dialogue routing.
- [x] 1.4 Replace proactive handling in `buildConversationEntries` with caption-only turn building; proactive prompts route to banner state only.

## 2. Assist overlay layout

- [x] 2.1 Restructure `AssistShell` as a full-viewport stage with absolutely positioned overlay children.
- [x] 2.2 Remove persistent hero header from default Assist render path.
- [x] 2.3 Update `App.css` for full-bleed camera stage, caption glass background, z-index stack, and overlay-safe responsive stacking.
- [x] 2.4 Demote `StatusBar` to ambient chrome (settings icon + network dot) and remove cloud-path, proactive, and speech pills from default Assist.

## 3. Caption layer and history

- [x] 3.1 Implement `CaptionLayer` with role-distinct styling for user, assistant, and system lines over the camera preview.
- [x] 3.2 Wire streaming assistant text updates from presentation adapter into `CaptionLayer`.
- [x] 3.3 Add scrollable session history for retained turns with latest turn visually prominent.
- [x] 3.4 Migrate or retire `ConversationStrip` usage on Assist in favor of `CaptionLayer`.

## 4. Proactive banner and system toasts

- [x] 4.1 Implement `ProactiveBanner` overlay with proactive styling separate from caption entries.
- [x] 4.2 Hide proactive banner when user starts push-to-talk or prompt playback completes.
- [x] 4.3 Implement `SystemToast` for weak-network and budget failures with distinct variants and auto-dismiss.
- [x] 4.4 Route network and budget failures through toast-first presentation while preserving caption fallback when needed.

## 5. Talk FAB and object controls

- [x] 5.1 Implement `TalkFab` centered over the lower camera stage with push-to-talk press/hold behavior.
- [x] 5.2 Place object-selection secondary control adjacent to the FAB without reintroducing a side dashboard column.
- [x] 5.3 Preserve teaching hint copy and microphone-disabled states on overlay controls.
- [x] 5.4 Remove legacy side-panel `TalkControls` from default Assist layout.

## 6. Camera interaction feedback

- [x] 6.1 Add CSS transition or pulse animation to `.selection-box` on region selection.
- [x] 6.2 Add teaching success and failure overlay feedback on or adjacent to `CameraStage`.
- [x] 6.3 Add fade-in animation to `VisualEvidenceOverlay` when evidence regions first appear.
- [x] 6.4 Move memory warnings from inline Assist text to a settings badge indicator where applicable.

## 7. Cleaner chrome and surface entry

- [x] 7.1 Remove Operator navigation button from default Assist chrome; retain `/admin` route when admin integration is configured.
- [x] 7.2 Render `DebugPanel` outside the Assist overlay stack and only when `isDebugMode()` is true.
- [x] 7.3 Ensure cloud-path label appears on Operator surface and not on default Assist.
- [x] 7.4 Verify Settings drawer, Operator dashboard, and Debug panel continue to function with existing hook props.

## 8. Internationalization

- [x] 8.1 Add i18n keys for caption placeholders, proactive banner actions, talk FAB labels, system toasts, and ambient status copy.
- [x] 8.2 Replace any new hardcoded Assist overlay strings with `getMessages(language)` lookups.

## 9. Tests

- [x] 9.1 Add component tests for `CaptionLayer` streaming updates and scrollable turn history.
- [x] 9.2 Add tests verifying `ProactiveBanner` does not render proactive text inside caption entries.
- [x] 9.3 Add tests verifying default Assist hides hero header, operator button, cloud-path pill, and debug overlay in production mode.
- [x] 9.4 Add tests for `SystemToast` weak-network and budget variants.
- [x] 9.5 Add tests for selection animation class application and evidence overlay fade-in behavior.
- [x] 9.6 Update `App.test.tsx` and existing Assist surface tests for overlay layout expectations.

## 10. OpenSpec

- [x] 10.1 Review change artifacts against implementation and confirm voice-companion overlay matches specs.
- [x] 10.2 Sync delta specs into main `openspec/specs/` after implementation is complete.
