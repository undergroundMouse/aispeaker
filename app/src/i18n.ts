import type { AppLanguage } from './types'

export type SurfaceMessages = {
  title: string
  subtitle: string
  startPushToTalk: string
  stopPushToTalk: string
  retryNetwork: string
  watchOnly: string
  cameraUnavailable: string
  microphoneUnavailable: string
  openSettings: string
  closeSettings: string
  openOperator: string
  backToAssist: string
  settingsTitle: string
  settingsPrivacy: string
  settingsDialogue: string
  settingsMemory: string
  authorizeCamera: string
  authorizeMicrophone: string
  authorizeCloudMedia: string
  allowCloudMemory: string
  enableSummarySync: string
  selectCenterObject: string
  teachingHint: string
  conversationEmpty: string
  roleUser: string
  roleAssistant: string
  roleSystem: string
  roleProactive: string
  statusNetwork: string
  statusCloud: string
  statusProactive: string
  statusSpeech: string
  cloudBackend: string
  cloudQwen: string
  cloudMock: string
  on: string
  off: string
  operatorTitle: string
  operatorSubtitle: string
  operatorOverview: string
  operatorTelemetry: string
  dailySpend: string
  cloudReduction: string
  setBudgetCap: string
  clearBudgetCap: string
  estimatedTokens: string
  actualTokens: string
  noTelemetry: string
  showDebug: string
  hideDebug: string
  runtimeState: string
  transcriptSimulator: string
  transcriptPlaceholder: string
  processTranscript: string
  undoTeaching: string
  simulateWeakNetwork: string
  localProcessing: string
  lastLocalCommand: string
  lastDialogueEvent: string
  lastAiFrame: string
  waitingForFrame: string
  visualAnswer: string
  localVision: string
  noAnalysisYet: string
  proactivePrompts: string
  memory: string
  noVisualContext: string
  longTermMemoryTitle: string
  longTermMemoryUnavailable: string
  visualEvidence: string
  highlightActive: string
  noVisualEvidence: string
  showDebugCoordinates: string
  noRegions: string
  selectedObjectRegion: string
  noSelectedRegion: string
  debugTelemetry: string
  speechOutput: string
  latency: string
  noLatency: string
  learnedObjectsTitle: string
  exportLearnedObjects: string
  forgetObject: string
  noCustomObjects: string
  forgetAllMemories: string
  exportMemories: string
  deleteMemory: string
  noLongTermMemories: string
  lastUsed: string
  weakened: string
  staleMemoryWarning: (count: number) => string
  longTermMemorySummary: (count: number, cloudAccess: boolean, summarySync: boolean) => string
}

