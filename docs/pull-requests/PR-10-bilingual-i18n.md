# PR-10: 中英文多语言

## 标题

feat(web): 支持中英文界面与语音命令切换语言

## 功能描述

新增应用语言状态与文案表。界面按钮、提示语、本地指令反馈和弱网重试提示会随当前语言切换。用户可通过语音说「switch to English」或「切换到中文」完成语言切换。

## 实现思路

- `LanguageStore` 维护 `zh` / `en` 状态，并发布 `i18n:language-changed` 事件
- `messages.ts` 集中管理界面与反馈文案
- `LocalCommandRouter` 在 `switch-language` 指令时更新语言，并返回对应反馈
- `CloudGateway` 弱网提示使用当前语言文案
- `Toolbar` 与 `App` 订阅语言变化并重新渲染

## 测试方式

```bash
cd web
npm install
npm run dev
```

1. 默认界面为中文，按钮显示「打开摄像头」「按住说话」等
2. 打开麦克风，说「switch to English」，界面切换为英文按钮文案
3. 说「switch to chinese」或「切换到中文」，界面恢复中文
4. 英文模式下点击「Simulate weak network」后说复杂语句，提示为英文重试文案
5. `npm run build` 构建成功
