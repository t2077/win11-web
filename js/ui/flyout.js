/* ============================================================
   flyout.js — 任务栏浮出控件通用容器（开始菜单/搜索/小组件/快速设置/通知）
   全局: Flyout
   ============================================================ */
(function (global) {
  'use strict';

  const LAYER = () => document.getElementById('flyoutLayer');
  const registry = new Map();
  let current = null;      /* 当前打开的任务栏浮出控件 */
  let scrim = null;
  let bound = false;

  function ensureScrim() {
    if (scrim) return scrim;
    scrim = U.el('div.flyout-scrim');
    scrim.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (current) current.close();
    });
    return scrim;
  }

  function bindGlobal() {
    if (bound) return;
    bound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && current) { e.stopPropagation(); e.preventDefault(); current.close(); }
    }, true);
    window.addEventListener('resize', U.throttle(() => { if (current) current.position(); }, 60));
  }

  class FlyoutPanel {
    constructor(o) {
      this.id = o.id;
      this.opts = o;
      this.el = null;
      this.isOpen = false;
      registry.set(o.id, this);
    }

    build() {
      const o = this.opts;
      const el = U.el('div.flyout' + (o.className ? '.' + o.className.split(' ').join('.') : ''), {
        dataset: { flyout: this.id }, role: 'dialog', 'aria-modal': 'false'
      });
      el.classList.add(o.material || 'acrylic', 'material-noise');
      if (o.width) el.style.width = (typeof o.width === 'number' ? o.width + 'px' : o.width);
      if (o.height) el.style.height = (typeof o.height === 'number' ? o.height + 'px' : o.height);
      if (o.maxHeight) el.style.maxHeight = (typeof o.maxHeight === 'number' ? o.maxHeight + 'px' : o.maxHeight);
      this.el = el;
      this.content = U.el('div.flyout__content');
      el.appendChild(this.content);
      if (o.build) o.build(this.content, this);
      return el;
    }

    position() {
      if (!this.el) return;
      const o = this.opts;
      const tb = document.getElementById('taskbar');
      const tbr = tb.getBoundingClientRect();
      const gap = o.gap === undefined ? 8 : o.gap;
      const r = this.el.getBoundingClientRect();
      const el = this.el;
      const anchor = o.anchor || 'center';

      el.style.bottom = (window.innerHeight - tbr.top + gap) + 'px';
      el.style.top = 'auto';

      if (anchor === 'center') {
        /* 开始菜单：任务栏居中时屏幕居中；左对齐时贴左侧 */
        if (Settings.taskbarAlign === 'left') el.style.left = '12px', el.style.right = 'auto';
        else {
          const startBtn = document.querySelector('.tb-start');
          if (startBtn && o.followStart) {
            const sr = startBtn.getBoundingClientRect();
            let x = sr.left + sr.width / 2 - r.width / 2;
            x = U.clamp(x, 12, innerWidth - r.width - 12);
            el.style.left = x + 'px'; el.style.right = 'auto';
          } else {
            el.style.left = '50%'; el.style.right = 'auto';
            el.style.transform = 'translateX(-50%)';
            this._centered = true;
          }
        }
      } else if (anchor === 'left') { el.style.left = '12px'; el.style.right = 'auto'; }
      else if (anchor === 'right') { el.style.right = '12px'; el.style.left = 'auto'; }
      else if (anchor instanceof Element) {
        const ar = anchor.getBoundingClientRect();
        let x = ar.left + ar.width / 2 - r.width / 2;
        x = U.clamp(x, 12, innerWidth - r.width - 12);
        el.style.left = x + 'px'; el.style.right = 'auto';
      }
    }

    async open(args) {
      bindGlobal();
      if (this.isOpen) return;
      if (current && current !== this) current.close(true);
      Menu.close(true);

      const el = this.build();
      if (this.opts.scrim !== false) LAYER().appendChild(ensureScrim());
      LAYER().appendChild(el);
      this.isOpen = true;
      current = this;
      document.body.classList.add('has-flyout');
      this.position();
      if (this.opts.onOpen) this.opts.onOpen(this.content, this, args);
      U.bus.emit('flyout:open', this.id);

      const tx = this._centered ? 'translateX(-50%) ' : '';
      await U.anim(el, [
        { opacity: 0, transform: tx + 'translateY(16px) scale(.985)' },
        { opacity: 1, transform: tx + 'translateY(0) scale(1)' }
      ], { duration: 300, easing: U.EASE.decel });
      if (this.opts.autofocus) {
        const f = this.content.querySelector(this.opts.autofocus);
        if (f) f.focus();
      }
    }

    async close(immediate) {
      if (!this.isOpen) return;
      this.isOpen = false;
      if (current === this) current = null;
      document.body.classList.remove('has-flyout');
      if (scrim && scrim.isConnected) scrim.remove();
      const el = this.el;
      this.el = null;
      if (this.opts.onClose) this.opts.onClose();
      U.bus.emit('flyout:close', this.id);
      if (!el) return;
      if (immediate) { el.remove(); return; }
      const tx = this._centered ? 'translateX(-50%) ' : '';
      await U.anim(el, [
        { opacity: 1, transform: tx + 'translateY(0) scale(1)' },
        { opacity: 0, transform: tx + 'translateY(12px) scale(.99)' }
      ], { duration: 160, easing: U.EASE.accel });
      el.remove();
    }

    toggle(args) { return this.isOpen ? this.close() : this.open(args); }
  }

  const Flyout = {
    define(o) { return new FlyoutPanel(o); },
    get(id) { return registry.get(id); },
    open(id, args) { const f = registry.get(id); return f && f.open(args); },
    close(id) { const f = registry.get(id); return f && f.close(); },
    toggle(id, args) { const f = registry.get(id); return f && f.toggle(args); },
    closeAll(immediate) { if (current) current.close(immediate); },
    current() { return current; },
    isOpen(id) { const f = registry.get(id); return !!(f && f.isOpen); }
  };

  global.Flyout = Flyout;
})(window);
