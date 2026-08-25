/* ============================================================
   contextmenu.js — Windows 11 风格上下文菜单（含图标条、子菜单、单选/复选）
   全局: Menu
   ============================================================ */
(function (global) {
  'use strict';

  const LAYER = () => document.getElementById('menuLayer');
  let openStack = [];
  let globalBound = false;

  function closeAll(immediate) {
    const stack = openStack.slice();
    openStack = [];
    stack.forEach(m => destroy(m, immediate));
    document.body.classList.remove('has-menu');
  }

  function destroy(m, immediate) {
    if (!m || m._dead) return;
    m._dead = true;
    if (immediate) { m.remove(); return; }
    U.anim(m, [{ opacity: 1, transform: m._tf + ' scale(1)' }, { opacity: 0, transform: m._tf + ' scale(.97)' }],
      { duration: 100, easing: U.EASE.accel }).then(() => m.remove());
  }

  function bindGlobal() {
    if (globalBound) return;
    globalBound = true;
    document.addEventListener('pointerdown', (e) => {
      if (!openStack.length) return;
      if (openStack.some(m => m.contains(e.target))) return;
      closeAll();
    }, true);
    document.addEventListener('keydown', (e) => {
      if (!openStack.length) return;
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); closeAll(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const m = openStack[openStack.length - 1];
        const items = U.$$('.mi:not(.is-disabled)', m);
        if (!items.length) return;
        e.preventDefault();
        const cur = items.findIndex(i => i === document.activeElement);
        const next = e.key === 'ArrowDown' ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length;
        items[next].focus();
      }
    }, true);
    window.addEventListener('blur', () => closeAll(true));
    window.addEventListener('resize', () => closeAll(true));
  }

  function buildMenu(items, opts) {
    const menu = U.el('div.ctx-menu.acrylic.material-noise', { role: 'menu', tabindex: -1 });
    if (opts && opts.compact) menu.classList.add('ctx-menu--compact');
    if (opts && opts.wide) menu.classList.add('ctx-menu--wide');

    /* 顶部图标条（Win11 文件右键菜单） */
    const bar = items.find(i => i && i.iconBar);
    if (bar) {
      const row = U.el('div.ctx-iconbar');
      bar.iconBar.forEach(b => {
        const btn = U.el('button.ctx-iconbtn', { title: b.label, disabled: !!b.disabled }, Icons.ui(b.icon, 16));
        if (b.danger) btn.classList.add('is-danger');
        btn.onclick = (e) => { e.stopPropagation(); if (b.disabled) return; closeAll(); b.onClick && b.onClick(); };
        U.tooltip(btn, b.label, 'top');
        row.appendChild(btn);
      });
      menu.appendChild(row);
    }

    items.filter(i => i && !i.iconBar).forEach(it => {
      if (it.separator) { menu.appendChild(U.el('div.ctx-sep')); return; }
      if (it.header) { menu.appendChild(U.el('div.ctx-header', { text: it.header })); return; }

      const mi = U.el('div.mi', { role: 'menuitem', tabindex: it.disabled ? -1 : 0 });
      if (it.disabled) mi.classList.add('is-disabled');
      if (it.danger) mi.classList.add('is-danger');
      if (it.checked) mi.classList.add('is-checked');

      const ic = U.el('div.mi__icon');
      if (it.checked) ic.appendChild(Icons.ui(it.radio ? 'check' : 'check', 16));
      else if (it.appIcon) ic.appendChild(Icons.app(it.appIcon, 16));
      else if (it.icon) ic.appendChild(Icons.ui(it.icon, 16));
      mi.appendChild(ic);
      mi.appendChild(U.el('div.mi__label', { text: it.label }));
      if (it.accel) mi.appendChild(U.el('div.mi__accel', { text: it.accel }));
      if (it.submenu) mi.appendChild(U.el('div.mi__chev', { html: Icons.UI.chevronRight }));

      let subTimer = null, sub = null;
      const openSub = () => {
        if (sub || it.disabled) return;
        const list = typeof it.submenu === 'function' ? it.submenu() : it.submenu;
        if (!list || !list.length) return;
        sub = buildMenu(list, opts);
        LAYER().appendChild(sub);
        const r = mi.getBoundingClientRect(), sr = sub.getBoundingClientRect();
        let x = r.right - 4, y = r.top - 5;
        let flipX = false;
        if (x + sr.width > innerWidth - 4) { x = r.left - sr.width + 4; flipX = true; }
        if (y + sr.height > innerHeight - 4) y = Math.max(4, innerHeight - sr.height - 4);
        sub.style.left = x + 'px'; sub.style.top = y + 'px';
        sub._tf = '';
        sub.style.transformOrigin = (flipX ? 'right' : 'left') + ' top';
        openStack.push(sub);
        U.anim(sub, [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 130, easing: U.EASE.decel });
        mi.classList.add('is-subopen');
      };
      const closeSub = () => {
        if (!sub) return;
        const i = openStack.indexOf(sub); if (i >= 0) openStack.splice(i, 1);
        destroy(sub); sub = null;
        mi.classList.remove('is-subopen');
      };
      if (it.submenu) {
        U.on(mi, 'pointerenter', () => { clearTimeout(subTimer); subTimer = setTimeout(openSub, 220); });
        U.on(mi, 'pointerleave', (e) => {
          clearTimeout(subTimer);
          subTimer = setTimeout(() => {
            if (sub && !sub.matches(':hover') && !mi.matches(':hover')) closeSub();
          }, 260);
        });
        U.on(mi, 'click', (e) => { e.stopPropagation(); openSub(); });
      } else {
        U.on(mi, 'pointerenter', () => {
          /* 关闭同级已展开的子菜单 */
          U.$$('.mi.is-subopen', menu).forEach(o => o.dispatchEvent(new PointerEvent('pointerleave')));
        });
        U.on(mi, 'click', (e) => {
          e.stopPropagation();
          if (it.disabled) return;
          if (it.keepOpen) { it.onClick && it.onClick(mi); return; }
          closeAll();
          setTimeout(() => it.onClick && it.onClick(mi), 0);
        });
        U.on(mi, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mi.click(); } });
      }
      menu.appendChild(mi);
    });
    return menu;
  }

  const Menu = {
    isOpen() { return openStack.length > 0; },
    close: closeAll,

    /**
     * Menu.show(items, {x,y,anchor,align,compact})
     * anchor: 元素（相对其下方/上方弹出）
     */
    show(items, opts) {
      bindGlobal();
      closeAll(true);
      opts = opts || {};
      const menu = buildMenu(items, opts);
      LAYER().appendChild(menu);
      document.body.classList.add('has-menu');

      const mr = menu.getBoundingClientRect();
      let x = opts.x || 0, y = opts.y || 0, ox = 'left', oy = 'top';

      if (opts.anchor) {
        const r = opts.anchor.getBoundingClientRect();
        const align = opts.align || 'bottom-left';
        if (align.startsWith('bottom')) { y = r.bottom + (opts.gap === undefined ? 6 : opts.gap); oy = 'top'; }
        else if (align.startsWith('top')) { y = r.top - mr.height - (opts.gap === undefined ? 6 : opts.gap); oy = 'bottom'; }
        else if (align.startsWith('right')) { x = r.right + 6; y = r.top; }
        if (align.endsWith('left')) x = r.left;
        else if (align.endsWith('right')) x = r.right - mr.width;
        else if (align.endsWith('center')) x = r.left + r.width / 2 - mr.width / 2;
        if (y + mr.height > innerHeight - 4) { y = r.top - mr.height - 6; oy = 'bottom'; }
        if (y < 4) { y = r.bottom + 6; oy = 'top'; }
      } else {
        if (x + mr.width > innerWidth - 4) { x = Math.max(4, x - mr.width); ox = 'right'; }
        if (y + mr.height > innerHeight - 4) { y = Math.max(4, y - mr.height); oy = 'bottom'; }
      }
      x = U.clamp(x, 4, Math.max(4, innerWidth - mr.width - 4));
      y = U.clamp(y, 4, Math.max(4, innerHeight - mr.height - 4));
      menu.style.left = x + 'px'; menu.style.top = y + 'px';
      menu.style.transformOrigin = ox + ' ' + oy;
      menu._tf = '';
      openStack.push(menu);

      /* Win11 菜单进场：轻微缩放 + 淡入 */
      U.anim(menu, [
        { opacity: 0, transform: 'scale(.96)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { duration: 150, easing: U.EASE.decel });
      const rows = U.$$('.mi, .ctx-iconbar', menu);
      rows.forEach((r, i) => U.anim(r, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }],
        { duration: 180, delay: Math.min(i * 12, 120), easing: U.EASE.decel }));
      return menu;
    }
  };

  global.Menu = Menu;
})(window);
