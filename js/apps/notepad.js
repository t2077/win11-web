/* ============================================================
   notepad.js — 记事本（标签页 / 菜单栏 / 查找替换 / 状态栏）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('notepad', `
  .np-root { display:flex; flex-direction:column; height:100%; min-height:0; background: var(--bg-solid); }
  [data-theme="dark"] .np-root { background:#202020; }
  .np-menubar { flex:none; display:flex; align-items:center; gap:2px; height:34px; padding:0 6px; }
  .np-menu { height:26px; padding:0 10px; border-radius:var(--r-sm); font-size:var(--fs-body); color:var(--text-primary);
    transition: background-color var(--dur-fast) linear; }
  .np-menu:hover, .np-menu.is-open { background: var(--fill-subtle-hover); }
  .np-area { flex:1 1 auto; min-height:0; display:flex; position:relative; }
  .np-text { flex:1; min-width:0; border:0; outline:0; resize:none; background:transparent; color:var(--text-primary);
    font-family: var(--font-mono); font-size:14px; line-height:1.5; padding:10px 14px; user-select:text; tab-size:4; }
  .np-text::placeholder { color: var(--text-tertiary); }
  .np-status { flex:none; display:flex; align-items:center; gap:0; height:26px; padding:0 4px;
    border-top:1px solid var(--stroke-divider); font-size:var(--fs-caption); color:var(--text-secondary); }
  .np-status > span { padding:0 12px; border-right:1px solid var(--stroke-divider); }
  .np-status > span:last-child { border-right:0; }
  .np-find { position:absolute; right:16px; top:10px; z-index:5; width:320px; padding:12px; border-radius:var(--r-lg);
    background: var(--bg-solid-3); box-shadow: var(--shadow-flyout), inset 0 0 0 1px var(--stroke-surface); }
  .np-find__row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
  .np-find__row .textbox { flex:1; }
  .np-zoom { display:flex; align-items:center; gap:2px; }
  `);

  const Notepad = { recent: [] };

  function mount(win, args) {
    const state = { tabs: [], active: 0, wrap: true, zoom: 100 };

    win.setChromeHeight(40);
    win.setBodyBg('');
    const tabstrip = U.el('div.tabstrip');
    win.headArea.appendChild(tabstrip);

    const root = U.el('div.np-root');
    const menubar = U.el('div.np-menubar');
    const area = U.el('div.np-area');
    const status = U.el('div.np-status');
    root.append(menubar, area, status);
    win.body.appendChild(root);

    const ta = U.el('textarea.np-text', { spellcheck: 'false', placeholder: '' });
    area.appendChild(ta);

    const cur = () => state.tabs[state.active];

    function addTab(path, content, activate) {
      const t = {
        id: U.uid('nt'), path: path || null,
        name: path ? VFS.basename(path) : '无标题',
        content: content || '', dirty: false, sel: [0, 0]
      };
      state.tabs.push(t);
      if (activate !== false) state.active = state.tabs.length - 1;
      if (path) { Notepad.recent = [path].concat(Notepad.recent.filter(x => x !== path)).slice(0, 10); }
      renderTabs(); loadTab();
      return t;
    }

    async function closeTab(i) {
      const t = state.tabs[i];
      if (t.dirty) {
        const r = await new Promise(res => {
          Notifications.dialog({
            title: '记事本',
            body: '是否要将更改保存到 ' + t.name + '？',
            buttons: [{ text: '保存', accent: true, value: 'save' }, { text: '不保存', value: 'no' }, { text: '取消', value: null }],
            onClose: res
          });
        });
        if (r === null) return false;
        if (r === 'save') { state.active = i; if (!(await save())) return false; }
      }
      state.tabs.splice(i, 1);
      if (!state.tabs.length) { win.close(); return true; }
      state.active = U.clamp(state.active > i ? state.active - 1 : state.active, 0, state.tabs.length - 1);
      renderTabs(); loadTab();
      return true;
    }

    function renderTabs() {
      U.clear(tabstrip);
      state.tabs.forEach((t, i) => {
        const tab = U.el('div.wtab' + (i === state.active ? '.is-active' : ''), { title: t.path || t.name }, [
          U.el('div.wtab__label', { text: (t.dirty ? '● ' : '') + t.name }),
          U.el('button.wtab__x', { title: '关闭' }, Icons.ui('close', 10))
        ]);
        tab.onclick = (e) => { if (e.target.closest('.wtab__x')) return; saveCaret(); state.active = i; renderTabs(); loadTab(); };
        tab.querySelector('.wtab__x').onclick = (e) => { e.stopPropagation(); closeTab(i); };
        tabstrip.appendChild(tab);
      });
      const add = U.el('button.wtab-add', { title: '新建标签页' }, Icons.ui('plus', 14));
      add.onclick = () => addTab(null, '');
      tabstrip.appendChild(add);
      const t = cur();
      win.setTitle((t.dirty ? '*' : '') + t.name + ' - 记事本');
    }

    function loadTab() {
      const t = cur();
      ta.value = t.content;
      ta.style.whiteSpace = state.wrap ? 'pre-wrap' : 'pre';
      ta.style.fontSize = (14 * state.zoom / 100) + 'px';
      updateStatus();
      setTimeout(() => { ta.focus(); ta.setSelectionRange(t.sel[0], t.sel[1]); }, 20);
    }
    function saveCaret() { const t = cur(); if (t) t.sel = [ta.selectionStart, ta.selectionEnd]; }

    ta.oninput = () => {
      const t = cur();
      t.content = ta.value;
      if (!t.dirty) { t.dirty = true; renderTabs(); }
      updateStatus();
    };
    ta.onkeyup = ta.onclick = updateStatus;
    ta.onkeydown = (e) => {
      if (e.key === 'Tab') { e.preventDefault(); insert('\t'); }
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); openDialog(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); addTab(null, ''); }
      if (e.ctrlKey && e.key.toLowerCase() === 'f') { e.preventDefault(); showFind(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'h') { e.preventDefault(); showFind(true); }
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) { e.preventDefault(); setZoom(state.zoom + 10); }
      if (e.ctrlKey && e.key === '-') { e.preventDefault(); setZoom(state.zoom - 10); }
      if (e.ctrlKey && e.key === '0') { e.preventDefault(); setZoom(100); }
    };

    function insert(s) {
      const a = ta.selectionStart, b = ta.selectionEnd;
      ta.value = ta.value.slice(0, a) + s + ta.value.slice(b);
      ta.setSelectionRange(a + s.length, a + s.length);
      ta.oninput();
    }

    function updateStatus() {
      U.clear(status);
      const v = ta.value;
      const pos = ta.selectionStart;
      const before = v.slice(0, pos);
      const line = before.split('\n').length;
      const col = pos - before.lastIndexOf('\n');
      status.append(
        U.el('span', { text: '第 ' + line + ' 行，第 ' + col + ' 列' }),
        U.el('span', { text: v.length.toLocaleString('zh-CN') + ' 个字符' }),
        U.el('div.spacer'),
        (() => {
          const z = U.el('span.np-zoom');
          const mk = (txt, fn) => { const b = U.el('button.viewtoggle', { text: txt, style: { width: '20px' } }); b.onclick = fn; return b; };
          z.append(mk('−', () => setZoom(state.zoom - 10)), U.el('span', { text: state.zoom + '%', style: { padding: '0 4px', border: 0 } }), mk('+', () => setZoom(state.zoom + 10)));
          return z;
        })(),
        U.el('span', { text: 'Windows (CRLF)' }),
        U.el('span', { text: 'UTF-8' })
      );
    }
    function setZoom(z) { state.zoom = U.clamp(z, 50, 300); ta.style.fontSize = (14 * state.zoom / 100) + 'px'; updateStatus(); }

    /* ---------- 菜单 ---------- */
    const mk = (label, items) => {
      const b = U.el('button.np-menu', { text: label });
      b.onclick = () => { b.classList.add('is-open'); Menu.show(items(), { anchor: b, align: 'bottom-left', gap: 2 }); setTimeout(() => b.classList.remove('is-open'), 300); };
      return b;
    };
    menubar.append(
      mk('文件', () => [
        { label: '新建标签页', icon: 'plus', accel: 'Ctrl+N', onClick: () => addTab(null, '') },
        { label: '新建窗口', icon: 'duplicate', accel: 'Ctrl+Shift+N', onClick: () => Apps.launch('notepad') },
        { label: '打开…', icon: 'open', accel: 'Ctrl+O', onClick: openDialog },
        { separator: true },
        { label: '保存', icon: 'save', accel: 'Ctrl+S', onClick: save },
        { label: '另存为…', icon: 'save', accel: 'Ctrl+Shift+S', onClick: saveAs },
        { separator: true },
        { label: '页面设置…', icon: 'print', disabled: true },
        { label: '打印…', icon: 'print', accel: 'Ctrl+P', onClick: () => Notifications.toast({ title: '打印', body: '未安装打印机。', icon: 'print' }) },
        { separator: true },
        { label: '退出', icon: 'close', onClick: () => win.close() }
      ]),
      mk('编辑', () => [
        { label: '撤消', icon: 'undo', accel: 'Ctrl+Z', onClick: () => document.execCommand('undo') },
        { label: '重做', icon: 'redo', accel: 'Ctrl+Y', onClick: () => document.execCommand('redo') },
        { separator: true },
        { label: '剪切', icon: 'cut', accel: 'Ctrl+X', onClick: () => { U.copyText(sel()); insert(''); } },
        { label: '复制', icon: 'copy', accel: 'Ctrl+C', onClick: () => U.copyText(sel()) },
        { label: '粘贴', icon: 'paste', accel: 'Ctrl+V', onClick: async () => insert(await U.readText()) },
        { label: '删除', icon: 'trash', accel: 'Del', onClick: () => insert('') },
        { separator: true },
        { label: '查找…', icon: 'search', accel: 'Ctrl+F', onClick: () => showFind() },
        { label: '替换…', icon: 'rename', accel: 'Ctrl+H', onClick: () => showFind(true) },
        { separator: true },
        { label: '全选', icon: 'check', accel: 'Ctrl+A', onClick: () => ta.select() },
        { label: '时间/日期', icon: 'time', accel: 'F5', onClick: () => insert(U.fmtTime() + ' ' + U.fmtDateShort()) }
      ]),
      mk('查看', () => [
        {
          label: '缩放', icon: 'zoomIn', submenu: [
            { label: '放大', accel: 'Ctrl++', onClick: () => setZoom(state.zoom + 10) },
            { label: '缩小', accel: 'Ctrl+-', onClick: () => setZoom(state.zoom - 10) },
            { label: '还原默认缩放', accel: 'Ctrl+0', onClick: () => setZoom(100) }
          ]
        },
        { label: '自动换行', checked: state.wrap, onClick: () => { state.wrap = !state.wrap; ta.style.whiteSpace = state.wrap ? 'pre-wrap' : 'pre'; } },
        { label: '状态栏', checked: true, onClick: () => status.hidden = !status.hidden },
        { separator: true },
        { label: '深色模式', checked: Settings.theme === 'dark', onClick: () => Settings.set('theme', Settings.theme === 'dark' ? 'light' : 'dark') }
      ])
    );
    function sel() { return ta.value.slice(ta.selectionStart, ta.selectionEnd); }

    /* ---------- 查找替换 ---------- */
    let findPanel = null;
    function showFind(replace) {
      if (findPanel) { findPanel.remove(); findPanel = null; }
      const fInput = U.el('input', { placeholder: '查找内容' });
      const rInput = U.el('input', { placeholder: '替换为' });
      const p = U.el('div.np-find', {}, [
        U.el('div.np-find__row', {}, [
          U.el('div.textbox', {}, fInput),
          (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '查找下一个' }, Icons.ui('chevronDown', 14)); b.onclick = () => findNext(fInput.value); return b; })(),
          (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '关闭' }, Icons.ui('close', 14)); b.onclick = () => { p.remove(); findPanel = null; ta.focus(); }; return b; })()
        ]),
        replace ? U.el('div.np-find__row', {}, [
          U.el('div.textbox', {}, rInput),
          (() => { const b = U.el('button.cmdbtn', { text: '替换' }); b.onclick = () => replaceOne(fInput.value, rInput.value); return b; })(),
          (() => { const b = U.el('button.cmdbtn', { text: '全部替换' }); b.onclick = () => replaceAll(fInput.value, rInput.value); return b; })()
        ]) : null
      ]);
      area.appendChild(p);
      findPanel = p;
      fInput.focus();
      fInput.onkeydown = (e) => { if (e.key === 'Enter') findNext(fInput.value); if (e.key === 'Escape') { p.remove(); findPanel = null; } };
      U.anim(p, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: U.EASE.decel });
    }
    function findNext(q) {
      if (!q) return;
      const from = ta.selectionEnd;
      let i = ta.value.indexOf(q, from);
      if (i < 0) i = ta.value.indexOf(q, 0);
      if (i < 0) { Sound.error(); return; }
      ta.focus(); ta.setSelectionRange(i, i + q.length);
      updateStatus();
    }
    function replaceOne(q, r) {
      if (!q) return;
      if (sel() === q) { insert(r); }
      findNext(q);
    }
    function replaceAll(q, r) {
      if (!q) return;
      const n = ta.value.split(q).length - 1;
      ta.value = ta.value.split(q).join(r);
      ta.oninput();
      Notifications.toast({ title: '替换完成', body: '共替换 ' + n + ' 处。', appIcon: 'notepad', timeout: 2600 });
    }

    /* ---------- 打开 / 保存 ---------- */
    function openDialog() {
      const files = [];
      [VFS.special('desktop'), VFS.special('documents'), VFS.special('downloads')].forEach(p =>
        VFS.list(p).filter(e => e.type === 'file' && ['txt', 'md', 'log', 'json', 'ini', 'csv', 'js', 'css', 'html'].includes(e.ext)).forEach(e => files.push(e)));
      const list = U.el('div.openwith');
      if (!files.length) list.appendChild(U.el('div.caption.text-tertiary', { text: '没有可打开的文本文件' }));
      files.forEach(f => {
        const row = U.el('div.openwith__row', { tabindex: 0 }, [
          Icons.app(Icons.forFile(f.name, false), 20),
          U.el('div', {}, [U.el('div', { text: f.name }), U.el('div.caption.text-tertiary', { text: VFS.parent(f.path) })])
        ]);
        row.onclick = () => { dlg.close(); addTab(f.path, VFS.readFile(f.path) || ''); };
        list.appendChild(row);
      });
      const dlg = Notifications.dialog({ title: '打开', content: list, width: 460, buttons: [{ text: '取消' }] });
    }

    async function save() {
      const t = cur();
      if (!t.path) return saveAs();
      VFS.writeFile(t.path, t.content);
      t.dirty = false; renderTabs();
      Notifications.toast({ title: '已保存', body: t.path, appIcon: 'notepad', timeout: 2000 });
      return true;
    }

    async function saveAs() {
      const t = cur();
      const name = await Notifications.prompt('另存为', t.name.endsWith('.txt') ? t.name : t.name + '.txt', '文件名（保存到「文档」）');
      if (!name) return false;
      const p = VFS.createFile(VFS.special('documents'), name, t.content);
      t.path = p; t.name = VFS.basename(p); t.dirty = false;
      Notepad.recent = [p].concat(Notepad.recent.filter(x => x !== p)).slice(0, 10);
      renderTabs();
      Notifications.toast({ title: '已保存', body: p, appIcon: 'notepad', timeout: 2200 });
      return true;
    }

    win.onClose(async () => {
      for (let i = state.tabs.length - 1; i >= 0; i--) {
        const t = state.tabs[i];
        if (!t.dirty) continue;
        const r = await new Promise(res => {
          Notifications.dialog({
            title: '记事本', body: '是否要将更改保存到 ' + t.name + '？',
            buttons: [{ text: '保存', accent: true, value: 'save' }, { text: '不保存', value: 'no' }, { text: '取消', value: null }],
            onClose: res
          });
        });
        if (r === null) return false;
        if (r === 'save') { state.active = i; await save(); }
        else t.dirty = false;
      }
      return true;
    });

    /* 初始 */
    if (args && args.path) addTab(args.path, VFS.readFile(args.path) || '');
    else addTab(null, args && args.text || '');
  }

  Apps.register({
    id: 'notepad', name: '记事本', icon: 'notepad', category: 'Windows 工具',
    size: { w: 860, h: 620 }, minSize: { w: 420, h: 280 }, mount
  });

  global.Notepad = Notepad;
})(window);
