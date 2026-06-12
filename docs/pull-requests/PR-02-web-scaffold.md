# PR-02: 初始化 Vite React 前端工程

## 标题

feat(web): 初始化 Vite + React + TypeScript 前端工程（HTTPS 开发服务器）

## 功能描述

在 `web/` 目录搭建前端工程骨架，支持 `npm run dev` 启动 HTTPS 开发服务器，为后续摄像头 API 调用提供安全上下文。

## 实现思路

- 使用 Vite `react-ts` 模板
- 集成 `@vitejs/plugin-basic-ssl` 自动启用 HTTPS
- 保留默认欢迎页，验证工具链可用

## 测试方式

```bash
cd web
npm install
npm run dev
```

1. 浏览器打开 `https://localhost:5173/`，接受自签名证书
2. 页面正常显示 Vite + React 默认页
3. `npm run build` 构建成功
