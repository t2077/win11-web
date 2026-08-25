# Windows 11 Web —— 应用开发契约（APP_API）

本项目是纯前端（无构建、无框架、无 npm）的 Windows 11 桌面复刻。
所有脚本都是**经典脚本**（非 ES module），按 `index.html` 中的顺序加载，通过全局对象通信。

## 一个应用文件的标准结构

```js
/* js/apps/xxx.js */
(function (global) {
  'use strict';

  U.injectStyle('xxx', `
    .xxx-root { display:flex; flex-direction:column; height:100%; }
    /* 所有选择器都必须带 .xxx- 前缀，避免与其他应用冲突 */
  `);

  Apps.register({
    id: 'xxx',                       // 唯一 id
    name: '应用名',                   // 显示名（中文）
    icon: 'terminal',                // Icons.APP 里的 id
    category: '实用工具',
    size: { w: 1000, h: 660 },       // 初始窗口大小
    minSize: { w: 480, h: 320 },
    singleton: false,                // true = 只允许一个实例（再次启动则聚焦）
    mount(win, args) {
      // win.body 是内容容器（flex column，已 overflow:hidden）
      // args 是 Apps.launch(id, args) 传入的参数
    }
  });

  global.Xxx = { /* 可选：暴露给其他模块的 API */ };
})(window);
```

## 窗口对象 win

| 成员 | 说明 |
|---|---|
| `win.body` | 内容容器（`.window__body`，flex column，overflow hidden）—— 把 UI 塞进这里 |
| `win.headArea` | 标题栏中间的可用区域（放标签页/工具按钮，位于图标与标题按钮之间） |
| `win.chrome` | 标题栏元素（拖拽区） |
| `win.setTitle(t)` / `win.setIcon(iconId)` | 改标题 / 图标 |
| `win.setBodyBg(kind)` | `solid` `solid2` `layer` `card` `dark` `white`（默认透明，透出 Mica） |
| `win.setMica(kind)` | `mica`(默认) `alt` `acrylic` `none` |
| `win.setChromeHeight(px)` | 加高标题栏（例如资源管理器的标签页） |
| `win.close()` `win.focus()` `win.minimize()` `win.maximize()` `win.restore()` `win.toggleMax()` | 窗口操作 |
| `win.onClose(fn)` | 关闭守卫：`fn` 返回 `false`（或 Promise<false>）可阻止关闭（用于"保存更改吗？"） |
| `win.on('resize'\|'focus'\|'close', fn)` | 窗口事件 |
| `win.w` `win.h` `win.x` `win.y` `win.state` | 几何与状态（`normal` / `max` / `snap`） |

## 全局 API 速查

### U（`js/core/util.js`）
- `U.el('div.cls#id', {props}, children)` —— 元素工厂。props 支持 `text` `html` `class` `style{}` `dataset{}` `onclick` 等；children 可为元素/数组/字符串
- `U.$ / U.$$ / U.clear(node) / U.on(el,'ev',fn) / U.delegate(root,sel,'ev',fn)`
- `U.anim(el, keyframes, {duration, easing, delay})` → Promise（WAAPI 包装，自动响应"关闭动画"设置）
- `U.EASE.decel / accel / standard / soft / back` —— Fluent 动效曲线
- `U.drag(handle, {onStart,onMove(dx,dy,e),onEnd,threshold,cursor})`
- `U.tooltip(el, '提示文字', 'top')`、`U.injectStyle(id, css)`
- `U.fmtTime / fmtTime12 / fmtDateShort / fmtDateLong / fmtDateFile / fmtSize / pad / clamp / uid / debounce / throttle / sleep / escapeHtml`
- `U.bus.on(ev, fn) / U.bus.emit(ev, ...)` —— 全局事件总线
- `U.copyText(t)`、`U.download(name, content)`、`U.imgFile()` → Promise<File>

### Icons（`js/core/icons.js`）
- `Icons.app(id, size)` → 彩色应用图标元素；`Icons.APP` 是全部 id 的字典
- `Icons.ui(id, size)` → 单色线性图标元素（跟随 `currentColor`）；`Icons.UI` 是字典
- `Icons.uiSvg(id)` / `Icons.appSvg(id)` → SVG 字符串
- `Icons.forFile(name, isDir)` → 按扩展名返回图标 id
- 常用 UI 图标 id：`close check plus minus more moreVert search back forward up down refresh home folder file copy cut paste rename trash share sort view list newFolder pin unpin star settings person power lock wifi bluetooth airplane battery volume volumeMute brightness nightlight cast accessibility keyboard save open print undo redo zoomIn zoomOut play pause stop next prev grid image monitor palette globe shield update edit eye info warning error bell music video2 doc desktop dock eraser text fill shapes crop rotate fullscreen pip download upload link filter history favorite collection extension lightbulb translate mic camera2 clock calendar mail pen tab apps devices network time game privacy chevronDown chevronUp chevronLeft chevronRight`

