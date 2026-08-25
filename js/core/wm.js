/* ============================================================
   wm.js — 窗口管理器
   拖拽 / 缩放 / 最小化 / 最大化 / Snap 贴靠 / 贴靠布局 / Snap 助手 / 动效
   全局: WM
   ============================================================ */
(function (global) {
  'use strict';

  const LAYER = () => document.getElementById('windowLayer');
  const Z_BASE = 100;

  const WM = {
    windows: [],
    active: null,
    _z: Z_BASE,
    _cascade: 0,

    /* ---------------- 工作区 ---------------- */
    workArea() {
      const tb = Settings.taskbarSize === 'small' ? 40 : Settings.taskbarSize === 'large' ? 56 : 48;
      const h = Settings.taskbarAutoHide ? 0 : tb;
      return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight - h };
    },

    /* ---------------- 创建窗口 ---------------- */
    create(o) {
      const wa = this.workArea();
      const w = Math.min(o.width || 900, wa.w - 40);
      const h = Math.min(o.height || 620, wa.h - 40);
      let x, y;
      if (o.centered) { x = Math.round((wa.w - w) / 2); y = Math.round((wa.h - h) / 2); }
      else {
        const step = 28, n = this._cascade++ % 6;
        x = Math.round((wa.w - w) / 2) + n * step - 60;
        y = Math.round((wa.h - h) / 2) + n * step - 60;
        x = U.clamp(x, 8, Math.max(8, wa.w - w - 8));
        y = U.clamp(y, 8, Math.max(8, wa.h - h - 8));
      }

      const win = {
        id: U.uid('win'), appId: o.appId || 'app', title: o.title || '窗口', icon: o.icon || 'file',
        x, y, w, h, state: 'normal', minimized: false, closing: false,
        minWidth: o.minWidth || 320, minHeight: o.minHeight || 200,
        resizable: o.resizable !== false, maximizable: o.maximizable !== false,
        minimizable: o.minimizable !== false, snapKind: null,
        prevRect: null, emitter: new U.Emitter(), _closeGuards: []
      };

      /* DOM */
      const el = U.el('div.window', { dataset: { state: 'normal', app: win.appId }, style: { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' } });
      if (o.chromeless) el.classList.add('window--chromeless');

      /* Mica 材质底层（在内容之下，避免噪点覆盖文字） */
      const micaEl = U.el('div.window__mica.mica.material-noise');
      el.appendChild(micaEl);

      const chrome = U.el('div.window__chrome');
      const iconEl = U.el('div.window__icon', {}, Icons.app(win.icon, 16));
      const titleEl = U.el('div.window__title', { text: win.title });
      const headArea = U.el('div.window__headarea');   /* 应用自定义标题栏内容（如标签页） */
      const caption = U.el('div.window__caption');

      const mkCap = (kind, svg, label) => {
        const b = U.el('button.cap.cap--' + kind, { title: label, 'aria-label': label }, U.el('span.cap__g', { html: svg }));
        return b;
      };
      const bMin = mkCap('min', Icons.UI.minimize, '最小化');
      const bMax = mkCap('max', Icons.UI.maximize, '最大化');
      const bClose = mkCap('close', Icons.UI.xClose, '关闭');
      if (win.minimizable) caption.appendChild(bMin);
      if (win.maximizable) caption.appendChild(bMax);
      caption.appendChild(bClose);

      chrome.append(iconEl, titleEl, headArea, caption);
      const body = U.el('div.window__body');
      el.append(chrome, body);

      /* 缩放手柄 */
      if (win.resizable) {
        ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach(d => {
          el.appendChild(U.el('div.rz.rz--' + d, { dataset: { dir: d } }));
        });
      }

      Object.assign(win, { el, body, chrome, titleEl, iconEl, headArea, caption, capMax: bMax, micaEl });

      /* ---- 方法 ---- */
      win.setTitle = (t) => { win.title = t; titleEl.textContent = t; U.bus.emit('wm:title', win); };
      win.setIcon = (id) => { win.icon = id; U.clear(iconEl).appendChild(Icons.app(id, 16)); U.bus.emit('wm:icon', win); };
      win.setBodyBg = (kind) => { body.dataset.bg = kind; };
      win.setMica = (kind) => {
        micaEl.className = 'window__mica material-noise ' + (kind === 'acrylic' ? 'acrylic' : kind === 'alt' ? 'mica-alt' : kind === 'none' ? '' : 'mica');
        if (kind === 'none') micaEl.style.background = 'var(--bg-solid)';
      };
      win.setChromeHeight = (px) => { chrome.style.height = px + 'px'; el.style.setProperty('--titlebar-h', px + 'px'); };
      win.close = () => WM.close(win);
      win.focus = () => WM.focus(win);
      win.minimize = () => WM.minimize(win);
      win.maximize = () => WM.maximize(win);
      win.restore = () => WM.restore(win);
      win.toggleMax = () => (win.state === 'normal' ? WM.maximize(win) : WM.restore(win));
      win.on = (ev, fn) => win.emitter.on(ev, fn);
      win.onClose = (fn) => win._closeGuards.push(fn);
      win.setChromeTheme = (t) => { el.dataset.chromeTheme = t || ''; };
      win.hideChrome = () => el.classList.add('window--nochrome');
      win.setResizable = (v) => { win.resizable = v; el.classList.toggle('window--fixed', !v); };

      /* ---- 事件 ---- */
      bMin.onclick = (e) => { e.stopPropagation(); WM.minimize(win); };
      bMax.onclick = (e) => { e.stopPropagation(); win.toggleMax(); };
      bClose.onclick = (e) => { e.stopPropagation(); WM.close(win); };
      if (win.maximizable) WM._bindSnapFlyout(win, bMax);

      U.on(el, 'pointerdown', () => WM.focus(win), true);
      U.on(chrome, 'dblclick', (e) => {
        if (e.target.closest('.cap') || e.target.closest('.window__headarea')) return;
        if (win.maximizable) win.toggleMax();
      });
      WM._bindDrag(win, chrome);
      if (win.resizable) WM._bindResize(win);

      LAYER().appendChild(el);
      this.windows.push(win);
      this.focus(win, true);

      /* 打开动效：Fluent 缩放淡入 */
      U.anim(el, [
        { opacity: 0, transform: 'scale(.90)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { duration: 250, easing: U.EASE.decel });

      U.bus.emit('wm:create', win);
      return win;
    },

    /* ---------------- 焦点 / 层级 ---------------- */
    focus(win, silent) {
      if (!win || win.closing) return;
      if (this.active === win && win.el.style.zIndex) return;
      this.windows.forEach(w => { w.el.classList.remove('is-active'); w.el.dataset.active = 'false'; });
      win.el.classList.add('is-active');
      win.el.dataset.active = 'true';
      win.el.style.zIndex = ++this._z;
      this.active = win;
      win.emitter.emit('focus');
      if (!silent) U.bus.emit('wm:focus', win);
      else U.bus.emit('wm:focus', win);
    },

    focusNext(dir) {
      const list = this.windows.filter(w => !w.minimized && !w.closing);
      if (!list.length) return;
      const i = list.indexOf(this.active);
      const n = list[(i + (dir || 1) + list.length) % list.length];
      this.focus(n);
    },

    /* ---------------- 关闭 ---------------- */
    async close(win) {
      if (!win || win.closing) return;
      for (const g of win._closeGuards) {
        try { const r = await g(); if (r === false) return; } catch (e) { }
      }
      win.closing = true;
      win.emitter.emit('close');
      U.bus.emit('wm:closing', win);
      await U.anim(win.el, [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(.94)' }
      ], { duration: 160, easing: U.EASE.accel });
      win.el.remove();
      const i = this.windows.indexOf(win);
      if (i >= 0) this.windows.splice(i, 1);
      if (this.active === win) {
        const next = this.windows.filter(w => !w.minimized).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0];
        this.active = null;
        if (next) this.focus(next);
      }
      U.bus.emit('wm:close', win);
    },

    closeAll() { this.windows.slice().forEach(w => this.close(w)); },

    /* ---------------- 最小化 / 恢复 ---------------- */
    async minimize(win) {
      if (!win || win.minimized) return;
      win.minimized = true;
      const tgt = this._taskbarRect(win.appId);
      const r = win.el.getBoundingClientRect();
      const sx = Math.max(.12, tgt.width / Math.max(1, r.width));
      const sy = Math.max(.12, 28 / Math.max(1, r.height));
      const dx = tgt.left + tgt.width / 2 - (r.left + r.width / 2);
      const dy = tgt.top + tgt.height / 2 - (r.top + r.height / 2);
      Sound.swoosh(false);
      await U.anim(win.el, [
        { opacity: 1, transform: 'translate(0,0) scale(1)', filter: 'blur(0px)' },
        { opacity: 0, transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, filter: 'blur(2px)' }
      ], { duration: 220, easing: U.EASE.accel });
      win.el.style.display = 'none';
      win.el.classList.remove('is-active');
      if (this.active === win) {
        this.active = null;
        const next = this.windows.filter(w => !w.minimized && !w.closing).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0];
        if (next) this.focus(next);
      }
      U.bus.emit('wm:minimize', win);
    },

    async unminimize(win) {
      if (!win || !win.minimized) return;
      win.minimized = false;
      win.el.style.display = '';
      this.focus(win);
      const tgt = this._taskbarRect(win.appId);
      const r = win.el.getBoundingClientRect();
      const sx = Math.max(.12, tgt.width / Math.max(1, r.width));
      const sy = Math.max(.12, 28 / Math.max(1, r.height));
      const dx = tgt.left + tgt.width / 2 - (r.left + r.width / 2);
      const dy = tgt.top + tgt.height / 2 - (r.top + r.height / 2);
      Sound.swoosh(true);
      await U.anim(win.el, [
        { opacity: 0, transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, filter: 'blur(2px)' },
        { opacity: 1, transform: 'translate(0,0) scale(1)', filter: 'blur(0px)' }
      ], { duration: 250, easing: U.EASE.decel });
      win.el.style.transform = '';
      U.bus.emit('wm:unminimize', win);
    },

    toggleMinimize(win) { return win.minimized ? this.unminimize(win) : this.minimize(win); },

    /* ---------------- 最大化 / 还原 / 贴靠 ---------------- */
    _applyRect(win, r, animate, dur) {
      const el = win.el;
      if (!animate) {
        el.style.left = r.x + 'px'; el.style.top = r.y + 'px';
        el.style.width = r.w + 'px'; el.style.height = r.h + 'px';
        return Promise.resolve();
      }
      const from = { left: el.offsetLeft + 'px', top: el.offsetTop + 'px', width: el.offsetWidth + 'px', height: el.offsetHeight + 'px' };
      const to = { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' };
      el.style.left = r.x + 'px'; el.style.top = r.y + 'px';
      el.style.width = r.w + 'px'; el.style.height = r.h + 'px';
      return U.anim(el, [from, to], { duration: dur || 250, easing: U.EASE.standard });
    },

    maximize(win, animate) {
      if (!win || win.state === 'max') return;
      if (win.state === 'normal') win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
      const wa = this.workArea();
      win.state = 'max'; win.snapKind = null;
      win.el.dataset.state = 'max';
      win.capMax && (win.capMax.title = '还原', U.clear(win.capMax).appendChild(U.el('span.cap__g', { html: Icons.UI.restore })));
      this._applyRect(win, wa, animate !== false, 230);
      Object.assign(win, wa);
      win.emitter.emit('resize');
      U.bus.emit('wm:maximize', win);
    },

    restore(win, animate) {
      if (!win) return;
      if (win.minimized) return this.unminimize(win);
      if (win.state === 'normal') return;
      const r = win.prevRect || { x: 80, y: 60, w: 900, h: 600 };
      win.state = 'normal'; win.snapKind = null;
      win.el.dataset.state = 'normal';
      win.capMax && (win.capMax.title = '最大化', U.clear(win.capMax).appendChild(U.el('span.cap__g', { html: Icons.UI.maximize })));
      this._applyRect(win, r, animate !== false, 230);
      Object.assign(win, r);
      win.emitter.emit('resize');
      U.bus.emit('wm:restore', win);
    },

    /** 贴靠到区域 rect（比例或像素） */
    snapTo(win, zone, kind, index, animate) {
      const wa = this.workArea();
      const g = 0;   /* Windows 11 贴靠无间隙 */
      const r = {
        x: Math.round(wa.x + zone[0] / 100 * wa.w) + g,
        y: Math.round(wa.y + zone[1] / 100 * wa.h) + g,
        w: Math.round(zone[2] / 100 * wa.w) - g * 2,
        h: Math.round(zone[3] / 100 * wa.h) - g * 2
      };
      if (win.state === 'normal') win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
      win.state = 'snap'; win.snapKind = kind || null; win.snapZone = zone;
      win.el.dataset.state = 'snap';
      win.capMax && (U.clear(win.capMax).appendChild(U.el('span.cap__g', { html: Icons.UI.restore })));
      this._applyRect(win, r, animate !== false, 250);
      Object.assign(win, r);
      win.emitter.emit('resize');
      U.bus.emit('wm:snap', win, zone, kind, index);
      if (Settings.snapAssist && kind) this._snapAssist(win, kind, index);
    },

    /* ---------------- 拖动标题栏 ---------------- */
    _bindDrag(win, handle) {
      let start = null, snapHint = null, layoutBarOpen = false;
      U.drag(handle, {
        threshold: 3,
        filter: (e) => {
          if (e.target.closest('.cap')) return false;
          if (e.target.closest('button,input,select,textarea,[data-nodrag]')) return false;
          return true;
        },
        onStart: (e) => {
          this.focus(win);
          const r = win.el.getBoundingClientRect();
          start = { x: r.left, y: r.top, w: r.width, h: r.height, px: e.clientX, py: e.clientY, wasMax: win.state !== 'normal' };
          if (start.wasMax) {
            /* 从最大化/贴靠状态拖出：还原并让窗口跟随指针（Windows 行为） */
            const pr = win.prevRect || { w: Math.round(start.w * .7), h: Math.round(start.h * .7) };
            const ratio = (e.clientX - r.left) / r.width;
            win.state = 'normal'; win.el.dataset.state = 'normal';
            win.capMax && (U.clear(win.capMax).appendChild(U.el('span.cap__g', { html: Icons.UI.maximize })));
            const nx = Math.round(e.clientX - pr.w * ratio), ny = Math.round(e.clientY - 16);
            Object.assign(win, { x: nx, y: ny, w: pr.w, h: pr.h });
            win.el.style.width = pr.w + 'px'; win.el.style.height = pr.h + 'px';
            win.el.style.left = nx + 'px'; win.el.style.top = ny + 'px';
            start = { x: nx, y: ny, w: pr.w, h: pr.h, px: e.clientX, py: e.clientY };
            win.emitter.emit('resize');
          }
          win.el.classList.add('is-dragging');
          document.body.classList.add('is-window-dragging');
        },
        onMove: (dx, dy, ev) => {
          if (!start) return;
          const wa = this.workArea();
          let nx = start.x + (ev.clientX - start.px);
          let ny = Math.max(-4, start.y + (ev.clientY - start.py));
          nx = U.clamp(nx, -start.w + 80, wa.w - 80);
          ny = U.clamp(ny, -2, wa.h - 40);
          win.el.style.left = nx + 'px'; win.el.style.top = ny + 'px';
          win.x = nx; win.y = ny;

          if (!Settings.snapWindows) return;
          /* 顶部中央：显示贴靠布局条 */
          const nearTopCenter = ev.clientY <= 14 && Math.abs(ev.clientX - wa.w / 2) < wa.w * 0.22;
          if (nearTopCenter && !layoutBarOpen) { layoutBarOpen = true; SnapBar.show(win); }
          else if (!nearTopCenter && layoutBarOpen && !SnapBar.hovering) { layoutBarOpen = false; SnapBar.hide(); }
          if (SnapBar.hovering) { this._hideSnapPreview(); snapHint = null; return; }

          const z = this._edgeZone(ev.clientX, ev.clientY, wa);
          if (z) { snapHint = z; this._showSnapPreview(z.zone); }
          else { snapHint = null; this._hideSnapPreview(); }
        },
        onEnd: (dx, dy, ev) => {
          win.el.classList.remove('is-dragging');
          document.body.classList.remove('is-window-dragging');
          this._hideSnapPreview();
          if (SnapBar.hovering) { SnapBar.commit(win, ev); layoutBarOpen = false; return; }
          if (layoutBarOpen) { SnapBar.hide(); layoutBarOpen = false; }
          if (snapHint) {
            if (snapHint.max) this.maximize(win);
            else this.snapTo(win, snapHint.zone, snapHint.kind, snapHint.index);
            snapHint = null;
          } else {
            win.x = win.el.offsetLeft; win.y = win.el.offsetTop;
            if (win.state === 'normal') win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
          }
          start = null;
        }
      });
    },

    /** 边缘贴靠区判定 */
    _edgeZone(px, py, wa) {
      const E = 6, C = Math.min(160, wa.h * .22);
      if (py <= E) {
        if (px <= wa.w * .12) return { zone: [0, 0, 50, 50], kind: 'quad', index: 0 };
        if (px >= wa.w * .88) return { zone: [50, 0, 50, 50], kind: 'quad', index: 1 };
        return { max: true, zone: [0, 0, 100, 100] };
      }
      if (px <= E) {
        if (py <= C) return { zone: [0, 0, 50, 50], kind: 'quad', index: 0 };
        if (py >= wa.h - C) return { zone: [0, 50, 50, 50], kind: 'quad', index: 2 };
        return { zone: [0, 0, 50, 100], kind: 'left-right', index: 0 };
      }
      if (px >= wa.w - E) {
        if (py <= C) return { zone: [50, 0, 50, 50], kind: 'quad', index: 1 };
        if (py >= wa.h - C) return { zone: [50, 50, 50, 50], kind: 'quad', index: 3 };
        return { zone: [50, 0, 50, 100], kind: 'left-right', index: 1 };
      }
      if (py >= wa.h - E) {
        if (px <= wa.w * .12) return { zone: [0, 50, 50, 50], kind: 'quad', index: 2 };
        if (px >= wa.w * .88) return { zone: [50, 50, 50, 50], kind: 'quad', index: 3 };
      }
      return null;
    },

    _showSnapPreview(zone) {
      const wa = this.workArea();
      const el = document.getElementById('snapPreview');
      const box = el.firstElementChild;
      el.hidden = false;
      const r = {
        x: wa.x + zone[0] / 100 * wa.w, y: wa.y + zone[1] / 100 * wa.h,
        w: zone[2] / 100 * wa.w, h: zone[3] / 100 * wa.h
      };
      if (!el.dataset.shown) {
        el.dataset.shown = '1';
        box.style.left = r.x + 'px'; box.style.top = r.y + 'px';
        box.style.width = r.w + 'px'; box.style.height = r.h + 'px';
        U.anim(box, [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 160 });
      } else {
        box.style.transition = 'left .16s var(--ease-decel), top .16s var(--ease-decel), width .16s var(--ease-decel), height .16s var(--ease-decel)';
        box.style.left = r.x + 'px'; box.style.top = r.y + 'px';
        box.style.width = r.w + 'px'; box.style.height = r.h + 'px';
      }
    },
    _hideSnapPreview() {
      const el = document.getElementById('snapPreview');
      if (el.hidden) return;
      delete el.dataset.shown;
      el.hidden = true;
      el.firstElementChild.style.transition = '';
    },

    /* ---------------- 缩放 ---------------- */
    _bindResize(win) {
      U.$$('.rz', win.el).forEach(h => {
        const dir = h.dataset.dir;
        let s = null;
        U.drag(h, {
          onStart: () => {
            this.focus(win);
            if (win.state !== 'normal') { /* 从贴靠状态缩放：转为普通窗口 */
              win.state = 'normal'; win.el.dataset.state = 'normal';
              win.capMax && (U.clear(win.capMax).appendChild(U.el('span.cap__g', { html: Icons.UI.maximize })));
            }
            s = { x: win.el.offsetLeft, y: win.el.offsetTop, w: win.el.offsetWidth, h: win.el.offsetHeight };
            win.el.classList.add('is-resizing');
          },
          onMove: (dx, dy) => {
            if (!s) return;
            let { x, y, w, h } = s;
            const mw = win.minWidth, mh = win.minHeight;
            if (dir.includes('e')) w = Math.max(mw, s.w + dx);
            if (dir.includes('s')) h = Math.max(mh, s.h + dy);
            if (dir.includes('w')) { w = Math.max(mw, s.w - dx); x = s.x + (s.w - w); }
            if (dir.includes('n')) { h = Math.max(mh, s.h - dy); y = s.y + (s.h - h); }
            Object.assign(win.el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
            Object.assign(win, { x, y, w, h });
            win.emitter.emit('resize');
          },
          onEnd: () => {
            win.el.classList.remove('is-resizing');
            win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
            win.emitter.emit('resizeend');
            s = null;
          }
        });
      });
    },

    /* ---------------- 最大化按钮悬停：贴靠布局浮出 ---------------- */
    _bindSnapFlyout(win, btn) {
      let timer = null, fly = null;
      const hide = () => { if (fly) { const f = fly; fly = null; U.anim(f, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 120 }).then(() => f.remove()); } };
      const show = () => {
        if (fly || !Settings.snapWindows) return;
        const wide = window.innerWidth >= 1400;
        const kinds = wide
          ? ['left-right', 'thirds', 'left-big', 'quad', 'wide-center', 'left-topright-bottomright']
          : ['left-right', 'left-topright-bottomright', 'quad', 'left-big'];
        fly = U.el('div.snap-flyout.acrylic.material-noise');
        const grid = U.el('div.snap-flyout__grid');
        kinds.forEach(kind => {
          const parts = Icons.SNAP[kind];
          const card = U.el('div.snap-card', { dataset: { kind } });
          parts.forEach((p, i) => {
            const zone = U.el('i', { style: { left: p[0] + '%', top: p[1] + '%', width: p[2] + '%', height: p[3] + '%' }, dataset: { i } });
            zone.onmouseenter = () => { card.querySelectorAll('i').forEach(z => z.classList.remove('is-hot')); zone.classList.add('is-hot'); };
            zone.onclick = (e) => {
              e.stopPropagation();
              hide();
              WM.snapTo(win, p, kind, i);
            };
            card.appendChild(zone);
          });
          card.onmouseleave = () => card.querySelectorAll('i').forEach(z => z.classList.remove('is-hot'));
          grid.appendChild(card);
        });
        fly.appendChild(grid);
        document.getElementById('flyoutLayer').appendChild(fly);
        const r = btn.getBoundingClientRect(), fr = fly.getBoundingClientRect();
        const pos = U.fitRect(fr.width, fr.height, r.left + r.width / 2 - fr.width / 2, r.bottom + 6);
        fly.style.left = pos.x + 'px'; fly.style.top = pos.y + 'px';
        U.anim(fly, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: U.EASE.decel });
        fly.onmouseleave = () => { clearTimeout(timer); timer = setTimeout(hide, 160); };
        fly.onmouseenter = () => clearTimeout(timer);
      };
      U.on(btn, 'pointerenter', () => { clearTimeout(timer); timer = setTimeout(show, 480); });
      U.on(btn, 'pointerleave', () => { clearTimeout(timer); timer = setTimeout(() => { if (!fly || !fly.matches(':hover')) hide(); }, 200); });
      U.on(btn, 'click', () => { clearTimeout(timer); hide(); });
    },

    /* ---------------- Snap 助手 ---------------- */
    _snapAssist(win, kind, index) {
      const parts = Icons.SNAP[kind];
      if (!parts || parts.length < 2) return;
      const others = this.windows.filter(w => w !== win && !w.minimized && !w.closing);
      if (!others.length) return;
      const remaining = parts.map((p, i) => i).filter(i => i !== index);
      if (!remaining.length) return;
      let ri = 0;
      const overlay = U.el('div.snap-assist');
      const buildStep = () => {
        U.clear(overlay);
        if (ri >= remaining.length) { finish(); return; }
        const zi = remaining[ri], zone = parts[zi];
        const wa = this.workArea();
        const box = U.el('div.snap-assist__zone.acrylic.material-noise', {
          style: {
            left: (wa.x + zone[0] / 100 * wa.w) + 'px', top: (wa.y + zone[1] / 100 * wa.h) + 'px',
            width: (zone[2] / 100 * wa.w) + 'px', height: (zone[3] / 100 * wa.h) + 'px'
          }
        });
        const inner = U.el('div.snap-assist__inner');
        inner.appendChild(U.el('div.snap-assist__hint', { text: '选择要贴靠到此处的窗口' }));
        const grid = U.el('div.snap-assist__grid');
        others.filter(w => !w._snapAssigned).forEach(w => {
          const card = U.el('div.snap-assist__card', { tabindex: 0 }, [
            U.el('div.snap-assist__thumb', {}, Icons.app(w.icon, 40)),
            U.el('div.snap-assist__name.truncate', { text: w.title })
          ]);
          card.onclick = () => {
            w._snapAssigned = true;
            WM.snapTo(w, zone, null, zi);
            setTimeout(() => { w._snapAssigned = false; }, 400);
            ri++; buildStep();
          };
          grid.appendChild(card);
        });
        if (!grid.children.length) { finish(); return; }
        inner.appendChild(grid);
        box.appendChild(inner);
        overlay.appendChild(box);
        U.anim(box, [{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 200, easing: U.EASE.decel });
      };
      const finish = () => {
        U.anim(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).then(() => overlay.remove());
        document.removeEventListener('keydown', onKey, true);
      };
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); finish(); } };
      overlay.onclick = (e) => { if (e.target === overlay || e.target.classList.contains('snap-assist__zone')) finish(); };
      document.addEventListener('keydown', onKey, true);
      document.getElementById('overlayLayer').appendChild(overlay);
      buildStep();
      setTimeout(() => { if (overlay.isConnected && !overlay.querySelector('.snap-assist__card')) finish(); }, 100);
    },

    /* ---------------- 辅助 ---------------- */
    _taskbarRect(appId) {
      const btn = document.querySelector('.tb-app[data-app="' + appId + '"]');
      if (btn) return btn.getBoundingClientRect();
      const c = document.getElementById('taskbarCenter');
      if (c) { const r = c.getBoundingClientRect(); return { left: r.left + r.width / 2 - 20, top: r.top, width: 40, height: r.height }; }
      return { left: innerWidth / 2 - 20, top: innerHeight - 48, width: 40, height: 48 };
    },

    minimizeAll() { this.windows.filter(w => !w.minimized).forEach(w => this.minimize(w)); },
    restoreAll() { this.windows.filter(w => w.minimized).forEach(w => this.unminimize(w)); },
    toggleShowDesktop() {
      const anyVisible = this.windows.some(w => !w.minimized);
      if (anyVisible) { this._lastMinimized = this.windows.filter(w => !w.minimized); this.minimizeAll(); }
      else (this._lastMinimized || this.windows).forEach(w => this.unminimize(w));
    },
    byApp(appId) { return this.windows.filter(w => w.appId === appId && !w.closing); },

    /** 窗口内容截图（用于任务视图缩略图）—— 简化为图标+标题卡片 */
    thumbFor(win) {
      const card = U.el('div.win-thumb');
      card.appendChild(Icons.app(win.icon, 48));
      return card;
    }
  };

  /* ---------------- 顶部贴靠布局条（拖到顶部时出现） ---------------- */
  const SnapBar = {
    el: null, hovering: false, _zone: null, _kind: null, _index: null,
    show(win) {
      if (this.el) return;
      const kinds = window.innerWidth >= 1400
        ? ['left-right', 'thirds', 'left-big', 'quad', 'wide-center', 'left-topright-bottomright']
        : ['left-right', 'left-topright-bottomright', 'quad', 'left-big'];
      const bar = U.el('div.snap-bar.acrylic.material-noise');
      kinds.forEach(kind => {
        const parts = Icons.SNAP[kind];
        const card = U.el('div.snap-card', { dataset: { kind } });
        parts.forEach((p, i) => {
          const z = U.el('i', { style: { left: p[0] + '%', top: p[1] + '%', width: p[2] + '%', height: p[3] + '%' } });
          z.onpointerenter = () => {
            card.querySelectorAll('i').forEach(q => q.classList.remove('is-hot'));
            z.classList.add('is-hot');
            SnapBar._zone = p; SnapBar._kind = kind; SnapBar._index = i;
            WM._showSnapPreview(p);
          };
          card.appendChild(z);
        });
        bar.appendChild(card);
      });
      bar.onpointerenter = () => { SnapBar.hovering = true; };
      bar.onpointerleave = () => { SnapBar.hovering = false; SnapBar._zone = null; WM._hideSnapPreview(); };
      document.getElementById('overlayLayer').appendChild(bar);
      this.el = bar;
      U.anim(bar, [{ opacity: 0, transform: 'translateY(-12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 200, easing: U.EASE.decel });
    },
    hide() {
      if (!this.el) return;
      const e = this.el; this.el = null; this.hovering = false; this._zone = null;
      U.anim(e, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-12px)' }], { duration: 140 }).then(() => e.remove());
    },
    commit(win) {
      const z = this._zone, k = this._kind, i = this._index;
      this.hide();
      WM._hideSnapPreview();
      if (z) WM.snapTo(win, z, k, i);
    }
  };
  WM.SnapBar = SnapBar;

  /* 窗口随视口变化调整 */
  window.addEventListener('resize', U.throttle(() => {
    const wa = WM.workArea();
    WM.windows.forEach(w => {
      if (w.state === 'max') WM._applyRect(w, wa, false), Object.assign(w, wa);
      else if (w.state === 'snap' && w.snapZone) {
        const z = w.snapZone;
        const r = { x: wa.x + z[0] / 100 * wa.w, y: wa.y + z[1] / 100 * wa.h, w: z[2] / 100 * wa.w, h: z[3] / 100 * wa.h };
        WM._applyRect(w, r, false); Object.assign(w, r);
      } else {
        w.x = U.clamp(w.x, -w.w + 80, Math.max(8, wa.w - 80));
        w.y = U.clamp(w.y, 0, Math.max(8, wa.h - 40));
        w.el.style.left = w.x + 'px'; w.el.style.top = w.y + 'px';
      }
      w.emitter.emit('resize');
    });
  }, 80));

  global.WM = WM;
})(window);
