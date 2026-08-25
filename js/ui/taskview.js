/* ============================================================
   taskview.js — 任务视图（窗口卡片 + 虚拟桌面）
   ============================================================ */
(function (global) {
  'use strict';

  const TaskView = {
    open: false,
    el: null,
    desktops: [{ id: 'd1', name: '桌面 1' }],
    activeDesktop: 0,
    _assign: {},     /* winId -> desktopIndex */

    toggle() { return this.open ? this.close() : this.show(); },

    show() {
      if (this.open) return;
      this.open = true;
      const overlay = U.el('div.tv');
      const backdrop = U.el('div.tv__backdrop');
      const grid = U.el('div.tv__grid');
      const strip = U.el('div.tv__strip');
      overlay.append(backdrop, grid, strip);
      document.getElementById('overlayLayer').appendChild(overlay);
      this.el = overlay;

      const wins = WM.windows.filter(w => !w.closing && this.desktopOf(w) === this.activeDesktop);

      if (!wins.length) {
        grid.appendChild(U.el('div.tv__empty', {}, [
          Icons.app('taskview', 64),
          U.el('div.subtitle', { text: '没有打开的窗口' }),
          U.el('div.text-secondary', { text: '打开应用后可在此处切换和整理窗口' })
        ]));
      }

      wins.forEach((w, i) => {
        const card = U.el('div.tv-card', { tabindex: 0 });
        const thumb = U.el('div.tv-card__thumb');
        thumb.appendChild(Icons.app(w.icon, 56));
        thumb.appendChild(U.el('div.tv-card__snapshot', { text: w.title }));
        const bar = U.el('div.tv-card__bar', {}, [
          Icons.app(w.icon, 16),
          U.el('span.truncate', { text: w.title })
        ]);
        const x = U.el('button.tv-card__x', { title: '关闭' }, Icons.ui('close', 12));
        x.onclick = (e) => {
          e.stopPropagation();
          WM.close(w);
          U.anim(card, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)' }], { duration: 160 }).then(() => card.remove());
        };
        card.append(thumb, bar, x);
        card.onclick = () => { this.close(); if (w.minimized) WM.unminimize(w); else WM.focus(w); };
        card.onkeydown = (e) => { if (e.key === 'Enter') card.click(); };
        card.oncontextmenu = (e) => {
          e.preventDefault();
          Menu.show([
            { label: '贴靠到左侧', icon: 'snapLeft', onClick: () => { this.close(); WM.snapTo(w, [0, 0, 50, 100], 'left-right', 0); } },
            { label: '贴靠到右侧', icon: 'snapLeft', onClick: () => { this.close(); WM.snapTo(w, [50, 0, 50, 100], 'left-right', 1); } },
            { separator: true },
            { label: '移动到新桌面', icon: 'plus', onClick: () => { this.addDesktop(); this._assign[w.id] = this.desktops.length - 1; this.refresh(); } },
            { separator: true },
            { label: '关闭', icon: 'close', danger: true, onClick: () => WM.close(w) }
          ], { x: e.clientX, y: e.clientY });
        };
        grid.appendChild(card);
        U.anim(card, [{ opacity: 0, transform: 'translateY(24px) scale(.94)' }, { opacity: 1, transform: 'none' }],
          { duration: 320, delay: i * 30, easing: U.EASE.decel });
      });

      /* 虚拟桌面条 */
      this.desktops.forEach((d, i) => {
        const c = U.el('div.tv-desk' + (i === this.activeDesktop ? '.is-active' : ''), { tabindex: 0 }, [
          U.el('div.tv-desk__preview'),
          U.el('div.tv-desk__name', { text: d.name })
        ]);
        c.onclick = () => this.switchTo(i);
        if (this.desktops.length > 1) {
          const x = U.el('button.tv-desk__x', { title: '关闭桌面' }, Icons.ui('close', 10));
          x.onclick = (e) => { e.stopPropagation(); this.removeDesktop(i); };
          c.appendChild(x);
        }
        strip.appendChild(c);
      });
      const add = U.el('button.tv-desk.tv-desk--add', {}, [Icons.ui('plus', 20), U.el('div.tv-desk__name', { text: '新建桌面' })]);
      add.onclick = () => { this.addDesktop(); this.refresh(); };
      strip.appendChild(add);

      overlay.onclick = (e) => { if (e.target === overlay || e.target === backdrop || e.target === grid) this.close(); };
      U.anim(backdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      U.anim(strip, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 80, easing: U.EASE.decel });

      this._key = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
        if (e.key === 'Tab') { e.preventDefault(); }
      };
      document.addEventListener('keydown', this._key, true);
      U.bus.emit('taskview:open');
    },

    refresh() { if (this.open) { this.close(true); this.show(); } },

    close(immediate) {
      if (!this.open) return;
      this.open = false;
      document.removeEventListener('keydown', this._key, true);
      const el = this.el; this.el = null;
      if (!el) return;
      if (immediate) { el.remove(); return; }
      U.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: U.EASE.accel }).then(() => el.remove());
      U.bus.emit('taskview:close');
    },

    desktopOf(w) { return this._assign[w.id] === undefined ? 0 : this._assign[w.id]; },

    addDesktop() {
      this.desktops.push({ id: U.uid('d'), name: '桌面 ' + (this.desktops.length + 1) });
      Notifications.toast({ title: '已创建新桌面', body: this.desktops[this.desktops.length - 1].name, icon: 'desktop' });
    },

    removeDesktop(i) {
      if (this.desktops.length <= 1) return;
      /* 该桌面的窗口移到前一个桌面 */
      Object.keys(this._assign).forEach(k => {
        if (this._assign[k] === i) this._assign[k] = Math.max(0, i - 1);
        else if (this._assign[k] > i) this._assign[k]--;
      });
      this.desktops.splice(i, 1);
      this.activeDesktop = U.clamp(this.activeDesktop > i ? this.activeDesktop - 1 : this.activeDesktop, 0, this.desktops.length - 1);
      this.applyDesktop();
      this.refresh();
    },

    switchTo(i) {
      if (i === this.activeDesktop) { this.close(); return; }
      this.activeDesktop = U.clamp(i, 0, this.desktops.length - 1);
      this.applyDesktop();
      this.close();
      Notifications.toast({ title: this.desktops[this.activeDesktop].name, body: '已切换桌面', icon: 'desktop', timeout: 1600 });
    },

    applyDesktop() {
      WM.windows.forEach(w => {
        const on = this.desktopOf(w) === this.activeDesktop;
        w.el.style.display = on ? (w.minimized ? 'none' : '') : 'none';
      });
      Taskbar.renderApps();
    },

    next(dir) {
      const i = U.clamp(this.activeDesktop + dir, 0, this.desktops.length - 1);
      if (i !== this.activeDesktop) { this.activeDesktop = i; this.applyDesktop(); }
    }
  };

  global.TaskView = TaskView;
})(window);
