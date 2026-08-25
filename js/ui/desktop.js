/* ============================================================
   desktop.js — 桌面（图标网格、框选、拖放、重命名、右键菜单）
   全局: Desktop
   ============================================================ */
(function (global) {
  'use strict';

  const POS_KEY = 'win11web.desktop.v1';
  const CELL = { w: 78, h: 92 };
  const SIZES = { small: { icon: 32, cw: 68, ch: 76 }, medium: { icon: 48, cw: 78, ch: 92 }, large: { icon: 64, cw: 100, ch: 116 } };

  const Desktop = {
    el: null, grid: null,
    items: [],
    selection: new Set(),
    positions: {},

    init() {
      this.el = document.getElementById('desktop');
      this.grid = document.getElementById('desktopGrid');
      try { this.positions = JSON.parse(localStorage.getItem(POS_KEY) || '{}'); } catch (e) { this.positions = {}; }
      this.render();

      U.bus.on('vfs:change', (p) => {
        if (!p || p.toLowerCase().includes('桌面') || p.toLowerCase().includes('desktop')) this.render();
      });
      U.bus.on('vfs:recycle', () => this.render());
      U.bus.on('settings:change', (k) => {
        if (['desktopIconSize', 'desktopShowIcons', 'desktopAutoArrange', 'sortDesktopBy'].includes(k)) this.render();
      });

      /* 空白处点击 / 框选 */
      this.el.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.dt-item')) return;
        if (e.button === 2) return;
        if (!e.ctrlKey) this.clearSelection();
        this.beginMarquee(e);
      });
      this.el.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.dt-item')) return;
        e.preventDefault();
        this.showDesktopMenu(e.clientX, e.clientY);
      });
      this.el.addEventListener('dblclick', (e) => {
        if (e.target.closest('.dt-item')) return;
      });
      /* 键盘 */
      document.addEventListener('keydown', (e) => {
        if (Flyout.current() || Menu.isOpen()) return;
        if (document.activeElement && document.activeElement.closest('.window')) return;
        if (!this.selection.size) return;
        if (e.key === 'Enter') { e.preventDefault(); this.openSelection(); }
        else if (e.key === 'Delete') { e.preventDefault(); this.deleteSelection(); }
        else if (e.key === 'F2') { e.preventDefault(); const id = Array.from(this.selection)[0]; this.beginRename(id); }
      });
      window.addEventListener('resize', U.throttle(() => this.layout(), 120));
    },

    /* ---------------- 数据 ---------------- */
    collect() {
      const list = [];
      list.push({ id: 'sys:thispc', name: '此电脑', icon: 'thispc', kind: 'sys', open: () => Apps.launch('explorer', { path: 'thispc' }), fixed: true });
      list.push({
        id: 'sys:recyclebin', name: '回收站',
        icon: VFS.recycle.length ? 'recyclebinFull' : 'recyclebin',
        kind: 'sys', open: () => Apps.launch('explorer', { path: 'recyclebin' }), fixed: true
      });
      list.push({ id: 'sys:user', name: Settings.userName, icon: 'folder', kind: 'sys', open: () => Apps.launch('explorer', { path: VFS.home() }) });
      list.push({ id: 'sys:edge', name: 'Microsoft Edge', icon: 'edge', kind: 'app', open: () => Apps.launch('edge') });

      VFS.list(VFS.special('desktop'), { hidden: Settings.showHiddenFiles }).forEach(e => {
        list.push({
          id: 'vfs:' + e.path, name: e.name, path: e.path, kind: e.type,
          icon: Icons.forFile(e.name, e.type === 'dir'),
          size: e.size, modified: e.modified,
          open: () => Apps.open(e.path)
        });
      });

      const by = Settings.sortDesktopBy;
      const sysCount = 4;
      const sys = list.slice(0, sysCount), rest = list.slice(sysCount);
      rest.sort((a, b) => {
        if (by === 'size') return (b.size || 0) - (a.size || 0);
        if (by === 'type') return String(a.icon).localeCompare(String(b.icon)) || a.name.localeCompare(b.name, 'zh');
        if (by === 'date') return (b.modified || 0) - (a.modified || 0);
        if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name, 'zh-Hans-CN');
      });
      return sys.concat(rest);
    },

    /* ---------------- 渲染 ---------------- */
    render() {
      if (!this.grid) return;
      const scroll = this.grid.scrollTop;
      U.clear(this.grid);
      this.grid.hidden = !Settings.desktopShowIcons;
      this.items = this.collect();
      const S = SIZES[Settings.desktopIconSize] || SIZES.medium;
      this.grid.style.setProperty('--dt-cw', S.cw + 'px');
      this.grid.style.setProperty('--dt-ch', S.ch + 'px');

      this.items.forEach(it => {
        const node = U.el('div.dt-item', { dataset: { id: it.id }, tabindex: 0, title: it.name }, [
          U.el('div.dt-item__icon', {}, Icons.app(it.icon, S.icon)),
          U.el('div.dt-item__label', {}, U.el('span', { text: it.name }))
        ]);
        if (this.selection.has(it.id)) node.classList.add('is-selected');
        this.bindItem(node, it);
        this.grid.appendChild(node);
      });
      this.layout();
      this.grid.scrollTop = scroll;
    },

    layout() {
      if (!this.grid) return;
      const S = SIZES[Settings.desktopIconSize] || SIZES.medium;
      const wa = WM.workArea();
      const cols = Math.max(1, Math.floor((wa.w - 8) / S.cw));
      const rows = Math.max(1, Math.floor((wa.h - 8) / S.ch));
      const used = new Set();
      const nodes = U.$$('.dt-item', this.grid);

      if (Settings.desktopAutoArrange) {
        nodes.forEach((n, i) => {
          const col = Math.floor(i / rows), row = i % rows;
          n.style.left = (4 + col * S.cw) + 'px';
          n.style.top = (4 + row * S.ch) + 'px';
        });
        return;
      }
      /* 自由摆放：使用保存的坐标，冲突则找下一个空格 */
      const place = (n, col, row) => {
        let key = col + ',' + row, guard = 0;
        while (used.has(key) && guard++ < 400) {
          row++;
          if (row >= rows) { row = 0; col++; }
          key = col + ',' + row;
        }
        used.add(key);
        n.style.left = (4 + col * S.cw) + 'px';
        n.style.top = (4 + row * S.ch) + 'px';
        n.dataset.col = col; n.dataset.row = row;
      };
      nodes.forEach((n, i) => {
        const p = this.positions[n.dataset.id];
        if (p) place(n, U.clamp(p.col, 0, cols - 1), U.clamp(p.row, 0, rows - 1));
      });
      nodes.forEach((n, i) => {
        if (this.positions[n.dataset.id]) return;
        let col = 0, row = 0;
        while (used.has(col + ',' + row)) { row++; if (row >= rows) { row = 0; col++; } }
        place(n, col, row);
      });
    },

    bindItem(node, it) {
      node.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (e.button === 2) { if (!this.selection.has(it.id)) this.select(it.id, false); return; }
        if (e.ctrlKey) this.toggleSelect(it.id);
        else if (!this.selection.has(it.id)) this.select(it.id, false);
        if (!Settings.desktopAutoArrange) this.beginItemDrag(e, node, it);
      });
      node.addEventListener('dblclick', (e) => { e.stopPropagation(); it.open && it.open(); });
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); it.open && it.open(); }
      });
      node.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        this.showItemMenu(it, e.clientX, e.clientY);
      });
    },

    /* ---------------- 选择 ---------------- */
    select(id, additive) {
      if (!additive) this.selection.clear();
      this.selection.add(id);
      this.syncSelection();
    },
    toggleSelect(id) {
      if (this.selection.has(id)) this.selection.delete(id); else this.selection.add(id);
      this.syncSelection();
    },
    clearSelection() { this.selection.clear(); this.syncSelection(); },
    syncSelection() {
      U.$$('.dt-item', this.grid).forEach(n => n.classList.toggle('is-selected', this.selection.has(n.dataset.id)));
    },
    selectedItems() { return this.items.filter(i => this.selection.has(i.id)); },
    openSelection() { this.selectedItems().forEach(i => i.open && i.open()); },

    /* ---------------- 框选 ---------------- */
    beginMarquee(e) {
      const box = document.getElementById('marquee');
      const sx = e.clientX, sy = e.clientY;
      const baseSel = new Set(this.selection);
      box.hidden = false;
      const move = (ev) => {
        const x = Math.min(sx, ev.clientX), y = Math.min(sy, ev.clientY);
        const w = Math.abs(ev.clientX - sx), h = Math.abs(ev.clientY - sy);
        Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        const r = { l: x, t: y, r: x + w, b: y + h };
        U.$$('.dt-item', this.grid).forEach(n => {
          const nr = n.getBoundingClientRect();
          const hit = !(nr.right < r.l || nr.left > r.r || nr.bottom < r.t || nr.top > r.b);
          if (hit) this.selection.add(n.dataset.id);
          else if (!baseSel.has(n.dataset.id)) this.selection.delete(n.dataset.id);
        });
        this.syncSelection();
      };
      const up = () => {
        box.hidden = true; box.style.width = '0'; box.style.height = '0';
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    },

    /* ---------------- 图标拖动 ---------------- */
    beginItemDrag(e, node, it) {
      const S = SIZES[Settings.desktopIconSize] || SIZES.medium;
      const startX = e.clientX, startY = e.clientY;
      const nodes = this.selectedItems().map(i => this.grid.querySelector('.dt-item[data-id="' + CSS.escape(i.id) + '"]')).filter(Boolean);
      const starts = nodes.map(n => ({ n, l: parseFloat(n.style.left), t: parseFloat(n.style.top) }));
      let moved = false;
      const move = (ev) => {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        if (!moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        moved = true;
        starts.forEach(s => { s.n.style.left = (s.l + dx) + 'px'; s.n.style.top = (s.t + dy) + 'px'; s.n.classList.add('is-dragging'); });
      };
      const up = (ev) => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        if (!moved) return;
        starts.forEach(s => {
          s.n.classList.remove('is-dragging');
          const col = Math.max(0, Math.round((parseFloat(s.n.style.left) - 4) / S.cw));
          const row = Math.max(0, Math.round((parseFloat(s.n.style.top) - 4) / S.ch));
          this.positions[s.n.dataset.id] = { col, row };
        });
        try { localStorage.setItem(POS_KEY, JSON.stringify(this.positions)); } catch (e) { }
        this.layout();
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    },

    /* ---------------- 重命名 ---------------- */
    beginRename(id) {
      const it = this.items.find(i => i.id === id);
      if (!it || !it.path) return;
      const node = this.grid.querySelector('.dt-item[data-id="' + CSS.escape(id) + '"]');
      if (!node) return;
      const label = node.querySelector('.dt-item__label');
      const old = it.name;
      const input = U.el('input.dt-rename', { value: old });
      U.clear(label).appendChild(input);
      input.focus();
      const dot = old.lastIndexOf('.');
      if (dot > 0 && it.kind === 'file') input.setSelectionRange(0, dot); else input.select();
      const commit = (ok) => {
        input.onblur = null;
        if (ok && input.value.trim() && input.value !== old) {
          if (!VFS.rename(it.path, input.value.trim())) {
            Notifications.dialog({ title: '无法重命名', body: '已存在同名文件或文件夹。', icon: 'warning' });
          }
        }
        this.render();
      };
      input.onblur = () => commit(true);
      input.onkeydown = (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); commit(true); }
        if (e.key === 'Escape') { e.preventDefault(); commit(false); }
      };
      input.onclick = (e) => e.stopPropagation();
      input.ondblclick = (e) => e.stopPropagation();
    },

    /* ---------------- 删除 ---------------- */
    async deleteSelection(permanent) {
      const items = this.selectedItems().filter(i => i.path);
      if (!items.length) return;
      if (permanent) {
        const ok = await Notifications.confirm('删除多个项目',
          '确实要永久删除这 ' + items.length + ' 个项目吗？', '是');
        if (!ok) return;
      }
      items.forEach(i => VFS.remove(i.path, permanent));
      this.clearSelection();
      Sound.click();
      this.render();
    },

    /* ---------------- 右键菜单 ---------------- */
    showDesktopMenu(x, y) {
      const items = [
        {
          label: '查看', icon: 'view', submenu: [
            { label: '大图标', checked: Settings.desktopIconSize === 'large', onClick: () => Settings.set('desktopIconSize', 'large') },
            { label: '中等图标', checked: Settings.desktopIconSize === 'medium', onClick: () => Settings.set('desktopIconSize', 'medium') },
            { label: '小图标', checked: Settings.desktopIconSize === 'small', onClick: () => Settings.set('desktopIconSize', 'small') },
            { separator: true },
            { label: '自动排列图标', checked: Settings.desktopAutoArrange, onClick: () => Settings.set('desktopAutoArrange', !Settings.desktopAutoArrange) },
            { label: '显示桌面图标', checked: Settings.desktopShowIcons, onClick: () => Settings.set('desktopShowIcons', !Settings.desktopShowIcons) }
          ]
        },
        {
          label: '排序方式', icon: 'sort', submenu: [
            { label: '名称', checked: Settings.sortDesktopBy === 'name', onClick: () => Settings.set('sortDesktopBy', 'name') },
            { label: '大小', checked: Settings.sortDesktopBy === 'size', onClick: () => Settings.set('sortDesktopBy', 'size') },
            { label: '项目类型', checked: Settings.sortDesktopBy === 'type', onClick: () => Settings.set('sortDesktopBy', 'type') },
            { label: '修改日期', checked: Settings.sortDesktopBy === 'date', onClick: () => Settings.set('sortDesktopBy', 'date') }
          ]
        },
        { label: '刷新', icon: 'refresh', onClick: () => { this.render(); Sound.click(); } },
        { separator: true },
        {
          label: '新建', icon: 'plus', submenu: [
            { label: '文件夹', appIcon: 'folder', onClick: () => { const p = VFS.mkdir(VFS.special('desktop'), '新建文件夹'); this.render(); setTimeout(() => this.beginRename('vfs:' + p), 60); } },
            { separator: true },
            { label: '文本文档', appIcon: 'notepad', onClick: () => { const p = VFS.createFile(VFS.special('desktop'), '新建文本文档.txt', ''); this.render(); setTimeout(() => this.beginRename('vfs:' + p), 60); } },
            { label: 'BMP 图像', appIcon: 'image', onClick: () => { const p = VFS.createFile(VFS.special('desktop'), '新建位图图像.bmp', '', { size: 0 }); this.render(); } },
            { label: '压缩文件夹', appIcon: 'zip', onClick: () => { const p = VFS.createFile(VFS.special('desktop'), '新建压缩文件夹.zip', '', { size: 22 }); this.render(); } }
          ]
        },
        { separator: true },
        { label: '显示设置', icon: 'monitor', onClick: () => Apps.launch('settings', { page: 'system', sub: 'display' }) },
        { label: '个性化', icon: 'palette', onClick: () => Apps.launch('settings', { page: 'personalization' }) },
        { separator: true },
        { label: '在终端中打开', icon: 'apps', onClick: () => Apps.launch('terminal', { cwd: VFS.special('desktop') }) },
        { label: '显示更多选项', icon: 'more', accel: 'Shift+F10', onClick: () => this.showLegacyMenu(x, y) }
      ];
      Menu.show(items, { x, y });
    },

    showLegacyMenu(x, y) {
      Menu.show([
        { label: '查看', icon: 'view', submenu: [{ label: '大图标' }, { label: '中等图标' }, { label: '小图标' }] },
        { label: '排序方式', icon: 'sort', submenu: [{ label: '名称' }, { label: '大小' }] },
        { label: '刷新', icon: 'refresh', onClick: () => this.render() },
        { separator: true },
        { label: '粘贴', icon: 'paste', disabled: !U.clipboard.files },
        { label: '粘贴快捷方式', icon: 'link', disabled: true },
        { label: '撤消删除', icon: 'undo', disabled: !VFS.recycle.length, onClick: () => { const last = VFS.recycle[VFS.recycle.length - 1]; if (last) VFS.restore(last.id); } },
        { separator: true },
        { label: '授予访问权限', icon: 'share', disabled: true },
        { label: '新建', icon: 'plus', submenu: [{ label: '文件夹', onClick: () => { VFS.mkdir(VFS.special('desktop'), '新建文件夹'); this.render(); } }] },
        { separator: true },
        { label: '显示设置', icon: 'monitor', onClick: () => Apps.launch('settings', { page: 'system', sub: 'display' }) },
        { label: '个性化', icon: 'palette', onClick: () => Apps.launch('settings', { page: 'personalization' }) }
      ], { x, y, compact: true });
    },

    showItemMenu(it, x, y) {
      const isFile = it.kind === 'file', isDir = it.kind === 'dir', isVfs = !!it.path;
      const items = [];
      if (isVfs) {
        items.push({
          iconBar: [
            { icon: 'cut', label: '剪切', onClick: () => { U.clipboard.files = [it.path]; U.clipboard.mode = 'cut'; } },
            { icon: 'copy', label: '复制', onClick: () => { U.clipboard.files = [it.path]; U.clipboard.mode = 'copy'; } },
            { icon: 'rename', label: '重命名', onClick: () => this.beginRename(it.id) },
            { icon: 'share', label: '共享', onClick: () => Notifications.toast({ title: '共享', body: '共享功能在 Web 版中不可用。', icon: 'share' }) },
            { icon: 'trash', label: '删除', danger: true, onClick: () => { this.select(it.id); this.deleteSelection(); } }
          ]
        });
      }
      items.push({ label: '打开', icon: 'open', onClick: () => it.open && it.open() });
      if (isFile) {
        items.push({ label: '打开方式', icon: 'apps', onClick: () => Apps.openWith(it.path) });
      }
      if (it.id === 'sys:recyclebin') {
        items.push({ label: '清空回收站', icon: 'trash', danger: true, disabled: !VFS.recycle.length, onClick: async () => {
          if (await Notifications.confirm('删除多个项目', '确实要永久删除这些项目吗？', '是')) { VFS.emptyRecycle(); this.render(); }
        } });
      }
      if (it.id === 'sys:thispc') {
        items.push({ label: '属性', icon: 'info', onClick: () => Apps.launch('settings', { page: 'about' }) });
        items.push({ label: '管理', icon: 'settings', onClick: () => Apps.launch('taskmgr') });
      }
      if (isDir) items.push({ label: '在新窗口中打开', icon: 'duplicate', onClick: () => Apps.launch('explorer', { path: it.path, forceNew: true }) });
      if (isDir) items.push({ label: '在终端中打开', icon: 'apps', onClick: () => Apps.launch('terminal', { cwd: it.path }) });
      items.push({ label: '固定到"开始"屏幕', icon: 'pin', onClick: () => Notifications.toast({ title: '已固定', body: it.name + ' 已固定到"开始"屏幕。', icon: 'pin' }) });
      if (isVfs) {
        items.push({ separator: true });
        items.push({ label: '复制为路径', icon: 'link', onClick: () => U.copyText(it.path) });
        items.push({ label: '属性', icon: 'info', accel: 'Alt+Enter', onClick: () => Shell.showProperties(it.path) });
      }
      items.push({ separator: true });
      items.push({ label: '显示更多选项', icon: 'more', accel: 'Shift+F10', onClick: () => this.showLegacyMenu(x, y) });
      Menu.show(items, { x, y });
    }
  };

  global.Desktop = Desktop;
})(window);
