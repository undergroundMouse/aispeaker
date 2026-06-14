export interface AecProcessorOptions {
  suppressionGain?: number
}

export class AecProcessor {
  private readonly suppressionGain: number
  private ttsReferenceRms = 0

  constructor(options: AecProcessorOptions = {}) {
    this.suppressionGain = options.suppressionGain ?? 0.35
  }

  setTtsReferenceRms(rms: number): void {
    this.ttsReferenceRms = rms
  }

  processMicRms(micRms: number): number {
    if (this.ttsReferenceRms <= 0) {
      return micRms
    }

    const echoEstimate = this.ttsReferenceRms * this.suppressionGain
    return Math.max(0, micRms - echoEstimate)
  }

  shouldSuppressAsr(micRms: number): boolean {
    const adjusted = this.processMicRms(micRms)
    return adjusted < 0.01 && this.ttsReferenceRms > 0.05
  }
}
