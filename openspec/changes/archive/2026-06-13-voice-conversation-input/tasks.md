## 1. Voice Types and Events

- [x] 1.1 Define voice input states, error codes, turn metadata, and event constants in `src/core/voice/types.ts`
- [x] 1.2 Add voice error mapping helpers mirroring the camera error pattern

## 2. Voice Adapters

- [x] 2.1 Define `SpeechRecognitionAdapter` and `WakeDetector` interfaces
- [x] 2.2 Implement browser `SpeechRecognitionAdapter` with graceful fallback when unsupported
- [x] 2.3 Implement `BrowserWakeDetector` stub that reports unavailable wake support

## 3. Voice Input Manager

- [x] 3.1 Implement `VoiceInputManager` with microphone `getUserMedia`, track cleanup, and state emission
- [x] 3.2 Add press-to-talk start/stop flow that submits audio for transcription
- [x] 3.3 Add optional wake-listening enable/disable with unavailable fallback
- [x] 3.4 Emit final transcript and conversation turn events; drive `ConversationManager` state transitions

## 4. Bootstrap Integration

- [x] 4.1 Wire `VoiceInputManager` into `appCore` init/destroy lifecycle
- [x] 4.2 Ensure microphone tracks stop on disable and page `beforeunload`

## 5. UI and Privacy

- [x] 5.1 Add toolbar controls for voice enable, wake toggle, and press-to-talk
- [x] 5.2 Display current voice input state and last transcript in the UI
- [x] 5.3 Verify no raw audio is written to localStorage, IndexedDB, or remote endpoints

## 6. Manual Verification

- [x] 6.1 Test microphone permission grant: voice becomes active and press-to-talk works
- [x] 6.2 Test permission deny: error state shown with retry path
- [x] 6.3 Test wake unavailable fallback: manual trigger still works
- [x] 6.4 Test voice disable: tracks released and state returns to inactive
