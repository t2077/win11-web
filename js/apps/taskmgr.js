/* ============================================================
   taskmgr.js — 任务管理器（进程 / 性能实时图表 / 启动 / 服务）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('taskmgr', `
  .tk-root { display:flex; height:100%; min-height:0; }
  .tk-nav { width:200px; flex:none; padding:8px 4px 8px 8px; display:flex; flex-direction:column; gap:2px; }
  .tk-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column;
    background: var(--bg-solid); border-top-left-radius:8px; box-shadow: inset 1px 1px 0 var(--stroke-control); }
  [data-theme="dark"] .tk-main { background: rgba(255,255,255,.025); }
  .tk-head { flex:none; display:flex; align-items:center; gap:10px; padding:14px 20px 10px; }
  .tk-title { font-family:var(--font-display); font-size:var(--fs-subtitle); font-weight:600; }
  .tk-table { flex:1 1 auto; min-height:0; overflow:auto; padding:0 12px 12px; }
  .tk-thead, .tk-trow { display:grid; grid-template-columns: 2.4fr .8fr .9fr .9fr .8fr .8fr; align-items:center; }
  .tk-thead { position:sticky; top:0; z-index:2; background: var(--bg-solid-3); font-size:var(--fs-caption);
    color:var(--text-secondary); height:30px; border-bottom:1px solid var(--stroke-divider); }
  [data-theme="dark"] .tk-thead { background:#252525; }
  .tk-thead > div, .tk-trow > div { padding:0 8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-thead > div:not(:first-child), .tk-trow > div:not(:first-child) { text-align:right; }
  .tk-trow { height:28px; border-radius:var(--r-sm); font-size:var(--fs-body); cursor:default; }
  .tk-trow:hover { background: var(--fill-subtle-hover); }
  .tk-trow.is-sel { background: var(--fill-accent-subtle); box-shadow: inset 0 0 0 1px var(--fill-accent); }
  .tk-name { display:flex; align-items:center; gap:8px; }
  .tk-heat { border-radius:2px; }
  .tk-perf { flex:1 1 auto; min-height:0; overflow:auto; padding:0 20px 20px; display:flex; gap:16px; }
  .tk-perfnav { width:180px; flex:none; display:flex; flex-direction:column; gap:6px; }
  .tk-perfcard { display:flex; gap:10px; padding:8px; border-radius:var(--r-sm); cursor:default;
    transition: background-color var(--dur-fast) linear; }
  .tk-perfcard:hover { background: var(--fill-subtle-hover); }
  .tk-perfcard.is-sel { background: var(--fill-subtle-sel); box-shadow: inset 2px 0 0 var(--fill-accent); }
  .tk-mini { width:56px; height:34px; flex:none; border-radius:2px; background: var(--fill-control); }
  .tk-perfmain { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; }
  .tk-graph { width:100%; height:260px; border:1px solid var(--stroke-control-2); border-radius:2px; }
  .tk-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px 24px; margin-top:16px; }
  .tk-stat__k { font-size:var(--fs-caption); color:var(--text-secondary); }
  .tk-stat__v { font-family:var(--font-display); font-size:var(--fs-body-lg); }
  .tk-foot { flex:none; display:flex; align-items:center; gap:8px; padding:10px 16px; border-top:1px solid var(--stroke-divider); }
  `);

  const SYS_PROCS = [
    { name: '系统', icon: 'settings', base: 0.4, mem: 132 },
    { name: '系统中断', icon: 'settings', base: 0.6, mem: 0 },
    { name: 'Windows 资源管理器', icon: 'explorer', base: 1.2, mem: 148 },
    { name: '桌面窗口管理器', icon: 'monitor', base: 2.4, mem: 96, ui: true },
    { name: 'Windows 音频设备图形隔离', icon: 'volume', base: 0.2, mem: 22, ui: true },
    { name: '服务主机: 本地系统', icon: 'settings', base: 0.3, mem: 46 },
    { name: '服务主机: 网络服务', icon: 'network', base: 0.2, mem: 28, ui: true },
    { name: 'Antimalware Service Executable', icon: 'shield', base: 1.8, mem: 214, ui: true },
    { name: '注册表', icon: 'settings', base: 0, mem: 12 },
    { name: 'Microsoft 输入法', icon: 'keyboard', base: 0.1, mem: 34, ui: true }
  ];

  function mount(win, args) {
    win.setBodyBg('');
    const root = U.el('div.tk-root');
    const nav = U.el('div.tk-nav');
    const main = U.el('div.tk-main');
    root.append(nav, main);
    win.body.appendChild(root);

    const TABS = [
      { id: 'proc', name: '进程', icon: 'grid' },
      { id: 'perf', name: '性能', icon: 'monitor' },
      { id: 'history', name: '应用历史记录', icon: 'history' },
      { id: 'startup', name: '启动应用', icon: 'power' },
      { id: 'users', name: '用户', icon: 'person' },
      { id: 'details', name: '详细信息', icon: 'list' },
      { id: 'services', name: '服务', icon: 'settings' }
    ];
    let tab = 'proc';
    let sortBy = 'cpu', selected = null;
    let perfSel = 'cpu';
    const series = { cpu: [], mem: [], disk: [], net: [], gpu: [] };
    for (const k in series) for (let i = 0; i < 60; i++) series[k].push(0);

    function buildNav() {
      U.clear(nav);
      TABS.forEach(t => {
        const it = U.el('div.navitem' + (t.id === tab ? '.is-active' : ''), { tabindex: 0 }, [
          U.el('div.navitem__ico', {}, Icons.ui(t.icon, 16)),
          U.el('div.navitem__label', { text: t.name })
        ]);
        it.onclick = () => { tab = t.id; buildNav(); render(); };
        nav.appendChild(it);
      });
      nav.appendChild(U.el('div.spacer'));
      const st = U.el('div.navitem', {}, [U.el('div.navitem__ico', {}, Icons.ui('settings', 16)), U.el('div.navitem__label', { text: '设置' })]);
      st.onclick = () => Apps.launch('settings');
      nav.appendChild(st);
    }

    /* ---------- 数据 ---------- */
    function procs() {
      const list = [];
      WM.windows.filter(w => !w.closing).forEach((w, i) => {
        const d = Apps.get(w.appId) || {};
        list.push({
          key: w.id, name: w.title, app: true, icon: d.icon || 'file',
          cpu: (w === WM.active ? 2.6 : 0.4) + (w._cpu = (w._cpu || 0) * .6 + Math.random() * 1.6),
          mem: 60 + (w.w * w.h) / 9000 + (w._m = (w._m || 0) * .8 + Math.random() * 8),
          disk: Math.random() * 1.2, net: Math.random() * .4, win: w
        });
      });
      SYS_PROCS.forEach(p => {
        list.push({
          key: p.name, name: p.name, icon: p.icon, ui: p.ui,
          cpu: p.base + Math.random() * .8, mem: p.mem + Math.random() * 6,
          disk: Math.random() * .4, net: Math.random() * .2
        });
      });
      const dir = -1;
      list.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh');
        return (b[sortBy] - a[sortBy]) * (dir < 0 ? 1 : -1);
      });
      return list;
    }

    function totals(list) {
      const cpu = U.clamp(list.reduce((s, p) => s + p.cpu, 0), 1, 99);
      const mem = list.reduce((s, p) => s + p.mem, 0) / 1024;
      return { cpu, mem };
    }

    /* ---------- 进程页 ---------- */
    function renderProc() {
      U.clear(main);
      const head = U.el('div.tk-head', {}, [
        U.el('div.tk-title', { text: '进程' }),
        U.el('div.spacer'),
        U.el('div.searchbox-sm', {}, [Icons.ui('search', 14), U.el('input', { placeholder: '搜索进程' })]),
        (() => {
          const b = U.el('button.cmdbtn', { title: '结束任务' }, [Icons.ui('close', 14), U.el('span', { text: '结束任务' })]);
          b.onclick = endTask;
          return b;
        })()
      ]);
      const search = head.querySelector('input');
      const table = U.el('div.tk-table');
      const list = procs();
      const tt = totals(list);

      const cols = [
        ['name', '名称'], ['cpu', Math.round(tt.cpu) + '%\nCPU'], ['mem', tt.mem.toFixed(1) + '/16.0 GB\n内存'],
        ['disk', '2%\n磁盘'], ['net', '0%\n网络'], ['gpu', '1%\nGPU']
      ];
      const thead = U.el('div.tk-thead');
      cols.forEach(([k, label]) => {
        const c = U.el('div', { style: { whiteSpace: 'pre-line', lineHeight: '1.15', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'default' } });
        c.textContent = label;
        c.onclick = () => { sortBy = k; renderProc(); };
        if (sortBy === k) c.style.color = 'var(--text-primary)';
        thead.appendChild(c);
      });
      table.appendChild(thead);

      const heat = (v, max) => {
        const p = U.clamp(v / max, 0, 1);
        if (p < .2) return 'transparent';
        return 'color-mix(in srgb, ' + (p > .7 ? '#e0a030' : '#3b8fd4') + ' ' + Math.round(18 + p * 45) + '%, transparent)';
      };

      const filter = () => (search.value || '').toLowerCase();
      const rows = U.el('div');
      function paint() {
        U.clear(rows);
        list.filter(p => !filter() || p.name.toLowerCase().includes(filter())).forEach(p => {
          const row = U.el('div.tk-trow' + (selected === p.key ? '.is-sel' : ''), { dataset: { key: p.key } }, [
            U.el('div.tk-name', {}, [Icons.app(p.icon, 16), U.el('span.truncate', { text: p.name })]),
            U.el('div', { text: p.cpu.toFixed(1) + '%', style: { background: heat(p.cpu, 20) } }),
            U.el('div', { text: p.mem.toFixed(1) + ' MB', style: { background: heat(p.mem, 300) } }),
            U.el('div', { text: p.disk.toFixed(1) + ' MB/秒' }),
            U.el('div', { text: p.net < .05 ? '0 Mbps' : p.net.toFixed(1) + ' Mbps' }),
            U.el('div', { text: p.app ? (Math.random() * 2).toFixed(1) + '%' : '0%' })
          ]);
          row.onclick = () => { selected = p.key; paint(); };
          row.ondblclick = () => { if (p.win) WM.focus(p.win); };
          row.oncontextmenu = (e) => {
            e.preventDefault(); selected = p.key; paint();
            Menu.show([
              { label: '展开', icon: 'chevronDown', disabled: true },
              { label: '结束任务', icon: 'close', danger: true, onClick: endTask },
              { separator: true },
              { label: '资源值', icon: 'grid', submenu: [{ label: '内存', checked: true }, { label: '磁盘' }, { label: '网络' }] },
              { label: '转到详细信息', icon: 'list', onClick: () => { tab = 'details'; buildNav(); render(); } },
              { label: '打开文件位置', icon: 'folder', onClick: () => Apps.launch('explorer', { path: 'C:\\Windows\\System32' }) },
              { separator: true },
              { label: '属性', icon: 'info', onClick: () => Notifications.toast({ title: p.name, body: 'PID ' + (1000 + (p.name.length * 137) % 8000) + ' · 已启动', icon: 'info' }) }
            ], { x: e.clientX, y: e.clientY });
          };
          rows.appendChild(row);
        });
      }
      search.oninput = paint;
      paint();
      table.appendChild(rows);

      const foot = U.el('div.tk-foot', {}, [
        U.el('span.caption.text-secondary', { text: '进程数：' + list.length }),
        U.el('div.spacer'),
        U.el('span.caption.text-secondary', { text: 'CPU ' + Math.round(tt.cpu) + '%　内存 ' + Math.round(tt.mem / 16 * 100) + '%' })
      ]);
      main.append(head, table, foot);

      function endTask() {
        const p = list.find(x => x.key === selected);
        if (!p) { Notifications.toast({ title: '任务管理器', body: '请先选择要结束的进程。', appIcon: 'taskmgr' }); return; }
        if (p.win) { WM.close(p.win); selected = null; setTimeout(renderProc, 200); return; }
        Notifications.dialog({
          title: '任务管理器', icon: 'warning',
          body: '"' + p.name + '" 是关键的系统进程。结束它可能导致系统不稳定，因此已被阻止。',
          buttons: [{ text: '确定', accent: true }]
        });
      }
    }

    /* ---------- 性能页 ---------- */
    function renderPerf() {
      U.clear(main);
      const head = U.el('div.tk-head', {}, [U.el('div.tk-title', { text: '性能' })]);
      const wrap = U.el('div.tk-perf');
      const pnav = U.el('div.tk-perfnav');
      const pmain = U.el('div.tk-perfmain');
      wrap.append(pnav, pmain);
      main.append(head, wrap);

      const METRICS = [
        { id: 'cpu', name: 'CPU', color: '#3b8fd4', unit: '%', max: 100 },
        { id: 'mem', name: '内存', color: '#8b5cf6', unit: '%', max: 100 },
        { id: 'disk', name: '磁盘 0 (C: D:)', color: '#22a06b', unit: '%', max: 100 },
        { id: 'net', name: 'WLAN', color: '#e0a030', unit: 'Kbps', max: 100 },
        { id: 'gpu', name: 'GPU 0', color: '#e05555', unit: '%', max: 100 }
      ];

      METRICS.forEach(m => {
        const cur = series[m.id][series[m.id].length - 1] || 0;
        const card = U.el('div.tk-perfcard' + (perfSel === m.id ? '.is-sel' : ''), {}, [
          (() => { const c = U.el('canvas.tk-mini', { width: 112, height: 68 }); drawGraph(c, series[m.id], m.color, true); return c; })(),
          U.el('div', {}, [
            U.el('div', { text: m.name, style: { fontSize: 'var(--fs-body)' } }),
            U.el('div.caption.text-secondary', { text: Math.round(cur) + (m.unit === '%' ? '%' : ' ' + m.unit) })
          ])
        ]);
        card.onclick = () => { perfSel = m.id; renderPerf(); };
        pnav.appendChild(card);
      });

      const m = METRICS.find(x => x.id === perfSel) || METRICS[0];
      pmain.appendChild(U.el('div', { text: m.name, style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-subtitle)', fontWeight: 600, marginBottom: '4px' } }));
      pmain.appendChild(U.el('div.caption.text-secondary', {
        text: m.id === 'cpu' ? 'Web Virtual CPU @ ' + (navigator.hardwareConcurrency || 8) + ' 核心' :
          m.id === 'mem' ? ((navigator.deviceMemory || 16) + ' GB DDR5') :
            m.id === 'disk' ? 'Virtual NVMe SSD 512 GB' : m.id === 'net' ? 'DeepSeek-5G · 802.11ax' : 'Virtual Adapter WebGL'
      }));
      const big = U.el('canvas.tk-graph', { width: 900, height: 260 });
      pmain.appendChild(big);
      drawGraph(big, series[m.id], m.color, false, m.name);

      const st = U.el('div.tk-stats');
      const stats = m.id === 'cpu' ? [
        ['利用率', Math.round(series.cpu[59]) + '%'], ['速度', (2.4 + Math.random() * .6).toFixed(2) + ' GHz'],
        ['进程', String(WM.windows.length + SYS_PROCS.length)], ['线程', String(1400 + WM.windows.length * 37)],
        ['句柄', String(48000 + WM.windows.length * 210)], ['正常运行时间', uptime()]
      ] : m.id === 'mem' ? [
        ['使用中（已压缩）', (series.mem[59] / 100 * 16).toFixed(1) + ' GB'], ['可用', (16 - series.mem[59] / 100 * 16).toFixed(1) + ' GB'],
        ['已提交', (series.mem[59] / 100 * 16 + 2).toFixed(1) + '/18.4 GB'], ['已缓存', '4.2 GB'],
        ['分页缓冲池', '682 MB'], ['非分页缓冲池', '410 MB']
      ] : m.id === 'disk' ? [
        ['活动时间', Math.round(series.disk[59]) + '%'], ['平均响应时间', (Math.random() * 2).toFixed(1) + ' 毫秒'],
        ['读取速度', (Math.random() * 4).toFixed(1) + ' MB/秒'], ['写入速度', (Math.random() * 2).toFixed(1) + ' MB/秒'],
        ['容量', '512 GB'], ['已格式化', '476 GB']
      ] : m.id === 'net' ? [
        ['发送', (Math.random() * 80).toFixed(0) + ' Kbps'], ['接收', (Math.random() * 400).toFixed(0) + ' Kbps'],
        ['适配器名称', 'WLAN'], ['连接类型', Settings.wifi ? 'Wi-Fi 6E' : '未连接'],
        ['IPv4 地址', '192.168.1.42'], ['信号强度', '优秀']
      ] : [
        ['3D 利用率', Math.round(series.gpu[59]) + '%'], ['专用 GPU 内存', '1.2/8.0 GB'],
        ['共享 GPU 内存', '0.4/8.0 GB'], ['驱动程序版本', '31.0.15.4675'],
        ['驱动程序日期', '2025-03-18'], ['DirectX 版本', '12 (FL 12.1)']
      ];
      stats.forEach(([k, v]) => st.appendChild(U.el('div', {}, [U.el('div.tk-stat__k', { text: k }), U.el('div.tk-stat__v', { text: v })])));
      pmain.appendChild(st);
    }

    function uptime() {
      const s = Math.floor((Date.now() - (window.__bootTime || (window.__bootTime = Date.now()))) / 1000) + 3600 * 5 + 1420;
      const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), mi = Math.floor(s % 3600 / 60), se = s % 60;
      return d + ':' + U.pad(h) + ':' + U.pad(mi) + ':' + U.pad(se);
    }

    function drawGraph(canvas, data, color, mini, label) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const dark = Settings.theme === 'dark';
      /* 网格 */
      if (!mini) {
        ctx.strokeStyle = dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
          ctx.beginPath(); ctx.moveTo(i * w / 10, 0); ctx.lineTo(i * w / 10, h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i * h / 10); ctx.lineTo(w, i * h / 10); ctx.stroke();
        }
      }
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, color + (mini ? '55' : '66'));
      grad.addColorStop(1, color + '08');
      ctx.beginPath();
      ctx.moveTo(0, h);
      data.forEach((v, i) => {
        const x = i / (data.length - 1) * w;
        const y = h - (U.clamp(v, 0, 100) / 100) * (h - 2) - 1;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = i / (data.length - 1) * w;
        const y = h - (U.clamp(v, 0, 100) / 100) * (h - 2) - 1;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = color; ctx.lineWidth = mini ? 1 : 1.6; ctx.stroke();
      if (!mini) {
        ctx.fillStyle = dark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('100%', 6, 14);
        ctx.fillText('60 秒', 6, h - 6);
        ctx.textAlign = 'right';
        ctx.fillText('0', w - 6, h - 6);
        ctx.textAlign = 'left';
      }
    }

    function renderSimple(title, rows, cols) {
      U.clear(main);
      main.appendChild(U.el('div.tk-head', {}, [U.el('div.tk-title', { text: title })]));
      const table = U.el('div.tk-table');
      const gt = cols.map(() => '1fr').join(' ');
      table.appendChild(U.el('div.tk-thead', { style: { gridTemplateColumns: gt } }, cols.map(c => U.el('div', { text: c }))));
      rows.forEach(r => {
        table.appendChild(U.el('div.tk-trow', { style: { gridTemplateColumns: gt } },
          r.map((v, i) => i === 0
            ? U.el('div.tk-name', {}, [Icons.app(r.icon || 'file', 16), U.el('span.truncate', { text: v })])
            : U.el('div', { text: v }))));
      });
      main.appendChild(table);
    }

    function render() {
      if (tab === 'proc') renderProc();
      else if (tab === 'perf') renderPerf();
      else if (tab === 'history') {
        const rows = Apps.all().slice(0, 10).map(a => { const r = [a.name, (Math.random() * 12).toFixed(1) + ' 小时', (Math.random() * 200).toFixed(1) + ' MB', (Math.random() * 30).toFixed(1) + ' MB']; r.icon = a.icon; return r; });
        renderSimple('应用历史记录', rows, ['名称', 'CPU 时间', '网络', '磁贴更新']);
      }
      else if (tab === 'startup') {
        const rows = [['Microsoft Edge', '已启用', '中'], ['OneDrive', '已启用', '低'], ['Windows 安全通知图标', '已启用', '低'], ['Microsoft Teams', '已禁用', '高']]
          .map((r, i) => { r.icon = ['edge', 'onedrive', 'shield', 'mail'][i]; return r; });
        renderSimple('启动应用', rows, ['名称', '状态', '启动影响']);
      }
      else if (tab === 'users') {
        const rows = [[Settings.userName, Math.round(totals(procs()).cpu) + '%', (totals(procs()).mem).toFixed(1) + ' GB', '2%', '0%']];
        rows[0].icon = 'user';
        renderSimple('用户', rows, ['用户', 'CPU', '内存', '磁盘', '网络']);
      }
      else if (tab === 'details') {
        const rows = procs().map(p => { const r = [p.name, String(1000 + (p.name.length * 137) % 8000), '正在运行', Settings.userName, p.cpu.toFixed(0) + '%', Math.round(p.mem * 1024).toLocaleString('en-US') + ' K']; r.icon = p.icon; return r; });
        renderSimple('详细信息', rows, ['名称', 'PID', '状态', '用户名', 'CPU', '内存']);
      }
      else if (tab === 'services') {
        const rows = [['AudioSrv', '正在运行', 'Windows Audio'], ['BFE', '正在运行', 'Base Filtering Engine'],
        ['Dhcp', '正在运行', 'DHCP Client'], ['Dnscache', '正在运行', 'DNS Client'],
        ['Spooler', '已停止', 'Print Spooler'], ['WSearch', '正在运行', 'Windows Search']]
          .map(r => { r.icon = 'settings'; return r; });
        renderSimple('服务', rows, ['名称', '状态', '描述']);
      }
    }

    /* ---------- 实时数据 ---------- */
    const tick = () => {
      const list = procs();
      const tt = totals(list);
      const push = (k, v) => { series[k].push(v); if (series[k].length > 60) series[k].shift(); };
      push('cpu', U.clamp(tt.cpu + (Math.random() - .5) * 6, 2, 96));
      push('mem', U.clamp(tt.mem / 16 * 100 + 18 + (Math.random() - .5) * 3, 10, 92));
      push('disk', U.clamp(Math.random() * 22 + (WM.windows.length ? 4 : 0), 0, 100));
      push('net', U.clamp(Settings.wifi ? Math.random() * 34 : 0, 0, 100));
      push('gpu', U.clamp(Math.random() * 12 + WM.windows.length * 2, 0, 100));
      if (tab === 'perf') renderPerf();
      else if (tab === 'proc') renderProc();
    };
    for (let i = 0; i < 60; i++) {
      series.cpu[i] = U.clamp(12 + Math.random() * 18, 0, 100);
      series.mem[i] = U.clamp(38 + Math.random() * 6, 0, 100);
      series.disk[i] = Math.random() * 15;
      series.net[i] = Math.random() * 20;
      series.gpu[i] = Math.random() * 10;
    }

    const timer = setInterval(tick, 1500);
    win.on('close', () => clearInterval(timer));

    buildNav(); render();
  }

  Apps.register({
    id: 'taskmgr', name: '任务管理器', icon: 'taskmgr', category: 'Windows 工具',
    size: { w: 1080, h: 700 }, minSize: { w: 620, h: 420 },
    singleton: true, mount, sortKey: 'renwu'
  });
})(window);
