## 1. ASR types and providers

- [x] 1.1 Add `AsrProvider`, `AsrEvent`, `AsrCaptureState`, and provider capability types alongside existing voice types.
- [x] 1.2 Implement `WebSpeechAsrProvider` with interim and final result streaming for push-to-talk sessions.
- [x] 1.3 Implement `MockAsrProvider` for tests and unavailable-browser fallback scenarios.
- [x] 1.4 Add provider selection helper mirroring `selectTtsProvider` patterns.

## 2. Speech capture controller and half-duplex

- [x] 2.1 Implement `SpeechCaptureController` to start/stop ASR sessions and aggregate final transcript commits.
- [x] 2.2 Integrate half-duplex rules: cancel TTS on push-to-talk start, block TTS until ASR commit completes.
- [x] 2.3 Wire `SpeechCaptureController` into `useRealtimeVisionVoice` for `startPushToTalk` / `stopPushToTalk`.
- [x] 2.4 Remove `App.tsx` hardcoded transcript from the default Assist dialogue submission path.
- [x] 2.5 Expose `asrState` and interim/final transcript fields from the hook to presentation components.

## 3. Dialogue panel UI

- [x] 3.1 Implement `DialoguePanel` with `UserTranscriptPanel` and assistant/history sections for the right column.
- [x] 3.2 Wire interim and final ASR text into `UserTranscriptPanel` with distinct interim styling.
- [x] 3.3 Migrate assistant streaming/history presentation from overlay `CaptionLayer` into `DialoguePanel`.
- [x] 3.4 Add optional collapsed manual text fallback when ASR is unavailable.
- [x] 3.5 Move `ProactiveBanner` to the dialogue column header.

## 4. Split Assist layout

- [x] 4.1 Refactor `AssistShell` to a desktop split grid (~55/45) with left `VisionColumn` and right `DialoguePanel`.
- [x] 4.2 Place camera stage and talk/object controls in the left vision column beneath the preview.
- [x] 4.3 Keep a single ⚙ settings button (and ambient network indicator) in top chrome opening `SettingsDrawer`.
- [x] 4.4 Remove default Assist usage of `TalkFab` and full-bleed overlay caption/talk stacking.
- [x] 4.5 Update `App.css` for split layout, dialogue panel styling, and narrow-viewport stacked fallback.

## 5. Presentation and dialogue integration

- [x] 5.1 Extend presentation state to combine `asrTranscript` with existing `captionTurns` in the right panel.
- [x] 5.2 Commit final ASR transcript through `handleTranscript` and preserve `transcriptCommittedAt` latency metrics.
- [x] 5.3 Keep system toasts and camera interaction feedback compatible with the split layout.
- [x] 5.4 Retain Debug transcript simulator for engineering override only.

## 6. Internationalization

- [x] 6.1 Add i18n keys for dialogue panel placeholders, interim listening state, ASR unavailable copy, and interrupt-TTS hint.
- [x] 6.2 Replace new hardcoded Assist dialogue strings with `getMessages(language)` lookups.

## 7. Tests

- [x] 7.1 Add `WebSpeechAsrProvider` / `SpeechCaptureController` unit tests for interim, final, and stop behavior.
- [x] 7.2 Add half-duplex tests verifying push-to-talk cancels TTS and delays new TTS until ASR commit.
- [x] 7.3 Add `DialoguePanel` tests for interim/final user transcript rendering and assistant streaming updates.
- [x] 7.4 Add Assist layout tests for split columns, single settings button, and absence of Talk FAB.
- [x] 7.5 Run quiet-environment ASR fixture evaluation and assert the >95% accuracy gate.
- [x] 7.6 Update `App.test.tsx` for split layout and real push-to-talk transcript commit flow.

## 8. OpenSpec

- [x] 8.1 Review change artifacts against implementation and confirm split layout plus ASR behavior match specs.
- [x] 8.2 Sync delta specs into main `openspec/specs/` after implementation is complete.
