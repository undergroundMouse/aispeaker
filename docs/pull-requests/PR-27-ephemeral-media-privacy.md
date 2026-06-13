# PR-27: 临时媒体隐私

## 标题

feat(web): 实现音视频临时处理与显式采集授权（FR-52）

## 功能描述

为摄像头、麦克风和云端媒体传输增加可撤销的显式授权设置。原始音视频仅在内存中处理，处理完成后立即释放 blob 引用，不写入 IndexedDB 或文件系统。用户可在「Media privacy」区域查看并关闭各项授权。

## 实现思路

- `mediaPrivacy.ts`：localStorage 持久化 `MediaPrivacyConsent`
- `ephemeralMedia.ts`：`releaseSampledVideoFrame` 与 `stripMediaForCloud` 辅助函数
- `mediaCapture.ts`：采集前检查授权，分别请求摄像头/麦克风
- `useRealtimeVisionVoice`：采样回调中释放上一帧；授权变更后重新初始化媒体

## 测试方式

```bash
cd web
npm test -- mediaPrivacy ephemeralMedia mediaCapture
npm run dev
```

1. 打开应用，确认默认授权状态下摄像头/麦克风正常初始化
2. 取消「Authorize camera capture」和「Authorize microphone capture」，确认采集被阻止
3. 运行相关单元测试，全部通过

> **合并说明**：本 PR 基于 PR-26，仅包含 FR-52 临时媒体隐私，不包含网关、导出或运营后台能力。
