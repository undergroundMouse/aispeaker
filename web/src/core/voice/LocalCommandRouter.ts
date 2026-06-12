import { eventBus } from '../event-bus'
import type { ConversationManager } from '../conversation/ConversationManager'
import type { CloudGateway } from '../cloud/CloudGateway'
import { LOCAL_COMMAND_EVENTS, VOICE_EVENTS, type LocalCommandResult, type VoiceTurn } from './types'
import { matchLocalCommand } from './localCommands'

export class LocalCommandRouter {
  private unsubscribe?: () => void
  private readonly conversationManager: ConversationManager
  private readonly cloudGateway: CloudGateway

  constructor(conversationManager: ConversationManager, cloudGateway: CloudGateway) {
    this.conversationManager = conversationManager
    this.cloudGateway = cloudGateway
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
    switch (action) {
      case 'greet':
        this.conversationManager.setState('speaking')
        return {
          action,
          phrase,
          message: '你好，我在。',
          handledLocally: true,
        }
      case 'goodbye':
        this.conversationManager.setState('idle')
        return {
          action,
          phrase,
          message: '再见。',
          handledLocally: true,
        }
      case 'stop-dialogue':
        this.conversationManager.setState('idle')
        return {
          action,
          phrase,
          message: '已停止对话。',
          handledLocally: true,
        }
      case 'take-photo': {
        const saved = this.cloudGateway.capturePhoto()
        return {
          action,
          phrase,
          message: saved ? '已触发拍照。' : '暂无可用画面，请先打开摄像头。',
          handledLocally: true,
        }
      }
      case 'switch-language':
        return {
          action,
          phrase,
          message:
            targetLanguage === 'en' ? 'Language switch will apply in PR-10.' : '语言切换将在 PR-10 生效。',
          handledLocally: true,
          targetLanguage,
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
