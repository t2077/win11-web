/* ============================================================
   terminal.js — Windows 终端（PowerShell 风格，含标签页与真实命令）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('terminal', `
  .tm-root { display:flex; flex-direction:column; height:100%; min-height:0; }
  .tm-view { flex:1 1 auto; min-height:0; overflow-y:auto; padding:10px 14px;
    font-family: var(--font-mono); font-size:13px; line-height:1.5; color:#ccc; user-select:text; }
  .tm-line { white-space:pre-wrap; word-break:break-all; }
  .tm-prompt { display:flex; flex-wrap:wrap; }
  .tm-ps { color:#61d6d6; }
  .tm-path { color:#e8e8b0; }
  .tm-in { flex:1; min-width:120px; background:transparent; border:0; outline:0; color:#f0f0f0;
    font-family: var(--font-mono); font-size:13px; user-select:text; caret-color:#f0f0f0; }
  .tm-err { color:#ff8a8a; }
  .tm-warn { color:#f5d67b; }
  .tm-ok { color:#9ae59a; }
  .tm-dim { color:#8a8a8a; }
  .tm-acc { color:#6fb8ff; }
  .tm-title { color:#fff; }
  .tm-admin { color:#ffb86c; }
  `);

  const BANNER = (admin) => [
    'Windows PowerShell',
    '版权所有（C）Microsoft Corporation。保留所有权利。',
    '',
    '尝试新的跨平台 PowerShell https://aka.ms/pscore6',
    admin ? '\u001b管理员权限已启用。' : '',
    ''
  ].filter(x => x !== '');

  function mount(win, args) {
    win.setChromeHeight(40);
    win.setBodyBg('dark');
    win.setMica('none');
    const tabstrip = U.el('div.tabstrip');
    win.headArea.appendChild(tabstrip);

    const state = { tabs: [], active: 0 };
    const root = U.el('div.tm-root');
    win.body.appendChild(root);
    win.body.style.background = '#0c0c0c';

    const cur = () => state.tabs[state.active];

    function addTab(cwd, admin) {
      const t = {
        id: U.uid('tt'), cwd: cwd || VFS.home(), admin: !!admin,
        view: U.el('div.tm-view'), hist: [], hi: -1, name: admin ? '管理员: PowerShell' : 'PowerShell'
      };
      state.tabs.push(t);
      state.active = state.tabs.length - 1;
      root.appendChild(t.view);
      BANNER(t.admin).forEach(l => print(t, l, l.startsWith('\u001b') ? 'tm-admin' : 'tm-dim'));
      newPrompt(t);
      renderTabs();
      return t;
    }

    function renderTabs() {
      U.clear(tabstrip);
      state.tabs.forEach((t, i) => {
        const tab = U.el('div.wtab' + (i === state.active ? '.is-active' : ''), { title: t.name }, [
          Icons.app('terminal', 14),
          U.el('div.wtab__label', { text: t.name }),
          U.el('button.wtab__x', { title: '关闭' }, Icons.ui('close', 10))
        ]);
        tab.onclick = (e) => {
          if (e.target.closest('.wtab__x')) return;
          state.active = i; syncViews(); renderTabs();
        };
        tab.querySelector('.wtab__x').onclick = (e) => { e.stopPropagation(); closeTab(i); };
        tabstrip.appendChild(tab);
      });
      const add = U.el('button.wtab-add', { title: '新建标签页' }, Icons.ui('plus', 14));
      add.onclick = (e) => {
        if (e.shiftKey) return addTab(VFS.home(), true), syncViews();
        addTab(cur() ? cur().cwd : VFS.home()); syncViews();
      };
      add.oncontextmenu = (e) => {
        e.preventDefault();
        Menu.show([
          { label: 'PowerShell', appIcon: 'terminal', onClick: () => { addTab(VFS.home()); syncViews(); } },
          { label: '命令提示符', appIcon: 'terminal', onClick: () => { addTab(VFS.home()); syncViews(); } },
          { label: 'PowerShell（管理员）', icon: 'shield', onClick: () => { addTab(VFS.home(), true); syncViews(); } },
          { separator: true },
          { label: '设置', icon: 'settings', onClick: () => Notifications.toast({ title: '终端设置', body: '外观设置在此版本中为演示。', appIcon: 'terminal' }) }
        ], { anchor: add, align: 'bottom-right' });
      };
      tabstrip.appendChild(add);
      win.setTitle((cur() ? cur().name : 'PowerShell') + ' — 终端');
    }
    function closeTab(i) {
      if (state.tabs.length <= 1) { win.close(); return; }
      state.tabs[i].view.remove();
      state.tabs.splice(i, 1);
      state.active = U.clamp(state.active > i ? state.active - 1 : state.active, 0, state.tabs.length - 1);
      syncViews(); renderTabs();
    }
    function syncViews() {
      state.tabs.forEach((t, i) => { t.view.hidden = i !== state.active; });
      const t = cur();
      if (t) { const inp = t.view.querySelector('.tm-in'); inp && inp.focus(); }
    }

    function print(t, text, cls) {
      const line = U.el('div.tm-line' + (cls ? '.' + cls : ''), { text: String(text).replace(/^\u001b/, '') });
      t.view.appendChild(line);
      t.view.scrollTop = t.view.scrollHeight;
      return line;
    }
    function printHtml(t, html) {
      const line = U.el('div.tm-line', { html });
      t.view.appendChild(line);
      t.view.scrollTop = t.view.scrollHeight;
    }

    function newPrompt(t) {
      const row = U.el('div.tm-line.tm-prompt');
      row.append(
        U.el('span.tm-ps', { text: t.admin ? 'PS(管理员) ' : 'PS ' }),
        U.el('span.tm-path', { text: t.cwd }),
        U.el('span.tm-ps', { text: '> ' })
      );
      const inp = U.el('input.tm-in', { spellcheck: 'false', autocomplete: 'off' });
      row.appendChild(inp);
      t.view.appendChild(row);
      t.view.scrollTop = t.view.scrollHeight;
      inp.focus();
      inp.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const cmd = inp.value;
          inp.disabled = true;
          inp.replaceWith(U.el('span', { text: cmd, style: { color: '#f0f0f0' } }));
          if (cmd.trim()) { t.hist.push(cmd); t.hi = t.hist.length; }
          run(t, cmd.trim());
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (t.hi > 0) { t.hi--; inp.value = t.hist[t.hi]; }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (t.hi < t.hist.length - 1) { t.hi++; inp.value = t.hist[t.hi]; }
          else { t.hi = t.hist.length; inp.value = ''; }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const parts = inp.value.split(' ');
          const frag = parts[parts.length - 1];
          const cands = VFS.list(t.cwd).map(x => x.name).filter(n => n.toLowerCase().startsWith(frag.toLowerCase()));
          if (cands.length === 1) { parts[parts.length - 1] = cands[0].includes(' ') ? '"' + cands[0] + '"' : cands[0]; inp.value = parts.join(' '); }
          else if (cands.length > 1) { print(t, cands.join('   '), 'tm-dim'); }
        } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
          print(t, '^C', 'tm-warn');
        } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
          e.preventDefault(); U.clear(t.view); newPrompt(t);
        }
        Sound.key();
      };
    }

    function resolve(t, p) {
      if (!p) return t.cwd;
      p = p.replace(/^"|"$/g, '');
      if (/^[a-zA-Z]:/.test(p)) return VFS.normalize(p);
      if (p === '..') return VFS.parent(t.cwd) || t.cwd;
      if (p === '.') return t.cwd;
      if (p === '~') return VFS.home();
      if (p === '\\' || p === '/') return VFS.split(t.cwd)[0] || 'C:';
      return VFS.join(t.cwd, p);
    }

    async function run(t, line) {
      const argv = (line.match(/"[^"]*"|\S+/g) || []).map(s => s.replace(/^"|"$/g, ''));
      const cmd = (argv[0] || '').toLowerCase();
      const rest = argv.slice(1);
      const arg = rest.join(' ');

      const CMDS = {
        '': () => { },
        help: () => {
          print(t, '可用命令：', 'tm-title');
          const rows = [
            ['dir / ls', '列出目录内容'], ['cd <路径>', '切换目录'], ['pwd', '显示当前目录'],
            ['type / cat <文件>', '显示文件内容'], ['echo <文本>', '输出文本'], ['echo 文本 > 文件', '写入文件'],
            ['mkdir <名称>', '新建目录'], ['ni / touch <名称>', '新建文件'], ['del / rm <名称>', '删除'],
            ['copy <源> <目标>', '复制'], ['move <源> <目标>', '移动'], ['ren <旧> <新>', '重命名'],
            ['tree', '树状显示目录'], ['cls / clear', '清屏'], ['whoami', '当前用户'],
            ['hostname', '计算机名'], ['ver / winver', '系统版本'], ['date / time', '日期时间'],
            ['ipconfig', '网络配置'], ['systeminfo', '系统信息'], ['tasklist', '运行中的进程'],
            ['ping <主机>', '测试连通性'], ['start <应用>', '启动应用'], ['notepad / calc / explorer', '打开应用'],
            ['history', '命令历史'], ['color <主题>', '切换配色'], ['title <文本>', '设置标签标题'],
            ['exit', '关闭标签页']
          ];
          rows.forEach(([c, d]) => printHtml(t, '  <span class="tm-acc">' + U.escapeHtml(c.padEnd(24)) + '</span><span class="tm-dim">' + U.escapeHtml(d) + '</span>'));
        },
        dir: () => {
          const p = resolve(t, rest[0]);
          if (!VFS.isDir(p)) { print(t, 'dir : 找不到路径 "' + p + '"。', 'tm-err'); return; }
          const list = VFS.list(p);
          print(t, '');
          print(t, '    目录: ' + p, 'tm-title');
          print(t, '');
          printHtml(t, '<span class="tm-dim">Mode                 LastWriteTime         Length Name</span>');
          printHtml(t, '<span class="tm-dim">----                 -------------         ------ ----</span>');
          list.forEach(e => {
            const mode = e.type === 'dir' ? 'd-----' : '-a----';
            const dt = U.fmtDateFile(new Date(e.modified || Date.now()));
            const len = e.type === 'dir' ? '' : String(e.size || 0);
            printHtml(t, mode.padEnd(21) + U.escapeHtml(dt).padEnd(22) + len.padStart(10) + ' ' +
              '<span class="' + (e.type === 'dir' ? 'tm-acc' : '') + '">' + U.escapeHtml(e.name) + '</span>');
          });
          print(t, '');
        },
        cd: () => {
          if (!rest[0]) { print(t, t.cwd); return; }
          const p = resolve(t, rest[0]);
          if (VFS.isDir(p)) t.cwd = VFS.realPath(p) || p;
          else print(t, 'cd : 找不到路径 "' + p + '"，因为该路径不存在。', 'tm-err');
        },
        pwd: () => print(t, t.cwd),
        type: () => {
          const p = resolve(t, rest[0]);
          const c = VFS.readFile(p);
          if (c === null) print(t, 'type : 找不到文件 "' + p + '"。', 'tm-err');
          else if (!c) print(t, '（空文件）', 'tm-dim');
          else c.split(/\r?\n/).forEach(l => print(t, l));
        },
        echo: () => {
          const m = line.match(/^echo\s+([\s\S]*?)\s*(>>?)\s*(\S+)\s*$/i);
          if (m) {
            const p = resolve(t, m[3]);
            const text = m[1].replace(/^"|"$/g, '');
            const old = m[2] === '>>' ? (VFS.readFile(p) || '') : '';
            if (VFS.exists(p)) VFS.writeFile(p, old + (old ? '\r\n' : '') + text);
            else VFS.createFile(VFS.parent(p) || t.cwd, VFS.basename(p), text);
            print(t, '', '');
            return;
          }
          print(t, arg.replace(/^"|"$/g, ''));
        },
        mkdir: () => {
          if (!rest[0]) { print(t, 'mkdir : 缺少参数。', 'tm-err'); return; }
          const p = VFS.mkdir(t.cwd, rest[0]);
          print(t, '已创建目录: ' + p, 'tm-ok');
        },
        ni: () => {
          if (!rest[0]) { print(t, 'ni : 缺少参数。', 'tm-err'); return; }
          const p = VFS.createFile(t.cwd, rest[0], '');
          print(t, '已创建文件: ' + p, 'tm-ok');
        },
        del: () => {
          const p = resolve(t, rest[0]);
          if (!VFS.exists(p)) { print(t, 'del : 找不到 "' + p + '"。', 'tm-err'); return; }
          VFS.remove(p);
          print(t, '已移动到回收站: ' + p, 'tm-ok');
        },
        copy: () => {
          const s = resolve(t, rest[0]), d = resolve(t, rest[1]);
          if (!VFS.exists(s)) { print(t, 'copy : 找不到源文件。', 'tm-err'); return; }
          const dest = VFS.isDir(d) ? d : VFS.parent(d) || t.cwd;
          print(t, '已复制到: ' + VFS.copy(s, dest), 'tm-ok');
        },
        move: () => {
          const s = resolve(t, rest[0]), d = resolve(t, rest[1]);
          if (!VFS.exists(s)) { print(t, 'move : 找不到源文件。', 'tm-err'); return; }
          const dest = VFS.isDir(d) ? d : VFS.parent(d) || t.cwd;
          print(t, '已移动到: ' + VFS.copy(s, dest, true), 'tm-ok');
        },
        ren: () => {
          const s = resolve(t, rest[0]);
          if (!VFS.exists(s) || !rest[1]) { print(t, 'ren : 参数无效。', 'tm-err'); return; }
          VFS.rename(s, rest[1]);
          print(t, '已重命名。', 'tm-ok');
        },
        tree: () => {
          const walk = (p, prefix, depth) => {
            if (depth > 3) return;
            const list = VFS.list(p);
            list.forEach((e, i) => {
              const last = i === list.length - 1;
              printHtml(t, '<span class="tm-dim">' + prefix + (last ? '└── ' : '├── ') + '</span>' +
                '<span class="' + (e.type === 'dir' ? 'tm-acc' : '') + '">' + U.escapeHtml(e.name) + '</span>');
              if (e.type === 'dir') walk(e.path, prefix + (last ? '    ' : '│   '), depth + 1);
            });
          };
          print(t, t.cwd, 'tm-title');
          walk(t.cwd, '', 0);
        },
        cls: () => { U.clear(t.view); },
        whoami: () => print(t, Settings.pcName.toLowerCase() + '\\' + Settings.userName.toLowerCase()),
        hostname: () => print(t, Settings.pcName),
        ver: () => print(t, 'Microsoft Windows [版本 10.0.26100.1742]'),
        date: () => print(t, U.fmtDateLong()),
        time: () => print(t, U.fmtTime(new Date(), true)),
        ipconfig: () => {
          print(t, '');
          print(t, 'Windows IP 配置', 'tm-title'); print(t, '');
          print(t, '无线局域网适配器 WLAN:', 'tm-acc');
          print(t, '   连接特定的 DNS 后缀 . . . . . . . : lan');
          print(t, '   IPv6 地址 . . . . . . . . . . . . : ' + (Settings.wifi ? 'fe80::a1b2:c3d4:e5f6:7a8b%12' : '媒体已断开'));
          print(t, '   IPv4 地址 . . . . . . . . . . . . : ' + (Settings.wifi ? '192.168.1.42' : '—'));
          print(t, '   子网掩码  . . . . . . . . . . . . : 255.255.255.0');
          print(t, '   默认网关. . . . . . . . . . . . . : 192.168.1.1');
          print(t, '');
        },
        systeminfo: () => {
          const rows = [
            ['主机名', Settings.pcName], ['OS 名称', 'Microsoft Windows 11 专业版'],
            ['OS 版本', '10.0.26100 暂缺 Build 26100'], ['系统制造商', 'Web Virtual Systems'],
            ['系统型号', 'Browser Virtual Machine'], ['系统类型', 'x64-based PC'],
            ['处理器', (navigator.hardwareConcurrency || 8) + ' 个逻辑处理器'],
            ['物理内存总量', ((navigator.deviceMemory || 16) * 1024) + ' MB'],
            ['区域设置', 'zh-cn；中文（中国）'], ['时区', '(UTC+08:00) 北京'],
            ['登录服务器', '\\\\' + Settings.pcName]
          ];
          print(t, '');
          rows.forEach(([k, v]) => printHtml(t, '<span class="tm-dim">' + U.escapeHtml((k + ':').padEnd(26)) + '</span>' + U.escapeHtml(v)));
          print(t, '');
        },
        tasklist: () => {
          printHtml(t, '<span class="tm-dim">映像名称                     PID 会话名              内存使用</span>');
          printHtml(t, '<span class="tm-dim">========================= ====== ================ ============</span>');
          const rows = [['System', 4], ['explorer.exe', 3412], ['dwm.exe', 1180]];
          WM.windows.forEach((w, i) => rows.push([(Apps.get(w.appId) || {}).id + '.exe', 5000 + i * 37]));
          rows.forEach(([n, pid]) => printHtml(t, U.escapeHtml(String(n).padEnd(26)) + String(pid).padStart(6) + ' Console' + '            ' + (U.randInt(4, 220) * 1024).toLocaleString('en-US').padStart(10) + ' K'));
        },
        ping: async () => {
          const host = rest[0] || 'localhost';
          print(t, '');
          print(t, '正在 Ping ' + host + ' [' + U.randInt(1, 254) + '.' + U.randInt(1, 254) + '.' + U.randInt(1, 254) + '.' + U.randInt(1, 254) + '] 具有 32 字节的数据:');
          for (let i = 0; i < 4; i++) {
            await U.sleep(420);
            if (!Settings.wifi && !Settings.airplane) { print(t, '请求超时。', 'tm-warn'); continue; }
            if (Settings.airplane) { print(t, 'PING: 传输失败。常见故障。', 'tm-err'); continue; }
            print(t, '来自 ' + host + ' 的回复: 字节=32 时间=' + U.randInt(6, 42) + 'ms TTL=56');
          }
          print(t, '');
        },
        start: () => {
          const target = rest[0] || '';
          if (Apps.has(target)) { Apps.launch(target); print(t, '已启动 ' + target, 'tm-ok'); }
          else if (VFS.exists(resolve(t, target))) { Apps.open(resolve(t, target)); }
          else Shell.runCommand(target);
        },
        history: () => t.hist.forEach((h, i) => printHtml(t, '<span class="tm-dim">' + String(i + 1).padStart(4) + '  </span>' + U.escapeHtml(h))),
        color: () => {
          const map = { '0': '#0c0c0c', '1': '#0b2e5c', '2': '#0c2a12', '4': '#3a0d0d', '7': '#1e1e1e' };
          const bg = map[rest[0]] || '#0c0c0c';
          win.body.style.background = bg;
          print(t, '已设置背景色。', 'tm-ok');
        },
        title: () => { t.name = arg || 'PowerShell'; renderTabs(); },
        exit: () => { closeTab(state.active); return true; },
        cat: null, ls: null, clear: null, rm: null, touch: null, winver: null, md: null
      };
      CMDS.cat = CMDS.type; CMDS.ls = CMDS.dir; CMDS.clear = CMDS.cls;
      CMDS.rm = CMDS.del; CMDS.touch = CMDS.ni; CMDS.md = CMDS.mkdir;
      CMDS.winver = () => Shell.winver();
      ['notepad', 'calc', 'mspaint', 'explorer', 'msedge', 'taskmgr', 'control'].forEach(k => {
        CMDS[k] = () => { Shell.runCommand(k); print(t, '已启动 ' + k, 'tm-ok'); };
      });

      const fn = CMDS[cmd];
      if (fn === undefined) {
        printHtml(t, '<span class="tm-err">' + U.escapeHtml(argv[0]) + ' : 无法将 "' + U.escapeHtml(argv[0]) +
          '" 项识别为 cmdlet、函数、脚本文件或可运行程序的名称。请检查名称的拼写，如果包括路径，请确保路径正确，然后再试一次。</span>');
        printHtml(t, '<span class="tm-dim">所在位置 行:1 字符: 1</span>');
        printHtml(t, '<span class="tm-dim">+ ' + U.escapeHtml(line) + '</span>');
        printHtml(t, '<span class="tm-dim">    + CategoryInfo          : ObjectNotFound: (' + U.escapeHtml(argv[0]) + ':String) []，CommandNotFoundException</span>');
        Sound.error();
      } else if (fn) {
        try { const r = fn(); if (r && r.then) await r; if (r === true) return; }
        catch (err) { print(t, String(err && err.message || err), 'tm-err'); }
      }
      if (t.view.isConnected) newPrompt(t);
    }

    /* 右键菜单：粘贴 */
    win.body.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      Menu.show([
        { label: '复制', icon: 'copy', accel: 'Ctrl+Shift+C', onClick: () => U.copyText(String(window.getSelection())) },
        {
          label: '粘贴', icon: 'paste', accel: 'Ctrl+Shift+V', onClick: async () => {
            const txt = await U.readText();
            const inp = cur().view.querySelector('.tm-in');
            if (inp) { inp.value += txt; inp.focus(); }
          }
        },
        { separator: true },
        { label: '清屏', icon: 'refresh', onClick: () => { U.clear(cur().view); newPrompt(cur()); } },
        { label: '新建标签页', icon: 'plus', onClick: () => { addTab(cur().cwd); syncViews(); } },
        { separator: true },
        { label: '关闭', icon: 'close', onClick: () => win.close() }
      ], { x: e.clientX, y: e.clientY });
    });
    win.body.addEventListener('pointerdown', (e) => {
      if (window.getSelection() && String(window.getSelection())) return;
      const inp = cur() && cur().view.querySelector('.tm-in');
      if (inp) setTimeout(() => inp.focus(), 0);
    });

    addTab(args && args.cwd, args && args.admin);
    syncViews();
  }

  Apps.register({
    id: 'terminal', name: '终端', icon: 'terminal', category: 'Windows 工具',
    size: { w: 960, h: 620 }, minSize: { w: 480, h: 300 }, mount, sortKey: 'zhongduan'
  });
})(window);
