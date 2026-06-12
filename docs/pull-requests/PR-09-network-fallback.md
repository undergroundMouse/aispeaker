# PR-09: 弱网与离线降级

## 标题

feat(web): 实现弱网/离线降级与复杂请求重试提示

## 功能描述

新增网络状态监测。弱网或离线时，本地简单指令仍可执行；需要云端处理的复杂语音请求会被拦截，并在界面提示「网络不佳，请重试」。

## 实现思路

- `NetworkMonitor` 综合 `navigator.onLine` 与最近云端失败时间推导 `online` / `weak` / `offline`
- `CloudGateway.submitComplexTurn` 在弱网/离线时发布 `network:retry-prompt`，不发起云端请求
- 本地指令路由保持不变，弱网下「停止对话」「拍照」等仍可执行
- `Toolbar` 展示网络状态，并提供「模拟弱网」按钮便于演示

## 测试方式

```bash
cd web
npm install
npm run dev
```

1. 打开麦克风，说「停止对话」，应正常执行本地指令
2. 点击「模拟弱网」，网络状态显示 `weak`
3. 再说一句非本地指令（如「帮我分析画面」），工具栏显示「网络不佳，请重试」
4. 弱网状态下说「拍照」，若摄像头已开，仍应触发本地下载
5. `npm run build` 构建成功
