# PR-06: 接入 AI 消费者桩与启动编排

## 标题

feat(web): 接入 AI 消费者桩模块与应用启动编排

## 功能描述

完成摄像头 → 抽帧 → AI 输入的端到端接线：`LocalInferenceEngine` 接收原始帧并日志输出，`CloudGateway` 缓存最新缩略图供后续 `/vision/chat` 调用。`appCore` 单例统一初始化各模块。

## 实现思路

- `LocalInferenceEngine` 订阅 `media:frame:raw`，`console.debug` 输出帧信息
- `CloudGateway` 订阅 `media:frame:thumbnail`，提供 `getLatestThumbnail()`
- `bootstrap.ts`：`appCore` 在流激活时启动 `FrameSampler`，停止时释放
- `App.tsx` 挂载时 `appCore.init()`，卸载时 `destroy()`
- 视频数据仅内存传递，不写入 localStorage / IndexedDB

## 测试方式

```bash
cd web
npm install
npm run dev
```

1. 打开摄像头，浏览器控制台应出现 `[LocalInferenceEngine] frame received` 日志
2. 在控制台执行（或通过后续 API）验证 `appCore.cloudGateway.getLatestThumbnail()` 返回 Blob
3. 关闭摄像头后日志停止、预览隐藏
4. `npm run build` 构建成功
