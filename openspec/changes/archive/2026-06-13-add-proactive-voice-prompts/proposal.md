## Why

The existing real-time vision and voice capability can answer user-initiated questions, but it does not yet define how the AI should proactively warn or remind the user when the live camera observes important unattended objects, safety risks, useful events, or optimizable actions. This change adds controlled, mostly local proactive voice prompts so the assistant can be helpful without becoming noisy, expensive, or privacy-invasive.

## What Changes

- Add proactive voice prompts for noteworthy visual targets or state changes, such as left-behind phones, unattended stove flame, risky scissor use, delivery arrival, optimizable operations, and reminders.
- Allow proactive prompts during watch-only energy-saving mode, even without active dialogue, while preserving local-first processing.
- Add local voice commands to disable proactive speech ("闭嘴，别主动说话") or increase reminders ("多提醒我"), with the switch state persisted in `localStorage`.
- Require multiple trigger gates, including target confidence above 90%, no duplicate prompt within 30 seconds, an average prompt rate of at most one per minute per session, and a configurable daily prompt cap.
- Require at least 90% of proactive prompts to be triggered by a local rules engine plus edge-side object detection to avoid cloud cost.
- Add continuous TensorFlow.js object detection plus local rules for conditions such as object leaving the scene and dangerous posture/action detection.
- Queue proactive prompts while the user is speaking, while allowing urgent safety prompts to interrupt.
- Add uncertainty wording to proactive prompts and support user correction feedback ("错了") that lowers the likelihood of repeating similar false triggers.
- Add local sensitive-information filtering so OCR-detected continuous digits are not spoken aloud.

## Capabilities

### New Capabilities

### Modified Capabilities

- `realtime-vision-voice-ai-input`: Extend real-time vision, local command, watch-only, edge-side vision, and TTS requirements with proactive local visual prompt detection, rate limits, voice controls, interruption rules, uncertainty wording, feedback adaptation, and sensitive OCR filtering.

## Impact

- Affects the camera frame sampling loop, edge-side vision inference, proactive prompt rules engine, local voice command recognition, TTS playback queue, user settings persistence, prompt rate limiting, feedback handling, and privacy filters.
- Requires a TensorFlow.js object detection runtime/model and local rule definitions for supported proactive prompt categories.
- May add UI/settings controls for daily proactive prompt limits and proactive reminder state.
- Should minimize cloud usage by keeping proactive detection and most prompt triggering local.
