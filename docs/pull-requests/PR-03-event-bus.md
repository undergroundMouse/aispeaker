# PR-03: 添加类型化事件总线

## 标题

feat(web): 添加类型化事件总线核心模块

## 功能描述

引入微内核事件总线 `EventBus`，供各核心模块（媒体、对话、推理、云端网关）解耦通信。本 PR 仅添加模块，不改变现有 UI 行为。

## 实现思路

- `src/core/event-bus/EventBus.ts`：`on` / `off` / `emit` API
- 导出单例 `eventBus` 供全局使用
- 无第三方依赖

## 测试方式

```bash
cd web
npm install
npm run build
```

1. TypeScript 编译无错误
2. 开发服务器仍可正常启动并显示默认页
