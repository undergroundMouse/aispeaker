## Why

The existing real-time vision and voice input capability captures media and supports simple local commands, but it does not yet define how AI combines live visual understanding with spoken intent. This change adds multimodal understanding so the system can answer object, scene, gesture, and contextual follow-up questions from video plus voice.

## What Changes

- Add multimodal AI intent understanding that analyzes sampled video content and voice instructions together.
- Add gesture and body-action recognition with spoken responses for simple user actions such as raising a hand or nodding.
- Add visual question answering for object identification, including an accuracy requirement for common objects.
- Add scene classification responses driven by live video when users ask what type of place they are in.
- Add continuous multi-turn dialogue context that remembers recently mentioned objects and topics.
- Add edge-side lightweight model responsibilities for scene classification and object-detection filtering to reduce cloud calls.
- Add cloud visual-language model responsibilities for complex visual QA, including optional region coordinates for explainability.

## Capabilities

### New Capabilities

### Modified Capabilities

- `realtime-vision-voice-ai-input`: Extend real-time media input requirements into multimodal understanding, gesture response, object and scene visual QA, dialogue memory, edge-side filtering, and cloud visual-language processing.

## Impact

- Affects the AI input pipeline, video frame sampling, speech transcription/dialogue orchestration, local vision inference, cloud VLM integration, response generation, and conversation memory.
- May require adding or wiring lightweight on-device vision models such as MobileNet-compatible classifiers/detectors.
- May require cloud model configuration for GPT-4V, LLaVA, or an equivalent visual-language backend that can answer visual QA and return referenced regions.
