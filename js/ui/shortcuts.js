/* ============================================================
   shortcuts.js — 全局键盘快捷键 + Alt+Tab 切换器
   ============================================================ */
(function (global) {
  'use strict';

  const Shortcuts = {
    init() {
      document.addEventListener('keydown', (e) => this.onKeyDown(e), true);
      document.addEventListener('keyup', (e) => this.onKeyUp(e), true);
      window.addEventListener('blur', () => this.closeSwitcher(false));
    },

    inEditable(e) {
      const t = e.target;
      if (!t) return false;
      return t.matches('input, textarea, [contenteditable="true"]') || (t.isContentEditable === true);
    },

    onKeyDown(e) {
      /* ---- Alt+Tab ---- */
      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault(); e.stopPropagation();
        this.openSwitcher(e.shiftKey ? -1 : 1);
        return;
      }
      /* ---- Alt+F4 ---- */
      if (e.key === 'F4' && e.altKey) {
        e.preventDefault();
        if (WM.active) WM.close(WM.active);
        else Shell.shutdownDialog();
        return;
      }
      /* ---- Ctrl+Shift+Esc ---- */
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault(); Apps.launch('taskmgr'); return;
      }
      /* ---- Esc 关闭浮出 ---- */
      if (e.key === 'Escape') {
        if (Flyout.current()) { Flyout.closeAll(); return; }
        if (TaskView.open) { TaskView.close(); return; }
      }

      /* ---- Win 组合键 ---- */
      const win = e.metaKey || e.key === 'Meta' || e.key === 'OS';
      if (!win) return;

      const k = (e.key || '').toLowerCase();
      const stop = () => { e.preventDefault(); e.stopPropagation(); };

      /* Win 单键 */
      if (k === 'meta' || k === 'os') {
        if (e.ctrlKey || e.altKey || e.shiftKey) return;
        stop();
        this._winTap = true;
        return;
      }

      switch (k) {
        case 'd': stop(); WM.toggleShowDesktop(); return;
        case 'e': stop(); Apps.launch('explorer'); return;
        case 'i': stop(); Apps.launch('settings'); return;
        case 'r': stop(); Shell.runDialog(); return;
        case 's': case 'q': stop(); Flyout.toggle('search'); return;
        case 'a': stop(); Flyout.toggle('quicksettings'); return;
        case 'n': stop(); Flyout.toggle('notifications'); return;
        case 'w': stop(); Flyout.toggle('widgets'); return;
        case 'l': stop(); Shell.lock(); return;
        case 'x': stop(); { const b = document.querySelector('.tb-start'); if (b) Taskbar.showWinXMenu(b); } return;
        case 'm': stop(); e.shiftKey ? WM.restoreAll() : WM.minimizeAll(); return;
        case 'v': stop(); Notifications.toast({ title: '剪贴板历史记录', body: '剪贴板历史在此版本中不可用。', icon: 'paste' }); return;
        case 'p': stop(); QuickSettings.init && Flyout.open('quicksettings'); return;
        case 'tab': stop(); TaskView.toggle(); return;
        case 'printscreen': stop(); Shell.screenshot(); return;
        case '.': stop(); Notifications.toast({ title: '表情符号面板', body: '此功能在 Web 版中不可用。', icon: 'lightbulb' }); return;
      }

      /* Win + 方向键：贴靠 */
      const w = WM.active;
      if (!w) return;
      if (k === 'arrowleft' || k === 'arrowright') {
        stop();
        if (e.ctrlKey) { TaskView.next(k === 'arrowleft' ? -1 : 1); return; }
        const left = k === 'arrowleft';
        if (w.state === 'snap' && w.snapZone) {
          const z = w.snapZone;
          const isLeftHalf = z[0] === 0 && z[2] === 50;
          const isRightHalf = z[0] === 50 && z[2] === 50;
          if (isLeftHalf && !left) { WM.restore(w); return; }
          if (isRightHalf && left) { WM.restore(w); return; }
        }
        if (w.state === 'max') { WM.snapTo(w, left ? [0, 0, 50, 100] : [50, 0, 50, 100], 'left-right', left ? 0 : 1); return; }
        WM.snapTo(w, left ? [0, 0, 50, 100] : [50, 0, 50, 100], 'left-right', left ? 0 : 1);
        return;
      }
      if (k === 'arrowup') { stop(); if (w.state === 'snap' && w.snapZone && w.snapZone[3] === 100) { WM.maximize(w); } else WM.maximize(w); return; }
      if (k === 'arrowdown') {
        stop();
        if (w.state === 'max' || w.state === 'snap') WM.restore(w);
        else WM.minimize(w);
        return;
      }
      /* Win + 数字：启动任务栏第 n 个应用 */
      if (/^[1-9]$/.test(k)) {
        stop();
        const btns = U.$$('.tb-app');
        const b = btns[parseInt(k, 10) - 1];
        if (b) b.click();
        return;
      }
    },

    onKeyUp(e) {
      if (e.key === 'Meta' || e.key === 'OS') {
        if (this._winTap && !this._switcher) { this._winTap = false; Flyout.toggle('start'); }
        this._winTap = false;
      }
      if (!e.altKey && this._switcher) this.commitSwitcher();
    },

    /* ---------------- Alt+Tab 切换器 ---------------- */
    openSwitcher(dir) {
      const list = WM.windows.filter(w => !w.closing);
      if (!list.length) return;
      if (!this._switcher) {
        this._order = list.slice().sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0));
        this._idx = 0;
        const ov = U.el('div.alt-tab');
        const panel = U.el('div.alt-tab__panel.acrylic-strong.material-noise');
        this._order.forEach((w, i) => {
          const c = U.el('div.alt-tab__card' + (i === 0 ? '.is-sel' : ''), { dataset: { i } }, [
            U.el('div.alt-tab__thumb', {}, Icons.app(w.icon, 44)),
            U.el('div.alt-tab__name.truncate', { text: w.title })
          ]);
          c.onpointerenter = () => { this._idx = i; this.syncSwitcher(); };
          c.onclick = () => { this._idx = i; this.commitSwitcher(); };
          panel.appendChild(c);
        });
        ov.appendChild(panel);
        document.getElementById('overlayLayer').appendChild(ov);
        this._switcher = ov;
        U.anim(panel, [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 160, easing: U.EASE.decel });
        this._idx = Math.min(1, this._order.length - 1);
      } else {
        this._idx = (this._idx + dir + this._order.length) % this._order.length;
      }
      this.syncSwitcher();
    },

    syncSwitcher() {
      if (!this._switcher) return;
      U.$$('.alt-tab__card', this._switcher).forEach((c, i) => c.classList.toggle('is-sel', i === this._idx));
    },

    commitSwitcher() {
      const w = this._order && this._order[this._idx];
      this.closeSwitcher(true);
      if (w) { if (w.minimized) WM.unminimize(w); else WM.focus(w); }
    },

    closeSwitcher(animate) {
      const ov = this._switcher;
      this._switcher = null; this._order = null;
      if (!ov) return;
      if (animate) U.anim(ov, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 }).then(() => ov.remove());
      else ov.remove();
    }
  };

  global.Shortcuts = Shortcuts;
})(window);
