/* ============================================================
   misc.js — 其余应用：邮件 / 截图工具 / 待办事项 / Xbox / 天气 / 写字板
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('misc', `
  .mx-3pane { display:flex; height:100%; min-height:0; }
  .mx-list { width:320px; flex:none; border-right:1px solid var(--stroke-divider); display:flex; flex-direction:column; }
  .mx-read { flex:1 1 auto; min-width:0; display:flex; flex-direction:column;
    background: var(--bg-solid); box-shadow: inset 1px 0 0 var(--stroke-control); }
  [data-theme="dark"] .mx-read { background: rgba(255,255,255,.025); }
  .mx-mail { display:flex; gap:10px; padding:12px 14px; border-bottom:1px solid var(--stroke-divider); cursor:default;
    transition: background-color var(--dur-fast) linear; }
  .mx-mail:hover { background: var(--fill-subtle-hover); }
  .mx-mail.is-sel { background: var(--fill-accent-subtle); box-shadow: inset 3px 0 0 var(--fill-accent); }
  .mx-mail.is-unread .mx-mail__f { font-weight:600; }
  .mx-mail__av { width:32px; height:32px; border-radius:50%; flex:none; display:grid; place-items:center;
    color:#fff; font-size:13px; font-weight:600; }
  .mx-mail__f { font-size:var(--fs-body); }
  .mx-mail__s { font-size:var(--fs-caption); color:var(--text-secondary); }
  .mx-mail__p { font-size:var(--fs-caption); color:var(--text-tertiary);
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .mx-body { flex:1; overflow:auto; padding:24px 28px; font-size:var(--fs-body); line-height:1.7; user-select:text; }
  .mx-todo { max-width:680px; margin:0 auto; padding:24px; width:100%; }
  .mx-titem { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:var(--r-sm);
    background: var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card); margin-bottom:6px; }
  .mx-titem.is-done .mx-titem__t { text-decoration:line-through; color:var(--text-tertiary); }
  .mx-titem__t { flex:1; font-size:var(--fs-body); }
  .mx-wx { display:flex; flex-direction:column; height:100%; overflow:auto; padding:24px 28px; }
  .mx-wx__now { display:flex; align-items:center; gap:22px; }
  .mx-wx__t { font-family:var(--font-display); font-size:76px; font-weight:600; line-height:1; }
  .mx-wx__grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(112px,1fr)); gap:10px; margin-top:20px; }
  .mx-wx__c { padding:14px; border-radius:var(--r-lg); background:var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card);
    display:flex; flex-direction:column; align-items:center; gap:6px; }
  .mx-xb { display:flex; flex-direction:column; height:100%; overflow:auto; }
  .mx-xb__hero { height:220px; background:linear-gradient(120deg,#0b4d0b,#107c10 60%,#5fd35f); padding:24px;
    display:flex; align-items:flex-end; color:#fff; }
  .mx-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:12px; padding:20px 24px; }
  .mx-gcard { border-radius:var(--r-lg); overflow:hidden; background:var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card);
    cursor:default; transition:transform var(--dur-normal) var(--ease-decel); }
  .mx-gcard:hover { transform:translateY(-4px); }
  .mx-gcard__pv { aspect-ratio:3/4; display:grid; place-items:center; }
  .mx-gcard__n { padding:8px 10px; font-size:var(--fs-caption); }
  .mx-snip { display:flex; flex-direction:column; height:100%; align-items:center; justify-content:center; gap:18px; }
  .mx-wp { display:flex; flex-direction:column; height:100%; min-height:0; }
  .mx-wp__doc { flex:1; min-height:0; overflow:auto; padding:28px; background:#fff; color:#111; margin:12px;
    border-radius:4px; box-shadow:0 2px 12px rgba(0,0,0,.2); user-select:text; outline:none; font-size:15px; line-height:1.7; }
  [data-theme="dark"] .mx-wp__doc { background:#f7f7f7; }
  `);

  /* ============================ 邮件 ============================ */
  const MAILS = [
    { f: 'Microsoft 账户团队', e: 'account@microsoft.com', s: '欢迎使用 Windows 11 Web 版', t: 0, unread: true, c: '你好！\n\n感谢体验 Windows 11 的 Web 复刻版。你可以在这里试用文件资源管理器、设置、终端、画图等应用，也可以拖动窗口体验 Snap 贴靠布局。\n\n提示：\n• 拖动窗口到屏幕顶部中央，会出现贴靠布局条\n• 悬停最大化按钮 0.5 秒也能选择布局\n• 按 Win+方向键可快速贴靠\n\n—— Microsoft 账户团队' },
    { f: '设计团队', e: 'design@contoso.com', s: '任务栏动效评审意见', t: 3600e3, unread: true, c: '各位：\n\n附上本次任务栏动效评审的结论：\n\n1. 图标悬停上移 1px、按下缩放 0.9，反馈更清晰\n2. 活跃指示条宽度从 12px 过渡到 17px，时长 250ms，缓动使用 decelerate\n3. 最小化动画应向任务栏按钮位置收缩\n\n请在本周内完成调整。' },
    { f: 'GitHub', e: 'noreply@github.com', s: '[win11-web] 新的 Pull Request #42', t: 7200e3, unread: false, c: 'shell: 实现 Snap 助手与虚拟桌面\n\n+842 −13\n\n本次变更实现了贴靠后的 Snap 助手浮层，并支持多虚拟桌面切换。' },
    { f: '日历提醒', e: 'calendar@outlook.com', s: '会议提醒：团队周会 10:00', t: 86400e3, unread: false, c: '你有一个即将开始的会议：\n\n团队周会\n时间：今天 10:00 - 11:00\n地点：会议室 A' },
    { f: 'Windows 更新', e: 'update@microsoft.com', s: '你的设备已是最新状态', t: 172800e3, unread: false, c: '设备已安装所有可用更新。\n\n上次检查时间：今天\n当前版本：Windows 11 24H2（26100.1742）' },
    { f: 'OneDrive', e: 'onedrive@microsoft.com', s: '本月的照片回顾', t: 259200e3, unread: false, c: '你在本月拍摄了 6 张照片，来看看回忆吧。' }
  ];
  const AVC = ['#0078d4', '#8764b8', '#107c10', '#c8382f', '#ca5010', '#038387'];

  Apps.register({
    id: 'mail', name: '邮件', icon: 'mail', category: '生产效率',
    size: { w: 1080, h: 700 }, minSize: { w: 560, h: 400 }, singleton: true, sortKey: 'youjian',
    mount(win) {
      win.setBodyBg('');
      let sel = 0, folder = '收件箱';
      const root = U.el('div.mx-3pane');
      const listCol = U.el('div.mx-list');
      const read = U.el('div.mx-read');
      const nav = U.el('div.navpane', { style: { width: '196px' } });
      root.append(nav, listCol, read);
      win.body.appendChild(root);

      function buildNav() {
        U.clear(nav);
        const nb = U.el('button.btn.btn--accent', { style: { margin: '4px 6px 10px' } }, [Icons.ui('plus', 14), U.el('span', { text: '新邮件' })]);
        nb.onclick = () => Notifications.toast({ title: '新邮件', body: '撰写功能在此版本中为演示。', appIcon: 'mail' });
        nav.appendChild(nb);
        [['收件箱', 'mail', MAILS.filter(m => m.unread).length], ['已发送', 'upload', 0], ['草稿', 'doc', 0], ['已删除', 'trash', 0], ['存档', 'collection', 0]]
          .forEach(([n, ic, badge]) => {
            const it = U.el('div.navitem' + (folder === n ? '.is-active' : ''), {}, [
              U.el('div.navitem__ico', {}, Icons.ui(ic, 16)),
              U.el('div.navitem__label', { text: n }),
              badge ? U.el('span.caption', { text: String(badge), style: { color: 'var(--text-accent)' } }) : null
            ]);
            it.onclick = () => { folder = n; buildNav(); buildList(); };
            nav.appendChild(it);
          });
      }

      function buildList() {
        U.clear(listCol);
        const hd = U.el('div.cmdbar', {}, [
          U.el('div', { text: folder, style: { fontWeight: 600, fontSize: 'var(--fs-body)', paddingLeft: '6px' } }),
          U.el('div.spacer'),
          U.el('button.cmdbtn.cmdbtn--icon', { title: '筛选' }, Icons.ui('filter', 16))
        ]);
        listCol.appendChild(hd);
        const wrap = U.el('div', { style: { flex: 1, overflow: 'auto' } });
        const items = folder === '收件箱' ? MAILS : [];
        if (!items.length) wrap.appendChild(U.el('div.empty-state', {}, [Icons.ui('mail', 40), U.el('div.empty-state__title', { text: '此文件夹为空' })]));
        items.forEach((m, i) => {
          const row = U.el('div.mx-mail' + (i === sel ? '.is-sel' : '') + (m.unread ? '.is-unread' : ''), {}, [
            U.el('div.mx-mail__av', { text: m.f[0], style: { background: AVC[i % AVC.length] } }),
            U.el('div', { style: { minWidth: 0, flex: 1 } }, [
              U.el('div', { style: { display: 'flex' } }, [
                U.el('div.mx-mail__f.truncate', { text: m.f }),
                U.el('div.spacer'),
                U.el('div.caption.text-tertiary', { text: m.t < 86400e3 ? U.fmtTime(new Date(Date.now() - m.t)) : U.fmtDateShort(new Date(Date.now() - m.t)) })
              ]),
              U.el('div.mx-mail__s.truncate', { text: m.s }),
              U.el('div.mx-mail__p', { text: m.c.split('\n')[0] })
            ])
          ]);
          row.onclick = () => { sel = i; m.unread = false; buildNav(); buildList(); buildRead(); };
          wrap.appendChild(row);
        });
        listCol.appendChild(wrap);
      }

      function buildRead() {
        U.clear(read);
        const m = MAILS[sel];
        if (!m) { read.appendChild(U.el('div.empty-state', {}, [Icons.ui('mail', 48), U.el('div.empty-state__title', { text: '选择一封邮件以阅读' })])); return; }
        read.appendChild(U.el('div.cmdbar', {}, [
          U.el('button.cmdbtn', {}, [Icons.ui('back', 16), U.el('span', { text: '答复' })]),
          U.el('button.cmdbtn', {}, [Icons.ui('forward', 16), U.el('span', { text: '转发' })]),
          U.el('button.cmdbtn.cmdbtn--icon', { title: '归档' }, Icons.ui('collection', 16)),
          U.el('button.cmdbtn.cmdbtn--icon', { title: '删除', onclick: () => { MAILS.splice(sel, 1); sel = 0; buildList(); buildRead(); } }, Icons.ui('trash', 16)),
          U.el('div.spacer'),
          U.el('button.cmdbtn.cmdbtn--icon', { title: '标记' }, Icons.ui('star', 16))
        ]));
        const b = U.el('div.mx-body');
        b.append(
          U.el('div', { text: m.s, style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-subtitle)', fontWeight: 600, marginBottom: '12px' } }),
          U.el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' } }, [
            U.el('div.mx-mail__av', { text: m.f[0], style: { background: AVC[sel % AVC.length], width: '40px', height: '40px' } }),
            U.el('div', {}, [U.el('div', { text: m.f }), U.el('div.caption.text-secondary', { text: m.e + ' · ' + U.fmtDateFile(new Date(Date.now() - m.t)) })])
          ]),
          U.el('div', { text: m.c, style: { whiteSpace: 'pre-line' } })
        );
        read.appendChild(b);
        U.anim(b, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: U.EASE.decel });
      }
      buildNav(); buildList(); buildRead();
    }
  });

  /* ============================ 截图工具 ============================ */
  Apps.register({
    id: 'snipping', name: '截图工具', icon: 'snipping', category: 'Windows 工具',
    size: { w: 620, h: 420 }, minSize: { w: 420, h: 320 }, singleton: true, sortKey: 'jietu',
    mount(win) {
      win.setBodyBg('solid');
      const root = U.el('div.mx-snip');
      win.body.appendChild(root);
      let mode = '矩形';
      const preview = U.el('div', {
        style: {
          width: '280px', height: '160px', borderRadius: 'var(--r-lg)', backgroundSize: 'cover',
          backgroundPosition: 'center', backgroundImage: 'url("' + Settings.wallpaperUrl() + '")',
          boxShadow: 'inset 0 0 0 1px var(--stroke-card)'
        }
      });
      const bar = U.el('div.ms-panel', { style: { gap: '6px' } });
      const nb = U.el('button.btn.btn--accent', {}, [Icons.ui('plus', 14), U.el('span', { text: '新建截图' })]);
      nb.onclick = () => {
        Shell.screenshot();
        preview.style.backgroundImage = 'url("' + Settings.wallpaperUrl() + '")';
      };
      const modeBtn = U.el('button.btn', { text: '模式：' + mode });
      modeBtn.onclick = () => Menu.show(['矩形', '窗口', '全屏', '任意形状'].map(m => ({
        label: m, checked: mode === m, onClick: () => { mode = m; modeBtn.textContent = '模式：' + m; }
      })), { anchor: modeBtn, align: 'bottom-left' });
      const delayBtn = U.el('button.btn', { text: '延迟：无' });
      delayBtn.onclick = () => Menu.show(['无', '3 秒', '5 秒', '10 秒'].map(d => ({
        label: d, onClick: () => delayBtn.textContent = '延迟：' + d
      })), { anchor: delayBtn, align: 'bottom-left' });
      bar.append(nb, modeBtn, delayBtn,
        U.el('button.cmdbtn.cmdbtn--icon', { title: '打开截图文件夹', onclick: () => Apps.launch('explorer', { path: VFS.special('screenshots') }) }, Icons.ui('folder', 16)));
      root.append(
        U.el('div', { text: '截图工具', style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-subtitle)', fontWeight: 600 } }),
        preview, bar,
        U.el('div.caption.text-tertiary', { text: '快捷键：Win + Shift + S（本版本使用 Win + PrintScreen 保存全屏）' })
      );
    }
  });

  /* ============================ 待办事项 ============================ */
  const TODO_KEY = 'win11web.todo.v1';
  Apps.register({
    id: 'todo', name: '待办事项', icon: 'todo', category: '生产效率',
    size: { w: 760, h: 640 }, minSize: { w: 420, h: 380 }, singleton: true, sortKey: 'daiban',
    mount(win) {
      win.setBodyBg('');
      let items = [];
      try { items = JSON.parse(localStorage.getItem(TODO_KEY) || 'null') || null; } catch (e) { }
      if (!items) items = [
        { id: U.uid('td'), t: '完成任务栏悬停预览', d: true },
        { id: U.uid('td'), t: '实现 Snap 助手浮层', d: true },
        { id: U.uid('td'), t: '为设置页补齐个性化选项', d: false },
        { id: U.uid('td'), t: '录制一段动效演示', d: false }
      ];
      const save = () => { try { localStorage.setItem(TODO_KEY, JSON.stringify(items)); } catch (e) { } };

      const wrap = U.el('div.app-scroll');
      const box = U.el('div.mx-todo');
      wrap.appendChild(box);
      win.body.appendChild(wrap);

      function render() {
        U.clear(box);
        box.appendChild(U.el('div', { text: '我的一天', style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-title)', fontWeight: 600 } }));
        box.appendChild(U.el('div.caption.text-secondary', { text: U.fmtDateLong() + ' · ' + items.filter(i => !i.d).length + ' 项待完成', style: { marginBottom: '18px' } }));

        const addRow = U.el('div.textbox', { style: { marginBottom: '14px' } }, [
          Icons.ui('plus', 14),
          U.el('input', { placeholder: '添加任务', id: 'todoInput' })
        ]);
        const inp = addRow.querySelector('input');
        inp.onkeydown = (e) => {
          if (e.key === 'Enter' && inp.value.trim()) {
            items.unshift({ id: U.uid('td'), t: inp.value.trim(), d: false });
            save(); render();
            setTimeout(() => { const i = box.querySelector('#todoInput'); i && i.focus(); }, 0);
          }
        };
        box.appendChild(addRow);

        items.forEach((it, i) => {
          const row = U.el('div.mx-titem' + (it.d ? '.is-done' : ''), {}, [
            (() => {
              const l = U.el('label.checkbox', {}, [U.el('input', { type: 'checkbox', checked: it.d }), U.el('span.checkbox__box')]);
              l.querySelector('input').onchange = () => { it.d = !it.d; save(); render(); Sound.click(); };
              return l;
            })(),
            U.el('div.mx-titem__t', { text: it.t }),
            (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '星标' }, Icons.ui('star', 14)); b.onclick = () => Notifications.toast({ title: '已加星标', body: it.t, appIcon: 'todo', timeout: 1800 }); return b; })(),
            (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '删除' }, Icons.ui('trash', 14)); b.onclick = () => { items.splice(i, 1); save(); render(); }; return b; })()
          ]);
          box.appendChild(row);
        });
        U.$$('.mx-titem', box).forEach((r, i) => U.anim(r, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 20, easing: U.EASE.decel }));
      }
      render();
    }
  });

  /* ============================ 天气 ============================ */
  Apps.register({
    id: 'weather', name: '天气', icon: 'weather', category: '实用工具',
    size: { w: 900, h: 660 }, minSize: { w: 480, h: 400 }, singleton: true, sortKey: 'tianqi',
    mount(win) {
      win.setBodyBg('');
      const w = Weather.current();
      const root = U.el('div.mx-wx');
      win.body.appendChild(root);
      root.append(
        U.el('div', { text: '北京市', style: { fontSize: 'var(--fs-body-lg)' } }),
        U.el('div.caption.text-secondary', { text: '更新于 ' + U.fmtTime() }),
        U.el('div.mx-wx__now', { style: { marginTop: '10px' } }, [
          Icons.app('weather', 96),
          U.el('div', {}, [
            U.el('div.mx-wx__t', { text: w.temp + '°' }),
            U.el('div', { text: w.text + '　体感 ' + (w.temp + 1) + '°', style: { fontSize: 'var(--fs-body-lg)' } }),
            U.el('div.caption.text-secondary', { text: '空气质量 良（AQI 62）· 风速 8 km/h · 湿度 48%' })
          ])
        ])
      );
      root.appendChild(U.el('div', { text: '逐小时预报', style: { fontWeight: 600, marginTop: '24px' } }));
      const hours = U.el('div.mx-wx__grid');
      for (let i = 0; i < 8; i++) {
        const h = (new Date().getHours() + i) % 24;
        hours.appendChild(U.el('div.mx-wx__c', {}, [
          U.el('div.caption', { text: U.pad(h) + ':00' }),
          Icons.app('weather', 28),
          U.el('div', { text: (w.temp + Math.round(Math.sin(i) * 3)) + '°' })
        ]));
      }
      root.appendChild(hours);
      root.appendChild(U.el('div', { text: '未来 7 天', style: { fontWeight: 600, marginTop: '24px' } }));
      const days = U.el('div', { style: { marginTop: '8px' } });
      Weather.forecast().forEach(f => {
        days.appendChild(U.el('div.stg-card', {}, [
          U.el('div.stg-card__ico', {}, Icons.app(f.icon, 24)),
          U.el('div.stg-card__txt', {}, [U.el('div.stg-card__t', { text: f.day }), U.el('div.stg-card__d', { text: f.text })]),
          U.el('div.stg-card__act', {}, U.el('div', { text: f.hi + '° / ' + f.lo + '°' }))
        ]));
      });
      root.appendChild(days);
    }
  });

  /* ============================ Xbox ============================ */
  Apps.register({
    id: 'xbox', name: 'Xbox', icon: 'xbox', category: '游戏',
    size: { w: 1060, h: 700 }, minSize: { w: 560, h: 420 }, singleton: true, sortKey: 'Xbox',
    mount(win) {
      win.setBodyBg('');
      const root = U.el('div.mx-xb');
      win.body.appendChild(root);
      root.appendChild(U.el('div.mx-xb__hero', {}, U.el('div', {}, [
        U.el('div', { text: 'GAME PASS', style: { fontSize: 'var(--fs-caption)', letterSpacing: '.16em', opacity: .9 } }),
        U.el('div', { text: '畅玩数百款高品质游戏', style: { fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, margin: '6px 0' } }),
        U.el('button.btn', { text: '开始体验', onclick: () => Apps.launch('minesweeper') })
      ])));
      root.appendChild(U.el('div', { text: '为你推荐', style: { fontWeight: 600, padding: '18px 24px 0' } }));
      const grid = U.el('div.mx-grid');
      [['扫雷', 'minesweeper', '#107c10'], ['纸牌合集', 'game', '#0b6a0b'], ['方块消除', 'grid', '#1f8ede'],
      ['赛车竞速', 'game', '#c8382f'], ['太空射击', 'game', '#8764b8'], ['像素冒险', 'game', '#ca5010']]
        .forEach(([n, ic, c]) => {
          const card = U.el('div.mx-gcard', {}, [
            U.el('div.mx-gcard__pv', { style: { background: 'linear-gradient(150deg,' + c + ',#111)' } }, Icons.ui(ic === 'minesweeper' ? 'game' : ic, 44)),
            U.el('div.mx-gcard__n', { text: n })
          ]);
          card.onclick = () => n === '扫雷' ? Apps.launch('minesweeper') : Notifications.toast({ title: n, body: '此游戏在 Web 版中不可用。', appIcon: 'xbox' });
          grid.appendChild(card);
        });
      root.appendChild(grid);
    }
  });

  /* ============================ 写字板 ============================ */
  Apps.register({
    id: 'wordpad', name: '写字板', icon: 'word', category: 'Windows 工具',
    size: { w: 920, h: 680 }, minSize: { w: 480, h: 360 }, sortKey: 'xiezibanA',
    mount(win, args) {
      win.setBodyBg('solid2');
      const root = U.el('div.mx-wp');
      const bar = U.el('div.cmdbar');
      const doc = U.el('div.mx-wp__doc', { contenteditable: 'true', spellcheck: 'false' });
      root.append(bar, doc);
      win.body.appendChild(root);

      const cmd = (c, v) => { document.execCommand(c, false, v); doc.focus(); };
      const btn = (icon, label, fn) => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: label }, Icons.ui(icon, 16)); b.onclick = fn; U.tooltip(b, label); return b; };
      bar.append(
        btn('save', '保存', async () => {
          const name = await Notifications.prompt('保存为', '文档.html', '文件名（保存到「文档」）');
          if (!name) return;
          VFS.createFile(VFS.special('documents'), name, doc.innerHTML);
          Notifications.toast({ title: '已保存', body: name, appIcon: 'word' });
        }),
        btn('undo', '撤销', () => cmd('undo')),
        btn('redo', '重做', () => cmd('redo')),
        U.el('div.cmdsep'),
        btn('text', '加粗', () => cmd('bold')),
        btn('pen', '斜体', () => cmd('italic')),
        btn('link', '下划线', () => cmd('underline')),
        U.el('div.cmdsep'),
        btn('list', '项目符号', () => cmd('insertUnorderedList')),
        btn('sort', '编号', () => cmd('insertOrderedList')),
        U.el('div.cmdsep'),
        (() => {
          const c = U.el('input', { type: 'color', value: '#1b1b1b', style: { width: '32px', height: '26px', border: 0, background: 'none' } });
          c.oninput = () => cmd('foreColor', c.value);
          return c;
        })(),
        (() => {
          const s = Shell.combo('15', [{ value: '13', label: '小' }, { value: '15', label: '中' }, { value: '20', label: '大' }, { value: '26', label: '特大' }],
            v => { doc.style.fontSize = v + 'px'; });
          return s;
        })()
      );
      doc.innerHTML = args && args.path
        ? (VFS.readFile(args.path) || '')
        : '<h2>写字板</h2><p>这是一个支持富文本的简易编辑器。你可以使用上方工具栏设置<b>加粗</b>、<i>斜体</i>与<u>下划线</u>，并保存为 HTML 文件。</p>';
      setTimeout(() => doc.focus(), 60);
    }
  });

  /* ============================ 控制面板（跳转设置） ============================ */
  Apps.register({
    id: 'controlpanel', name: '控制面板', icon: 'settings', category: 'Windows 工具',
    size: { w: 900, h: 620 }, minSize: { w: 520, h: 400 }, sortKey: 'kongzhimianban',
    mount(win) {
      win.setBodyBg('solid');
      const wrap = U.el('div.app-scroll', { style: { padding: '24px' } });
      win.body.appendChild(wrap);
      wrap.appendChild(U.el('div', { text: '调整计算机的设置', style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-subtitle)', fontWeight: 600, marginBottom: '18px' } }));
      const grid = U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '18px' } });
      [['系统和安全', 'shield', { page: 'privacy' }], ['网络和 Internet', 'network', { page: 'network' }],
      ['硬件和声音', 'volume', { page: 'system', sub: 'sound' }], ['程序', 'apps', { page: 'apps' }],
      ['用户账户', 'person', { page: 'accounts' }], ['外观和个性化', 'palette', { page: 'personalization' }],
      ['时钟和区域', 'time', { page: 'time' }], ['轻松使用', 'accessibility', { page: 'accessibility' }]]
        .forEach(([n, ic, a]) => {
          const c = U.el('div', { style: { display: 'flex', gap: '12px', cursor: 'default' } }, [
            U.el('div', { style: { color: 'var(--text-accent)' } }, Icons.ui(ic, 28)),
            U.el('div', {}, [
              U.el('div', { text: n, style: { color: 'var(--text-accent)', fontSize: 'var(--fs-body)' } }),
              U.el('div.caption.text-secondary', { text: '打开对应的现代设置页' })
            ])
          ]);
          c.onclick = () => Apps.launch('settings', a);
          grid.appendChild(c);
        });
      wrap.appendChild(grid);
      wrap.appendChild(U.el('div.caption.text-tertiary', { text: '提示：Windows 11 中的多数设置项已迁移到「设置」应用。', style: { marginTop: '24px' } }));
    }
  });
})(window);