### Shell（`js/boot.js`）—— 通用控件工厂
- `Shell.toggle(checked, onChange, label?)` → Win11 开关元素
- `Shell.slider(value, min, max, onInput, onCommit?)` → Win11 滑块元素（含 `.setValue(v)`）
- `Shell.combo(value, [{value,label}], onChange, width?)` → 下拉框（点击弹 Menu）
- `Shell.showProperties(path)`、`Shell.runDialog()`、`Shell.winver()`、`Shell.screenshot()`
- `Shell.lock() / signOut() / sleep() / shutdown() / restart()`

### Menu（`js/core/contextmenu.js`）
```js
Menu.show([
  { iconBar: [{icon:'cut',label:'剪切',onClick(){}}, ...] },   // 顶部图标条（可选，仅一条）
  { label:'打开', icon:'open', accel:'Enter', onClick(){} },
  { label:'带子菜单', icon:'view', submenu:[{label:'A',checked:true,onClick(){}}] },
  { separator:true }, { header:'分组标题' },
  { label:'危险项', icon:'trash', danger:true, disabled:false, keepOpen:false }
], { x, y });                       // 或 { anchor: el, align:'bottom-left'|'top-center'|... }
```

### Notifications（`js/ui/notifications.js`）
- `Notifications.toast({title, body, appIcon|icon, app, actions:[{text,accent,onClick}], timeout})`
- `Notifications.dialog({title, body|html|content, icon, width, buttons:[{text,accent,value,onClick}], onClose(v)})` → `{close(v)}`
- `await Notifications.confirm(title, body, okText)` → boolean
- `await Notifications.prompt(title, defaultValue, label)` → string|null

### VFS（`js/core/vfs.js`）虚拟文件系统（路径用反斜杠，如 `C:\Users\DeepSeek\文档`）
- `VFS.home()` → `C:\Users\DeepSeek`；`VFS.special('desktop'|'documents'|'pictures'|'music'|'videos'|'downloads'|'screenshots')`
- `VFS.list(path, {hidden})` → `[{name,path,type:'dir'|'file',size,modified,ext,src,node}]`
- `VFS.get(path)` `VFS.exists(path)` `VFS.isDir(path)` `VFS.readFile(path)` `VFS.writeFile(path, text)`
- `VFS.createFile(dir, name, content, extra?)` → 新路径；`VFS.mkdir(dir, name)` → 新路径
- `VFS.rename(path, newName)` `VFS.remove(path, permanent?)` `VFS.copy(src, destDir, cut?)`
- `VFS.search(query, root?, limit?)`、`VFS.drives()`、`VFS.recycle`（回收站数组）
- 路径工具：`VFS.join(...)` `VFS.parent(p)` `VFS.basename(p)` `VFS.ext(name)` `VFS.stem(name)`
- 图片文件的 `src` 字段是可直接用于 `<img>` 的 URL（例如 `assets/wallpapers/dusk.svg`）

### Settings（`js/core/state.js`）
- 读：`Settings.theme` `accent` `volume` `muted` `brightness` `wifi` `userName` `hourFormat24` …
- 写：`Settings.set('key', value)` —— 自动保存 + 应用 + 触发 `settings:change` 事件
- `Settings.ACCENTS`（10 个强调色）、`Settings.WALLPAPERS`（6 张壁纸）、`Settings.accentObj()`

### 其他
- `Apps.launch(id, args)` `Apps.open(vfsPath)` `Apps.get(id)` `Apps.all()` `Apps.openWith(path)`
- `WM.windows` `WM.active` `WM.focus(win)` `WM.snapTo(win, [x,y,w,h]百分比, kind, index)` `WM.workArea()`
- `Sound.click() hover() ding() notify() error() key() connect() swoosh(up)`
- `Taskbar.renderApps()`、`Flyout.open/close/toggle(id)`、`TaskView.toggle()`

## 设计规范（务必遵守）

- 字号只用：12px(`--fs-caption`) / 14px(`--fs-body`) / 18px / 20px / 28px；正文行高 20px
- 圆角：控件 4px(`--r-sm`)、卡片与浮层 8px(`--r-lg`)、大卡片 12px
- 颜色**只用 CSS 变量**，不要写死颜色（除了应用品牌色）：
  `--text-primary/secondary/tertiary/disabled/onaccent`、`--fill-control(-hover/-press)`、
  `--fill-subtle-hover/-press`、`--fill-accent(-hover)`、`--bg-solid/-2/-3/-4`、`--bg-card(-hover)`、
  `--stroke-control/-divider/-card/-surface`、`--accent-base/-light2/-dark1`
- 动效：hover 用 150ms linear，进出场用 250ms `var(--ease-decel)`；列表项进场可用 `.reveal-items`
- 交互反馈：所有可点元素都要有 hover / active 态；图标按钮 32×32；工具栏按钮高度 32
- 中文界面文案要和真实 Windows 11 简体中文版一致（例如"新建"、"查看"、"属性"、"重命名"）
- 不要用 `alert` / `confirm` / `prompt`，改用 `Notifications.*`
- 不要引入任何外部资源（CDN、图片、字体）；图形一律用内联 SVG 或 CSS 绘制
- 文本输入框加 `user-select:text`（全局默认禁用选择）
