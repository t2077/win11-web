/* ============================================================
   state.js — 系统设置 / 持久化 / 主题应用
   全局: Settings
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'win11web.settings.v1';

  const ACCENTS = [
    { id: 'blue', name: '默认蓝', base: '#0078d4', d1: '#005fb8', d2: '#003e92', d3: '#002b60', l1: '#2d9bef', l2: '#60ccff', l3: '#99ebff' },
    { id: 'teal', name: '蓝绿色', base: '#038387', d1: '#026b6e', d2: '#014f52', d3: '#003639', l1: '#2ba3a7', l2: '#4cc2c6', l3: '#8fe3e6' },
    { id: 'green', name: '绿色', base: '#107c10', d1: '#0b6a0b', d2: '#074f07', d3: '#043604', l1: '#3ca23c', l2: '#6ccb6c', l3: '#a6e6a6' },
    { id: 'purple', name: '紫色', base: '#8764b8', d1: '#6f52a0', d2: '#513c76', d3: '#372850', l1: '#a184cc', l2: '#c3aae4', l3: '#ded1f2' },
    { id: 'pink', name: '粉玫瑰', base: '#e3008c', d1: '#bf0076', d2: '#8f0058', d3: '#63003d', l1: '#f042a6', l2: '#f981c6', l3: '#fdc0e2' },
    { id: 'red', name: '红色', base: '#e81123', d1: '#c50f1f', d2: '#960b17', d3: '#68080f', l1: '#f0505c', l2: '#f78d95', l3: '#fbc6ca' },
    { id: 'orange', name: '橙色', base: '#f7630c', d1: '#ca5010', d2: '#963b0c', d3: '#682807', l1: '#f98c46', l2: '#fbb282', l3: '#fdd8bf' },
    { id: 'yellow', name: '金色', base: '#ffb900', d1: '#e09c00', d2: '#a87400', d3: '#704d00', l1: '#ffca3d', l2: '#ffdc7c', l3: '#ffedbd' },
    { id: 'gray', name: '石墨灰', base: '#69797e', d1: '#56666b', d2: '#3f4b4f', d3: '#293134', l1: '#8a989c', l2: '#b0bcc0', l3: '#d5dcde' },
    { id: 'navy', name: '海军蓝', base: '#4a5459', d1: '#3c4448', d2: '#2c3236', d3: '#1d2124', l1: '#6d777c', l2: '#98a1a5', l3: '#c6cdd0' }
  ];

  const WALLPAPERS = [
    { id: 'bloom-dark', name: 'Windows 花簇（深色）', url: 'assets/wallpapers/bloom-dark.svg', theme: 'dark' },
    { id: 'bloom-light', name: 'Windows 花簇（浅色）', url: 'assets/wallpapers/bloom-light.svg', theme: 'light' },
    { id: 'glow', name: '流光', url: 'assets/wallpapers/glow.svg', theme: 'dark' },
    { id: 'flow', name: '涌动', url: 'assets/wallpapers/flow.svg', theme: 'light' },
    { id: 'dusk', name: '暮色山峦', url: 'assets/wallpapers/dusk.svg', theme: 'dark' },
    { id: 'captured', name: '光影捕捉', url: 'assets/wallpapers/captured.svg', theme: 'dark' }
  ];

  const DEFAULTS = {
    theme: 'dark',
    accent: 'blue',
    accentOnTitlebar: false,
    accentOnTaskbar: false,
    wallpaper: 'bloom-dark',
    wallpaperCustom: null,
    wallpaperFit: 'fill',
    lockWallpaper: 'dusk',
    taskbarAlign: 'center',
    taskbarSize: 'medium',
    taskbarAutoHide: false,
    showSearchBox: 'icon',      /* icon | box | hidden */
    showTaskView: true,
    showWidgets: true,
    showChat: false,
    transparency: true,
    animations: true,
    nightLight: false,
    nightLightStrength: 40,
    volume: 30,
    muted: false,
    brightness: 100,
    wifi: true,
    bluetooth: true,
    airplane: false,
    batterySaver: false,
    focusAssist: false,
    hourFormat24: true,
    showSeconds: false,
    userName: 'DeepSeek',
    userEmail: 'user@outlook.com',
    userAvatar: null,
    pcName: 'DESKTOP-W11WEB',
    desktopIconSize: 'medium',
    desktopAutoArrange: true,
    desktopShowIcons: true,
    sortDesktopBy: 'name',
    snapWindows: true,
    snapAssist: true,
    showFileExtensions: true,
    showHiddenFiles: false,
    explorerCompact: false,
    pinnedStart: ['edge', 'explorer', 'settings', 'notepad', 'calculator', 'terminal', 'paint', 'photos', 'store', 'mediaplayer', 'clock', 'calendar', 'mail', 'taskmgr', 'minesweeper', 'snipping', 'todo', 'xbox'],
    pinnedTaskbar: ['explorer', 'edge', 'store', 'settings'],
    recentApps: [],
    notifications: [],
    firstRun: true
  };

  const Settings = Object.assign({}, DEFAULTS);
  Settings.ACCENTS = ACCENTS;
  Settings.WALLPAPERS = WALLPAPERS;
  Settings.DEFAULTS = DEFAULTS;

  Settings.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const o = JSON.parse(raw);
        Object.keys(DEFAULTS).forEach(k => { if (o[k] !== undefined) Settings[k] = o[k]; });
      }
    } catch (e) { console.warn('[settings] load failed', e); }
    return Settings;
  };

  Settings.save = function () {
    try {
      const o = {};
      Object.keys(DEFAULTS).forEach(k => { o[k] = Settings[k]; });
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) { }
  };

  Settings.reset = function () {
    Object.keys(DEFAULTS).forEach(k => { Settings[k] = JSON.parse(JSON.stringify(DEFAULTS[k])); });
    Settings.save(); Settings.apply();
  };

  Settings.set = function (k, v, skipApply) {
    Settings[k] = v;
    Settings.save();
    if (!skipApply) Settings.apply();
    U.bus.emit('settings:change', k, v);
    U.bus.emit('settings:' + k, v);
  };

  Settings.accentObj = function () {
    return ACCENTS.find(a => a.id === Settings.accent) || ACCENTS[0];
  };

  Settings.wallpaperUrl = function () {
    if (Settings.wallpaper === 'custom' && Settings.wallpaperCustom) return Settings.wallpaperCustom;
    const w = WALLPAPERS.find(w => w.id === Settings.wallpaper);
    return w ? w.url : WALLPAPERS[0].url;
  };
  Settings.lockWallpaperUrl = function () {
    const w = WALLPAPERS.find(w => w.id === Settings.lockWallpaper);
    return w ? w.url : WALLPAPERS[4].url;
  };

  /** 把设置应用到 DOM */
  Settings.apply = function () {
    const root = document.documentElement;
    root.dataset.theme = Settings.theme;
    root.dataset.transparency = Settings.transparency ? 'on' : 'off';
    root.dataset.animations = Settings.animations ? 'on' : 'off';
    root.dataset.accentTitlebar = Settings.accentOnTitlebar ? 'on' : 'off';

    const a = Settings.accentObj();
    const s = root.style;
    s.setProperty('--accent-base', a.base);
    s.setProperty('--accent-dark1', a.d1);
    s.setProperty('--accent-dark2', a.d2);
    s.setProperty('--accent-dark3', a.d3);
    s.setProperty('--accent-light1', a.l1);
    s.setProperty('--accent-light2', a.l2);
    s.setProperty('--accent-light3', a.l3);

    /* 任务栏尺寸 */
    const th = Settings.taskbarSize === 'small' ? 40 : Settings.taskbarSize === 'large' ? 56 : 48;
    s.setProperty('--taskbar-h', th + 'px');

    /* 亮度 + 夜间模式滤镜 */
    const filters = [];
    if (Settings.brightness < 100) filters.push('brightness(' + (0.35 + Settings.brightness / 100 * 0.65).toFixed(3) + ')');
    if (Settings.nightLight) {
      const k = Settings.nightLightStrength / 100;
      filters.push('sepia(' + (k * .45).toFixed(3) + ')');
      filters.push('saturate(' + (1 + k * .25).toFixed(3) + ')');
      filters.push('hue-rotate(-' + (k * 12).toFixed(1) + 'deg)');
    }
    const os = document.getElementById('os');
    if (os) os.style.filter = filters.length ? filters.join(' ') : '';

    Sound.volume = Settings.volume;
    Sound.muted = Settings.muted;

    /* 壁纸 */
    const wi = document.getElementById('wallpaperImg');
    if (wi) {
      const url = Settings.wallpaperUrl();
      const bg = 'url("' + url + '")';
      if (wi.style.backgroundImage !== bg) wi.style.backgroundImage = bg;
      wi.dataset.fit = Settings.wallpaperFit;
    }
    const lb = document.getElementById('lockBg');
    if (lb) lb.style.backgroundImage = 'url("' + Settings.lockWallpaperUrl() + '")';

    const tb = document.getElementById('taskbar');
    if (tb) {
      tb.dataset.align = Settings.taskbarAlign;
      tb.dataset.accent = Settings.accentOnTaskbar ? 'on' : 'off';
    }
  };

  /** 平滑切换壁纸（交叉淡入） */
  Settings.setWallpaper = async function (id, customUrl) {
    const next = document.getElementById('wallpaperImgNext');
    const cur = document.getElementById('wallpaperImg');
    const url = id === 'custom' ? customUrl : (WALLPAPERS.find(w => w.id === id) || WALLPAPERS[0]).url;
    if (next && cur) {
      next.style.backgroundImage = 'url("' + url + '")';
      next.dataset.fit = Settings.wallpaperFit;
      next.style.opacity = '0';
      await U.nextFrame();
      await U.anim(next, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: U.EASE.soft });
      next.style.opacity = '1';
    }
    Settings.wallpaper = id;
    if (id === 'custom') Settings.wallpaperCustom = customUrl;
    Settings.save();
    if (cur) { cur.style.backgroundImage = 'url("' + url + '")'; cur.dataset.fit = Settings.wallpaperFit; }
    if (next) { next.style.opacity = '0'; next.style.backgroundImage = ''; }
    U.bus.emit('settings:change', 'wallpaper', id);
  };

  global.Settings = Settings;
})(window);
