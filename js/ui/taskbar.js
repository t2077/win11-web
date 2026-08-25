/* ============================================================
   taskbar.js — 任务栏（居中图标、活跃指示条、悬停预览、系统托盘、时钟）
   全局: Taskbar
   ============================================================ */
(function (global) {
  'use strict';

  const Taskbar = {
    left: null, center: null, right: null,
    _clockTimer: null,
    _preview: null,

    init() {
      this.left = document.getElementById('taskbarLeft');
      this.center = document.getElementById('taskbarCenter');
      this.right = document.getElementById('taskbarRight');
      this.render();
      this.startClock();

      U.bus.on('wm:create', () => this.renderApps());
      U.bus.on('wm:close', () => this.renderApps());
      U.bus.on('wm:focus', () => this.updateStates());
      U.bus.on('wm:minimize', () => this.updateStates());
      U.bus.on('wm:unminimize', () => this.updateStates());
      U.bus.on('wm:title', () => this.updateStates());
      U.bus.on('notify:add', () => this.updateTray());
      U.bus.on('notify:change', () => this.updateTray());
      U.bus.on('settings:change', (k) => {
        if (['taskbarAlign', 'showSearchBox', 'showTaskView', 'showWidgets', 'pinnedTaskbar', 'taskbarSize', 'hourFormat24', 'showSeconds', 'taskbarAutoHide'].includes(k)) this.render();
        if (['volume', 'muted', 'wifi', 'bluetooth', 'airplane', 'batterySaver', 'focusAssist'].includes(k)) this.updateTray();
      });
      U.bus.on('flyout:open', (id) => this.updateFlyoutStates(id));
      U.bus.on('flyout:close', () => this.updateFlyoutStates(null));

      /* 自动隐藏 */
      const tb = document.getElementById('taskbar');
      document.addEventListener('pointermove', U.throttle((e) => {
        if (!Settings.taskbarAutoHide) { tb.classList.remove('is-hidden'); return; }
        const near = e.clientY > window.innerHeight - 6;
        if (near) tb.classList.remove('is-hidden');
        else if (!tb.matches(':hover') && !Flyout.current()) tb.classList.add('is-hidden');
      }, 100));
      if (Settings.taskbarAutoHide) tb.classList.add('is-hidden');

      /* 任务栏右键菜单 */
      tb.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.tb-app') || e.target.closest('.tb-tray-clock')) return;
        e.preventDefault();
        Menu.show([
          { label: '任务栏设置', icon: 'settings', onClick: () => Apps.launch('settings', { page: 'personalization', sub: 'taskbar' }) },
          { separator: true },
          { label: '任务管理器', icon: 'apps', onClick: () => Apps.launch('taskmgr') }
        ], { x: e.clientX, y: e.clientY });
      });
    },

    /* ---------------- 渲染 ---------------- */
    render() {
      this.renderLeft();
      this.renderCenter();
      this.renderRight();
      this.updateStates();
      this.updateTray();
    },

    renderLeft() {
      const l = U.clear(this.left);
      if (Settings.showWidgets) {
        const w = Weather.current();
        const pill = U.el('button.tb-widgets', { title: '小组件' }, [
          Icons.app(w.icon, 20),
          U.el('div.tb-widgets__txt', {}, [
            U.el('div.tb-widgets__t', { text: w.temp + '°C' }),
            U.el('div.tb-widgets__d', { text: w.text })
          ])
        ]);
        pill.onclick = () => Flyout.toggle('widgets');
        U.tooltip(pill, w.text + ' ' + w.temp + '°C');
        l.appendChild(pill);
      }
    },

    renderCenter() {
      const c = U.clear(this.center);

      /* 开始按钮 */
      const start = U.el('button.tb-btn.tb-start', { title: '开始' }, Icons.app('start', 24));
      start.onclick = (e) => { e.stopPropagation(); Sound.click(); Flyout.toggle('start'); };
      start.oncontextmenu = (e) => { e.preventDefault(); this.showWinXMenu(start); };
      U.tooltip(start, '开始');
      c.appendChild(start);

      /* 搜索 */
      if (Settings.showSearchBox !== 'hidden') {
        if (Settings.showSearchBox === 'box') {
          const box = U.el('button.tb-searchbox', {}, [Icons.ui('search', 16), U.el('span', { text: '搜索' })]);
          box.onclick = () => Flyout.toggle('search');
          c.appendChild(box);
        } else {
          const b = U.el('button.tb-btn.tb-search', { title: '搜索' }, Icons.app('search', 24));
          b.onclick = () => Flyout.toggle('search');
          U.tooltip(b, '搜索');
          c.appendChild(b);
        }
      }

      /* 任务视图 */
      if (Settings.showTaskView) {
        const b = U.el('button.tb-btn.tb-taskview', { title: '任务视图' }, Icons.app('taskview', 24));
        b.onclick = () => TaskView.toggle();
        U.tooltip(b, '任务视图');
        c.appendChild(b);
      }

      this._appsWrap = U.el('div.tb-apps');
      c.appendChild(this._appsWrap);
      this.renderApps();
    },

    renderApps() {
      if (!this._appsWrap) return;
      const wrap = U.clear(this._appsWrap);
      const pinned = Settings.pinnedTaskbar.slice();
      const running = {};
      WM.windows.filter(w => !w.closing).forEach(w => {
        (running[w.appId] = running[w.appId] || []).push(w);
      });
      const ids = pinned.concat(Object.keys(running).filter(id => !pinned.includes(id)));

      ids.forEach(id => {
        const def = Apps.get(id);
        if (!def) return;
        const wins = running[id] || [];
        const btn = U.el('button.tb-btn.tb-app', {
          dataset: { app: id, count: wins.length },
          title: def.name
        }, [
          U.el('div.tb-app__icon', {}, Icons.app(def.icon, 24)),
          U.el('div.tb-app__ind')
        ]);
        U.tooltip(btn, def.name);

        btn.onclick = (e) => {
          e.stopPropagation();
          Sound.click();
          const list = WM.byApp(id);
          if (!list.length) { this.bounce(btn); Apps.launch(id); return; }
          if (list.length === 1) {
            const w = list[0];
            if (w.minimized) WM.unminimize(w);
            else if (WM.active === w) WM.minimize(w);
            else WM.focus(w);
          } else {
            const active = list.find(w => w === WM.active);
            if (active) {
              const i = list.indexOf(active);
              const nxt = list[(i + 1) % list.length];
              if (nxt.minimized) WM.unminimize(nxt); else WM.focus(nxt);
            } else {
              const w = list[0];
              if (w.minimized) WM.unminimize(w); else WM.focus(w);
            }
          }
        };
        btn.oncontextmenu = (e) => { e.preventDefault(); this.showJumpList(id, btn); };

        /* 悬停预览 */
        let hoverTimer = null;
        btn.addEventListener('pointerenter', () => {
          clearTimeout(hoverTimer);
          const list = WM.byApp(id);
          if (!list.length) return;
          hoverTimer = setTimeout(() => this.showPreview(btn, id), 380);
        });
        btn.addEventListener('pointerleave', () => {
          clearTimeout(hoverTimer);
          this.hidePreview(220);
        });
        wrap.appendChild(btn);
      });
      this.updateStates();
    },

    renderRight() {
      const r = U.clear(this.right);

      /* 隐藏的图标 */
      const chev = U.el('button.tb-tray-btn.tb-tray-chev', { title: '显示隐藏的图标' }, Icons.ui('chevronUp', 12));
      chev.onclick = () => this.showHiddenTray(chev);
      r.appendChild(chev);

      /* 系统托盘（网络/音量/电池）→ 快速设置 */
      const tray = U.el('button.tb-tray-group', { title: '网络、声音、电池' });
      this._trayIcons = {
        net: U.el('span.tb-tray-ico'),
        vol: U.el('span.tb-tray-ico'),
        bat: U.el('span.tb-tray-ico')
      };
      tray.append(this._trayIcons.net, this._trayIcons.vol, this._trayIcons.bat);
      tray.onclick = () => Flyout.toggle('quicksettings');
      this._trayGroup = tray;
      r.appendChild(tray);

      /* 输入法指示（简化） */
      const ime = U.el('button.tb-tray-btn.tb-ime', { title: '中文（简体，中国）' }, U.el('span', { text: '中' }));
      ime.onclick = () => Notifications.toast({ title: '输入法', body: '中文（简体，中国）— 微软拼音', icon: 'keyboard' });
      r.appendChild(ime);

      /* 时钟 + 日期（通知计数徽标作为同级 flex 项放在时间左侧，避免遮挡时间文字） */
      this._badge = U.el('span.tb-badge', { hidden: true });
      const clock = U.el('button.tb-tray-clock', { title: '通知' }, [
        this._badge,
        U.el('div.tb-clock__col', {}, [
          U.el('div.tb-clock__t', { id: 'tbTime' }),
          U.el('div.tb-clock__d', { id: 'tbDate' })
        ])
      ]);
      clock.onclick = () => Flyout.toggle('notifications');
      clock.oncontextmenu = (e) => {
        e.preventDefault();
        Menu.show([
          { label: '调整日期和时间', icon: 'time', onClick: () => Apps.launch('settings', { page: 'time' }) },
          { label: '通知设置', icon: 'bell', onClick: () => Apps.launch('settings', { page: 'system', sub: 'notifications' }) }
        ], { x: e.clientX, y: e.clientY });
      };
      this._clock = clock;
      r.appendChild(clock);

      /* 显示桌面 */
      const sd = U.el('button.tb-showdesktop', { title: '显示桌面' });
      sd.onclick = () => WM.toggleShowDesktop();
      r.appendChild(sd);

      this.tickClock();
    },

    /* ---------------- 状态 ---------------- */
    updateStates() {
      U.$$('.tb-app', this.center).forEach(btn => {
        const id = btn.dataset.app;
        const list = WM.byApp(id);
        btn.dataset.count = list.length;
        btn.classList.toggle('is-running', list.length > 0);
        btn.classList.toggle('is-multi', list.length > 1);
        const focused = list.some(w => w === WM.active && !w.minimized);
        btn.classList.toggle('is-active', focused);
      });
    },

    updateFlyoutStates(openId) {
      const map = { start: '.tb-start', search: '.tb-search,.tb-searchbox', widgets: '.tb-widgets', quicksettings: '.tb-tray-group', notifications: '.tb-tray-clock' };
      Object.keys(map).forEach(k => {
        U.$$(map[k], document.getElementById('taskbar')).forEach(el => el.classList.toggle('is-open', k === openId));
      });
    },

    updateTray() {
      if (!this._trayIcons) return;
      const t = this._trayIcons;
      U.clear(t.net).appendChild(Icons.ui(Settings.airplane ? 'airplane' : (Settings.wifi ? 'wifi' : 'globe'), 16));
      U.clear(t.vol).appendChild(Icons.ui(Settings.muted || Settings.volume === 0 ? 'volumeMute' : 'volume', 16));
      U.clear(t.bat).appendChild(Icons.ui('battery', 16));
      const n = Notifications.items.length;
      if (this._badge) {
        this._badge.hidden = n === 0;
        this._badge.textContent = n > 9 ? '9+' : String(n);
      }
      if (this._clock) this._clock.classList.toggle('has-badge', n > 0);
    },

    /* ---------------- 时钟 ---------------- */
    startClock() {
      clearInterval(this._clockTimer);
      this._clockTimer = setInterval(() => this.tickClock(), 1000);
      this.tickClock();
    },
    tickClock() {
      const t = document.getElementById('tbTime'), d = document.getElementById('tbDate');
      if (!t || !d) return;
      const now = new Date();
      t.textContent = Settings.hourFormat24
        ? U.fmtTime(now, Settings.showSeconds)
        : U.fmtTime12(now);
      d.textContent = U.fmtDateShort(now);
    },

    /* ---------------- 悬停预览 ---------------- */
    showPreview(btn, appId) {
      this.hidePreview(0);
      const list = WM.byApp(appId);
      if (!list.length) return;
      const fly = U.el('div.tb-preview.acrylic.material-noise');
      list.forEach(w => {
        const card = U.el('div.tb-preview__card', { dataset: { win: w.id } }, [
          U.el('div.tb-preview__head', {}, [
            Icons.app(w.icon, 14),
            U.el('span.truncate', { text: w.title }),
            U.el('button.tb-preview__x', { title: '关闭', onclick: (e) => { e.stopPropagation(); WM.close(w); setTimeout(() => this.showPreview(btn, appId), 60); } }, Icons.ui('close', 10))
          ]),
          U.el('div.tb-preview__thumb', {}, Icons.app(w.icon, 36))
        ]);
        card.onclick = () => { this.hidePreview(0); if (w.minimized) WM.unminimize(w); else WM.focus(w); };
        card.onpointerenter = () => { w.el.classList.add('is-peek'); };
        card.onpointerleave = () => { w.el.classList.remove('is-peek'); };
        fly.appendChild(card);
      });
      document.getElementById('flyoutLayer').appendChild(fly);
      const r = btn.getBoundingClientRect(), fr = fly.getBoundingClientRect();
      const pos = U.fitRect(fr.width, fr.height, r.left + r.width / 2 - fr.width / 2, r.top - fr.height - 8);
      fly.style.left = pos.x + 'px'; fly.style.top = pos.y + 'px';
      U.anim(fly, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: U.EASE.decel });
      fly.onpointerenter = () => clearTimeout(this._previewTimer);
      fly.onpointerleave = () => this.hidePreview(160);
      this._preview = fly;
    },
    hidePreview(delay) {
      clearTimeout(this._previewTimer);
      const kill = () => {
        if (!this._preview) return;
        const f = this._preview; this._preview = null;
        WM.windows.forEach(w => w.el.classList.remove('is-peek'));
        U.anim(f, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 }).then(() => f.remove());
      };
      if (!delay) kill(); else this._previewTimer = setTimeout(() => { if (this._preview && !this._preview.matches(':hover')) kill(); }, delay);
    },

    /* ---------------- 跳转列表（右键应用） ---------------- */
    showJumpList(appId, btn) {
      const def = Apps.get(appId);
      const wins = WM.byApp(appId);
      const pinned = Settings.pinnedTaskbar.includes(appId);
      const items = [];

      if (appId === 'explorer') {
        items.push({ header: '常用' });
        [['桌面', VFS.special('desktop')], ['下载', VFS.special('downloads')], ['文档', VFS.special('documents')], ['图片', VFS.special('pictures')]].forEach(([n, p]) => {
          items.push({ label: n, icon: 'folder', onClick: () => Apps.launch('explorer', { path: p }) });
        });
        items.push({ separator: true });
      }
      if (appId === 'notepad') {
        items.push({ header: '最近' });
        (Notepad.recent || []).slice(0, 5).forEach(p => items.push({ label: VFS.basename(p), icon: 'doc', onClick: () => Apps.launch('notepad', { path: p }) }));
        if (!(Notepad.recent || []).length) items.push({ label: '（无最近文件）', disabled: true });
        items.push({ separator: true });
      }

      items.push({ label: def ? def.name : appId, appIcon: def ? def.icon : 'file', onClick: () => Apps.launch(appId) });
      items.push({
        label: pinned ? '从任务栏取消固定' : '固定到任务栏', icon: pinned ? 'unpin' : 'pin',
        onClick: () => {
          const arr = Settings.pinnedTaskbar.slice();
          const i = arr.indexOf(appId);
          if (i >= 0) arr.splice(i, 1); else arr.push(appId);
          Settings.set('pinnedTaskbar', arr);
          this.renderApps();
        }
      });
      if (wins.length) {
        items.push({ separator: true });
        if (wins.length > 1) items.push({ label: '关闭所有窗口', icon: 'close', danger: true, onClick: () => wins.forEach(w => WM.close(w)) });
        else items.push({ label: '关闭窗口', icon: 'close', danger: true, onClick: () => WM.close(wins[0]) });
      }
      Menu.show(items, { anchor: btn, align: 'top-center' });
    },

    /* ---------------- Win+X 菜单 ---------------- */
    showWinXMenu(anchor) {
      Menu.show([
        { label: '应用和功能', icon: 'apps', onClick: () => Apps.launch('settings', { page: 'apps' }) },
        { label: '电源选项', icon: 'power', onClick: () => Apps.launch('settings', { page: 'system', sub: 'power' }) },
        { label: '事件查看器', icon: 'list', onClick: () => Notifications.toast({ title: '事件查看器', body: '此组件在 Web 版中不可用。', icon: 'info' }) },
        { label: '系统', icon: 'pcSmall', onClick: () => Apps.launch('settings', { page: 'about' }) },
        { label: '设备管理器', icon: 'devices', onClick: () => Notifications.toast({ title: '设备管理器', body: '此组件在 Web 版中不可用。', icon: 'info' }) },
        { label: '网络连接', icon: 'network', onClick: () => Apps.launch('settings', { page: 'network' }) },
        { label: '磁盘管理', icon: 'drive', onClick: () => Apps.launch('explorer', { path: 'C:' }) },
        { label: '计算机管理', icon: 'settings', onClick: () => Apps.launch('taskmgr') },
        { separator: true },
        { label: '终端', icon: 'apps', accel: '', onClick: () => Apps.launch('terminal') },
        { label: '终端（管理员）', icon: 'shield', onClick: () => Apps.launch('terminal', { admin: true }) },
        { separator: true },
        { label: '任务管理器', icon: 'apps', onClick: () => Apps.launch('taskmgr') },
        { label: '设置', icon: 'settings', onClick: () => Apps.launch('settings') },
        { label: '文件资源管理器', icon: 'folder', onClick: () => Apps.launch('explorer') },
        { label: '搜索', icon: 'search', onClick: () => Flyout.open('search') },
        { label: '运行', icon: 'open', onClick: () => Shell.runDialog() },
        { separator: true },
        {
          label: '关机或注销', icon: 'power', submenu: [
            { label: '注销', icon: 'person', onClick: () => Shell.signOut() },
            { label: '睡眠', icon: 'nightlight', onClick: () => Shell.sleep() },
            { label: '关机', icon: 'power', onClick: () => Shell.shutdown() },
            { label: '重启', icon: 'refresh', onClick: () => Shell.restart() }
          ]
        },
        { label: '桌面', icon: 'desktop', onClick: () => WM.toggleShowDesktop() }
      ], { anchor, align: 'top-left', compact: true });
    },

    /* ---------------- 隐藏图标浮出 ---------------- */
    showHiddenTray(anchor) {
      const items = [
        { icon: 'shield', label: 'Windows 安全中心', onClick: () => Notifications.toast({ title: 'Windows 安全中心', body: '设备受到保护。', icon: 'shield' }) },
        { icon: 'onedrive', label: 'OneDrive', app: true, onClick: () => Notifications.toast({ title: 'OneDrive', body: '文件已是最新。', appIcon: 'onedrive' }) },
        { icon: 'bluetooth', label: '蓝牙设备', onClick: () => Apps.launch('settings', { page: 'bluetooth' }) },
        { icon: 'volume', label: '音量混合器', onClick: () => Apps.launch('settings', { page: 'system', sub: 'sound' }) }
      ];
      const fly = U.el('div.tray-hidden.acrylic.material-noise');
      items.forEach(it => {
        const b = U.el('button.tray-hidden__btn', { title: it.label }, it.app ? Icons.app(it.icon, 16) : Icons.ui(it.icon, 16));
        U.tooltip(b, it.label);
        b.onclick = () => { fly.remove(); it.onClick(); };
        fly.appendChild(b);
      });
      document.getElementById('flyoutLayer').appendChild(fly);
      const r = anchor.getBoundingClientRect(), fr = fly.getBoundingClientRect();
      const pos = U.fitRect(fr.width, fr.height, r.left + r.width / 2 - fr.width / 2, r.top - fr.height - 8);
      fly.style.left = pos.x + 'px'; fly.style.top = pos.y + 'px';
      U.anim(fly, [{ opacity: 0, transform: 'translateY(8px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: U.EASE.decel });
      const off = () => { fly.remove(); document.removeEventListener('pointerdown', h, true); };
      const h = (e) => { if (!fly.contains(e.target) && e.target !== anchor) off(); };
      setTimeout(() => document.addEventListener('pointerdown', h, true), 10);
    },

    /* 启动应用时图标跳动 */
    bounce(btn) {
      U.anim(btn.querySelector('.tb-app__icon') || btn, [
        { transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }
      ], { duration: 420, easing: U.EASE.soft });
    }
  };

  /* ---------------- 简易天气数据源 ---------------- */
  const Weather = {
    _cache: null,
    current() {
      if (this._cache) return this._cache;
      const conds = [
        { icon: 'weather', text: '晴', temp: 24 },
        { icon: 'weather', text: '多云', temp: 21 },
        { icon: 'weather', text: '局部多云', temp: 22 }
      ];
      const h = new Date().getHours();
      const c = conds[h % conds.length];
      this._cache = { icon: c.icon, text: c.text, temp: c.temp + (h > 12 ? 2 : 0) };
      return this._cache;
    },
    forecast() {
      const base = this.current().temp;
      return U.WEEK_CN_S.map((d, i) => ({
        day: U.WEEK_CN_S[(new Date().getDay() + i) % 7],
        hi: base + ((i * 3) % 5), lo: base - 6 + (i % 3),
        icon: 'weather', text: ['晴', '多云', '阴', '小雨', '晴'][i % 5]
      }));
    }
  };

  global.Taskbar = Taskbar;
  global.Weather = Weather;
})(window);
