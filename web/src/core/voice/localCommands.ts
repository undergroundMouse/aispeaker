export type LocalCommandAction =
  | 'greet'
  | 'goodbye'
  | 'stop-dialogue'
  | 'take-photo'
  | 'switch-language'
  | 'forget-custom-object'
  | 'undo-custom-object-teaching'

export interface LocalCommand {
  id: string
  action: LocalCommandAction
  phrases: string[]
  targetLanguage?: 'zh' | 'en'
}

export interface LocalCommandMatch {
  command: LocalCommand
  phrase: string
}

export const LOCAL_COMMANDS: LocalCommand[] = [
  {
    id: 'greet',
    action: 'greet',
    phrases: ['你好', '您好', 'hello', 'hi'],
  },
  {
    id: 'goodbye',
    action: 'goodbye',
    phrases: ['再见', '拜拜', 'goodbye', 'bye'],
  },
  {
    id: 'stop-dialogue',
    action: 'stop-dialogue',
    phrases: ['停止', '停止对话', 'stop', 'stop dialogue'],
  },
  {
    id: 'take-photo',
    action: 'take-photo',
    phrases: ['拍照', '截图', 'take photo', 'capture'],
  },
  {
    id: 'forget-custom-object',
    action: 'forget-custom-object',
    phrases: ['忘记那个物体', '忘记这个物体', 'forget that object', 'forget this object'],
  },
  {
    id: 'undo-custom-object-teaching',
    action: 'undo-custom-object-teaching',
    phrases: ['撤销最后一次教学', '撤销教学', 'undo last teaching', 'undo teaching'],
  },
  {
    id: 'switch-english',
    action: 'switch-language',
    targetLanguage: 'en',
    phrases: ['switch to english', 'english mode', '切换到英文', '切换到英语'],
  },
  {
    id: 'switch-chinese',
    action: 'switch-language',
    targetLanguage: 'zh',
    phrases: ['切换到中文', '中文模式', 'switch to chinese', 'chinese mode'],
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
  commands: LocalCommand[] = LOCAL_COMMANDS,
): LocalCommandMatch | null {
  const normalized = normalizePhrase(transcript)

  for (const command of commands) {
    const phrase = command.phrases.find((candidate) => normalizePhrase(candidate) === normalized)
    if (phrase) {
      return { command, phrase }
    }
  }

  return null
}
