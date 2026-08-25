/* ============================================================
   notifications.js — 通知气泡 / 模态对话框 / 通知中心（含日历）
   全局: Notifications
   ============================================================ */
(function (global) {
  'use strict';

  const TOASTS = () => document.getElementById('toastLayer');
  let calRef = new Date();

  const Notifications = {
    items: [],

    /* ---------------- 通知气泡 ---------------- */
    toast(o) {
      o = o || {};
      const rec = {
        id: U.uid('nt'), title: o.title || '通知', body: o.body || '',
        appIcon: o.appIcon || null, icon: o.icon || null, app: o.app || 'Windows',
        time: Date.now(), actions: o.actions || null
      };
      this.items.unshift(rec);
      this.items = this.items.slice(0, 50);
      this._persist();
      U.bus.emit('notify:add', rec);

      if (Settings.focusAssist && !o.force) return rec;

      const card = U.el('div.toast.acrylic-strong.material-noise');
      const head = U.el('div.toast__head', {}, [
        U.el('div.toast__app', {}, [
          rec.appIcon ? Icons.app(rec.appIcon, 16) : Icons.ui(rec.icon || 'info', 16),
          U.el('span', { text: rec.app })
        ]),
        U.el('div.spacer'),
        U.el('button.toast__x', { title: '关闭', onclick: (e) => { e.stopPropagation(); dismiss(); } }, Icons.ui('close', 12))
      ]);
      const bodyEl = U.el('div.toast__body', {}, [
        (rec.appIcon || o.bigIcon) ? U.el('div.toast__icon', {}, Icons.app(rec.appIcon || o.bigIcon, 40)) : null,
        U.el('div.toast__text', {}, [
          U.el('div.toast__title', { text: rec.title }),
          rec.body ? U.el('div.toast__desc', { text: rec.body }) : null
        ])
      ]);
      card.append(head, bodyEl);
      if (rec.actions) {
        const acts = U.el('div.toast__actions');
        rec.actions.forEach(a => {
          acts.appendChild(U.el('button.btn.btn--sm' + (a.accent ? '.btn--accent' : ''), {
            text: a.text, onclick: (e) => { e.stopPropagation(); dismiss(); a.onClick && a.onClick(); }
          }));
        });
        card.appendChild(acts);
      }
      if (o.onClick) card.onclick = () => { dismiss(); o.onClick(); };

      TOASTS().appendChild(card);
      U.anim(card, [
        { opacity: 0, transform: 'translateY(24px) scale(.96)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { duration: 300, easing: U.EASE.decel });
      Sound.notify();

      let timer = setTimeout(dismiss, o.timeout || 5200);
      card.onpointerenter = () => clearTimeout(timer);
      card.onpointerleave = () => { timer = setTimeout(dismiss, 2200); };
      let dead = false;
      function dismiss() {
        if (dead) return; dead = true;
        clearTimeout(timer);
        U.anim(card, [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(30px)' }
        ], { duration: 180, easing: U.EASE.accel }).then(() => card.remove());
      }
      rec.dismiss = dismiss;
      return rec;
    },

    clearAll() { this.items = []; this._persist(); U.bus.emit('notify:change'); },
    remove(id) { this.items = this.items.filter(i => i.id !== id); this._persist(); U.bus.emit('notify:change'); },
    _persist() {
      Settings.notifications = this.items.map(i => ({ id: i.id, title: i.title, body: i.body, app: i.app, appIcon: i.appIcon, icon: i.icon, time: i.time }));
      Settings.save();
    },
    load() { this.items = (Settings.notifications || []).slice(0, 50); },

    /* ---------------- 模态对话框 ---------------- */
    dialog(o) {
      o = o || {};
      const host = o.host || document.getElementById('overlayLayer');
      const modal = U.el('div.win-modal');
      const dlg = U.el('div.win-dialog', { role: 'dialog', 'aria-modal': 'true' });
      if (o.width) dlg.style.minWidth = o.width + 'px';
      const head = U.el('div.win-dialog__head');
      if (o.icon) head.appendChild(U.el('span.win-dialog__icon', {}, Icons.ui(o.icon, 20)));
      head.appendChild(U.el('span', { text: o.title || '' }));
      const body = U.el('div.win-dialog__body');
      if (o.body) body.appendChild(U.el('div', { text: o.body }));
      if (o.html) body.appendChild(U.el('div', { html: o.html }));
      if (o.content) body.appendChild(o.content);
      const foot = U.el('div.win-dialog__foot');
      const api = {
        close(result) {
          U.anim(dlg, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.97)' }], { duration: 130, easing: U.EASE.accel });
          U.anim(modal, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).then(() => modal.remove());
          document.removeEventListener('keydown', onKey, true);
          if (o.onClose) o.onClose(result);
        }
      };
      (o.buttons || [{ text: '确定', accent: true }]).forEach(b => {
        const btn = U.el('button.btn' + (b.accent ? '.btn--accent' : ''), {
          text: b.text,
          onclick: () => { api.close(b.value !== undefined ? b.value : b.text); b.onClick && b.onClick(); }
        });
        foot.appendChild(btn);
      });
      dlg.append(head, body, foot);
      if (o.buttons !== null) dlg.appendChild(foot);
      modal.appendChild(dlg);
      modal.addEventListener('pointerdown', (e) => { if (e.target === modal && o.dismissable !== false) api.close(null); });
      const onKey = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); api.close(null); }
        if (e.key === 'Enter') { const b = dlg.querySelector('.btn--accent'); if (b) { e.stopPropagation(); b.click(); } }
      };
      document.addEventListener('keydown', onKey, true);
      host.appendChild(modal);
      if (o.sound !== false) Sound.ding();
      setTimeout(() => { const b = dlg.querySelector('.btn--accent') || dlg.querySelector('.btn'); b && b.focus(); }, 60);
      return api;
    },

    confirm(title, body, okText) {
      return new Promise(res => {
        this.dialog({
          title, body,
          buttons: [{ text: okText || '确定', accent: true, value: true }, { text: '取消', value: false }],
          onClose: (v) => res(v === true)
        });
      });
    },

    prompt(title, defVal, label) {
      return new Promise(res => {
        const input = U.el('input', { value: defVal || '', class: 'dlg-input' });
        const wrap = U.el('div.textbox', { style: { marginTop: '8px' } }, input);
        const content = U.el('div', {}, [label ? U.el('div', { text: label, class: 'text-secondary' }) : null, wrap]);
        const api = this.dialog({
          title, content,
          buttons: [{ text: '确定', accent: true, value: 'ok' }, { text: '取消', value: null }],
          onClose: (v) => res(v === 'ok' ? input.value : null)
        });
        setTimeout(() => { input.focus(); input.select(); }, 80);
        input.onkeydown = (e) => { if (e.key === 'Enter') { res(input.value); api.close('_'); } };
      });
    },

    /* ---------------- 通知中心面板 ---------------- */
    buildCenter(root) {
      root.classList.add('nc');
      const notifs = U.el('div.nc__notifs');
      const head = U.el('div.nc__head', {}, [
        U.el('div.nc__title', { text: '通知' }),
        U.el('div.spacer'),
        U.el('button.nc__link', { text: '全部清除', onclick: () => { Notifications.clearAll(); render(); } })
      ]);
      const list = U.el('div.nc__list.thin-scroll');
      notifs.append(head, list);

      const cal = U.el('div.nc__cal');
      root.append(notifs, cal);

      function render() {
        U.clear(list);
        if (!Notifications.items.length) {
          list.appendChild(U.el('div.nc__empty', {}, [
            U.el('div.nc__empty-ico', {}, Icons.ui('bell', 32)),
            U.el('div', { text: '暂无新通知' })
          ]));
          return;
        }
        Notifications.items.forEach(n => {
          const card = U.el('div.nc-card.card', {}, [
            U.el('div.nc-card__head', {}, [
              U.el('div.nc-card__app', {}, [
                n.appIcon ? Icons.app(n.appIcon, 16) : Icons.ui(n.icon || 'info', 16),
                U.el('span', { text: n.app || 'Windows' })
              ]),
              U.el('div.spacer'),
              U.el('span.nc-card__time', { text: relTime(n.time) }),
              U.el('button.nc-card__x', { title: '清除', onclick: () => { Notifications.remove(n.id); render(); } }, Icons.ui('close', 12))
            ]),
            U.el('div.nc-card__title', { text: n.title }),
            n.body ? U.el('div.nc-card__body', { text: n.body }) : null
          ]);
          list.appendChild(card);
        });
      }

      function relTime(t) {
        const d = Math.floor((Date.now() - t) / 1000);
        if (d < 60) return '刚刚';
        if (d < 3600) return Math.floor(d / 60) + ' 分钟前';
        if (d < 86400) return Math.floor(d / 3600) + ' 小时前';
        return Math.floor(d / 86400) + ' 天前';
      }

      /* ------- 日历 ------- */
      let expanded = true;
      function renderCal() {
        U.clear(cal);
        const today = new Date();
        const hdr = U.el('div.nc-cal__head');
        const dateLine = U.el('button.nc-cal__date', {
          onclick: () => { expanded = !expanded; renderCal(); }
        }, [
          U.el('div', {}, [
            U.el('div.nc-cal__d1', { text: U.fmtTime(today) }),
            U.el('div.nc-cal__d2', { text: U.fmtDateLong(today) })
          ]),
          U.el('span.nc-cal__chev', { html: expanded ? Icons.UI.chevronDown : Icons.UI.chevronUp })
        ]);
        hdr.appendChild(dateLine);
        cal.appendChild(hdr);
        if (!expanded) return;

        const grid = U.el('div.nc-cal__wrap');
        const nav = U.el('div.nc-cal__nav', {}, [
          U.el('button.nc-cal__month', {
            text: calRef.getFullYear() + '年' + (calRef.getMonth() + 1) + '月',
            onclick: () => { calRef = new Date(); renderCal(); }
          }),
          U.el('div.spacer'),
          U.el('button.nc-cal__arrow', { title: '上一月', onclick: () => { calRef = new Date(calRef.getFullYear(), calRef.getMonth() - 1, 1); renderCal(); } }, Icons.ui('chevronUp', 12)),
          U.el('button.nc-cal__arrow', { title: '下一月', onclick: () => { calRef = new Date(calRef.getFullYear(), calRef.getMonth() + 1, 1); renderCal(); } }, Icons.ui('chevronDown', 12))
        ]);
        const days = U.el('div.nc-cal__grid');
        ['一', '二', '三', '四', '五', '六', '日'].forEach(w => days.appendChild(U.el('div.nc-cal__wd', { text: w })));
        const y = calRef.getFullYear(), m = calRef.getMonth();
        const first = new Date(y, m, 1);
        let start = first.getDay() - 1; if (start < 0) start = 6;   /* 周一开头 */
        const dim = new Date(y, m + 1, 0).getDate();
        const prevDim = new Date(y, m, 0).getDate();
        for (let i = start - 1; i >= 0; i--) days.appendChild(U.el('div.nc-cal__day.is-out', { text: prevDim - i }));
        for (let d = 1; d <= dim; d++) {
          const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
          const cell = U.el('div.nc-cal__day' + (isToday ? '.is-today' : ''), { text: d });
          cell.onclick = () => {
            days.querySelectorAll('.is-sel').forEach(x => x.classList.remove('is-sel'));
            cell.classList.add('is-sel');
          };
          days.appendChild(cell);
        }
        const rest = (7 - ((start + dim) % 7)) % 7;
        for (let i = 1; i <= rest; i++) days.appendChild(U.el('div.nc-cal__day.is-out', { text: i }));
        grid.append(nav, days);
        cal.appendChild(grid);
        U.anim(days, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: U.EASE.decel });
      }

      render(); renderCal();
      const off = U.bus.on('notify:change', render);
      const off2 = U.bus.on('notify:add', render);
      root._cleanup = () => { off(); off2(); };
    }
  };

  global.Notifications = Notifications;
})(window);
