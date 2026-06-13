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
      void this.executeLocal(
        match.command.action,
        match.phrase,
        match.command.targetLanguage,
      ).then((result) => {
        eventBus.emit(LOCAL_COMMAND_EVENTS.EXECUTED, result)
      })
      return
    }

    void this.cloudGateway.submitComplexTurn(turn)
  }

  private async executeLocal(
    action: LocalCommandResult['action'],
    phrase: string,
    targetLanguage?: 'zh' | 'en',
  ): Promise<LocalCommandResult> {
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
      case 'forget-custom-object': {
        const deleted = await this.cloudGateway.forgetLastCustomObject()
        return {
          action,
          phrase,
          message: deleted
            ? (this.languageStore.getLanguage() === 'zh'
                ? '已忘记该物体。'
                : 'I forgot that object.')
            : (this.languageStore.getLanguage() === 'zh'
                ? '我还不知道你指的是哪个物体。'
                : 'I am not sure which object you mean.'),
          handledLocally: true,
        }
      }
      case 'undo-custom-object-teaching': {
        const undone = await this.cloudGateway.undoLastCustomObjectTeaching()
        return {
          action,
          phrase,
          message: undone
            ? (this.languageStore.getLanguage() === 'zh'
                ? '已撤销最后一次教学。'
                : 'I undid the last teaching.')
            : (this.languageStore.getLanguage() === 'zh'
                ? '没有可撤销的教学记录。'
                : 'There is no teaching action to undo.'),
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
