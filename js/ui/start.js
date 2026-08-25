/* ============================================================
   start.js — 开始菜单（已固定 / 所有应用 / 推荐的项目 / 用户 / 电源）
   ============================================================ */
(function (global) {
  'use strict';

  let page = 'pinned';
  let pinPage = 0;

  const StartMenu = {
    panel: null,

    init() {
      this.panel = Flyout.define({
        id: 'start',
        className: 'start',
        material: 'acrylic-strong',
        width: 640,
        anchor: 'center',
        followStart: false,
        build: (root, f) => this.build(root, f),
        onOpen: () => { page = 'pinned'; Sound.hover(); }
      });
    },

    build(root) {
      const search = U.el('button.start__search', {}, [
        Icons.ui('search', 16),
        U.el('span', { text: '搜索应用、设置和文档' })
      ]);
      search.onclick = () => { Flyout.close('start'); setTimeout(() => Flyout.open('search'), 60); };

      const stage = U.el('div.start__stage');
      const pinnedView = U.el('div.start__view.start__view--pinned');
      const allView = U.el('div.start__view.start__view--all', { hidden: true });
      stage.append(pinnedView, allView);

      /* ---------- 已固定 ---------- */
      const pinHead = U.el('div.start__sechead', {}, [
        U.el('div.start__sectitle', { text: '已固定' }),
        U.el('div.spacer'),
        U.el('button.start__more', {}, [U.el('span', { text: '所有应用' }), U.el('i', { html: Icons.UI.chevronRight })])
      ]);
      pinHead.querySelector('.start__more').onclick = () => this.goto('all', pinnedView, allView);

      const pinWrap = U.el('div.start__pinwrap');
      const pinGrid = U.el('div.start__pins');
      const dots = U.el('div.start__dots');
      pinWrap.append(pinGrid, dots);

      const renderPins = () => {
        U.clear(pinGrid); U.clear(dots);
        const ids = Settings.pinnedStart.filter(id => Apps.has(id));
        const perPage = 18;
        const pages = Math.max(1, Math.ceil(ids.length / perPage));
        pinPage = U.clamp(pinPage, 0, pages - 1);
        ids.slice(pinPage * perPage, pinPage * perPage + perPage).forEach(id => {
          const d = Apps.get(id);
          const tile = U.el('button.start-tile', { dataset: { app: id } }, [
            U.el('div.start-tile__icon', {}, Icons.app(d.icon, 32)),
            U.el('div.start-tile__name', { text: d.name })
          ]);
          tile.onclick = () => { Flyout.close('start'); Apps.launch(id); };
          tile.oncontextmenu = (e) => { e.preventDefault(); this.tileMenu(id, e.clientX, e.clientY, renderPins); };
          pinGrid.appendChild(tile);
        });
        if (pages > 1) {
          for (let i = 0; i < pages; i++) {
            const dot = U.el('button.start__dot' + (i === pinPage ? '.is-active' : ''));
            dot.onclick = () => { pinPage = i; renderPins(); };
            dots.appendChild(dot);
          }
        }
        U.$$('.start-tile', pinGrid).forEach((t, i) => U.anim(t,
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, delay: Math.min(i * 12, 160), easing: U.EASE.decel }));
      };

      /* ---------- 推荐的项目 ---------- */
      const recHead = U.el('div.start__sechead', {}, [
        U.el('div.start__sectitle', { text: '推荐的项目' }),
        U.el('div.spacer'),
        U.el('button.start__more', {}, [U.el('span', { text: '更多' }), U.el('i', { html: Icons.UI.chevronRight })])
      ]);
      recHead.querySelector('.start__more').onclick = () => { Flyout.close('start'); Apps.launch('explorer', { path: 'home' }); };
      const recGrid = U.el('div.start__rec');

      const renderRec = () => {
        U.clear(recGrid);
        const files = [];
        [VFS.special('desktop'), VFS.special('documents'), VFS.special('downloads'), VFS.special('pictures')].forEach(p => {
          VFS.list(p).filter(e => e.type === 'file').forEach(e => files.push(e));
        });
        files.sort((a, b) => (b.modified || 0) - (a.modified || 0));
        const recs = files.slice(0, 6);
        if (!recs.length) {
          recGrid.appendChild(U.el('div.start__recempty', { text: '越是使用设备，我们越能更好地在此处显示你的推荐项目。' }));
          return;
        }
        recs.forEach(e => {
          const item = U.el('button.start-rec', {}, [
            U.el('div.start-rec__icon', {}, Icons.app(Icons.forFile(e.name, false), 24)),
            U.el('div.start-rec__txt', {}, [
              U.el('div.start-rec__name.truncate', { text: e.name }),
              U.el('div.start-rec__sub.truncate', { text: recentLabel(e.modified) })
            ])
          ]);
          item.onclick = () => { Flyout.close('start'); Apps.open(e.path); };
          item.oncontextmenu = (ev) => {
            ev.preventDefault();
            Menu.show([
              { label: '打开', icon: 'open', onClick: () => { Flyout.close('start'); Apps.open(e.path); } },
              { label: '打开文件位置', icon: 'folder', onClick: () => { Flyout.close('start'); Apps.launch('explorer', { path: VFS.parent(e.path) }); } },
              { separator: true },
              { label: '从列表中删除', icon: 'close' }
            ], { x: ev.clientX, y: ev.clientY });
          };
          recGrid.appendChild(item);
        });
        U.$$('.start-rec', recGrid).forEach((t, i) => U.anim(t,
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, delay: 120 + i * 20, easing: U.EASE.decel }));
      };

      function recentLabel(t) {
        const d = Date.now() - (t || 0);
        if (d < 3600e3) return '最近使用';
        if (d < 86400e3) return '今天 ' + U.fmtTime(new Date(t));
        if (d < 2 * 86400e3) return '昨天';
        return U.fmtDateShort(new Date(t));
      }

      pinnedView.append(pinHead, pinWrap, recHead, recGrid);

      /* ---------- 所有应用 ---------- */
      const allHead = U.el('div.start__sechead', {}, [
        U.el('button.start__back', {}, [U.el('i', { html: Icons.UI.back })]),
        U.el('div.start__sectitle', { text: '所有应用' }),
        U.el('div.spacer'),
        U.el('button.start__more', {}, [U.el('span', { text: '返回' }), U.el('i', { html: Icons.UI.chevronRight })])
      ]);
      allHead.querySelector('.start__back').onclick = () => this.goto('pinned', pinnedView, allView);
      allHead.querySelector('.start__more').onclick = () => this.goto('pinned', pinnedView, allView);
      const allList = U.el('div.start__alllist.thin-scroll');
      allView.append(allHead, allList);

      const renderAll = () => {
        U.clear(allList);
        const apps = Apps.listForStart();
        const groups = new Map();
        apps.forEach(a => {
          let k = (a.sortKey || a.name).charAt(0).toUpperCase();
          if (/[\u4e00-\u9fa5]/.test(k)) k = '中';
          if (/[0-9]/.test(k)) k = '#';
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k).push(a);
        });
        Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'zh')).forEach(k => {
          allList.appendChild(U.el('div.start__group', { text: k }));
          groups.get(k).forEach(a => {
            const row = U.el('button.start-row', {}, [
              Icons.app(a.icon, 24),
              U.el('span.truncate', { text: a.name })
            ]);
            row.onclick = () => { Flyout.close('start'); Apps.launch(a.id); };
            row.oncontextmenu = (e) => { e.preventDefault(); this.tileMenu(a.id, e.clientX, e.clientY, renderPins); };
            allList.appendChild(row);
          });
        });
      };

      /* ---------- 底栏 ---------- */
      const foot = U.el('div.start__foot');
      const userBtn = U.el('button.start__user', {}, [
        U.el('div.start__avatar', {}, Settings.userAvatar
          ? U.el('img', { src: Settings.userAvatar })
          : Icons.app('user', 28)),
        U.el('span', { text: Settings.userName })
      ]);
      userBtn.onclick = (e) => {
        Menu.show([
          { label: '更改账户设置', icon: 'person', onClick: () => { Flyout.close('start'); Apps.launch('settings', { page: 'accounts' }); } },
          { label: '锁定', icon: 'lock', accel: 'Win+L', onClick: () => { Flyout.close('start'); Shell.lock(); } },
          { label: '注销', icon: 'power', onClick: () => { Flyout.close('start'); Shell.signOut(); } }
        ], { anchor: userBtn, align: 'top-left' });
      };
      const powerBtn = U.el('button.start__power', { title: '电源' }, Icons.ui('power', 18));
      powerBtn.onclick = () => {
        Menu.show([
          { label: '睡眠', icon: 'nightlight', onClick: () => { Flyout.close('start'); Shell.sleep(); } },
          { label: '关机', icon: 'power', onClick: () => { Flyout.close('start'); Shell.shutdown(); } },
          { label: '重启', icon: 'refresh', onClick: () => { Flyout.close('start'); Shell.restart(); } }
        ], { anchor: powerBtn, align: 'top-right' });
      };
      foot.append(userBtn, U.el('div.spacer'), powerBtn);

      root.append(search, stage, foot);
      renderPins(); renderRec(); renderAll();
      this._renderPins = renderPins;
    },

    goto(target, pinnedView, allView) {
      if (page === target) return;
      page = target;
      const showing = target === 'all' ? allView : pinnedView;
      const hiding = target === 'all' ? pinnedView : allView;
      const dir = target === 'all' ? 1 : -1;
      showing.hidden = false;
      U.anim(hiding, [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-24 * dir}px)` }],
        { duration: 180, easing: U.EASE.accel }).then(() => { hiding.hidden = true; });
      U.anim(showing, [{ opacity: 0, transform: `translateX(${24 * dir}px)` }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 260, easing: U.EASE.decel });
    },

    tileMenu(id, x, y, refresh) {
      const d = Apps.get(id);
      const pinnedStart = Settings.pinnedStart.includes(id);
      const pinnedTb = Settings.pinnedTaskbar.includes(id);
      Menu.show([
        {
          label: pinnedStart ? '从"开始"屏幕取消固定' : '固定到"开始"屏幕', icon: pinnedStart ? 'unpin' : 'pin',
          onClick: () => {
            const arr = Settings.pinnedStart.slice();
            const i = arr.indexOf(id);
            if (i >= 0) arr.splice(i, 1); else arr.push(id);
            Settings.set('pinnedStart', arr);
            refresh && refresh();
          }
        },
        {
          label: pinnedTb ? '从任务栏取消固定' : '固定到任务栏', icon: pinnedTb ? 'unpin' : 'pin',
          onClick: () => {
            const arr = Settings.pinnedTaskbar.slice();
            const i = arr.indexOf(id);
            if (i >= 0) arr.splice(i, 1); else arr.push(id);
            Settings.set('pinnedTaskbar', arr);
            Taskbar.renderApps();
          }
        },
        { separator: true },
        { label: '以管理员身份运行', icon: 'shield', onClick: () => { Flyout.close('start'); Apps.launch(id, { admin: true }); } },
        { label: '打开文件位置', icon: 'folder', onClick: () => { Flyout.close('start'); Apps.launch('explorer', { path: 'C:\\Windows\\System32' }); } },
        { separator: true },
        { label: '应用设置', icon: 'settings', onClick: () => { Flyout.close('start'); Apps.launch('settings', { page: 'apps' }); } },
        { label: '卸载', icon: 'trash', onClick: () => Notifications.dialog({ title: '卸载 ' + d.name, body: '此应用是 Windows Web 版的内置组件，无法卸载。', icon: 'warning' }) }
      ], { x, y });
    }
  };

  global.StartMenu = StartMenu;
})(window);
