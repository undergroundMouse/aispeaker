import { eventBus } from '../event-bus'
import type { ConversationManager } from '../conversation/ConversationManager'
import type { CloudGateway } from '../cloud/CloudGateway'
import type { LanguageStore } from '../i18n/LanguageStore'
import { getMessages } from '../i18n/messages'
import { LOCAL_COMMAND_EVENTS, VOICE_EVENTS, type LocalCommandResult, type VoiceTurn } from './types'
import { matchLocalCommand } from './localCommands'

export class LocalCommandRouter {
  private unsubscribe?: () => void
  private readonly conversationManager: ConversationManager
  private readonly cloudGateway: CloudGateway
  private readonly languageStore: LanguageStore

  constructor(
    conversationManager: ConversationManager,
    cloudGateway: CloudGateway,
    languageStore: LanguageStore,
  ) {
    this.conversationManager = conversationManager
    this.cloudGateway = cloudGateway
    this.languageStore = languageStore
  }

  start(): void {
    this.unsubscribe = eventBus.on<VoiceTurn>(VOICE_EVENTS.TURN_SUBMITTED, (turn) => {
      this.routeTurn(turn)
    })
  }

  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = undefined
  }

  private routeTurn(turn: VoiceTurn): void {
    const match = matchLocalCommand(turn.text)

    if (match) {
      const result = this.executeLocal(match.command.action, match.phrase, match.command.targetLanguage)
      eventBus.emit(LOCAL_COMMAND_EVENTS.EXECUTED, result)
      return
    }

    this.cloudGateway.submitComplexTurn(turn)
  }

  private executeLocal(
    action: LocalCommandResult['action'],
    phrase: string,
    targetLanguage?: 'zh' | 'en',
  ): LocalCommandResult {
    const text = getMessages(this.languageStore.getLanguage())

    switch (action) {
      case 'greet':
        this.conversationManager.setState('speaking')
        return {
          action,
          phrase,
          message: text.greet,
          handledLocally: true,
        }
      case 'goodbye':
        this.conversationManager.setState('idle')
        return {
          action,
          phrase,
          message: text.goodbye,
          handledLocally: true,
        }
      case 'stop-dialogue':
        this.conversationManager.setState('idle')
        return {
          action,
          phrase,
          message: text.stopDialogue,
          handledLocally: true,
        }
      case 'take-photo': {
        const saved = this.cloudGateway.capturePhoto()
        return {
          action,
          phrase,
          message: saved ? text.takePhotoOk : text.takePhotoFail,
          handledLocally: true,
        }
      }
      case 'switch-language': {
        if (targetLanguage) {
          this.languageStore.setLanguage(targetLanguage)
        }
        const next = getMessages(this.languageStore.getLanguage())
        return {
          action,
          phrase,
          message: targetLanguage === 'en' ? next.switchEn : next.switchZh,
          handledLocally: true,
          targetLanguage,
        }
      }
      default:
        return {
          action: 'greet',
          phrase,
          message: '已处理本地指令。',
          handledLocally: true,
        }
    }
  }
}
