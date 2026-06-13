const TARGET_SAMPLE_RATE = 16_000
const FRAME_SAMPLES = 1_600

export function downsampleToPcm16(input: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    return floatTo16BitPcm(input)
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE
  const outputLength = Math.max(1, Math.round(input.length / ratio))
  const output = new Int16Array(outputLength)

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = Math.min(input.length - 1, Math.floor(index * ratio))
    const sample = input[sourceIndex] ?? 0
    const clamped = Math.max(-1, Math.min(1, sample))
    output[index] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }

  return output
}

export function floatTo16BitPcm(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let index = 0; index < input.length; index += 1) {
    const sample = input[index] ?? 0
    const clamped = Math.max(-1, Math.min(1, sample))
    output[index] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }
  return output
}

export interface PcmAudioCaptureSession {
  stop: () => Promise<void>
}

export interface StartPcm16CaptureOptions {
  audioContext?: AudioContext
}

export function createPcmCaptureAudioContext(): AudioContext {
  const audioContext = new AudioContext()
  void audioContext.resume()
  return audioContext
}

export async function startPcm16Capture(
  stream: MediaStream,
  onFrame: (frame: ArrayBuffer) => void,
  options: StartPcm16CaptureOptions = {},
): Promise<PcmAudioCaptureSession> {
  const audioContext = options.audioContext ?? createPcmCaptureAudioContext()
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  const source = audioContext.createMediaStreamSource(stream)
  const processor = audioContext.createScriptProcessor(4096, 1, 1)
  const silentGain = audioContext.createGain()
  silentGain.gain.value = 0

  let pending = new Int16Array(0)

  const appendSamples = (samples: Int16Array) => {
    if (samples.length === 0) {
      return
    }

    const merged = new Int16Array(pending.length + samples.length)
    merged.set(pending, 0)
    merged.set(samples, pending.length)
    pending = merged

    while (pending.length >= FRAME_SAMPLES) {
      const frame = pending.slice(0, FRAME_SAMPLES)
      pending = pending.slice(FRAME_SAMPLES)
      onFrame(frame.buffer.slice(frame.byteOffset, frame.byteOffset + frame.byteLength))
    }
  }

  processor.onaudioprocess = (event) => {
    const channel = event.inputBuffer.getChannelData(0)
    appendSamples(downsampleToPcm16(channel, audioContext.sampleRate))
  }

  source.connect(processor)
  processor.connect(silentGain)
  silentGain.connect(audioContext.destination)

  return {
    stop: async () => {
      if (pending.length > 0) {
        const frame = new Int16Array(FRAME_SAMPLES)
        frame.set(pending.slice(0, Math.min(pending.length, FRAME_SAMPLES)))
        onFrame(frame.buffer.slice(frame.byteOffset, frame.byteOffset + frame.byteLength))
        pending = new Int16Array(0)
      }

      processor.disconnect()
      source.disconnect()
      silentGain.disconnect()
      processor.onaudioprocess = null

      if (!options.audioContext) {
        await audioContext.close()
      }
    },
  }
}
