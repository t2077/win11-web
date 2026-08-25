/* ============================================================
   edge.js — Microsoft Edge（标签页 / 地址栏 / 新标签页 / 本地渲染）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('edge', `
  .eg-root { display:flex; flex-direction:column; height:100%; min-height:0; }
  .eg-bar { flex:none; display:flex; align-items:center; gap:4px; padding:6px 8px; }
  .eg-omni { flex:1; min-width:0; height:32px; display:flex; align-items:center; gap:8px; padding:0 10px;
    border-radius:var(--r-pill); background: var(--fill-control);
    box-shadow: inset 0 0 0 1px var(--stroke-control-2); }
  .eg-omni:focus-within { background: var(--bg-solid-4); box-shadow: inset 0 0 0 2px var(--fill-accent); }
  .eg-omni input { flex:1; min-width:0; border:0; outline:0; background:transparent; font-size:var(--fs-body);
    color:var(--text-primary); user-select:text; }
  .eg-favbar { flex:none; display:flex; align-items:center; gap:2px; padding:0 10px 6px; }
  .eg-fav { display:flex; align-items:center; gap:6px; height:26px; padding:0 8px; border-radius:var(--r-sm);
    font-size:var(--fs-caption); color:var(--text-primary); }
  .eg-fav:hover { background: var(--fill-subtle-hover); }
  .eg-view { flex:1 1 auto; min-height:0; position:relative; background:#fff; }
  [data-theme="dark"] .eg-view { background:#202124; }
  .eg-view iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
  .eg-progress { position:absolute; left:0; top:0; height:2px; background: var(--accent-light1); z-index:5;
    transition: width .3s linear, opacity .3s linear; }
  `);

  const HOME = 'edge://newtab';

  /* 本地"网页"内容库 */
  const SITES = {
    'example.com': { title: 'Example Domain', body: '<h1>Example Domain</h1><p>此域用于文档中的示例说明，你可以在文献中使用此域名而无需事先协调或请求许可。</p><p><a href="#">了解更多…</a></p>' },
    'microsoft.com': {
      title: 'Microsoft — 云、计算机、应用和游戏', body:
        '<h1>欢迎来到 Microsoft</h1><div class="cards"><div class="c"><h3>Windows 11</h3><p>为效率而生的全新体验。</p></div>' +
        '<div class="c"><h3>Microsoft 365</h3><p>随处使用 Word、Excel 与 PowerPoint。</p></div>' +
        '<div class="c"><h3>Surface</h3><p>轻薄、强大的设备家族。</p></div>' +
        '<div class="c"><h3>Xbox</h3><p>畅玩数百款高品质游戏。</p></div></div>'
    },
    'learn.microsoft.com': {
      title: 'Microsoft Learn — 技术文档', body:
        '<h1>Fluent Design System</h1><p>Fluent 设计体系用五个基本要素描述界面：光、深度、材质、缩放与动效。</p>' +
        '<h2>亚克力（Acrylic）</h2><p>亚克力是一种半透明材质，它会对背景进行模糊与着色，从而在界面中建立层次关系。</p>' +
        '<h2>Mica</h2><p>Mica 是一种不透明材质，它采样桌面壁纸的颜色，为长期驻留的窗口提供沉稳的背景。</p>' +
        '<h2>圆角</h2><p>Windows 11 中窗口使用 8px 圆角，控件使用 4px 圆角。</p>'
    },
    'zh.wikipedia.org': {
      title: 'Windows 11 — 维基百科', body:
        '<h1>Windows 11</h1><p><b>Windows 11</b> 是微软公司开发的 Windows NT 系列操作系统，于 2021 年 10 月 5 日正式发行。</p>' +
        '<h2>界面</h2><p>Windows 11 引入了居中的任务栏、圆角窗口、全新的开始菜单、贴靠布局（Snap Layouts）、小组件面板以及 Mica 材质。</p>' +
        '<h2>系统要求</h2><ul><li>1 GHz 双核 64 位处理器</li><li>4 GB 内存</li><li>64 GB 存储空间</li><li>UEFI 安全启动与 TPM 2.0</li></ul>'
    },
    'github.com': {
      title: 'GitHub — 构建软件的地方', body:
        '<h1>让我们一起构建</h1><p>数以千万计的开发者在 GitHub 上共同开发、评审代码并管理项目。</p>' +
        '<pre>$ git clone https://example/win11-web.git\n$ cd win11-web\n$ start index.html</pre>'
    }
  };

  const CSS_PAGE = `
  :root { color-scheme: light dark; }
  body { margin:0; font-family:"Segoe UI Variable Text","Segoe UI","Microsoft YaHei UI",sans-serif;
    background:#fff; color:#1b1b1b; line-height:1.6; }
  .wrap { max-width:820px; margin:0 auto; padding:40px 24px 80px; }
  h1 { font-size:32px; margin:0 0 12px; font-weight:600; }
  h2 { font-size:20px; margin:28px 0 8px; font-weight:600; }
  h3 { font-size:16px; margin:0 0 6px; }
  p, li { font-size:15px; color:#333; }
  a { color:#0067b8; }
  pre { background:#f3f3f3; padding:14px; border-radius:6px; overflow:auto; font-family:Consolas,monospace; font-size:13px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; margin-top:20px; }
  .c { border:1px solid #e3e3e3; border-radius:8px; padding:16px; background:#fafafa; }
  .res { padding:16px 0; border-bottom:1px solid #eee; }
  .res .u { font-size:12px; color:#5a5a5a; }
  .res .t { font-size:18px; color:#1a0dab; margin:2px 0 4px; }
  .res .d { font-size:14px; color:#4d5156; }
  .sbar { display:flex; align-items:center; gap:10px; border:1px solid #dfdfdf; border-radius:24px; padding:10px 18px;
    box-shadow:0 1px 6px rgba(0,0,0,.1); max-width:560px; }
  .hdr { display:flex; align-items:center; gap:16px; padding:14px 24px; border-bottom:1px solid #eee; }
  @media (prefers-color-scheme: dark) {
    body { background:#202124; color:#e8eaed; }
    p, li { color:#bdc1c6; } a { color:#8ab4f8; } .res .t { color:#8ab4f8; } .res .d { color:#bdc1c6; }
    .c { background:#282a2d; border-color:#3c4043; } pre { background:#282a2d; }
    .sbar { border-color:#3c4043; background:#303134; } .hdr { border-color:#3c4043; }
  }`;

  function pageDoc(inner, cls) {
    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><style>' + CSS_PAGE + '</style></head><body class="' + (cls || '') + '">' + inner + '</body></html>';
  }

  function searchDoc(q) {
    const seeds = [
      { u: 'zh.wikipedia.org › wiki › Windows_11', t: 'Windows 11 - 维基百科，自由的百科全书', d: 'Windows 11 是微软于 2021 年发布的操作系统，带来了居中任务栏、圆角窗口、Snap 布局与小组件面板。' },
      { u: 'www.microsoft.com › windows › windows-11', t: 'Windows 11 — 全新的 Windows 体验', d: '了解 Windows 11 的新功能：贴靠布局、Microsoft Store、小组件、专注助手等。' },
      { u: 'learn.microsoft.com › windows › apps › design', t: 'Fluent Design 设计体系 - Windows 应用开发', d: '光、深度、材质、缩放与动效：Fluent 的五个基本要素，以及 Acrylic 与 Mica 材质的使用指南。' },
      { u: 'github.com › topics › windows11', t: 'windows11 · GitHub Topics', d: '在 GitHub 上探索与 Windows 11 相关的开源项目，包括主题、桌面复刻与工具集。' },
      { u: 'support.microsoft.com › windows › keyboard-shortcuts', t: 'Windows 键盘快捷方式 - Microsoft 支持', d: 'Win+D 显示桌面、Win+E 打开文件资源管理器、Win+方向键贴靠窗口、Alt+Tab 切换应用。' }
    ];
    const res = seeds.map(s => '<div class="res"><div class="u">' + s.u + '</div><div class="t">' + U.escapeHtml(q) + ' — ' + s.t + '</div><div class="d">' + s.d + '</div></div>').join('');
    return pageDoc('<div class="hdr"><b style="font-size:20px">Bing</b><div class="sbar" style="flex:1"><span>🔍</span><span>' + U.escapeHtml(q) + '</span></div></div>' +
      '<div class="wrap"><div style="font-size:13px;color:#70757a;margin-bottom:6px">约 ' + (1200 + q.length * 137).toLocaleString('en-US') + ' 条结果（' + (0.2 + Math.random() * .5).toFixed(2) + ' 秒）</div>' + res + '</div>');
  }

  function mount(win, args) {
    win.setChromeHeight(40);
    win.setBodyBg('');
    const tabstrip = U.el('div.tabstrip');
    win.headArea.appendChild(tabstrip);

    const state = { tabs: [], active: 0 };
    const root = U.el('div.eg-root');
    const bar = U.el('div.eg-bar');
    const favbar = U.el('div.eg-favbar');
    const view = U.el('div.eg-view');
    root.append(bar, favbar, view);
    win.body.appendChild(root);

    const cur = () => state.tabs[state.active];

    function addTab(url) {
      const t = { id: U.uid('et'), url: url || HOME, title: '新建标签页', hist: [], hi: -1, frame: null };
      const f = U.el('iframe', { sandbox: 'allow-same-origin', title: '页面内容' });
      t.frame = f;
      view.appendChild(f);
      state.tabs.push(t);
      state.active = state.tabs.length - 1;
      navigate(t.url, true);
      renderTabs();
      return t;
    }
    function closeTab(i) {
      if (state.tabs.length <= 1) { win.close(); return; }
      state.tabs[i].frame.remove();
      state.tabs.splice(i, 1);
      state.active = U.clamp(state.active > i ? state.active - 1 : state.active, 0, state.tabs.length - 1);
      sync(); renderTabs(); buildBar();
    }
    function sync() { state.tabs.forEach((t, i) => t.frame.hidden = i !== state.active); }

    function renderTabs() {
      U.clear(tabstrip);
      state.tabs.forEach((t, i) => {
        const tab = U.el('div.wtab' + (i === state.active ? '.is-active' : ''), { title: t.title }, [
          Icons.app(t.url.startsWith('file:///') ? Icons.forFile(t.title, false) : 'edge', 14),
          U.el('div.wtab__label', { text: t.title }),
          U.el('button.wtab__x', { title: '关闭标签页' }, Icons.ui('close', 10))
        ]);
        tab.onclick = (e) => { if (e.target.closest('.wtab__x')) return; state.active = i; sync(); renderTabs(); buildBar(); };
        tab.querySelector('.wtab__x').onclick = (e) => { e.stopPropagation(); closeTab(i); };
        tabstrip.appendChild(tab);
      });
      const add = U.el('button.wtab-add', { title: '新建标签页 (Ctrl+T)' }, Icons.ui('plus', 14));
      add.onclick = () => { addTab(HOME); sync(); buildBar(); };
      tabstrip.appendChild(add);
      const t = cur();
      win.setTitle((t ? t.title : '新建标签页') + ' — Microsoft Edge');
    }

    function buildBar() {
      U.clear(bar);
      const t = cur();
      const nb = (icon, label, fn, disabled) => {
        const b = U.el('button.cmdbtn.cmdbtn--icon', { title: label, 'aria-disabled': disabled ? 'true' : null }, Icons.ui(icon, 16));
        b.onclick = fn; U.tooltip(b, label); return b;
      };
      bar.append(
        nb('back', '返回', () => go(-1), !t || t.hi <= 0),
        nb('forward', '前进', () => go(1), !t || t.hi >= t.hist.length - 1),
        nb('refresh', '刷新', () => navigate(t.url, true)),
        nb('home', '主页', () => navigate(HOME))
      );
      const omni = U.el('div.eg-omni');
      const input = U.el('input', { value: t && t.url !== HOME ? t.url : '', placeholder: '搜索或输入 Web 地址', spellcheck: 'false' });
      omni.append(Icons.ui(t && t.url.startsWith('edge://') ? 'search' : 'shield', 14), input);
      omni.appendChild(U.el('button.cmdbtn.cmdbtn--icon', { title: '添加到收藏夹', onclick: () => Notifications.toast({ title: '已添加到收藏夹', body: t.title, appIcon: 'edge' }) }, Icons.ui('star', 14)));
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const v = input.value.trim();
          if (!v) return;
          navigate(resolveInput(v));
        }
        e.stopPropagation();
      };
      input.onfocus = () => input.select();
      bar.appendChild(omni);
      bar.append(
        nb('collection', '集锦', () => Notifications.toast({ title: '集锦', body: '尚未创建任何集锦。', appIcon: 'edge' })),
        nb('extension', '扩展', () => Notifications.toast({ title: '扩展', body: '未安装扩展。', appIcon: 'edge' })),
        nb('download', '下载', () => Apps.launch('explorer', { path: VFS.special('downloads') })),
        nb('person', '个人资料', () => Notifications.toast({ title: Settings.userName, body: Settings.userEmail + ' · 已同步', appIcon: 'edge' })),
        nb('more', '设置及其他', (e) => {
          Menu.show([
            { label: '新建标签页', icon: 'plus', accel: 'Ctrl+T', onClick: () => { addTab(HOME); sync(); buildBar(); } },
            { label: '新建窗口', icon: 'duplicate', onClick: () => Apps.launch('edge') },
            { separator: true },
            { label: '缩放', icon: 'zoomIn', submenu: [{ label: '放大' }, { label: '缩小' }, { label: '重置为 100%' }] },
            { label: '收藏夹', icon: 'star', onClick: () => navigate('edge://favorites') },
            { label: '历史记录', icon: 'history', onClick: () => navigate('edge://history') },
            { label: '下载', icon: 'download', onClick: () => Apps.launch('explorer', { path: VFS.special('downloads') }) },
            { separator: true },
            { label: '打印', icon: 'print', onClick: () => Notifications.toast({ title: '打印', body: '未安装打印机。', icon: 'print' }) },
            { label: '在页面上查找', icon: 'search', accel: 'Ctrl+F' },
            { separator: true },
            { label: '设置', icon: 'settings', onClick: () => navigate('edge://settings') },
            { label: '关于 Microsoft Edge', icon: 'info', onClick: () => navigate('edge://version') }
          ], { x: e.clientX, y: e.clientY });
        })
      );

      U.clear(favbar);
      [['Microsoft', 'microsoft.com'], ['Microsoft Learn', 'learn.microsoft.com'], ['维基百科', 'zh.wikipedia.org'], ['GitHub', 'github.com'], ['Example', 'example.com']]
        .forEach(([n, u]) => {
          const b = U.el('button.eg-fav', {}, [Icons.ui('globe', 12), U.el('span', { text: n })]);
          b.onclick = () => navigate('https://' + u);
          favbar.appendChild(b);
        });
    }

    function resolveInput(v) {
      if (/^(https?|edge|file):/i.test(v)) return v;
      if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v)) return 'https://' + v;
      if (VFS.exists(v)) return 'file:///' + v;
      return 'edge://search?q=' + encodeURIComponent(v);
    }

    function go(d) {
      const t = cur();
      const ni = U.clamp(t.hi + d, 0, t.hist.length - 1);
      if (ni === t.hi) return;
      t.hi = ni;
      navigate(t.hist[ni], true, true);
    }

    async function navigate(url, force, noHist) {
      const t = cur();
      if (!t) return;
      if (!noHist && (force || t.url !== url)) {
        t.hist = t.hist.slice(0, t.hi + 1);
        if (t.hist[t.hi] !== url) { t.hist.push(url); t.hi = t.hist.length - 1; }
      }
      t.url = url;

      /* 进度条 */
      const pg = U.el('div.eg-progress', { style: { width: '0%' } });
      view.appendChild(pg);
      requestAnimationFrame(() => pg.style.width = '65%');

      let doc, title;
      if (url === HOME || url === 'edge://newtab') {
        doc = newTabDoc(); title = '新建标签页';
      } else if (url.startsWith('edge://search?q=')) {
        const q = decodeURIComponent(url.split('q=')[1] || '');
        doc = searchDoc(q); title = q + ' — 必应搜索';
      } else if (url === 'edge://favorites') {
        doc = pageDoc('<div class="wrap"><h1>收藏夹</h1><ul><li>Microsoft</li><li>Microsoft Learn</li><li>维基百科</li><li>GitHub</li></ul></div>');
        title = '收藏夹';
      } else if (url === 'edge://history') {
        const items = state.tabs.flatMap(x => x.hist).filter(u => !u.startsWith('edge://')).slice(-20).reverse();
        doc = pageDoc('<div class="wrap"><h1>历史记录</h1>' + (items.length ? '<ul>' + items.map(u => '<li>' + U.escapeHtml(u) + '</li>').join('') + '</ul>' : '<p>暂无历史记录。</p>') + '</div>');
        title = '历史记录';
      } else if (url === 'edge://settings') {
        doc = pageDoc('<div class="wrap"><h1>设置</h1><h2>外观</h2><p>整体外观：跟随系统（当前为' + (Settings.theme === 'dark' ? '深色' : '浅色') + '）</p><h2>隐私、搜索和服务</h2><p>跟踪防护：均衡</p><h2>默认浏览器</h2><p>Microsoft Edge 是此系统的默认浏览器。</p></div>');
        title = '设置';
      } else if (url === 'edge://version') {
        doc = pageDoc('<div class="wrap"><h1>Microsoft Edge</h1><p>版本 126.0.2592.87（正式版本）（64 位）</p><p>内核：' +
          U.escapeHtml((navigator.userAgent.match(/Chrome\/[\d.]+/) || ['Chromium'])[0]) + '</p><p>操作系统：Windows 11 Web 版 26100.1742</p></div>');
        title = '关于';
      } else if (url.startsWith('file:///')) {
        const p = url.replace('file:///', '');
        const content = VFS.readFile(p);
        if (content === null) { doc = errDoc(url, '找不到文件'); title = '无法访问此页面'; }
        else if (/\.(html?|htm)$/i.test(p)) { doc = content; title = VFS.basename(p); }
        else { doc = pageDoc('<div class="wrap"><h1>' + U.escapeHtml(VFS.basename(p)) + '</h1><pre>' + U.escapeHtml(content) + '</pre></div>'); title = VFS.basename(p); }
      } else {
        const host = url.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
        const site = SITES[host];
        if (site) { doc = pageDoc('<div class="wrap">' + site.body + '</div>'); title = site.title; }
        else { doc = errDoc(url, '无法访问此页面'); title = '无法访问此页面'; }
      }

      await U.sleep(180);
      t.frame.srcdoc = doc;
      t.title = title;
      renderTabs(); buildBar();
      pg.style.width = '100%';
      setTimeout(() => { pg.style.opacity = '0'; setTimeout(() => pg.remove(), 320); }, 160);
      sync();
    }

    function errDoc(url, msg) {
      return pageDoc('<div class="wrap" style="text-align:center;padding-top:80px">' +
        '<div style="font-size:64px">🦖</div><h1>' + msg + '</h1>' +
        '<p>无法访问 <b>' + U.escapeHtml(url) + '</b>。此浏览器运行在本地沙盒中，仅可访问内置的演示站点：' +
        Object.keys(SITES).map(s => '<code>' + s + '</code>').join('、') + '。</p></div>');
    }

    function newTabDoc() {
      const links = [
        { n: 'Microsoft', u: 'microsoft.com' }, { n: 'Microsoft Learn', u: 'learn.microsoft.com' },
        { n: '维基百科', u: 'zh.wikipedia.org' }, { n: 'GitHub', u: 'github.com' },
        { n: 'Example', u: 'example.com' }, { n: 'Microsoft Store', u: 'microsoft.com' }
      ];
      return pageDoc(
        '<div style="min-height:100vh;background:linear-gradient(160deg,#0b3b6f,#04182f);color:#fff;display:flex;flex-direction:column;align-items:center;padding-top:14vh">' +
        '<div style="font-size:15px;opacity:.85;margin-bottom:18px">' + U.fmtDateLong() + '</div>' +
        '<div class="sbar" style="width:min(560px,80vw);background:rgba(255,255,255,.95);color:#333">🔍 <span style="color:#666">在此搜索网页</span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(6,84px);gap:14px;margin-top:36px">' +
        links.map(l => '<div style="display:flex;flex-direction:column;align-items:center;gap:8px">' +
          '<div style="width:52px;height:52px;border-radius:12px;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:20px">🌐</div>' +
          '<div style="font-size:12px;opacity:.9;text-align:center">' + l.n + '</div></div>').join('') +
        '</div>' +
        '<div style="margin-top:48px;width:min(760px,86vw)"><div style="font-size:13px;opacity:.8;margin-bottom:10px">今日热点</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        ['Windows 11 新功能一览', '如何用纯前端复刻操作系统桌面', 'Fluent Design 的五个要素', '开发者最爱的终端配置'].map(h =>
          '<div style="background:rgba(255,255,255,.1);border-radius:10px;padding:14px;font-size:14px">' + h + '</div>').join('') +
        '</div></div></div>');
    }

    /* 键盘 */
    win.body.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 't') { e.preventDefault(); addTab(HOME); sync(); buildBar(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'w') { e.preventDefault(); closeTab(state.active); }
      if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); const i = bar.querySelector('.eg-omni input'); i && i.focus(); }
      if (e.key === 'F5') { e.preventDefault(); navigate(cur().url, true); }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });

    /* 初始 */
    let start = HOME;
    if (args) {
      if (args.query) start = 'edge://search?q=' + encodeURIComponent(args.query);
      else if (args.url) start = resolveInput(args.url);
      else if (args.path) start = 'file:///' + args.path;
    }
    addTab(start);
    sync(); buildBar();
  }

  Apps.register({
    id: 'edge', name: 'Microsoft Edge', icon: 'edge', category: '网络',
    size: { w: 1180, h: 740 }, minSize: { w: 560, h: 380 }, mount, sortKey: 'Microsoft Edge'
  });
})(window);