export const messages = {
  zh: {
    title: '实时视觉语音 AI 输入',
    subtitle: 'WebRTC 摄像头/麦克风采集、端侧简单指令、弱网降级和节能采样原型。',
    startPushToTalk: '按住说话',
    stopPushToTalk: '松开结束',
    retryNetwork: '网络不佳，请重试',
    watchOnly: '只看不对话',
    cameraUnavailable: '摄像头不可用',
    microphoneUnavailable: '麦克风不可用',
    openSettings: '设置',
    closeSettings: '关闭',
    openOperator: '运营台',
    backToAssist: '返回 Assist',
    settingsTitle: '设置',
    settingsPrivacy: '隐私与授权',
    settingsDialogue: '对话偏好',
    settingsMemory: '我的记忆',
    authorizeCamera: '授权摄像头采集',
    authorizeMicrophone: '授权麦克风采集',
    authorizeCloudMedia: '授权云端画面传输',
    allowCloudMemory: '允许云端访问相关长期记忆',
    enableSummarySync: '启用仅摘要云端记忆同步',
    selectCenterObject: '框选中央物体',
    teachingHint: '教学前请点击画面或框选物体区域。',
    conversationEmpty: '开始说话后，AI 回复会显示在这里。',
    roleUser: '你',
    roleAssistant: 'AI',
    roleSystem: '系统',
    roleProactive: '主动提醒',
    statusNetwork: '网络',
    statusCloud: '云端',
    statusProactive: '主动提醒',
    statusSpeech: '语音',
    cloudBackend: 'backend+Qwen3-VL',
    cloudQwen: 'Qwen3-VL',
    cloudMock: 'mock',
    on: '开',
    off: '关',
    operatorTitle: '运营台',
    operatorSubtitle: '查看会话成本、token 消耗与每日预算配置。',
    operatorOverview: '成本概览',
    operatorTelemetry: '会话遥测',
    dailySpend: '今日花费',
    cloudReduction: '云端削减率',
    setBudgetCap: '设置每日预算上限 $0.01',
    clearBudgetCap: '清除预算上限',
    estimatedTokens: '预估 tokens',
    actualTokens: '实际 tokens',
    noTelemetry: '暂无会话遥测',
    showDebug: '展开调试面板',
    hideDebug: '收起调试面板',
    runtimeState: '运行时状态',
    transcriptSimulator: '语音转写模拟器',
    transcriptPlaceholder: '你好 / stop / take photo / switch to English',
    processTranscript: '处理转写',
    undoTeaching: '撤销教学',
    simulateWeakNetwork: '模拟弱网',
    localProcessing: '本地处理',
    lastLocalCommand: '最近本地指令',
    lastDialogueEvent: '最近对话事件',
    lastAiFrame: '最近 AI 帧',
    waitingForFrame: '等待摄像头帧',
    visualAnswer: '视觉答案',
    localVision: '本地视觉',
    noAnalysisYet: '尚无分析',
    proactivePrompts: '主动提示',
    memory: '会话记忆',
    noVisualContext: '尚无视觉上下文',
    longTermMemoryTitle: '长期记忆',
    longTermMemoryUnavailable: '本地长期记忆不可用',
    visualEvidence: '视觉证据',
    highlightActive: '预览区高亮已激活',
    noVisualEvidence: '无视觉证据',
    showDebugCoordinates: '显示调试坐标',
    noRegions: '无可用区域',
    selectedObjectRegion: '已选物体区域',
    noSelectedRegion: '未选择物体区域',
    debugTelemetry: '调试遥测',
    speechOutput: '语音输出',
    latency: '延迟',
    noLatency: '尚未测量语音延迟',
    learnedObjectsTitle: '已学物体',
    exportLearnedObjects: '导出已学物体',
    forgetObject: '忘记',
    noCustomObjects: '暂无已学物体',
    forgetAllMemories: '忘记全部长期记忆',
    exportMemories: '导出长期记忆',
    deleteMemory: '删除',
    noLongTermMemories: '暂无长期记忆',
    lastUsed: '最近使用',
    weakened: '已弱化',
    staleMemoryWarning: (count: number) => `${count} 条长期记忆已超过 30 天未使用，建议复查。`,
    longTermMemorySummary: (count, cloudAccess, summarySync) =>
      `${count} 条本地加密记忆，云端访问：${cloudAccess ? '已授权' : '关闭'}，摘要同步：${summarySync ? '开' : '关'}`,
  },
  en: {
    title: 'Realtime Vision Voice AI Input',
    subtitle:
      'A WebRTC camera/microphone capture prototype with local commands, network fallback, and sampling throttles.',
    startPushToTalk: 'Hold to talk',
    stopPushToTalk: 'Release to stop',
    retryNetwork: 'Network is poor. Please try again.',
    watchOnly: 'Watch-only',
    cameraUnavailable: 'Camera unavailable',
    microphoneUnavailable: 'Microphone unavailable',
    openSettings: 'Settings',
    closeSettings: 'Close',
    openOperator: 'Operator',
    backToAssist: 'Back to Assist',
    settingsTitle: 'Settings',
    settingsPrivacy: 'Privacy and consent',
    settingsDialogue: 'Dialogue preferences',
    settingsMemory: 'My memory',
    authorizeCamera: 'Authorize camera capture',
    authorizeMicrophone: 'Authorize microphone capture',
    authorizeCloudMedia: 'Authorize cloud media transmission',
    allowCloudMemory: 'Allow cloud access to relevant long-term memory',
    enableSummarySync: 'Enable summary-only cloud memory sync',
    selectCenterObject: 'Select center object',
    teachingHint: 'Tap the preview or select a region before teaching an object.',
    conversationEmpty: 'AI responses will appear here after you speak.',
    roleUser: 'You',
    roleAssistant: 'AI',
    roleSystem: 'System',
    roleProactive: 'Proactive',
    statusNetwork: 'Network',
    statusCloud: 'Cloud',
    statusProactive: 'Proactive',
    statusSpeech: 'Speech',
    cloudBackend: 'backend+Qwen3-VL',
    cloudQwen: 'Qwen3-VL',
    cloudMock: 'mock',
    on: 'on',
    off: 'off',
    operatorTitle: 'Operator dashboard',
    operatorSubtitle: 'Review conversation cost, token usage, and daily budget settings.',
    operatorOverview: 'Spend overview',
    operatorTelemetry: 'Conversation telemetry',
    dailySpend: 'Daily spend',
    cloudReduction: 'Cloud reduction',
    setBudgetCap: 'Set daily budget cap to $0.01',
    clearBudgetCap: 'Clear daily budget cap',
    estimatedTokens: 'est tokens',
    actualTokens: 'actual tokens',
    noTelemetry: 'No conversation telemetry yet',
    showDebug: 'Show debug panel',
    hideDebug: 'Hide debug panel',
    runtimeState: 'Runtime state',
    transcriptSimulator: 'Voice transcript simulator',
    transcriptPlaceholder: 'hello / stop / take photo / switch to English',
    processTranscript: 'Process transcript',
    undoTeaching: 'Undo teaching',
    simulateWeakNetwork: 'Simulate weak network',
    localProcessing: 'Local processing',
    lastLocalCommand: 'Last local command',
    lastDialogueEvent: 'Last dialogue event',
    lastAiFrame: 'Last AI frame',
    waitingForFrame: 'Waiting for camera frame',
    visualAnswer: 'Visual answer',
    localVision: 'Local vision',
    noAnalysisYet: 'No analysis yet',
    proactivePrompts: 'Proactive prompts',
    memory: 'Memory',
    noVisualContext: 'No visual context remembered',
    longTermMemoryTitle: 'Long-term memory',
    longTermMemoryUnavailable: 'Local long-term memory unavailable',
    visualEvidence: 'Visual evidence',
    highlightActive: 'Highlight active on preview.',
    noVisualEvidence: 'No active visual evidence',
    showDebugCoordinates: 'Show debug coordinates',
    noRegions: 'No regions available',
    selectedObjectRegion: 'Selected object region',
    noSelectedRegion: 'No selected object region',
    debugTelemetry: 'Debug telemetry',
    speechOutput: 'Speech output',
    latency: 'Latency',
    noLatency: 'No voice latency measured',
    learnedObjectsTitle: 'Learned custom objects',
    exportLearnedObjects: 'Export learned objects',
    forgetObject: 'Forget',
    noCustomObjects: 'No custom objects learned',
    forgetAllMemories: 'Forget all long-term memories',
    exportMemories: 'Export long-term memories',
    deleteMemory: 'Delete',
    noLongTermMemories: 'No long-term memories stored',
    lastUsed: 'last used',
    weakened: 'weakened',
    staleMemoryWarning: (count: number) =>
      `${count} long-term memories need review after 30 days without use.`,
    longTermMemorySummary: (count, cloudAccess, summarySync) =>
      `${count} local encrypted memories, cloud access: ${cloudAccess ? 'authorized' : 'off'}, summary sync: ${summarySync ? 'on' : 'off'}`,
  },
} satisfies Record<AppLanguage, SurfaceMessages>

export function getMessages(language: AppLanguage): SurfaceMessages {
  return messages[language]
}
