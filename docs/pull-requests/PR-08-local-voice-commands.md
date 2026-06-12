# PR-08: 端侧简单语音指令

## 标题

feat(web): 实现端侧简单语音指令识别与本地动作触发

## 功能描述

在语音识别结果基础上，新增 6 组中英文本地指令（问候、再见、停止对话、拍照、切换语言占位）。匹配成功的指令在端侧直接执行，不经过云端；未匹配内容交给 `CloudGateway` 作为复杂请求处理。

## 实现思路

- `localCommands.ts`：配置 5~10 个短语别名，提供 `normalizePhrase` 与 `matchLocalCommand`
- `LocalCommandRouter`：订阅 `voice:turn:submitted`，本地命中则执行动作并发布 `voice:local-command:executed`
- `CloudGateway.capturePhoto()`：使用最新缩略图触发浏览器下载，实现「拍照」
- `VoiceInputManager` 不再直接置 `thinking`，由路由层决定对话状态
- `Toolbar` 展示最近一次本地指令反馈

## 测试方式

```bash
cd web
npm install
npm run dev
```

1. 打开摄像头与麦克风，按住说话说「你好」，工具栏应显示「本地: 你好，我在。」
2. 说「停止对话」，对话状态回到 `idle`，显示「已停止对话。」
3. 打开摄像头后说「拍照」，应下载一张 JPEG 缩略图
4. 说「今天天气怎么样」等非本地指令，控制台出现 `[CloudGateway] complex turn queued`
5. `npm run build` 构建成功
