import { eventBus } from '../event-bus'
import { type AppLanguage } from './messages'

export const LANGUAGE_EVENTS = {
  CHANGED: 'i18n:language-changed',
} as const

export interface LanguageChangedPayload {
  language: AppLanguage
}

export class LanguageStore {
  private language: AppLanguage = 'zh'

  getLanguage(): AppLanguage {
    return this.language
  }

  setLanguage(language: AppLanguage): void {
    if (this.language === language) return
    this.language = language
    eventBus.emit(LANGUAGE_EVENTS.CHANGED, { language })
  }
}
