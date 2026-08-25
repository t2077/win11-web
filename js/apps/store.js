/* ============================================================
   store.js — Microsoft Store（主页 / 应用 / 游戏 / 库 / 详情页）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('store', `
  .st-root { display:flex; height:100%; min-height:0; }
  .st-nav { width:212px; flex:none; padding:8px 4px 8px 8px; display:flex; flex-direction:column; gap:2px; }
  .st-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column;
    background: var(--bg-solid); border-top-left-radius:8px; box-shadow: inset 1px 1px 0 var(--stroke-control); }
  [data-theme="dark"] .st-main { background: rgba(255,255,255,.025); }
  .st-top { flex:none; display:flex; align-items:center; gap:10px; padding:12px 24px; }
  .st-scroll { flex:1 1 auto; min-height:0; overflow:auto; padding:0 24px 28px; }
  .st-hero { position:relative; height:260px; border-radius:var(--r-xl); overflow:hidden; margin-bottom:8px;
    background:linear-gradient(120deg,#0b3b6f,#1f8ede 60%,#4fd0f7); display:flex; align-items:flex-end; padding:24px; }
  .st-hero__t { position:relative; z-index:2; color:#fff; max-width:60%; }
  .st-hero__glow { position:absolute; right:-40px; top:-60px; width:420px; height:420px; border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.35),transparent 65%); }
  .st-sec { margin-top:24px; }
  .st-sechead { display:flex; align-items:center; margin-bottom:12px; }
  .st-sectitle { font-family:var(--font-display); font-size:var(--fs-subtitle); font-weight:600; }
  .st-row { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; }
  .st-card { border-radius:var(--r-lg); padding:14px; background:var(--bg-card);
    box-shadow: inset 0 0 0 1px var(--stroke-card); display:flex; flex-direction:column; gap:10px; cursor:default;
    transition: background-color var(--dur-fast) linear, transform var(--dur-normal) var(--ease-decel); }
  .st-card:hover { background:var(--bg-card-hover); transform:translateY(-3px); }
  .st-card__n { font-size:var(--fs-body); font-weight:600; }
  .st-card__s { font-size:var(--fs-caption); color:var(--text-secondary); }
  .st-stars { color:#f0b429; font-size:11px; letter-spacing:1px; }
  .st-detail__head { display:flex; gap:24px; padding:18px 0 8px; }
  .st-detail__ico { width:120px; height:120px; border-radius:var(--r-xl); flex:none; display:grid; place-items:center;
    background:var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card); }
  .st-shots { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; margin-top:12px; }
  .st-shot { aspect-ratio:16/10; border-radius:var(--r-lg); background:linear-gradient(140deg,#123,#1f4f7a);
    display:grid; place-items:center; box-shadow: inset 0 0 0 1px var(--stroke-card); overflow:hidden; }
  .st-meta { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:14px; margin-top:18px; }
  .st-meta__k { font-size:var(--fs-caption); color:var(--text-tertiary); }
  .st-progress { height:4px; border-radius:2px; background:var(--fill-control-strong); opacity:.4; overflow:hidden; }
  .st-progress > i { display:block; height:100%; background:var(--fill-accent); width:0%; transition:width .2s linear; }
  `);

  const CATALOG = [
    { id: 'edge', pub: 'Microsoft Corporation', cat: '生产效率', rate: 4.5, n: 12483, size: 148, desc: '快速、安全、为效率而生的浏览器。内置垂直标签页、集锦与沉浸式阅读器。' },
    { id: 'notepad', pub: 'Microsoft Corporation', cat: '实用工具', rate: 4.6, n: 8712, size: 12, desc: '轻量的纯文本编辑器，支持标签页、深色模式与自动换行。' },
    { id: 'paint', pub: 'Microsoft Corporation', cat: '照片和视频', rate: 4.4, n: 6204, size: 46, desc: '经典的绘图工具，现已支持深色模式、图层与背景移除。' },
    { id: 'photos', pub: 'Microsoft Corporation', cat: '照片和视频', rate: 4.2, n: 15380, size: 92, desc: '整理、编辑并分享你的照片与视频。' },
    { id: 'terminal', pub: 'Microsoft Corporation', cat: '开发人员工具', rate: 4.8, n: 4290, size: 68, desc: '现代化的多标签终端，支持 GPU 加速渲染与自定义配置。' },
    { id: 'calculator', pub: 'Microsoft Corporation', cat: '实用工具', rate: 4.7, n: 9932, size: 8, desc: '标准、科学、程序员模式与单位换算。' },
    { id: 'mediaplayer', pub: 'Microsoft Corporation', cat: '音乐', rate: 4.1, n: 3120, size: 74, desc: '播放本地音乐与视频，支持播放列表与均衡器。' },
    { id: 'clock', pub: 'Microsoft Corporation', cat: '实用工具', rate: 4.3, n: 2810, size: 22, desc: '闹钟、计时器、秒表、世界时钟与专注会话。' },
    { id: 'minesweeper', pub: 'Microsoft Studios', cat: '游戏', rate: 4.6, n: 20455, size: 34, desc: '经典扫雷，三种难度，挑战你的推理速度。', game: true },
    { id: 'xbox', pub: 'Xbox Game Studios', cat: '游戏', rate: 4.0, n: 51230, size: 210, desc: '发现并畅玩 Game Pass 中的数百款游戏。', game: true },
    { id: 'todo', pub: 'Microsoft Corporation', cat: '生产效率', rate: 4.5, n: 7710, size: 40, desc: '规划一天的任务，与 Outlook 任务同步。' },
    { id: 'mail', pub: 'Microsoft Corporation', cat: '生产效率', rate: 3.9, n: 18220, size: 88, desc: '统一收件箱，管理邮件、日历与联系人。' },
    { id: 'snipping', pub: 'Microsoft Corporation', cat: '实用工具', rate: 4.4, n: 5140, size: 18, desc: '截取屏幕、录制视频并快速批注。' },
    { id: 'weather', pub: 'Microsoft Corporation', cat: '天气', rate: 4.2, n: 6620, size: 30, desc: '逐小时预报、空气质量与恶劣天气预警。' }
  ];

  function stars(r) { const f = Math.round(r); return '★★★★★'.slice(0, f) + '☆☆☆☆☆'.slice(0, 5 - f); }

  function mount(win, args) {
    win.setBodyBg('');
    const root = U.el('div.st-root');
    const nav = U.el('div.st-nav');
    const main = U.el('div.st-main');
    root.append(nav, main);
    win.body.appendChild(root);

    let page = 'home', detail = null, query = '';
    const installed = new Set(Apps.all().map(a => a.id));

    const NAVS = [
      { id: 'home', name: '主页', icon: 'home' },
      { id: 'apps', name: '应用', icon: 'apps' },
      { id: 'games', name: '游戏', icon: 'game' },
      { id: 'movies', name: '电影和电视', icon: 'video2' },
      { id: 'lib', name: '库', icon: 'collection' }
    ];

    function buildNav() {
      U.clear(nav);
      NAVS.forEach(n => {
        const it = U.el('div.navitem' + (n.id === page && !detail ? '.is-active' : ''), { tabindex: 0 }, [
          U.el('div.navitem__ico', {}, Icons.ui(n.icon, 16)),
          U.el('div.navitem__label', { text: n.name })
        ]);
        it.onclick = () => { page = n.id; detail = null; render(); };
        nav.appendChild(it);
      });
      nav.appendChild(U.el('div.spacer'));
      const h = U.el('div.navitem', {}, [U.el('div.navitem__ico', {}, Icons.ui('info', 16)), U.el('div.navitem__label', { text: '帮助' })]);
      h.onclick = () => Notifications.toast({ title: 'Microsoft Store', body: '这是 Web 复刻版商店，所有应用均已内置。', appIcon: 'store' });
      nav.appendChild(h);
    }

    function top() {
      const t = U.el('div.st-top');
      if (detail) {
        const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '返回' }, Icons.ui('back', 16));
        b.onclick = () => { detail = null; render(); };
        t.appendChild(b);
      }
      const sb = U.el('div.searchbox-sm', { style: { width: '320px' } }, [Icons.ui('search', 14), U.el('input', { placeholder: '搜索应用、游戏、电影', value: query })]);
      const inp = sb.querySelector('input');
      inp.oninput = U.debounce(() => { query = inp.value.trim(); page = 'search'; detail = null; render(true); }, 200);
      t.append(sb, U.el('div.spacer'),
        U.el('button.cmdbtn.cmdbtn--icon', { title: '下载和更新', onclick: () => { page = 'lib'; detail = null; render(); } }, Icons.ui('download', 16)),
        U.el('button.cmdbtn.cmdbtn--icon', { title: Settings.userName, onclick: () => Notifications.toast({ title: Settings.userName, body: Settings.userEmail, appIcon: 'user' }) }, Icons.ui('person', 16))
      );
      return t;
    }

    function appCard(a) {
      const def = Apps.get(a.id) || { name: a.id, icon: 'file' };
      const c = U.el('div.st-card', {}, [
        Icons.app(def.icon, 48),
        U.el('div', {}, [
          U.el('div.st-card__n.truncate', { text: def.name }),
          U.el('div.st-card__s.truncate', { text: a.cat }),
          U.el('div.st-stars', { text: stars(a.rate) + ' ' + a.rate.toFixed(1) })
        ]),
        U.el('div.spacer'),
        U.el('button.btn.btn--sm' + (installed.has(a.id) ? '' : '.btn--accent'), {
          text: installed.has(a.id) ? '打开' : '获取',
          onclick: (e) => { e.stopPropagation(); installed.has(a.id) ? Apps.launch(a.id) : install(a); }
        })
      ]);
      c.onclick = () => { detail = a; render(); };
      return c;
    }

    function install(a) {
      const def = Apps.get(a.id);
      Notifications.toast({
        title: (def ? def.name : a.id) + ' 已在此设备上', body: '所有应用均为系统内置组件。',
        appIcon: 'store', actions: def ? [{ text: '打开', accent: true, onClick: () => Apps.launch(a.id) }] : null
      });
    }

    function section(title, list, more) {
      const s = U.el('div.st-sec');
      s.appendChild(U.el('div.st-sechead', {}, [
        U.el('div.st-sectitle', { text: title }), U.el('div.spacer'),
        more ? U.el('button.btn.btn--sm', { text: '查看全部', onclick: more }) : null
      ]));
      const row = U.el('div.st-row');
      list.forEach(a => row.appendChild(appCard(a)));
      s.appendChild(row);
      return s;
    }

    function render(keepFocus) {
      U.clear(main);
      buildNav();
      main.appendChild(top());
      const sc = U.el('div.st-scroll');
      main.appendChild(sc);

      if (detail) { renderDetail(sc); return; }

      if (page === 'home') {
        const hero = U.el('div.st-hero', {}, [
          U.el('div.st-hero__glow'),
          U.el('div.st-hero__t', {}, [
            U.el('div', { text: '精选', style: { fontSize: 'var(--fs-caption)', opacity: .85 } }),
            U.el('div', { text: 'Windows 11 Web 版', style: { fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 700, margin: '6px 0' } }),
            U.el('div', { text: '用纯前端技术复刻的完整桌面体验：贴靠布局、亚克力材质、Fluent 图标与 20+ 内置应用。', style: { fontSize: 'var(--fs-body)', opacity: .92 } }),
            U.el('button.btn.btn--accent', { text: '查看内置应用', style: { marginTop: '14px' }, onclick: () => { page = 'apps'; render(); } })
          ])
        ]);
        sc.appendChild(hero);
        sc.appendChild(section('为你推荐', CATALOG.slice(0, 6), () => { page = 'apps'; render(); }));
        sc.appendChild(section('热门免费游戏', CATALOG.filter(a => a.game), () => { page = 'games'; render(); }));
        sc.appendChild(section('效率精选', CATALOG.filter(a => a.cat === '生产效率' || a.cat === '开发人员工具')));
      } else if (page === 'apps') {
        sc.appendChild(section('所有应用（' + CATALOG.filter(a => !a.game).length + '）', CATALOG.filter(a => !a.game)));
      } else if (page === 'games') {
        sc.appendChild(section('游戏', CATALOG.filter(a => a.game)));
        sc.appendChild(U.el('div.caption.text-tertiary', { text: 'Xbox Game Pass 内容在此版本中不可用。', style: { marginTop: '16px' } }));
      } else if (page === 'movies') {
        sc.appendChild(U.el('div.empty-state', {}, [
          Icons.ui('video2', 48), U.el('div.empty-state__title', { text: '电影和电视暂不可用' }),
          U.el('div.caption', { text: '此区域需要联网的 Microsoft 账户。' })
        ]));
      } else if (page === 'lib') {
        const s = U.el('div.st-sec');
        s.appendChild(U.el('div.st-sechead', {}, [U.el('div.st-sectitle', { text: '库' }), U.el('div.spacer'),
        U.el('button.btn.btn--accent.btn--sm', {
          text: '获取更新', onclick: async (e) => {
            const b = e.currentTarget; b.disabled = true; b.textContent = '正在检查…';
            await U.sleep(1400);
            b.textContent = '全部为最新';
            Notifications.toast({ title: 'Microsoft Store', body: '所有应用均为最新版本。', appIcon: 'store' });
          }
        })]));
        const list = U.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } });
        Apps.all().sort((a, b) => a.name.localeCompare(b.name, 'zh')).forEach(a => {
          const c = CATALOG.find(x => x.id === a.id);
          list.appendChild(U.el('div.stg-card', {}, [
            U.el('div.stg-card__ico', {}, Icons.app(a.icon, 28)),
            U.el('div.stg-card__txt', {}, [
              U.el('div.stg-card__t', { text: a.name }),
              U.el('div.stg-card__d', { text: (c ? c.pub : 'Microsoft Corporation') + ' · ' + (c ? c.size + ' MB' : '内置组件') })
            ]),
            U.el('div.stg-card__act', {}, U.el('button.btn.btn--sm', { text: '打开', onclick: () => Apps.launch(a.id) }))
          ]));
        });
        s.appendChild(list);
        sc.appendChild(s);
      } else if (page === 'search') {
        const q = query.toLowerCase();
        const hits = CATALOG.filter(a => {
          const def = Apps.get(a.id);
          return (def && def.name.toLowerCase().includes(q)) || a.cat.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
        });
        if (!q) { page = 'home'; render(); return; }
        if (!hits.length) {
          sc.appendChild(U.el('div.empty-state', {}, [
            Icons.ui('search', 48), U.el('div.empty-state__title', { text: '未找到"' + query + '"的结果' })
          ]));
        } else sc.appendChild(section('"' + query + '"的搜索结果（' + hits.length + '）', hits));
        if (keepFocus) setTimeout(() => { const i = main.querySelector('.searchbox-sm input'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0);
      }
      U.$$('.st-card, .stg-card', sc).forEach((c, i) => U.anim(c,
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 280, delay: Math.min(i * 16, 220), easing: U.EASE.decel }));
    }

    function renderDetail(sc) {
      const a = detail;
      const def = Apps.get(a.id) || { name: a.id, icon: 'file' };
      const head = U.el('div.st-detail__head', {}, [
        U.el('div.st-detail__ico', {}, Icons.app(def.icon, 84)),
        U.el('div', { style: { flex: '1', minWidth: 0 } }, [
          U.el('div', { text: def.name, style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-title)', fontWeight: 600 } }),
          U.el('div', { text: a.pub, style: { color: 'var(--text-accent)', fontSize: 'var(--fs-body)', marginTop: '2px' } }),
          U.el('div.st-stars', { text: stars(a.rate) + '  ' + a.rate.toFixed(1) + '（' + a.n.toLocaleString('zh-CN') + ' 条评分）', style: { marginTop: '6px' } }),
          U.el('div.st-card__s', { text: a.cat + ' · ' + a.size + ' MB · 适用于 Windows 11', style: { marginTop: '4px' } }),
          (() => {
            const wrap = U.el('div', { style: { marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' } });
            const btn = U.el('button.btn.btn--accent.btn--wide', { text: installed.has(a.id) ? '打开' : '获取' });
            const prog = U.el('div.st-progress', { style: { width: '180px', display: 'none' } }, U.el('i'));
            btn.onclick = async () => {
              if (installed.has(a.id)) { Apps.launch(a.id); return; }
              btn.disabled = true; prog.style.display = 'block';
              for (let i = 0; i <= 100; i += 5) { prog.firstChild.style.width = i + '%'; await U.sleep(60); }
              btn.disabled = false; btn.textContent = '打开'; prog.style.display = 'none';
              install(a);
            };
            wrap.append(btn, prog,
              U.el('button.btn.btn--sm', { text: '共享', onclick: () => U.copyText('ms-windows-store://pdp/?productid=' + a.id) }));
            return wrap;
          })()
        ])
      ]);
      sc.appendChild(head);
      sc.appendChild(U.el('div.st-sec', {}, [
        U.el('div.st-sectitle', { text: '说明', style: { fontSize: 'var(--fs-body-lg)', marginBottom: '6px' } }),
        U.el('div', { text: a.desc, style: { color: 'var(--text-secondary)', maxWidth: '760px' } })
      ]));
      const shots = U.el('div.st-shots');
      for (let i = 0; i < 3; i++) {
        shots.appendChild(U.el('div.st-shot', {}, Icons.app(def.icon, 56)));
      }
      sc.appendChild(U.el('div.st-sec', {}, [U.el('div.st-sectitle', { text: '屏幕截图', style: { fontSize: 'var(--fs-body-lg)', marginBottom: '6px' } }), shots]));
      const meta = U.el('div.st-meta');
      [['发布者', a.pub], ['版本', '1.' + (a.size % 20) + '.' + a.n % 100], ['大小', a.size + ' MB'],
      ['类别', a.cat], ['支持的语言', '简体中文、English'], ['分级', '3+ 适合所有人']]
        .forEach(([k, v]) => meta.appendChild(U.el('div', {}, [U.el('div.st-meta__k', { text: k }), U.el('div', { text: v })])));
      sc.appendChild(U.el('div.st-sec', {}, [U.el('div.st-sectitle', { text: '其他信息', style: { fontSize: 'var(--fs-body-lg)', marginBottom: '6px' } }), meta]));
      U.anim(head, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: U.EASE.decel });
    }

    if (args && args.app) { detail = CATALOG.find(a => a.id === args.app) || null; }
    render();
  }

  Apps.register({
    id: 'store', name: 'Microsoft Store', icon: 'store', category: '系统',
    size: { w: 1120, h: 740 }, minSize: { w: 620, h: 440 }, mount, singleton: true, sortKey: 'Microsoft Store'
  });
})(window);
