import type { MediaPrivacyConsent } from '../types'

export const MEDIA_PRIVACY_STORAGE_KEY = 'media-privacy-consent'

export const defaultMediaPrivacyConsent = (): MediaPrivacyConsent => ({
  cameraCapture: true,
  microphoneCapture: true,
  cloudMediaTransmission: false,
})

export function loadMediaPrivacyConsent(storage: Storage = localStorage): MediaPrivacyConsent {
  try {
    const raw = storage.getItem(MEDIA_PRIVACY_STORAGE_KEY)
    if (!raw) {
      return defaultMediaPrivacyConsent()
    }

    const parsed = JSON.parse(raw) as Partial<MediaPrivacyConsent>
    return {
      cameraCapture: parsed.cameraCapture ?? true,
      microphoneCapture: parsed.microphoneCapture ?? true,
      cloudMediaTransmission: parsed.cloudMediaTransmission ?? false,
    }
  } catch {
    return defaultMediaPrivacyConsent()
  }
}

export function saveMediaPrivacyConsent(
  consent: MediaPrivacyConsent,
  storage: Storage = localStorage,
): MediaPrivacyConsent {
  storage.setItem(MEDIA_PRIVACY_STORAGE_KEY, JSON.stringify(consent))
  return consent
}

export function isCameraCaptureAuthorized(consent: MediaPrivacyConsent): boolean {
  return consent.cameraCapture
}

export function isMicrophoneCaptureAuthorized(consent: MediaPrivacyConsent): boolean {
  return consent.microphoneCapture
}

export function isCloudMediaTransmissionAuthorized(consent: MediaPrivacyConsent): boolean {
  return consent.cloudMediaTransmission
}

export function canStartMediaCapture(consent: MediaPrivacyConsent): boolean {
  return consent.cameraCapture || consent.microphoneCapture
}
