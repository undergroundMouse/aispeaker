## 1. Evidence Data Model

- [x] 1.1 Extend `VisualAnswer` and related types with `explanation`, `evidenceAvailable`, and lightweight evidence metadata helpers.
- [x] 1.2 Add a serialized evidence payload size guard so per-frame region data stays under 200 bytes.
- [x] 1.3 Extend conversation memory entries to retain explanation text and evidence availability for recent visual answers.

## 2. Answer Generation and Provider Normalization

- [x] 2.1 Update local, custom-object, and memory answer builders to populate regions plus short local explanation templates when region evidence exists.
- [x] 2.2 Extend `CloudVisualLanguageProvider` adapters to request and normalize region coordinates and bundled explanation text in one response.
- [x] 2.3 Add uncertainty fallback behavior that clears regions, marks evidence unavailable, and returns phrasing such as "我不确定原因" when coordinates cannot be parsed.
- [x] 2.4 Add why-follow-up detection that reuses recent memory evidence before issuing a new cloud request.

## 3. Canvas Evidence Overlay

- [x] 3.1 Create a `VisualEvidenceOverlay` Canvas component aligned to the live video preview container.
- [x] 3.2 Draw normalized highlight boxes for active evidence regions and clear overlays when evidence expires or is unavailable.
- [x] 3.3 Integrate the overlay into the preview card while preserving the existing manual object-selection box for teaching flows.

## 4. Hook, TTS, and UI Wiring

- [x] 4.1 Extend `useRealtimeVisionVoice` with `activeVisualEvidence` lifecycle state, expiry rules, and interruption handling.
- [x] 4.2 Speak bundled explanation text through the existing `SpeechResponseController` when visual evidence is available.
- [x] 4.3 Update the UI to show active visual evidence on the preview and keep optional debug coordinate output for development only.

## 5. Tests and Verification

- [x] 5.1 Add unit tests for provider normalization, uncertainty fallback, evidence payload size limits, and why-follow-up reuse.
- [x] 5.2 Add tests for overlay state transitions and spoken explanation sequencing during image-related answers.
- [x] 5.3 Verify an end-to-end scenario such as "为什么你觉得这是苹果？" highlights the apple region and speaks feature-based reasoning.
