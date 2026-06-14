import { OMNI_OUTPUT_SAMPLE_RATE } from '@ai/shared'

export class OmniPcmPlaybackQueue {
  private readonly audioContext: AudioContext
  private nextStartTime = 0

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext ?? new AudioContext()
    void this.audioContext.resume()
  }

  getAudioContext(): AudioContext {
    return this.audioContext
  }

  enqueueBase64Pcm(base64: string, sampleRate = OMNI_OUTPUT_SAMPLE_RATE): void {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2))
    this.enqueuePcm16(pcm, sampleRate)
  }

  enqueuePcm16(pcm: Int16Array, sampleRate = OMNI_OUTPUT_SAMPLE_RATE): void {
    if (pcm.length === 0) {
      return
    }

    const float32 = new Float32Array(pcm.length)
    for (let index = 0; index < pcm.length; index += 1) {
      float32[index] = (pcm[index] ?? 0) / 0x8000
    }

    const buffer = this.audioContext.createBuffer(1, float32.length, sampleRate)
    buffer.copyToChannel(float32, 0)

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.audioContext.destination)

    const startAt = Math.max(this.audioContext.currentTime, this.nextStartTime)
    source.start(startAt)
    this.nextStartTime = startAt + buffer.duration
  }

  reset(): void {
    this.nextStartTime = 0
  }

  async close(): Promise<void> {
    await this.audioContext.close()
  }
}
