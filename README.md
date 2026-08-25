## 🎨 原创作者 · B站 [Annore](https://space.bilibili.com/447553626)

> **作者 B站用户名：Annore**
> B站主页：https://space.bilibili.com/447553626
> 尊重原作者的劳动成果，转载 / 二创请在显眼处保留此署名。

# Windows 11 Web — Win11 网页版

纯前端（无构建、无框架、无 npm）的 Windows 11 桌面复刻，直接打开 `index.html` 即可体验。

## ✨ 功能特性

- 开机 / 锁屏 / 登录界面
- 桌面图标、任务栏、开始菜单、搜索、小组件
- 多窗口窗口管理器（拖动 / 缩放 / Snap 贴靠 / 任务视图 / Alt+Tab）
- 内置应用：文件资源管理器、设置、记事本、计算器、终端、画图、照片、Edge、商店、任务管理器、媒体播放器、时钟、日历、扫雷等
- 系统音效由 WebAudio 合成，无外部依赖
- 支持 `?debug=1` 进入开发诊断模式

## 🚀 使用方式

直接用浏览器打开：

```bash
# 本地方案（任选其一）
start index.html
# 或
python -m http.server 8000
# 访问 http://localhost:8000
```

部署到 GitHub Pages 后即可在线访问。

## 📁 项目结构

```
win11-web/
├── index.html          # 入口
├── APP_API.md          # 应用开发契约
├── assets/             # 图标 / 壁纸等静态资源
├── css/                # 样式（tokens/基础/桌面/窗口/任务栏等）
└── js/
    ├── core/           # 核心：工具/图标/状态/虚拟文件系统/窗口管理等
    ├── ui/             # 界面：桌面/任务栏/开始菜单/搜索/小组件等
    ├── apps/           # 内置应用
    └── boot.js         # 启动入口
```

## 📄 版权与许可

作者：B站 UP 主 **Annore**，主页 [space.bilibili.com/447553626](https://space.bilibili.com/447553626)。
如原作者另有明确开源协议，以原作者声明为准；使用本项目请注明出处。
