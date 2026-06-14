import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defaultMediaPrivacyConsent,
  isCameraCaptureAuthorized,
  isCloudMediaTransmissionAuthorized,
  loadMediaPrivacyConsent,
  saveMediaPrivacyConsent,
} from './mediaPrivacy'

describe('mediaPrivacy', () => {
  beforeEach(() => {
    const storage = {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null
      },
      setItem(key: string, value: string) {
        this.store[key] = value
      },
    }
    vi.stubGlobal('localStorage', storage)
  })

  it('loads default consent when storage is empty', () => {
    expect(loadMediaPrivacyConsent()).toEqual(defaultMediaPrivacyConsent())
  })

  it('persists and reloads consent', () => {
    saveMediaPrivacyConsent({
      cameraCapture: false,
      microphoneCapture: true,
      cloudMediaTransmission: true,
    })

    expect(loadMediaPrivacyConsent()).toEqual({
      cameraCapture: false,
      microphoneCapture: true,
      cloudMediaTransmission: true,
    })
  })

  it('checks authorization flags', () => {
    const consent = {
      cameraCapture: true,
      microphoneCapture: false,
      cloudMediaTransmission: false,
    }

    expect(isCameraCaptureAuthorized(consent)).toBe(true)
    expect(isCloudMediaTransmissionAuthorized(consent)).toBe(false)
  })
})
