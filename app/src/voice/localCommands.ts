import type { LocalCommand, LocalCommandMatch, NetworkState } from '../types'

export const localCommands: LocalCommand[] = [
  {
    id: 'greet',
    action: 'greet',
    phrases: ['你好', '您好', 'hello', 'hi'],
    requiresNetwork: false,
  },
  {
    id: 'goodbye',
    action: 'goodbye',
    phrases: ['再见', '拜拜', 'goodbye', 'bye'],
    requiresNetwork: false,
  },
  {
    id: 'stop-dialogue',
    action: 'stop-dialogue',
    phrases: ['停止', '停止对话', 'stop', 'stop dialogue'],
    requiresNetwork: false,
  },
  {
    id: 'take-photo',
    action: 'take-photo',
    phrases: ['拍照', '截图', 'take photo', 'capture'],
    requiresNetwork: false,
  },
  {
    id: 'forget-custom-object',
    action: 'forget-custom-object',
    phrases: ['忘记那个物体', '忘记这个物体', 'forget that object', 'forget this object'],
    requiresNetwork: false,
  },
  {
    id: 'undo-custom-object-teaching',
    action: 'undo-custom-object-teaching',
    phrases: ['撤销最后一次教学', '撤销教学', 'undo last teaching', 'undo teaching'],
    requiresNetwork: false,
  },
  {
    id: 'disable-proactive-prompts',
    action: 'disable-proactive-prompts',
    phrases: ['闭嘴别主动说话', '闭嘴，别主动说话', '别主动说话', 'stop proactive prompts'],
    requiresNetwork: false,
  },
  {
    id: 'increase-proactive-prompts',
    action: 'increase-proactive-prompts',
    phrases: ['多提醒我', '多提醒提醒我', 'remind me more'],
    requiresNetwork: false,
  },
  {
    id: 'proactive-prompt-wrong',
    action: 'proactive-prompt-wrong',
    phrases: ['错了', '你说错了', 'wrong', 'that was wrong'],
    requiresNetwork: false,
  },
  {
    id: 'switch-english',
    action: 'switch-language',
    language: 'en',
    targetLanguage: 'en',
    phrases: ['switch to english', 'english mode', '切换到英文', '切换到英语'],
    requiresNetwork: false,
  },
  {
    id: 'switch-chinese',
    action: 'switch-language',
    language: 'zh',
    targetLanguage: 'zh',
    phrases: ['切换到中文', '中文模式', 'switch to chinese', 'chinese mode'],
    requiresNetwork: false,
  },
]

export function normalizePhrase(input: string): string {
  return input
    .trim()
    .toLocaleLowerCase()
    .replace(/[，。！？,.!?]/g, '')
    .replace(/\s+/g, ' ')
}

export function matchLocalCommand(
  transcript: string,
  commands: LocalCommand[] = localCommands,
): LocalCommandMatch | null {
  const normalizedTranscript = normalizePhrase(transcript)

  for (const command of commands) {
    const phrase = command.phrases.find((candidate) => normalizePhrase(candidate) === normalizedTranscript)

    if (phrase) {
      return { command, phrase }
    }
  }

  return null
}

export function canRouteComplexRequest(networkState: NetworkState): boolean {
  return networkState === 'online'
}
