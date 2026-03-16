# Zchat Electron 多端适配指南

## 已完成的配置

项目已成功集成 Electron，支持以下功能：

### 📦 新增文件
- `electron/main.ts` - Electron 主进程文件
- `electron/preload.ts` - 预加载脚本
- `src/types/electron.d.ts` - TypeScript 类型声明
- `tsconfig.electron.json` - Electron 专用 TypeScript 配置

### 🔧 更新的文件
- `vite.config.ts` - 集成 Vite + Electron 插件
- `package.json` - 添加 Electron 相关脚本和配置
- `.gitignore` - 排除 Electron 构建产物

## 使用方法

### 开发模式
```bash
cd frontend
npm run electron:dev
```

这将启动 Vite 开发服务器和 Electron 应用。

### 预览构建
```bash
# 先构建前端
npm run build

# 然后预览 Electron 应用
npm run electron:preview
```

### 打包应用

#### Windows
```bash
npm run build:win
```
生成的文件在 `release/` 目录下。

#### macOS
```bash
npm run build:mac
```

#### Linux
```bash
npm run build:linux
```

### 完整构建
```bash
npm run electron:build
```
这会根据当前平台自动构建。

## 主要特性

### 窗口控制
- 最小化、最大化、关闭窗口
- 最小尺寸限制：900x600
- 默认尺寸：1200x800

### 安全设置
- 上下文隔离（Context Isolation）已启用
- Node.js 集成已禁用
- 预加载脚本暴露安全的 API

### 开发工具
- 开发模式下自动打开 DevTools
- 热重载支持

## API 接口

通过 `window.electron` 可以访问以下方法：

```typescript
// 获取应用版本
window.electron.getAppVersion()

// 窗口控制
window.electron.minimizeWindow()
window.electron.maximizeWindow()
window.electron.closeWindow()
```

## 后续优化建议

1. **应用图标**：替换默认的 vite.svg 为自定义图标
2. **自定义标题栏**：实现自定义的窗口标题栏
3. **系统托盘**：添加系统托盘图标和菜单
4. **自动更新**：集成 electron-updater
5. **原生通知**：使用 Electron 的 Notification API
6. **文件系统**：添加文件读写功能（通过 preload）
7. **快捷键**：添加全局快捷键支持

## 注意事项

1. 确保后端服务正常运行
2. 开发时需要同时启动后端和前端
3. 打包前先测试开发模式是否正常
4. 不同平台的打包需要在对应平台上进行
