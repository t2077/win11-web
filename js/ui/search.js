/* ============================================================
   search.js — 搜索面板（应用 / 文档 / 设置 / 网页）
   ============================================================ */
(function (global) {
  'use strict';

  const SETTINGS_INDEX = [
    { name: '显示设置', page: 'system', sub: 'display', icon: 'monitor' },
    { name: '声音设置', page: 'system', sub: 'sound', icon: 'volume' },
    { name: '通知', page: 'system', sub: 'notifications', icon: 'bell' },
    { name: '电源和电池', page: 'system', sub: 'power', icon: 'battery' },
    { name: '蓝牙和其他设备', page: 'bluetooth', icon: 'bluetooth' },
    { name: 'WLAN', page: 'network', icon: 'wifi' },
    { name: '背景（壁纸）', page: 'personalization', sub: 'background', icon: 'image' },
    { name: '颜色（主题色）', page: 'personalization', sub: 'colors', icon: 'palette' },
    { name: '主题', page: 'personalization', sub: 'themes', icon: 'palette' },
    { name: '锁屏界面', page: 'personalization', sub: 'lockscreen', icon: 'lock' },
    { name: '任务栏', page: 'personalization', sub: 'taskbar', icon: 'dock' },
    { name: '应用和功能', page: 'apps', icon: 'apps' },
    { name: '账户信息', page: 'accounts', icon: 'person' },
    { name: '日期和时间', page: 'time', icon: 'time' },
    { name: '辅助功能', page: 'accessibility', icon: 'accessibility' },
    { name: '隐私和安全性', page: 'privacy', icon: 'shield' },
    { name: 'Windows 更新', page: 'update', icon: 'update' },
    { name: '关于本机', page: 'about', icon: 'pcSmall' }
  ];

  const Search = {
    init() {
      Flyout.define({
        id: 'search',
        className: 'search',
        material: 'acrylic-strong',
        width: 660,
        anchor: 'center',
        build: (root, f) => this.build(root, f),
        autofocus: '.search__input'
      });
    },

    build(root) {
      const input = U.el('input.search__input', { placeholder: '在此处键入以搜索', spellcheck: 'false' });
      const box = U.el('div.search__box', {}, [
        Icons.ui('search', 16),
        input,
        U.el('button.search__ico', { title: '语音搜索', onclick: () => Notifications.toast({ title: '语音输入', body: '此设备上未启用麦克风。', icon: 'mic' }) }, Icons.ui('mic', 16))
      ]);

      const tabs = U.el('div.search__tabs');
      const TABS = [['all', '全部'], ['apps', '应用'], ['docs', '文档'], ['web', '网页'], ['settings', '设置']];
      let tab = 'all';
      TABS.forEach(([k, n]) => {
        const b = U.el('button.search__tab' + (k === 'all' ? '.is-active' : ''), { text: n, dataset: { k } });
        b.onclick = () => {
          tab = k;
          U.$$('.search__tab', tabs).forEach(x => x.classList.toggle('is-active', x.dataset.k === k));
          render();
        };
        tabs.appendChild(b);
      });

      const bodyEl = U.el('div.search__body');
      const listCol = U.el('div.search__list.thin-scroll');
      const prevCol = U.el('div.search__preview');
      bodyEl.append(listCol, prevCol);

      root.append(box, tabs, bodyEl);

      let results = [], sel = -1;

      const gather = (q) => {
        const out = [];
        const ql = q.toLowerCase();
        if (tab === 'all' || tab === 'apps') {
          Apps.all().filter(a => a.showInSearch && a.name.toLowerCase().includes(ql))
            .slice(0, 8).forEach(a => out.push({
              kind: 'app', title: a.name, sub: '应用', icon: a.icon, appId: a.id,
              open: () => { Flyout.close('search'); Apps.launch(a.id); }
            }));
        }
        if (tab === 'all' || tab === 'settings') {
          SETTINGS_INDEX.filter(s => s.name.toLowerCase().includes(ql)).slice(0, 6).forEach(s => out.push({
            kind: 'setting', title: s.name, sub: '系统设置', uiIcon: s.icon,
            open: () => { Flyout.close('search'); Apps.launch('settings', { page: s.page, sub: s.sub }); }
          }));
        }
        if (tab === 'all' || tab === 'docs') {
          VFS.search(q, null, 20).forEach(f => out.push({
            kind: 'file', title: f.name, sub: VFS.parent(f.path), icon: Icons.forFile(f.name, f.type === 'dir'),
            path: f.path, size: f.size, modified: f.modified,
            open: () => { Flyout.close('search'); Apps.open(f.path); }
          }));
        }
        if (tab === 'all' || tab === 'web') {
          out.push({
            kind: 'web', title: q, sub: '在网页上搜索 — Bing 搜索结果', uiIcon: 'globe',
            open: () => { Flyout.close('search'); Apps.launch('edge', { query: q }); }
          });
        }
        return out;
      };

      const renderPreview = (r) => {
        U.clear(prevCol);
        if (!r) {
          prevCol.appendChild(U.el('div.search__prev-empty', {}, [
            Icons.ui('search', 40),
            U.el('div', { text: '开始键入以搜索应用、文件与网页' })
          ]));
          return;
        }
        const head = U.el('div.search__prev-head', {}, [
          U.el('div.search__prev-icon', {}, r.icon ? Icons.app(r.icon, 64) : Icons.ui(r.uiIcon || 'file', 48)),
          U.el('div.search__prev-title', { text: r.title }),
          U.el('div.search__prev-sub', { text: r.kind === 'app' ? '应用' : r.kind === 'setting' ? '系统设置' : r.kind === 'web' ? '网页搜索' : '文件' })
        ]);
        const acts = U.el('div.search__prev-acts');
        const mk = (label, icon, fn, accent) => {
          const b = U.el('button.search__act' + (accent ? '.is-accent' : ''), {}, [Icons.ui(icon, 16), U.el('span', { text: label })]);
          b.onclick = fn; return b;
        };
        acts.appendChild(mk('打开', 'open', () => r.open(), true));
        if (r.kind === 'app') {
          acts.appendChild(mk('以管理员身份运行', 'shield', () => { Flyout.close('search'); Apps.launch(r.appId, { admin: true }); }));
          acts.appendChild(mk('固定到"开始"屏幕', 'pin', () => {
            if (!Settings.pinnedStart.includes(r.appId)) Settings.set('pinnedStart', Settings.pinnedStart.concat([r.appId]));
            Notifications.toast({ title: '已固定到"开始"屏幕', body: r.title, icon: 'pin' });
          }));
          acts.appendChild(mk('固定到任务栏', 'pin', () => {
            if (!Settings.pinnedTaskbar.includes(r.appId)) { Settings.set('pinnedTaskbar', Settings.pinnedTaskbar.concat([r.appId])); Taskbar.renderApps(); }
          }));
        }
        if (r.kind === 'file') {
          acts.appendChild(mk('打开文件位置', 'folder', () => { Flyout.close('search'); Apps.launch('explorer', { path: VFS.parent(r.path) }); }));
          acts.appendChild(mk('复制完整路径', 'link', () => U.copyText(r.path)));
          const meta = U.el('div.search__prev-meta', {}, [
            U.el('div', { text: '位置：' + VFS.parent(r.path) }),
            U.el('div', { text: '大小：' + (r.size ? U.fmtSize(r.size) : '—') }),
            U.el('div', { text: '修改时间：' + (r.modified ? U.fmtDateFile(new Date(r.modified)) : '—') })
          ]);
          head.appendChild(meta);
        }
        prevCol.append(head, acts);
        U.anim(prevCol, [{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: U.EASE.decel });
      };

      const renderEmpty = () => {
        U.clear(listCol);
        const top = U.el('div.search__section', { text: '热门应用' });
        const grid = U.el('div.search__quickgrid');
        (Settings.recentApps.length ? Settings.recentApps : ['edge', 'explorer', 'notepad', 'settings', 'calculator', 'terminal'])
          .filter(id => Apps.has(id)).slice(0, 6).forEach(id => {
            const d = Apps.get(id);
            const c = U.el('button.search__quick', {}, [Icons.app(d.icon, 28), U.el('span.truncate', { text: d.name })]);
            c.onclick = () => { Flyout.close('search'); Apps.launch(id); };
            grid.appendChild(c);
          });
        const recentHead = U.el('div.search__section', { text: '最近使用' });
        const recentList = U.el('div.search__rows');
        const files = [];
        [VFS.special('desktop'), VFS.special('documents'), VFS.special('downloads')].forEach(p =>
          VFS.list(p).filter(e => e.type === 'file').forEach(e => files.push(e)));
        files.sort((a, b) => (b.modified || 0) - (a.modified || 0));
        files.slice(0, 6).forEach(e => {
          const row = U.el('button.search-row', {}, [
            Icons.app(Icons.forFile(e.name, false), 20),
            U.el('div.search-row__txt', {}, [
              U.el('div.truncate', { text: e.name }),
              U.el('div.search-row__sub.truncate', { text: VFS.parent(e.path) })
            ])
          ]);
          row.onclick = () => { Flyout.close('search'); Apps.open(e.path); };
          recentList.appendChild(row);
        });
        listCol.append(top, grid, recentHead, recentList);
        renderPreview(null);
      };

      const render = () => {
        const q = input.value.trim();
        if (!q) { renderEmpty(); return; }
        results = gather(q);
        sel = results.length ? 0 : -1;
        U.clear(listCol);
        if (!results.length) {
          listCol.appendChild(U.el('div.search__none', {}, [Icons.ui('search', 32), U.el('div', { text: '未找到"' + q + '"的结果' })]));
          renderPreview(null);
          return;
        }
        listCol.appendChild(U.el('div.search__section', { text: '最佳匹配' }));
        results.forEach((r, i) => {
          const row = U.el('button.search-row' + (i === sel ? '.is-sel' : ''), {}, [
            r.icon ? Icons.app(r.icon, 20) : Icons.ui(r.uiIcon || 'file', 20),
            U.el('div.search-row__txt', {}, [
              U.el('div.truncate', { text: r.title }),
              U.el('div.search-row__sub.truncate', { text: r.sub })
            ])
          ]);
          row.onclick = () => r.open();
          row.onpointerenter = () => { sel = i; U.$$('.search-row', listCol).forEach((x, j) => x.classList.toggle('is-sel', j === i)); renderPreview(r); };
          listCol.appendChild(row);
          if (i === 0) listCol.appendChild(U.el('div.search__section', { text: '其他结果' }));
        });
        renderPreview(results[0]);
      };

      input.oninput = U.debounce(render, 90);
      input.onkeydown = (e) => {
        if (e.key === 'Enter') { if (results[sel]) results[sel].open(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!results.length) return;
          sel = U.clamp(sel + (e.key === 'ArrowDown' ? 1 : -1), 0, results.length - 1);
          U.$$('.search-row', listCol).forEach((x, j) => x.classList.toggle('is-sel', j === sel));
          const el = U.$$('.search-row', listCol)[sel];
          el && el.scrollIntoView({ block: 'nearest' });
          renderPreview(results[sel]);
        }
      };
      renderEmpty();
    }
  };

  global.Search = Search;
})(window);
