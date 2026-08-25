/* ============================================================
   explorer.js — 文件资源管理器（标签页 / 导航窗格 / 详细信息与图标视图）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('explorer', `
  .ex-root { display:flex; flex-direction:column; height:100%; min-height:0; }
  .ex-body { display:flex; flex:1 1 auto; min-height:0; }
  .ex-content { flex:1 1 auto; min-width:0; display:flex; flex-direction:column;
    background: var(--bg-solid); border-top-left-radius: 8px; box-shadow: inset 1px 1px 0 var(--stroke-control); }
  [data-theme="dark"] .ex-content { background: var(--bg-solid-3); }
  .ex-quick { padding: 16px 20px; }
  .ex-quick__h { font-size: var(--fs-body); font-weight:600; margin: 6px 0 10px; }
  .ex-qgrid { display:grid; grid-template-columns: repeat(auto-fill, minmax(148px,1fr)); gap:4px; }
  .ex-qcard { display:flex; align-items:center; gap:10px; padding:10px; border-radius:var(--r-sm);
    transition: background-color var(--dur-fast) linear; cursor:default; }
  .ex-qcard:hover { background: var(--fill-subtle-hover); }
  .ex-qcard__t { font-size: var(--fs-body); }
  .ex-qcard__s { font-size: 11px; color: var(--text-tertiary); }
  .ex-drive { display:flex; align-items:center; gap:14px; padding:12px; border-radius:var(--r-sm);
    transition: background-color var(--dur-fast) linear; cursor:default; }
  .ex-drive:hover { background: var(--fill-subtle-hover); }
  .ex-drive__info { flex:1; min-width:0; }
  .ex-drive__bar { height:6px; border-radius:3px; background: var(--fill-control-strong); opacity:.35; margin-top:6px; overflow:hidden; }
  .ex-drive__bar > i { display:block; height:100%; border-radius:3px; background: var(--fill-accent); }
  .ex-drive__bar.is-full > i { background:#e5484d; }
  .ex-rename { border:1px solid var(--accent-base); border-radius:2px; background: var(--bg-solid-4);
    color: var(--text-primary); font-size: var(--fs-body); padding:1px 4px; outline:none; user-select:text; min-width:60px; }
  .ex-tags { display:flex; gap:6px; padding: 6px 12px 0; flex-wrap:wrap; }
  .ex-chip { height:26px; padding:0 10px; border-radius:var(--r-pill); font-size:var(--fs-caption);
    background: var(--fill-control); box-shadow: inset 0 0 0 1px var(--stroke-control-2); color:var(--text-secondary); display:flex; align-items:center; gap:6px; }
  .ex-chip:hover { background: var(--fill-control-hover); color: var(--text-primary); }
  .ex-detail { width:280px; flex:none; border-left:1px solid var(--stroke-divider); padding:16px; overflow:auto; }
  .ex-detail__prev { width:100%; aspect-ratio:4/3; border-radius:var(--r-sm); background:var(--fill-control);
    display:grid; place-items:center; margin-bottom:14px; background-size:cover; background-position:center; }
  .ex-detail__n { font-size:var(--fs-body); font-weight:600; word-break:break-all; }
  .ex-detail__row { display:flex; gap:8px; font-size:var(--fs-caption); margin-top:8px; }
  .ex-detail__k { width:76px; flex:none; color:var(--text-tertiary); }
  .ex-detail__v { flex:1; min-width:0; color:var(--text-secondary); word-break:break-all; }
  `);

  const VIEWS = [
    { id: 'xl', label: '超大图标', icon: 'grid', size: 96 },
    { id: 'lg', label: '大图标', icon: 'grid', size: 72 },
    { id: 'md', label: '中等图标', icon: 'grid', size: 48 },
    { id: 'sm', label: '小图标', icon: 'view', size: 24 },
    { id: 'list', label: '列表', icon: 'list', size: 20 },
    { id: 'details', label: '详细信息', icon: 'list', size: 16 },
    { id: 'tiles', label: '平铺', icon: 'view', size: 40 }
  ];

  const QUICK = () => [
    { name: '桌面', path: VFS.special('desktop'), icon: 'folder', sub: '固定' },
    { name: '下载', path: VFS.special('downloads'), icon: 'folder', sub: '固定' },
    { name: '文档', path: VFS.special('documents'), icon: 'folder', sub: '固定' },
    { name: '图片', path: VFS.special('pictures'), icon: 'folder', sub: '固定' },
    { name: '音乐', path: VFS.special('music'), icon: 'folder', sub: '固定' },
    { name: '视频', path: VFS.special('videos'), icon: 'folder', sub: '固定' }
  ];

  function mount(win, args) {
    const state = {
      tabs: [], active: 0, view: 'details', sortBy: 'name', sortAsc: true,
      showDetailPane: false
    };

    win.setChromeHeight(40);
    win.setBodyBg('');

    /* ---------- 标签页 ---------- */
    const tabstrip = U.el('div.tabstrip');
    win.headArea.appendChild(tabstrip);

    const newTab = (path, activate) => {
      const t = { id: U.uid('tab'), path: path || 'home', hist: [path || 'home'], hi: 0, sel: new Set() };
      state.tabs.push(t);
      if (activate !== false) state.active = state.tabs.length - 1;
      renderTabs(); renderAll();
      return t;
    };
    const closeTab = (i) => {
      if (state.tabs.length <= 1) { win.close(); return; }
      state.tabs.splice(i, 1);
      state.active = U.clamp(state.active > i ? state.active - 1 : state.active, 0, state.tabs.length - 1);
      renderTabs(); renderAll();
    };
    const cur = () => state.tabs[state.active];

    function renderTabs() {
      U.clear(tabstrip);
      state.tabs.forEach((t, i) => {
        const label = pathLabel(t.path);
        const tab = U.el('div.wtab' + (i === state.active ? '.is-active' : ''), { title: label }, [
          Icons.app(pathIcon(t.path), 16),
          U.el('div.wtab__label', { text: label }),
          U.el('button.wtab__x', { title: '关闭标签页' }, Icons.ui('close', 10))
        ]);
        tab.onclick = (e) => { if (e.target.closest('.wtab__x')) return; state.active = i; renderTabs(); renderAll(); };
        tab.querySelector('.wtab__x').onclick = (e) => { e.stopPropagation(); closeTab(i); };
        tab.oncontextmenu = (e) => {
          e.preventDefault();
          Menu.show([
            { label: '复制标签页', icon: 'duplicate', onClick: () => newTab(t.path) },
            { label: '关闭标签页', icon: 'close', onClick: () => closeTab(i) },
            { label: '关闭其他标签页', icon: 'close', onClick: () => { state.tabs = [t]; state.active = 0; renderTabs(); renderAll(); } }
          ], { x: e.clientX, y: e.clientY });
        };
        tabstrip.appendChild(tab);
      });
      const add = U.el('button.wtab-add', { title: '新建标签页' }, Icons.ui('plus', 14));
      add.onclick = () => newTab('home');
      tabstrip.appendChild(add);
      win.setTitle(pathLabel(cur().path));
      win.setIcon(pathIcon(cur().path));
    }

    /* ---------- 命令栏 ---------- */
    const cmdbar = U.el('div.cmdbar');
    const addrbar = U.el('div.addrbar');
    const bodyRow = U.el('div.ex-body');
    const navpane = U.el('div.navpane');
    const contentWrap = U.el('div.ex-content');
    const statusbar = U.el('div.statusbar');
    const detailPane = U.el('div.ex-detail', { hidden: true });

    const root = U.el('div.ex-root');
    root.append(cmdbar, addrbar, bodyRow, statusbar);
    bodyRow.append(navpane, contentWrap, detailPane);
    win.body.appendChild(root);

    function buildCmdbar() {
      U.clear(cmdbar);
      const t = cur();
      const inFolder = t.path !== 'home' && t.path !== 'thispc' && t.path !== 'recyclebin' && VFS.isDir(t.path);
      const selCount = t.sel.size;
      const b = (label, icon, fn, opts) => {
        const el = U.el('button.cmdbtn' + (opts && opts.iconOnly ? '.cmdbtn--icon' : ''), {
          title: label, 'aria-disabled': opts && opts.disabled ? 'true' : null
        }, [Icons.ui(icon, 16), opts && opts.iconOnly ? null : U.el('span', { text: label })]);
        el.onclick = fn;
        if (opts && opts.iconOnly) U.tooltip(el, label);
        return el;
      };

      const newBtn = b('新建', 'plus', (e) => {
        Menu.show([
          { label: '文件夹', appIcon: 'folder', accel: 'Ctrl+Shift+N', onClick: () => createItem('dir') },
          { separator: true },
          { label: '文本文档', appIcon: 'notepad', onClick: () => createItem('txt') },
          { label: 'BMP 图像', appIcon: 'image', onClick: () => createItem('bmp') },
          { label: '压缩文件夹', appIcon: 'zip', onClick: () => createItem('zip') }
        ], { anchor: newBtn, align: 'bottom-left' });
      }, { disabled: !inFolder });
      cmdbar.append(newBtn, U.el('div.cmdsep'));

      cmdbar.append(
        b('剪切', 'cut', () => doClipboard('cut'), { iconOnly: true, disabled: !selCount }),
        b('复制', 'copy', () => doClipboard('copy'), { iconOnly: true, disabled: !selCount }),
        b('粘贴', 'paste', doPaste, { iconOnly: true, disabled: !(U.clipboard.files && U.clipboard.files.length && inFolder) }),
        b('重命名', 'rename', () => { const p = Array.from(t.sel)[0]; if (p) beginRename(p); }, { iconOnly: true, disabled: selCount !== 1 }),
        b('共享', 'share', () => Notifications.toast({ title: '共享', body: 'Web 版不支持系统共享。', icon: 'share' }), { iconOnly: true, disabled: !selCount }),
        b('删除', 'trash', () => doDelete(false), { iconOnly: true, disabled: !selCount }),
        U.el('div.cmdsep')
      );

      const sortBtn = b('排序', 'sort', () => {
        Menu.show([
          { label: '名称', checked: state.sortBy === 'name', onClick: () => { state.sortBy = 'name'; renderContent(); } },
          { label: '修改日期', checked: state.sortBy === 'date', onClick: () => { state.sortBy = 'date'; renderContent(); } },
          { label: '类型', checked: state.sortBy === 'type', onClick: () => { state.sortBy = 'type'; renderContent(); } },
          { label: '大小', checked: state.sortBy === 'size', onClick: () => { state.sortBy = 'size'; renderContent(); } },
          { separator: true },
          { label: '递增', checked: state.sortAsc, onClick: () => { state.sortAsc = true; renderContent(); } },
          { label: '递减', checked: !state.sortAsc, onClick: () => { state.sortAsc = false; renderContent(); } }
        ], { anchor: sortBtn, align: 'bottom-left' });
      });
      const viewBtn = b('查看', 'view', () => {
        Menu.show(VIEWS.map(v => ({
          label: v.label, checked: state.view === v.id, icon: v.icon,
          onClick: () => { state.view = v.id; renderContent(); }
        })).concat([
          { separator: true },
          { label: '显示', icon: 'eye', submenu: [
            { label: '导航窗格', checked: true, onClick: () => navpane.hidden = !navpane.hidden },
            { label: '详细信息窗格', checked: state.showDetailPane, onClick: () => { state.showDetailPane = !state.showDetailPane; renderContent(); } },
            { label: '项目复选框', checked: false },
            { label: '文件扩展名', checked: Settings.showFileExtensions, onClick: () => Settings.set('showFileExtensions', !Settings.showFileExtensions) },
            { label: '隐藏的项目', checked: Settings.showHiddenFiles, onClick: () => { Settings.set('showHiddenFiles', !Settings.showHiddenFiles); renderContent(); } }
          ] },
          { label: '紧凑视图', checked: Settings.explorerCompact, onClick: () => { Settings.set('explorerCompact', !Settings.explorerCompact); renderContent(); } }
        ]), { anchor: viewBtn, align: 'bottom-left' });
      });
      cmdbar.append(sortBtn, viewBtn, U.el('div.cmdsep'));

      if (t.path === 'recyclebin') {
        cmdbar.append(
          b('还原选定的项目', 'undo', () => { Array.from(t.sel).forEach(id => VFS.restore(id)); t.sel.clear(); renderAll(); }, { disabled: !selCount }),
          b('清空回收站', 'trash', async () => {
            if (!VFS.recycle.length) return;
            if (await Notifications.confirm('删除多个项目', '确实要永久删除这 ' + VFS.recycle.length + ' 个项目吗？', '是')) { VFS.emptyRecycle(); renderAll(); }
          })
        );
      }
      const moreBtn = b('查看更多', 'more', () => {
        Menu.show([
          { label: '全选', icon: 'check', accel: 'Ctrl+A', onClick: selectAll },
          { label: '全部不选', icon: 'close', onClick: () => { cur().sel.clear(); renderContent(); } },
          { separator: true },
          { label: '在终端中打开', icon: 'apps', onClick: () => Apps.launch('terminal', { cwd: inFolder ? t.path : VFS.home() }) },
          { label: '复制路径', icon: 'link', onClick: () => U.copyText(inFolder ? t.path : '') },
          { separator: true },
          { label: '属性', icon: 'info', accel: 'Alt+Enter', onClick: () => { const p = Array.from(t.sel)[0] || (inFolder ? t.path : null); if (p) Shell.showProperties(p); } }
        ], { anchor: moreBtn, align: 'bottom-right' });
      }, { iconOnly: true });
      cmdbar.append(U.el('div.spacer'), moreBtn);
    }

    /* ---------- 地址栏 ---------- */
    function buildAddrbar() {
      U.clear(addrbar);
      const t = cur();
      const nav = (icon, label, fn, disabled) => {
        const el = U.el('button.cmdbtn.cmdbtn--icon', { title: label, 'aria-disabled': disabled ? 'true' : null }, Icons.ui(icon, 16));
        el.onclick = fn; U.tooltip(el, label);
        return el;
      };
      addrbar.append(
        nav('back', '后退', () => go(-1), t.hi <= 0),
        nav('forward', '前进', () => go(1), t.hi >= t.hist.length - 1),
        nav('up', '向上', () => {
          const p = VFS.parent(t.path);
          navigate(p && VFS.isDir(p) ? p : (t.path === 'home' ? 'home' : 'thispc'));
        }, t.path === 'home')
      );

      const box = U.el('div.addrbox');
      const crumbs = crumbsFor(t.path);
      crumbs.forEach((c, i) => {
        const seg = U.el('button.crumb', {}, [i === 0 ? Icons.app(c.icon || 'folder', 16) : null, U.el('span', { text: c.name })]);
        seg.onclick = () => navigate(c.path);
        box.appendChild(seg);
        if (i < crumbs.length - 1) {
          const sep = U.el('button.crumb-sep', { html: Icons.UI.chevronRight });
          sep.onclick = (e) => {
            const kids = VFS.isDir(c.path) ? VFS.list(c.path).filter(x => x.type === 'dir') : [];
            if (!kids.length) return;
            Menu.show(kids.map(k => ({ label: k.name, appIcon: 'folder', onClick: () => navigate(k.path) })), { anchor: sep, align: 'bottom-left' });
          };
          box.appendChild(sep);
        }
      });
      box.ondblclick = () => {
        U.clear(box);
        const inp = U.el('input.addr-input', { value: t.path === 'home' ? '主文件夹' : t.path });
        box.appendChild(inp); inp.focus(); inp.select();
        inp.onkeydown = (e) => {
          if (e.key === 'Enter') { const v = inp.value.trim(); if (VFS.exists(v)) navigate(v); else { Sound.error(); buildAddrbar(); } }
          if (e.key === 'Escape') buildAddrbar();
        };
        inp.onblur = () => buildAddrbar();
      };
      const refresh = U.el('button.crumb-sep', { title: '刷新', style: { width: '24px', height: '24px' } }, Icons.ui('refresh', 14));
      refresh.onclick = () => { renderAll(); Sound.click(); };
      box.appendChild(U.el('div.spacer'));
      box.appendChild(refresh);
      addrbar.appendChild(box);

      const sb = U.el('div.searchbox-sm', {}, [Icons.ui('search', 14), U.el('input', { placeholder: '搜索 ' + pathLabel(t.path) })]);
      const inp = sb.querySelector('input');
      inp.oninput = U.debounce(() => renderContent(inp.value.trim()), 180);
      addrbar.appendChild(sb);
    }

    /* ---------- 导航窗格 ---------- */
    function buildNav() {
      U.clear(navpane);
      const t = cur();
      const item = (name, icon, path, opts) => {
        const el = U.el('div.navitem' + (t.path === path ? '.is-active' : ''), { tabindex: 0 }, [
          U.el('div.navitem__ico', {}, opts && opts.ui ? Icons.ui(icon, 16) : Icons.app(icon, 16)),
          U.el('div.navitem__label', { text: name })
        ]);
        if (opts && opts.child) el.classList.add('navitem--child');
        el.onclick = () => navigate(path);
        el.oncontextmenu = (e) => {
          e.preventDefault();
          Menu.show([
            { label: '在新标签页中打开', icon: 'tab', onClick: () => newTab(path) },
            { label: '在新窗口中打开', icon: 'duplicate', onClick: () => Apps.launch('explorer', { path, forceNew: true }) },
            { separator: true },
            { label: '属性', icon: 'info', onClick: () => VFS.exists(path) && Shell.showProperties(path) }
          ], { x: e.clientX, y: e.clientY });
        };
        return el;
      };

      navpane.appendChild(item('主文件夹', 'folderOpen', 'home'));
      navpane.appendChild(item('图库', 'photos', VFS.special('pictures')));
      navpane.appendChild(item('OneDrive', 'onedrive', VFS.home()));
      navpane.appendChild(U.el('div.navsep'));
      [['桌面', 'desktop'], ['下载', 'downloads'], ['文档', 'documents'], ['图片', 'pictures'], ['音乐', 'music'], ['视频', 'videos']]
        .forEach(([n, k]) => navpane.appendChild(item(n, 'folder', VFS.special(k))));
      navpane.appendChild(U.el('div.navsep'));
      navpane.appendChild(item('此电脑', 'thispc', 'thispc'));
      VFS.drives().forEach(d => navpane.appendChild(item(d.name, 'drive', d.key, { child: true })));
      navpane.appendChild(item('网络', 'network', 'network', { ui: true }));
      navpane.appendChild(item('回收站', VFS.recycle.length ? 'recyclebinFull' : 'recyclebin', 'recyclebin'));
    }

    /* ---------- 内容区 ---------- */
    function renderContent(filter) {
      U.clear(contentWrap);
      const t = cur();
      if (t.path === 'home') { renderHome(); return; }
      if (t.path === 'thispc') { renderThisPC(); return; }
      if (t.path === 'recyclebin') { renderRecycle(); return; }
      if (t.path === 'network') {
        contentWrap.appendChild(U.el('div.empty-state', {}, [
          Icons.ui('network', 48), U.el('div.empty-state__title', { text: '网络发现已关闭' }),
          U.el('div.caption', { text: '网络计算机和设备不可见。' })
        ]));
        renderStatus(0); return;
      }
      if (!VFS.isDir(t.path)) {
        contentWrap.appendChild(U.el('div.empty-state', {}, [
          Icons.ui('warning', 48), U.el('div.empty-state__title', { text: '找不到此位置' })
        ]));
        return;
      }

      let entries = VFS.list(t.path, { hidden: Settings.showHiddenFiles });
      if (filter) entries = entries.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()));
      const dir = state.sortAsc ? 1 : -1;
      entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        let r = 0;
        if (state.sortBy === 'name') r = a.name.localeCompare(b.name, 'zh-Hans-CN', { numeric: true });
        else if (state.sortBy === 'date') r = (a.modified || 0) - (b.modified || 0);
        else if (state.sortBy === 'size') r = (a.size || 0) - (b.size || 0);
        else if (state.sortBy === 'type') r = (a.ext || '').localeCompare(b.ext || '') || a.name.localeCompare(b.name, 'zh');
        return r * dir;
      });

      if (!entries.length) {
        contentWrap.appendChild(U.el('div.empty-state', {}, [
          Icons.app('folderOpen', 56),
          U.el('div.empty-state__title', { text: filter ? '没有匹配的搜索结果' : '此文件夹为空' })
        ]));
        renderStatus(0);
        bindBlankMenu(contentWrap);
        return;
      }

      if (state.view === 'details') renderDetails(entries);
      else if (state.view === 'list') renderListView(entries);
      else renderGrid(entries);
      renderStatus(entries.length);
      detailPane.hidden = !state.showDetailPane;
      if (state.showDetailPane) renderDetailPane();
    }

    function nameOf(e) {
      if (Settings.showFileExtensions || e.type === 'dir') return e.name;
      return VFS.stem(e.name);
    }
    function typeOf(e) {
      if (e.type === 'dir') return '文件夹';
      const m = { txt: '文本文档', png: 'PNG 图像', jpg: 'JPG 图像', svg: 'SVG 图像', mp3: 'MP3 音频', mp4: 'MP4 视频', zip: '压缩文件夹', exe: '应用程序', pdf: 'PDF 文档', docx: 'Word 文档', xlsx: 'Excel 工作表', md: 'Markdown 文档', html: 'HTML 文档' };
      return m[e.ext] || ((e.ext || '').toUpperCase() + ' 文件').trim();
    }

    function renderDetails(entries) {
      const lv = U.el('div.lv');
      const cols = [
        { k: 'name', label: '名称', w: '2.2fr', sort: 'name' },
        { k: 'date', label: '修改日期', w: '1.1fr', sort: 'date' },
        { k: 'type', label: '类型', w: '1fr', sort: 'type' },
        { k: 'size', label: '大小', w: '.7fr', sort: 'size' }
      ];
      const gt = cols.map(c => c.w).join(' ');
      const head = U.el('div.lv__head', { style: { display: 'grid', gridTemplateColumns: gt } });
      cols.forEach(c => {
        const h = U.el('div.lv__hcell' + (state.sortBy === c.sort ? '.is-sorted' : ''), {}, [
          U.el('span', { text: c.label }),
          U.el('i', { html: state.sortAsc ? Icons.UI.chevronUp : Icons.UI.chevronDown })
        ]);
        h.onclick = () => {
          if (state.sortBy === c.sort) state.sortAsc = !state.sortAsc;
          else { state.sortBy = c.sort; state.sortAsc = true; }
          renderContent();
        };
        head.appendChild(h);
      });
      const body = U.el('div.lv__body');
      const t = cur();
      entries.forEach((e, i) => {
        const row = U.el('div.lv-row' + (t.sel.has(e.path) ? '.is-selected' : ''), {
          style: { display: 'grid', gridTemplateColumns: gt, height: Settings.explorerCompact ? '26px' : '30px' },
          dataset: { path: e.path, i }
        }, [
          U.el('div.lv-cell.lv-cell--name', {}, [Icons.app(Icons.forFile(e.name, e.type === 'dir'), 16), U.el('span.truncate', { text: nameOf(e) })]),
          U.el('div.lv-cell', { text: e.modified ? U.fmtDateFile(new Date(e.modified)) : '' }),
          U.el('div.lv-cell', { text: typeOf(e) }),
          U.el('div.lv-cell', { text: e.type === 'file' ? U.fmtKB(e.size || 0) : '', style: { textAlign: 'right' } })
        ]);
        bindItem(row, e, entries, i);
        body.appendChild(row);
      });
      lv.append(head, body);
      contentWrap.appendChild(lv);
      bindBlankMenu(body);
      U.anim(body, [{ opacity: 0 }, { opacity: 1 }], { duration: 140 });
    }

    function renderListView(entries) {
      const body = U.el('div.lv__body', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gridAutoFlow: 'column', gridTemplateRows: 'repeat(auto-fill, 26px)' } });
      const t = cur();
      entries.forEach((e, i) => {
        const row = U.el('div.lv-row' + (t.sel.has(e.path) ? '.is-selected' : ''), { style: { height: '26px' }, dataset: { path: e.path } }, [
          U.el('div.lv-cell.lv-cell--name', {}, [Icons.app(Icons.forFile(e.name, e.type === 'dir'), 16), U.el('span.truncate', { text: nameOf(e) })])
        ]);
        bindItem(row, e, entries, i);
        body.appendChild(row);
      });
      contentWrap.appendChild(body);
      bindBlankMenu(body);
    }

    function renderGrid(entries) {
      const v = VIEWS.find(x => x.id === state.view) || VIEWS[2];
      const cls = state.view === 'tiles' ? 'gv gv--tiles' : (v.size >= 72 ? 'gv gv--icons' : 'gv gv--medium');
      const grid = U.el('div.' + cls.split(' ').join('.'));
      if (state.view !== 'tiles') grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${v.size + 40}px, 1fr))`;
      const t = cur();
      entries.forEach((e, i) => {
        const isImg = e.src && ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'bmp'].includes(e.ext);
        const ic = isImg
          ? U.el('div', { style: { width: v.size + 'px', height: v.size + 'px', backgroundImage: 'url("' + e.src + '")', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '3px' } })
          : Icons.app(Icons.forFile(e.name, e.type === 'dir'), v.size);
        const cell = U.el('div.gv-item' + (t.sel.has(e.path) ? '.is-selected' : ''), { dataset: { path: e.path } }, [
          ic,
          state.view === 'tiles'
            ? U.el('div', {}, [U.el('div.gv-item__name', { text: nameOf(e) }), U.el('div.gv-item__sub', { text: typeOf(e) + (e.size ? ' · ' + U.fmtSize(e.size) : '') })])
            : U.el('div.gv-item__name', { text: nameOf(e) })
        ]);
        bindItem(cell, e, entries, i);
        grid.appendChild(cell);
      });
      contentWrap.appendChild(grid);
      bindBlankMenu(grid);
      U.anim(grid, [{ opacity: 0, transform: 'scale(.99)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: U.EASE.decel });
    }

    function renderHome() {
      const wrap = U.el('div.app-scroll');
      const box = U.el('div.ex-quick');
      box.appendChild(U.el('div.ex-quick__h', { text: '快速访问' }));
      const grid = U.el('div.ex-qgrid');
      QUICK().forEach(q => {
        const c = U.el('div.ex-qcard', { tabindex: 0 }, [
          Icons.app(q.icon, 28),
          U.el('div', {}, [U.el('div.ex-qcard__t', { text: q.name }), U.el('div.ex-qcard__s', { text: q.sub })])
        ]);
        c.ondblclick = c.onclick = () => navigate(q.path);
        grid.appendChild(c);
      });
      box.appendChild(grid);

      box.appendChild(U.el('div.ex-quick__h', { text: '最近使用', style: { marginTop: '20px' } }));
      const files = [];
      [VFS.special('desktop'), VFS.special('documents'), VFS.special('downloads'), VFS.special('pictures')].forEach(p =>
        VFS.list(p).filter(e => e.type === 'file').forEach(e => files.push(e)));
      files.sort((a, b) => (b.modified || 0) - (a.modified || 0));
      const lv = U.el('div', { style: { padding: '0' } });
      const gt = '2.2fr 1.1fr 1.4fr';
      const head = U.el('div.lv__head', { style: { display: 'grid', gridTemplateColumns: gt, paddingLeft: '4px' } }, [
        U.el('div.lv__hcell', {}, U.el('span', { text: '名称' })),
        U.el('div.lv__hcell', {}, U.el('span', { text: '修改日期' })),
        U.el('div.lv__hcell', {}, U.el('span', { text: '位置' }))
      ]);
      lv.appendChild(head);
      files.slice(0, 20).forEach(e => {
        const row = U.el('div.lv-row', { style: { display: 'grid', gridTemplateColumns: gt } }, [
          U.el('div.lv-cell.lv-cell--name', {}, [Icons.app(Icons.forFile(e.name, false), 16), U.el('span.truncate', { text: nameOf(e) })]),
          U.el('div.lv-cell', { text: U.fmtDateFile(new Date(e.modified || Date.now())) }),
          U.el('div.lv-cell', { text: VFS.parent(e.path) })
        ]);
        row.ondblclick = () => Apps.open(e.path);
        row.onclick = () => { cur().sel.clear(); cur().sel.add(e.path); renderContent(); };
        row.oncontextmenu = (ev) => { ev.preventDefault(); itemMenu(e, ev.clientX, ev.clientY); };
        lv.appendChild(row);
      });
      if (!files.length) lv.appendChild(U.el('div.caption.text-tertiary', { text: '暂无最近使用的文件', style: { padding: '12px 4px' } }));
      box.appendChild(lv);
      wrap.appendChild(box);
      contentWrap.appendChild(wrap);
      renderStatus(QUICK().length + files.length);
      U.anim(box, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: U.EASE.decel });
    }

    function renderThisPC() {
      const wrap = U.el('div.app-scroll');
      const box = U.el('div.ex-quick');
      box.appendChild(U.el('div.ex-quick__h', { text: '设备和驱动器' }));
      const grid = U.el('div.ex-qgrid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))' } });
      VFS.drives().forEach(d => {
        const pct = Math.round(d.used / d.total * 100);
        const c = U.el('div.ex-drive', { tabindex: 0 }, [
          Icons.app('drive', 40),
          U.el('div.ex-drive__info', {}, [
            U.el('div', { text: d.name }),
            U.el('div.ex-drive__bar' + (pct > 88 ? '.is-full' : ''), {}, U.el('i', { style: { width: pct + '%' } })),
            U.el('div.caption.text-tertiary', { text: U.fmtSize(d.free) + ' 可用，共 ' + U.fmtSize(d.total), style: { marginTop: '4px' } })
          ])
        ]);
        c.ondblclick = c.onclick = () => navigate(d.key);
        c.oncontextmenu = (e) => {
          e.preventDefault();
          Menu.show([
            { label: '打开', icon: 'open', onClick: () => navigate(d.key) },
            { label: '在新标签页中打开', icon: 'tab', onClick: () => newTab(d.key) },
            { separator: true },
            { label: '属性', icon: 'info', onClick: () => Shell.showProperties(d.key) }
          ], { x: e.clientX, y: e.clientY });
        };
        grid.appendChild(c);
      });
      box.appendChild(grid);
      box.appendChild(U.el('div.ex-quick__h', { text: '文件夹', style: { marginTop: '20px' } }));
      const g2 = U.el('div.ex-qgrid');
      QUICK().forEach(q => {
        const c = U.el('div.ex-qcard', {}, [Icons.app('folder', 28), U.el('div.ex-qcard__t', { text: q.name })]);
        c.ondblclick = c.onclick = () => navigate(q.path);
        g2.appendChild(c);
      });
      box.appendChild(g2);
      wrap.appendChild(box);
      contentWrap.appendChild(wrap);
      renderStatus(VFS.drives().length);
    }

    function renderRecycle() {
      const t = cur();
      if (!VFS.recycle.length) {
        contentWrap.appendChild(U.el('div.empty-state', {}, [
          Icons.app('recyclebin', 64), U.el('div.empty-state__title', { text: '回收站为空' })
        ]));
        renderStatus(0);
        return;
      }
      const lv = U.el('div.lv');
      const gt = '2fr 1.6fr 1fr .8fr';
      lv.appendChild(U.el('div.lv__head', { style: { display: 'grid', gridTemplateColumns: gt } }, [
        U.el('div.lv__hcell', {}, U.el('span', { text: '名称' })),
        U.el('div.lv__hcell', {}, U.el('span', { text: '原位置' })),
        U.el('div.lv__hcell', {}, U.el('span', { text: '删除日期' })),
        U.el('div.lv__hcell', {}, U.el('span', { text: '大小' }))
      ]));
      const body = U.el('div.lv__body');
      VFS.recycle.slice().reverse().forEach(r => {
        const row = U.el('div.lv-row' + (t.sel.has(r.id) ? '.is-selected' : ''), { style: { display: 'grid', gridTemplateColumns: gt } }, [
          U.el('div.lv-cell.lv-cell--name', {}, [Icons.app(Icons.forFile(r.name, r.type === 'dir'), 16), U.el('span.truncate', { text: r.name })]),
          U.el('div.lv-cell', { text: VFS.parent(r.origin) }),
          U.el('div.lv-cell', { text: U.fmtDateFile(new Date(r.deleted)) }),
          U.el('div.lv-cell', { text: r.size ? U.fmtKB(r.size) : '', style: { textAlign: 'right' } })
        ]);
        row.onclick = (e) => { if (!e.ctrlKey) t.sel.clear(); t.sel.add(r.id); renderContent(); };
        row.ondblclick = () => { VFS.restore(r.id); renderAll(); };
        row.oncontextmenu = (e) => {
          e.preventDefault();
          Menu.show([
            { label: '还原', icon: 'undo', onClick: () => { VFS.restore(r.id); renderAll(); } },
            { separator: true },
            { label: '删除', icon: 'trash', danger: true, onClick: () => { VFS.recycle = VFS.recycle.filter(x => x.id !== r.id); VFS.save(); renderAll(); } }
          ], { x: e.clientX, y: e.clientY });
        };
        body.appendChild(row);
      });
      lv.appendChild(body);
      contentWrap.appendChild(lv);
      renderStatus(VFS.recycle.length);
    }

    function renderStatus(count) {
      U.clear(statusbar);
      const t = cur();
      statusbar.appendChild(U.el('span', { text: count + ' 个项目' }));
      if (t.sel.size) statusbar.appendChild(U.el('span', { text: '选中 ' + t.sel.size + ' 个项目' }));
      const right = U.el('div.statusbar__right');
      [['details', 'list', '详细信息'], ['md', 'grid', '大图标']].forEach(([id, ic, label]) => {
        const b = U.el('button.viewtoggle' + (state.view === id ? '.is-active' : ''), { title: label }, Icons.ui(ic, 14));
        b.onclick = () => { state.view = id; renderContent(); };
        right.appendChild(b);
      });
      statusbar.appendChild(right);
    }

    function renderDetailPane() {
      U.clear(detailPane);
      const t = cur();
      const p = Array.from(t.sel)[0];
      if (!p || !VFS.exists(p)) {
        detailPane.appendChild(U.el('div.caption.text-tertiary', { text: '选择一个文件以查看详细信息' }));
        return;
      }
      const n = VFS.get(p);
      const isDir = n.type === 'dir';
      const prev = U.el('div.ex-detail__prev');
      if (n.src) prev.style.backgroundImage = 'url("' + n.src + '")';
      else prev.appendChild(Icons.app(Icons.forFile(n.name, isDir), 56));
      detailPane.append(prev, U.el('div.ex-detail__n', { text: n.name }));
      const rows = [
        ['类型', isDir ? '文件夹' : ((VFS.ext(n.name) || '文件').toUpperCase() + ' 文件')],
        ['大小', isDir ? U.fmtSize(VFS.dirSize(n)) : U.fmtSize(VFS.sizeOf(n))],
        ['修改时间', U.fmtDateFile(new Date(n.modified || Date.now()))],
        ['路径', VFS.parent(p)]
      ];
      rows.forEach(([k, v]) => detailPane.appendChild(U.el('div.ex-detail__row', {}, [
        U.el('div.ex-detail__k', { text: k }), U.el('div.ex-detail__v', { text: v })
      ])));
    }

    /* ---------- 交互 ---------- */
    function bindItem(el, e, entries, index) {
      const t = cur();
      el.onclick = (ev) => {
        ev.stopPropagation();
        if (ev.ctrlKey) { t.sel.has(e.path) ? t.sel.delete(e.path) : t.sel.add(e.path); }
        else if (ev.shiftKey && t._last !== undefined) {
          const a = Math.min(t._last, index), b = Math.max(t._last, index);
          t.sel.clear();
          entries.slice(a, b + 1).forEach(x => t.sel.add(x.path));
        } else { t.sel.clear(); t.sel.add(e.path); }
        t._last = index;
        syncSel(); renderStatus(entries.length);
        if (state.showDetailPane) renderDetailPane();
      };
      el.ondblclick = (ev) => { ev.stopPropagation(); openEntry(e); };
      el.oncontextmenu = (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        if (!t.sel.has(e.path)) { t.sel.clear(); t.sel.add(e.path); syncSel(); }
        itemMenu(e, ev.clientX, ev.clientY);
      };
    }

    function syncSel() {
      const t = cur();
      U.$$('[data-path]', contentWrap).forEach(n => n.classList.toggle('is-selected', t.sel.has(n.dataset.path)));
    }

    function openEntry(e) {
      if (e.type === 'dir') navigate(e.path);
      else Apps.open(e.path);
    }

    function bindBlankMenu(host) {
      host.oncontextmenu = (ev) => {
        if (ev.target.closest('[data-path]')) return;
        ev.preventDefault();
        const t = cur();
        const inFolder = VFS.isDir(t.path);
        Menu.show([
          { label: '查看', icon: 'view', submenu: VIEWS.map(v => ({ label: v.label, checked: state.view === v.id, onClick: () => { state.view = v.id; renderContent(); } })) },
          {
            label: '排序方式', icon: 'sort', submenu: [
              { label: '名称', checked: state.sortBy === 'name', onClick: () => { state.sortBy = 'name'; renderContent(); } },
              { label: '修改日期', checked: state.sortBy === 'date', onClick: () => { state.sortBy = 'date'; renderContent(); } },
              { label: '类型', checked: state.sortBy === 'type', onClick: () => { state.sortBy = 'type'; renderContent(); } },
              { label: '大小', checked: state.sortBy === 'size', onClick: () => { state.sortBy = 'size'; renderContent(); } }
            ]
          },
          { label: '刷新', icon: 'refresh', onClick: () => renderAll() },
          { separator: true },
          { label: '粘贴', icon: 'paste', disabled: !(U.clipboard.files && U.clipboard.files.length && inFolder), onClick: doPaste },
          { separator: true },
          {
            label: '新建', icon: 'plus', disabled: !inFolder, submenu: [
              { label: '文件夹', appIcon: 'folder', onClick: () => createItem('dir') },
              { separator: true },
              { label: '文本文档', appIcon: 'notepad', onClick: () => createItem('txt') },
              { label: 'BMP 图像', appIcon: 'image', onClick: () => createItem('bmp') },
              { label: '压缩文件夹', appIcon: 'zip', onClick: () => createItem('zip') }
            ]
          },
          { separator: true },
          { label: '在终端中打开', icon: 'apps', disabled: !inFolder, onClick: () => Apps.launch('terminal', { cwd: t.path }) },
          { label: '属性', icon: 'info', disabled: !inFolder, onClick: () => Shell.showProperties(t.path) }
        ], { x: ev.clientX, y: ev.clientY });
      };
      host.onclick = (ev) => {
        if (ev.target.closest('[data-path]')) return;
        cur().sel.clear(); syncSel(); renderStatus(U.$$('[data-path]', contentWrap).length);
      };
    }

    function itemMenu(e, x, y) {
      const t = cur();
      const multi = t.sel.size > 1;
      Menu.show([
        {
          iconBar: [
            { icon: 'cut', label: '剪切', onClick: () => doClipboard('cut') },
            { icon: 'copy', label: '复制', onClick: () => doClipboard('copy') },
            { icon: 'rename', label: '重命名', disabled: multi, onClick: () => beginRename(e.path) },
            { icon: 'share', label: '共享', onClick: () => Notifications.toast({ title: '共享', body: 'Web 版不支持系统共享。', icon: 'share' }) },
            { icon: 'trash', label: '删除', danger: true, onClick: () => doDelete(false) }
          ]
        },
        { label: '打开', icon: 'open', accel: 'Enter', onClick: () => openEntry(e) },
        e.type === 'dir'
          ? { label: '在新标签页中打开', icon: 'tab', onClick: () => newTab(e.path) }
          : { label: '打开方式', icon: 'apps', onClick: () => Apps.openWith(e.path) },
        e.type === 'dir' ? { label: '在新窗口中打开', icon: 'duplicate', onClick: () => Apps.launch('explorer', { path: e.path, forceNew: true }) } : null,
        { separator: true },
        { label: '复制为路径', icon: 'link', accel: 'Ctrl+Shift+C', onClick: () => U.copyText(e.path) },
        { label: '压缩为 ZIP 文件', icon: 'zip', onClick: () => { VFS.createFile(cur().path, VFS.stem(e.name) + '.zip', '', { size: Math.round((e.size || 4096) * .6) }); renderAll(); } },
        { separator: true },
        { label: '属性', icon: 'info', accel: 'Alt+Enter', onClick: () => Shell.showProperties(e.path) }
      ].filter(Boolean), { x, y });
    }

    function createItem(kind) {
      const t = cur();
      let p;
      if (kind === 'dir') p = VFS.mkdir(t.path, '新建文件夹');
      else if (kind === 'txt') p = VFS.createFile(t.path, '新建文本文档.txt', '');
      else if (kind === 'bmp') p = VFS.createFile(t.path, '新建位图图像.bmp', '', { size: 0 });
      else if (kind === 'zip') p = VFS.createFile(t.path, '新建压缩文件夹.zip', '', { size: 22 });
      t.sel.clear(); if (p) t.sel.add(p);
      renderContent();
      if (p) setTimeout(() => beginRename(p), 50);
    }

    function beginRename(path) {
      const el = contentWrap.querySelector('[data-path="' + CSS.escape(path) + '"]');
      if (!el) return;
      const holder = el.querySelector('.lv-cell--name span') || el.querySelector('.gv-item__name');
      if (!holder) return;
      const old = VFS.basename(path);
      const showExt = Settings.showFileExtensions || VFS.isDir(path);
      const input = U.el('input.ex-rename', { value: showExt ? old : VFS.stem(old) });
      holder.replaceWith(input);
      input.focus();
      const dot = old.lastIndexOf('.');
      if (showExt && dot > 0 && !VFS.isDir(path)) input.setSelectionRange(0, dot); else input.select();
      let done = false;
      const commit = (ok) => {
        if (done) return; done = true;
        let v = input.value.trim();
        if (ok && v) {
          if (!showExt && !VFS.isDir(path)) { const ex = VFS.ext(old); if (ex) v = v + '.' + ex; }
          if (v !== old && !VFS.rename(path, v)) {
            Notifications.dialog({ title: '重命名失败', body: '目标位置已存在同名项目。', icon: 'warning' });
          }
        }
        renderAll();
      };
      input.onblur = () => commit(true);
      input.onkeydown = (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') commit(true);
        if (ev.key === 'Escape') commit(false);
      };
      input.onclick = (ev) => ev.stopPropagation();
      input.ondblclick = (ev) => ev.stopPropagation();
    }

    function doClipboard(mode) {
      const t = cur();
      U.clipboard.files = Array.from(t.sel);
      U.clipboard.mode = mode;
      U.copyText(U.clipboard.files.join('\r\n'));
      buildCmdbar();
    }

    function doPaste() {
      const t = cur();
      if (!U.clipboard.files || !VFS.isDir(t.path)) return;
      U.clipboard.files.forEach(src => VFS.copy(src, t.path, U.clipboard.mode === 'cut'));
      if (U.clipboard.mode === 'cut') U.clipboard.files = null;
      Sound.click();
      renderAll();
    }

    async function doDelete(permanent) {
      const t = cur();
      const list = Array.from(t.sel);
      if (!list.length) return;
      if (permanent) {
        const ok = await Notifications.confirm('删除' + (list.length > 1 ? '多个项目' : '文件'),
          list.length > 1 ? '确实要永久删除这 ' + list.length + ' 个项目吗？' : '确实要永久删除"' + VFS.basename(list[0]) + '"吗？', '是');
        if (!ok) return;
      }
      list.forEach(p => VFS.remove(p, permanent));
      t.sel.clear();
      Sound.click();
      renderAll();
    }

    function selectAll() {
      const t = cur();
      U.$$('[data-path]', contentWrap).forEach(n => t.sel.add(n.dataset.path));
      syncSel(); renderStatus(U.$$('[data-path]', contentWrap).length);
    }

    /* ---------- 导航 ---------- */
    function navigate(path, noHist) {
      const t = cur();
      t.path = path; t.sel.clear(); t._last = undefined;
      if (!noHist) {
        t.hist = t.hist.slice(0, t.hi + 1);
        if (t.hist[t.hi] !== path) { t.hist.push(path); t.hi = t.hist.length - 1; }
      }
      renderTabs(); renderAll();
    }
    function go(d) {
      const t = cur();
      const ni = U.clamp(t.hi + d, 0, t.hist.length - 1);
      if (ni === t.hi) return;
      t.hi = ni;
      navigate(t.hist[ni], true);
    }

    function renderAll() { buildCmdbar(); buildAddrbar(); buildNav(); renderContent(); }

    function crumbsFor(path) {
      if (path === 'home') return [{ name: '主文件夹', path: 'home', icon: 'folderOpen' }];
      if (path === 'thispc') return [{ name: '此电脑', path: 'thispc', icon: 'thispc' }];
      if (path === 'recyclebin') return [{ name: '回收站', path: 'recyclebin', icon: 'recyclebin' }];
      if (path === 'network') return [{ name: '网络', path: 'network', icon: 'folder' }];
      const parts = VFS.split(path);
      const out = [{ name: '此电脑', path: 'thispc', icon: 'thispc' }];
      let acc = '';
      parts.forEach((p, i) => {
        acc = acc ? acc + '\\' + p : p;
        const node = VFS.get(acc);
        out.push({ name: (node && node.drive ? node.name : p), path: acc });
      });
      return out;
    }
    function pathLabel(path) {
      if (path === 'home') return '主文件夹';
      if (path === 'thispc') return '此电脑';
      if (path === 'recyclebin') return '回收站';
      if (path === 'network') return '网络';
      const n = VFS.get(path);
      return (n && n.drive ? n.name : VFS.basename(path)) || path;
    }
    function pathIcon(path) {
      if (path === 'recyclebin') return VFS.recycle.length ? 'recyclebinFull' : 'recyclebin';
      if (path === 'thispc') return 'thispc';
      if (path === 'home') return 'explorer';
      const n = VFS.get(path);
      if (n && n.drive) return 'drive';
      return 'folder';
    }

    /* ---------- 键盘 ---------- */
    win.body.tabIndex = 0;
    win.body.addEventListener('keydown', (e) => {
      const t = cur();
      if (e.target.matches('input')) return;
      if (e.ctrlKey && e.key.toLowerCase() === 'a') { e.preventDefault(); selectAll(); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'c') { e.preventDefault(); doClipboard('copy'); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'x') { e.preventDefault(); doClipboard('cut'); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'v') { e.preventDefault(); doPaste(); }
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); createItem('dir'); }
      else if (e.ctrlKey && e.key.toLowerCase() === 't') { e.preventDefault(); newTab('home'); }
      else if (e.ctrlKey && e.key.toLowerCase() === 'w') { e.preventDefault(); closeTab(state.active); }
      else if (e.key === 'Delete') { e.preventDefault(); doDelete(e.shiftKey); }
      else if (e.key === 'F2') { e.preventDefault(); const p = Array.from(t.sel)[0]; if (p) beginRename(p); }
      else if (e.key === 'F5') { e.preventDefault(); renderAll(); }
      else if (e.key === 'Enter') { const p = Array.from(t.sel)[0]; if (p) { e.preventDefault(); Apps.open(p); } }
      else if (e.key === 'Backspace') { e.preventDefault(); const p = VFS.parent(t.path); navigate(p && VFS.isDir(p) ? p : 'thispc'); }
      else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });

    const offVfs = U.bus.on('vfs:change', () => { if (win.el.isConnected) { buildNav(); renderContent(); } });
    const offRb = U.bus.on('vfs:recycle', () => { if (win.el.isConnected) { buildNav(); renderContent(); } });
    win.on('close', () => { offVfs(); offRb(); });

    /* ---------- 初始 ---------- */
    let initPath = args && args.path ? args.path : 'home';
    if (initPath === 'home' && args && args.path === undefined) initPath = 'home';
    newTab(initPath);
    setTimeout(() => win.body.focus(), 60);

    win.explorerNavigate = navigate;
  }

  Apps.register({
    id: 'explorer', name: '文件资源管理器', icon: 'explorer', category: 'Windows 工具',
    size: { w: 1080, h: 700 }, minSize: { w: 560, h: 380 },
    mount, sortKey: 'wenjian',
    onReactivate: (win, args) => { if (args && args.path && win.explorerNavigate) win.explorerNavigate(args.path); }
  });
})(window);
