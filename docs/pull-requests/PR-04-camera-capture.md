# PR-04: 实现摄像头采集与实时预览

## 标题

feat(web): 实现设备摄像头采集与实时预览

## 功能描述

用户点击「打开摄像头」后，系统请求浏览器摄像头权限，获取 MediaStream 并显示实时预览。权限拒绝或设备不可用时展示错误信息与重试按钮。关闭摄像头后立即释放硬件资源。

## 实现思路

- `MediaStreamManager`：`getUserMedia` 视频流管理，`start()` / `stop()` 生命周期
- 错误映射：`NotAllowedError` → 权限拒绝，`NotFoundError` → 无设备，`NotReadableError` → 设备占用
- 通过 `media:stream:state` 事件广播状态
- `CameraPreview` 组件绑定 MediaStream 渲染预览

## 测试方式

```bash
cd web
npm install
npm run dev
```

1. 打开 `https://localhost:5173/`，点击「打开摄像头」
2. 授权后应看到实时画面；点击「关闭摄像头」后预览消失
3. 拒绝权限时应显示中文错误提示与「重试」按钮
4. 打开浏览器控制台，确认无报错
