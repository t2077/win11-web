/* ============================================================
   settings.js — 设置（系统 / 个性化 / 账户 / 时间 / 更新 …）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('settings', `
  .sg-root { display:flex; height:100%; min-height:0; }
  .sg-nav { width:290px; flex:none; display:flex; flex-direction:column; padding:0 4px 8px 12px; }
  .sg-user { display:flex; align-items:center; gap:12px; padding:14px 10px 16px; }
  .sg-user__av { width:44px; height:44px; border-radius:50%; overflow:hidden; display:grid; place-items:center; flex:none; }
  .sg-user__av img { width:100%; height:100%; object-fit:cover; }
  .sg-user__n { font-size:var(--fs-body); }
  .sg-user__e { font-size:var(--fs-caption); color:var(--text-secondary); }
  .sg-search { margin:0 8px 12px; }
  .sg-navlist { flex:1 1 auto; min-height:0; overflow-y:auto; padding-right:4px; }
  .sg-content { flex:1 1 auto; min-width:0; overflow-y:auto; background: var(--bg-solid);
    border-top-left-radius:8px; box-shadow: inset 1px 1px 0 var(--stroke-control); }
  [data-theme="dark"] .sg-content { background: rgba(255,255,255,.025); }
  .sg-wallgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(148px,1fr)); gap:10px; margin-top:8px; }
  .sg-wall { aspect-ratio:16/10; border-radius:var(--r-sm); background-size:cover; background-position:center;
    box-shadow: inset 0 0 0 1px var(--stroke-control); position:relative; cursor:default;
    transition: transform var(--dur-fast) var(--ease-decel); }
  .sg-wall:hover { transform:scale(1.03); }
  .sg-wall.is-active { box-shadow: inset 0 0 0 2px var(--fill-accent), 0 4px 12px rgba(0,0,0,.2); }
  .sg-wall__chk { position:absolute; right:6px; top:6px; width:20px; height:20px; border-radius:50%;
    background: var(--fill-accent); color: var(--text-onaccent); display:grid; place-items:center; opacity:0; }
  .sg-wall.is-active .sg-wall__chk { opacity:1; }
  .sg-accents { display:grid; grid-template-columns:repeat(auto-fill,minmax(48px,1fr)); gap:8px; margin-top:10px; }
  .sg-accent { aspect-ratio:1; border-radius:var(--r-sm); position:relative; box-shadow: inset 0 0 0 1px rgba(0,0,0,.12);
    transition: transform var(--dur-fast) var(--ease-decel); }
  .sg-accent:hover { transform:scale(1.08); }
  .sg-accent.is-active::after { content:''; position:absolute; inset:-3px; border-radius:6px;
    box-shadow: 0 0 0 2px var(--text-primary); }
  .sg-preview { display:flex; gap:14px; align-items:center; margin-bottom:12px; }
  .sg-monitor { width:260px; aspect-ratio:16/10; border-radius:6px; background-size:cover; background-position:center;
    box-shadow: 0 6px 18px rgba(0,0,0,.28), inset 0 0 0 3px #2b2b2b; position:relative; overflow:hidden; }
  .sg-monitor__tb { position:absolute; left:0; right:0; bottom:0; height:12%; background: var(--taskbar-tint);
    backdrop-filter: blur(8px); display:flex; align-items:center; justify-content:center; gap:4px; }
  .sg-monitor__tb i { width:6px; height:6px; border-radius:1.5px; background: var(--text-secondary); display:block; }
  .sg-monitor__win { position:absolute; left:18%; top:18%; width:52%; height:46%; border-radius:4px;
    background: var(--mica-tint); box-shadow: 0 4px 12px rgba(0,0,0,.3), inset 0 0 0 1px var(--stroke-surface); }
  .sg-monitor__win::before { content:''; position:absolute; left:0; right:0; top:0; height:20%;
    border-bottom:1px solid var(--stroke-divider); }
  .sg-themes { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; margin-top:10px; }
  .sg-theme { border-radius:var(--r-lg); overflow:hidden; box-shadow: inset 0 0 0 1px var(--stroke-card); cursor:default; }
  .sg-theme.is-active { box-shadow: inset 0 0 0 2px var(--fill-accent); }
  .sg-theme__pv { aspect-ratio:16/10; background-size:cover; background-position:center; }
  .sg-theme__n { padding:8px 10px; font-size:var(--fs-caption); background: var(--bg-card); }
  .sg-spec { display:grid; grid-template-columns:170px 1fr; gap:6px 16px; font-size:var(--fs-body); }
  .sg-spec__k { color:var(--text-secondary); }
  .sg-update { display:flex; align-items:center; gap:16px; padding:18px; border-radius:var(--r-lg);
    background: var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card); }
  .sg-update__ico { width:48px; height:48px; border-radius:50%; display:grid; place-items:center;
    background: color-mix(in srgb, var(--accent-base) 25%, transparent); color: var(--text-accent); flex:none; }
  `);

  const PAGES = [
    { id: 'system', name: '系统', icon: 'pcSmall' },
    { id: 'bluetooth', name: '蓝牙和其他设备', icon: 'bluetooth' },
    { id: 'network', name: '网络和 Internet', icon: 'network' },
    { id: 'personalization', name: '个性化', icon: 'palette' },
    { id: 'apps', name: '应用', icon: 'apps' },
    { id: 'accounts', name: '账户', icon: 'person' },
    { id: 'time', name: '时间和语言', icon: 'time' },
    { id: 'gaming', name: '游戏', icon: 'game' },
    { id: 'accessibility', name: '辅助功能', icon: 'accessibility' },
    { id: 'privacy', name: '隐私和安全性', icon: 'privacy' },
    { id: 'update', name: 'Windows 更新', icon: 'update' }
  ];

  function mount(win, args) {
    win.setBodyBg('');
    const root = U.el('div.sg-root');
    const nav = U.el('div.sg-nav');
    const content = U.el('div.sg-content');
    root.append(nav, content);
    win.body.appendChild(root);

    let page = (args && args.page) || 'system';
    let sub = (args && args.sub) || null;

    /* ---------- 导航 ---------- */
    const navlist = U.el('div.sg-navlist');
    function buildNav() {
      U.clear(nav);
      nav.appendChild(U.el('div.sg-user', {}, [
        U.el('div.sg-user__av', {}, Settings.userAvatar ? U.el('img', { src: Settings.userAvatar }) : Icons.app('user', 44)),
        U.el('div', {}, [
          U.el('div.sg-user__n', { text: Settings.userName }),
          U.el('div.sg-user__e', { text: Settings.userEmail })
        ])
      ]));
      const sb = U.el('div.textbox.sg-search', {}, [Icons.ui('search', 14), U.el('input', { placeholder: '查找设置' })]);
      const inp = sb.querySelector('input');
      inp.oninput = U.debounce(() => {
        const q = inp.value.trim().toLowerCase();
        if (!q) { buildNavList(); return; }
        U.clear(navlist);
        const hits = [];
        PAGES.forEach(p => { if (p.name.toLowerCase().includes(q)) hits.push({ p, label: p.name }); });
        SEARCHABLE.forEach(s => { if (s.label.toLowerCase().includes(q)) hits.push({ p: PAGES.find(x => x.id === s.page), label: s.label, sub: s.sub }); });
        if (!hits.length) navlist.appendChild(U.el('div.caption.text-tertiary', { text: '未找到匹配的设置', style: { padding: '10px' } }));
        hits.slice(0, 14).forEach(h => {
          const it = U.el('div.navitem', {}, [
            U.el('div.navitem__ico', {}, Icons.ui(h.p ? h.p.icon : 'settings', 16)),
            U.el('div.navitem__label', { text: h.label })
          ]);
          it.onclick = () => { goto(h.p.id, h.sub); inp.value = ''; buildNavList(); };
          navlist.appendChild(it);
        });
      }, 150);
      nav.append(sb, navlist);
      buildNavList();
    }
    function buildNavList() {
      U.clear(navlist);
      PAGES.forEach(p => {
        const it = U.el('div.navitem' + (p.id === page ? '.is-active' : ''), { tabindex: 0 }, [
          U.el('div.navitem__ico', {}, Icons.ui(p.icon, 16)),
          U.el('div.navitem__label', { text: p.name })
        ]);
        it.onclick = () => goto(p.id);
        navlist.appendChild(it);
      });
    }

    const SEARCHABLE = [
      { label: '背景（壁纸）', page: 'personalization', sub: 'background' },
      { label: '颜色（强调色）', page: 'personalization', sub: 'colors' },
      { label: '主题', page: 'personalization', sub: 'themes' },
      { label: '锁屏界面', page: 'personalization', sub: 'lockscreen' },
      { label: '任务栏', page: 'personalization', sub: 'taskbar' },
      { label: '显示（亮度、夜间模式）', page: 'system', sub: 'display' },
      { label: '声音（音量）', page: 'system', sub: 'sound' },
      { label: '通知', page: 'system', sub: 'notifications' },
      { label: '电源和电池', page: 'system', sub: 'power' },
      { label: '存储', page: 'system', sub: 'storage' },
      { label: '关于本机', page: 'system', sub: 'about' },
      { label: '日期和时间', page: 'time', sub: null },
      { label: '视觉效果（动画）', page: 'accessibility', sub: null }
    ];

    /* ---------- 内容 ---------- */
    function goto(p, s) {
      page = p; sub = s || null;
      buildNavList();
      render();
      content.scrollTop = 0;
    }

    function card(o) {
      const c = U.el('div.stg-card' + (o.onClick ? '.stg-card--btn' : ''), {}, [
        o.icon ? U.el('div.stg-card__ico', {}, o.appIcon ? Icons.app(o.icon, 24) : Icons.ui(o.icon, 20)) : null,
        U.el('div.stg-card__txt', {}, [
          U.el('div.stg-card__t', { text: o.title }),
          o.desc ? U.el('div.stg-card__d', { text: o.desc }) : null
        ]),
        U.el('div.stg-card__act', {}, o.action || (o.onClick ? Icons.ui('chevronRight', 14) : null))
      ]);
      if (o.onClick) c.onclick = o.onClick;
      return c;
    }
    function group(title, children) {
      const g = U.el('div.stg-group');
      if (title) g.appendChild(U.el('div.stg-grouphead', { text: title }));
      U.append(g, children);
      return g;
    }
    function pageHead(title, desc) {
      const h = U.el('div', {}, [
        U.el('div.stg-breadcrumb', {}, [U.el('span', { text: '设置' }), Icons.ui('chevronRight', 10), U.el('span', { text: title })]),
        U.el('div.stg-title', { text: title }),
        desc ? U.el('div.text-secondary', { text: desc, style: { marginTop: '6px' } }) : null
      ]);
      return h;
    }

    function monitorPreview() {
      const m = U.el('div.sg-monitor', { style: { backgroundImage: 'url("' + Settings.wallpaperUrl() + '")' } });
      m.appendChild(U.el('div.sg-monitor__win'));
      const tb = U.el('div.sg-monitor__tb');
      for (let i = 0; i < 5; i++) tb.appendChild(U.el('i'));
      if (Settings.taskbarAlign === 'left') tb.style.justifyContent = 'flex-start', tb.style.paddingLeft = '6px';
      m.appendChild(tb);
      return m;
    }

    function render() {
      U.clear(content);
      const p = U.el('div.stg-page');
      content.appendChild(p);
      const R = RENDERERS[page] || RENDERERS.system;
      R(p);
      U.$$('.stg-card, .stg-group', p).forEach((c, i) => U.anim(c,
        [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 260, delay: Math.min(i * 18, 200), easing: U.EASE.decel }));
      win.setTitle('设置');
    }

    /* ================= 各页面 ================= */
    const RENDERERS = {

      /* ---------------- 系统 ---------------- */
      system(p) {
        p.appendChild(pageHead('系统'));
        p.appendChild(U.el('div.stg-card', {}, [
          U.el('div.stg-card__ico', {}, Icons.app('thispc', 24)),
          U.el('div.stg-card__txt', {}, [
            U.el('div.stg-card__t', { text: Settings.pcName }),
            U.el('div.stg-card__d', { text: 'Windows 11 专业版 · 已激活' })
          ]),
          U.el('div.stg-card__act', {}, U.el('button.btn.btn--sm', { text: '重命名', onclick: async () => {
            const n = await Notifications.prompt('重命名这台电脑', Settings.pcName, '电脑名称');
            if (n) { Settings.set('pcName', n.toUpperCase().replace(/\s+/g, '-')); render(); }
          } }))
        ]));

        p.appendChild(group('', [
          card({ title: '显示', desc: '监视器、亮度、夜间模式、显示配置文件', icon: 'monitor', onClick: () => goto('system', 'display') }),
          card({ title: '声音', desc: '音量级别、输出、输入、声音设备', icon: 'volume', onClick: () => goto('system', 'sound') }),
          card({ title: '通知', desc: '来自应用和系统的警报、免打扰', icon: 'bell', onClick: () => goto('system', 'notifications') }),
          card({ title: '专注', desc: '减少干扰', icon: 'lightbulb', action: Shell.toggle(Settings.focusAssist, v => Settings.set('focusAssist', v)) }),
          card({ title: '电源和电池', desc: '睡眠、电池使用情况、节能模式', icon: 'battery', onClick: () => goto('system', 'power') }),
          card({ title: '存储', desc: '存储空间、驱动器、配置规则', icon: 'drive', appIcon: true, onClick: () => goto('system', 'storage') }),
          card({ title: '多任务处理', desc: '贴靠窗口、桌面、任务切换', icon: 'grid', onClick: () => goto('system', 'multitask') }),
          card({ title: '疑难解答', desc: '建议的疑难解答、首选项和历史记录', icon: 'shield', onClick: () => Notifications.toast({ title: '疑难解答', body: '未检测到问题。', icon: 'shield' }) }),
          card({ title: '关于', desc: '设备规格、重命名电脑、Windows 规格', icon: 'info', onClick: () => goto('system', 'about') })
        ]));

        if (sub && this['_' + sub]) {
          U.clear(p);
          p.appendChild(pageHead(SUBTITLES[sub] || '系统'));
          this['_' + sub](p);
        }
      },

      _display(p) {
        p.appendChild(U.el('div.sg-preview', {}, [monitorPreview(), U.el('div.text-secondary', { text: '选择要更改设置的显示器\n显示器 1：内置显示器', style: { whiteSpace: 'pre-line' } })]));
        p.appendChild(group('亮度和颜色', [
          card({
            title: '亮度', desc: '调整内置显示器的亮度', icon: 'brightness',
            action: (() => { const s = Shell.slider(Settings.brightness, 20, 100, v => Settings.set('brightness', v)); s.style.width = '180px'; return s; })()
          }),
          card({
            title: '夜间模式', desc: '使用更暖的颜色帮助阻挡蓝光', icon: 'nightlight',
            action: Shell.toggle(Settings.nightLight, v => Settings.set('nightLight', v))
          }),
          card({
            title: '夜间模式强度', desc: '仅在夜间模式开启时生效', icon: 'brightness',
            action: (() => { const s = Shell.slider(Settings.nightLightStrength, 0, 100, v => Settings.set('nightLightStrength', v)); s.style.width = '180px'; return s; })()
          })
        ]));
        p.appendChild(group('缩放和布局', [
          card({ title: '缩放', desc: '更改文本、应用和其他项目的大小', icon: 'zoomIn', action: Shell.combo('100', [{ value: '100', label: '100%（推荐）' }, { value: '125', label: '125%' }, { value: '150', label: '150%' }], v => Notifications.toast({ title: '缩放', body: 'Web 版无法更改系统缩放（当前 ' + v + '%）。', icon: 'info' })) }),
          card({ title: '显示器分辨率', desc: '调整分辨率以适应连接的显示器', icon: 'monitor', action: Shell.combo('auto', [{ value: 'auto', label: window.innerWidth + ' × ' + window.innerHeight + '（推荐）' }], () => { }) }),
          card({ title: '显示方向', icon: 'rotate', action: Shell.combo('h', [{ value: 'h', label: '横向' }, { value: 'v', label: '纵向' }], () => { }) })
        ]));
      },

      _sound(p) {
        p.appendChild(group('输出', [
          card({
            title: '音量', desc: (Settings.muted ? '已静音' : Settings.volume + '%'), icon: Settings.muted ? 'volumeMute' : 'volume',
            action: (() => {
              const wrap = U.el('div.row', { style: { gap: '10px' } });
              const s = Shell.slider(Settings.volume, 0, 100, v => { Settings.set('volume', v, true); Sound.volume = v; }, () => Sound.volumeBeep());
              s.style.width = '180px';
              wrap.append(s, U.el('button.cmdbtn.cmdbtn--icon', {
                title: '静音', onclick: () => { Settings.set('muted', !Settings.muted); render(); }
              }, Icons.ui(Settings.muted ? 'volumeMute' : 'volume', 16)));
              return wrap;
            })()
          }),
          card({ title: '扬声器', desc: 'Realtek High Definition Audio · 默认输出设备', icon: 'volume', onClick: () => Notifications.toast({ title: '扬声器', body: '设备属性在 Web 版中不可用。', icon: 'volume' }) }),
          card({ title: '系统音效', desc: '开机、通知、错误提示音', icon: 'music', action: Shell.toggle(Sound.enabled, v => { Sound.enabled = v; if (v) Sound.ding(); }) })
        ]));
        p.appendChild(group('输入', [
          card({ title: '麦克风阵列', desc: '未检测到输入设备', icon: 'mic' })
        ]));
      },

      _notifications(p) {
        p.appendChild(group('通知', [
          card({ title: '通知', desc: '从应用和系统获取通知', icon: 'bell', action: Shell.toggle(!Settings.focusAssist, v => Settings.set('focusAssist', !v)) }),
          card({ title: '允许通知播放声音', icon: 'volume', action: Shell.toggle(Sound.enabled, v => Sound.enabled = v) }),
          card({ title: '清除所有通知', desc: '当前有 ' + Notifications.items.length + ' 条通知', icon: 'trash', onClick: () => { Notifications.clearAll(); render(); } }),
          card({ title: '发送测试通知', icon: 'lightbulb', onClick: () => Notifications.toast({ title: '这是一条测试通知', body: '通知系统工作正常。', appIcon: 'settings', force: true }) })
        ]));
      },

      _power(p) {
        p.appendChild(group('电池', [
          card({ title: '电池电量', desc: '86% — 剩余约 4 小时 20 分钟', icon: 'battery' }),
          card({ title: '节能模式', desc: '在电量低时自动降低性能', icon: 'battery', action: Shell.toggle(Settings.batterySaver, v => Settings.set('batterySaver', v)) })
        ]));
        p.appendChild(group('电源', [
          card({ title: '屏幕和睡眠', desc: '接通电源后 15 分钟关闭屏幕', icon: 'monitor', action: Shell.combo('15', [{ value: '5', label: '5 分钟' }, { value: '15', label: '15 分钟' }, { value: '30', label: '30 分钟' }, { value: 'never', label: '从不' }], () => { }) }),
          card({ title: '电源模式', desc: '优化设备的能耗与性能', icon: 'power', action: Shell.combo('balanced', [{ value: 'saver', label: '最佳能效' }, { value: 'balanced', label: '平衡' }, { value: 'perf', label: '最佳性能' }], () => { }) }),
          card({ title: '立即睡眠', icon: 'nightlight', onClick: () => Shell.sleep() })
        ]));
      },

      _storage(p) {
        const g = U.el('div.stg-group');
        VFS.drives().forEach(d => {
          const pct = Math.round(d.used / d.total * 100);
          g.appendChild(U.el('div.stg-card', {}, [
            U.el('div.stg-card__ico', {}, Icons.app('drive', 24)),
            U.el('div.stg-card__txt', {}, [
              U.el('div.stg-card__t', { text: d.name }),
              U.el('div.ex-drive__bar', { style: { marginTop: '6px' } }, U.el('i', { style: { width: pct + '%' } })),
              U.el('div.stg-card__d', { text: '已使用 ' + U.fmtSize(d.used) + '，共 ' + U.fmtSize(d.total) + '（' + pct + '%）' })
            ])
          ]));
        });
        p.appendChild(g);
        p.appendChild(group('存储管理', [
          card({ title: '存储感知', desc: '通过自动释放空间来管理存储', icon: 'shield', action: Shell.toggle(true, () => { }) }),
          card({ title: '清理建议', desc: '临时文件、回收站（' + VFS.recycle.length + ' 项）', icon: 'trash', onClick: () => Apps.launch('explorer', { path: 'recyclebin' }) })
        ]));
      },

      _multitask(p) {
        p.appendChild(group('贴靠窗口', [
          card({ title: '贴靠窗口', desc: '拖动窗口到屏幕边缘时自动排列', icon: 'grid', action: Shell.toggle(Settings.snapWindows, v => Settings.set('snapWindows', v)) }),
          card({ title: '贴靠时显示可贴靠的窗口（贴靠助手）', icon: 'snapLeft', action: Shell.toggle(Settings.snapAssist, v => Settings.set('snapAssist', v)) }),
          card({ title: '将鼠标悬停在最大化按钮上时显示贴靠布局', icon: 'view', action: Shell.toggle(Settings.snapWindows, v => Settings.set('snapWindows', v)) })
        ]));
        p.appendChild(group('桌面', [
          card({ title: '虚拟桌面数量', desc: '当前有 ' + TaskView.desktops.length + ' 个桌面', icon: 'desktop', onClick: () => TaskView.toggle() })
        ]));
      },

      _about(p) {
        const spec = U.el('div.stg-card', { style: { display: 'block', padding: '18px' } });
        spec.appendChild(U.el('div.stg-grouphead', { text: '设备规格' }));
        const g1 = U.el('div.sg-spec');
        const cores = navigator.hardwareConcurrency || 8;
        const mem = navigator.deviceMemory || 16;
        [['设备名称', Settings.pcName],
        ['处理器', 'Web Virtual CPU @ ' + cores + ' 核心'],
        ['机带 RAM', mem + '.0 GB'],
        ['设备 ID', 'W11-WEB-' + (navigator.userAgent.length * 977).toString(16).toUpperCase()],
        ['系统类型', '64 位操作系统，基于浏览器的虚拟平台'],
        ['笔和触控', (navigator.maxTouchPoints > 0 ? '支持触控输入（' + navigator.maxTouchPoints + ' 点）' : '没有可用于此显示器的笔或触控输入')]
        ].forEach(([k, v]) => { g1.append(U.el('div.sg-spec__k', { text: k }), U.el('div.selectable', { text: v })); });
        spec.appendChild(g1);
        p.appendChild(spec);

        const spec2 = U.el('div.stg-card', { style: { display: 'block', padding: '18px' } });
        spec2.appendChild(U.el('div.stg-grouphead', { text: 'Windows 规格' }));
        const g2 = U.el('div.sg-spec');
        [['版本', 'Windows 11 专业版'],
        ['版本号', '24H2'],
        ['安装日期', U.fmtDateShort(new Date(Date.now() - 86400e3 * 42))],
        ['操作系统内部版本', '26100.1742'],
        ['体验', 'Windows Feature Experience Pack 1000.26100.30.0'],
        ['渲染引擎', (navigator.userAgent.match(/Chrome\/[\d.]+/) || ['Chromium'])[0]]
        ].forEach(([k, v]) => { g2.append(U.el('div.sg-spec__k', { text: k }), U.el('div.selectable', { text: v })); });
        spec2.appendChild(g2);
        p.appendChild(spec2);
        p.appendChild(group('', [
          card({ title: '关于 Windows', desc: '查看 winver 对话框', icon: 'info', onClick: () => Shell.winver() }),
          card({ title: '重置所有设置', desc: '恢复默认主题、壁纸、任务栏与虚拟文件系统', icon: 'refresh', onClick: async () => {
            if (await Notifications.confirm('重置设置', '将恢复所有默认设置并重置虚拟文件系统，此操作不可撤销。', '重置')) {
              Settings.reset(); VFS.resetFS(); Desktop.render(); Taskbar.render(); render();
              Notifications.toast({ title: '已重置', body: '所有设置已恢复默认。', appIcon: 'settings' });
            }
          } })
        ]));
      },

      /* ---------------- 蓝牙和设备 ---------------- */
      bluetooth(p) {
        p.appendChild(pageHead('蓝牙和其他设备'));
        p.appendChild(group('', [
          card({ title: '蓝牙', desc: Settings.bluetooth ? '已开启，可被发现为「' + Settings.pcName + '」' : '已关闭', icon: 'bluetooth', action: Shell.toggle(Settings.bluetooth, v => { Settings.set('bluetooth', v); render(); }) }),
          card({ title: '添加设备', desc: '蓝牙、无线显示器、其他设备', icon: 'plus', onClick: () => Notifications.toast({ title: '添加设备', body: '未找到可配对的设备。', icon: 'bluetooth' }) })
        ]));
        p.appendChild(group('鼠标、键盘和笔', [
          card({ title: 'Surface 蓝牙鼠标', desc: '已连接 · 电量 78%', icon: 'pcSmall' }),
          card({ title: 'Microsoft 无线键盘', desc: '已配对', icon: 'keyboard' })
        ]));
        p.appendChild(group('音频', [
          card({ title: 'WH-1000XM5', desc: '已配对', icon: 'music' })
        ]));
        p.appendChild(group('其他设备', [
          card({ title: 'Xbox 无线控制器', desc: '已配对', icon: 'game' }),
          card({ title: 'iPhone 15', desc: '通过「手机连接」配对', icon: 'devices' })
        ]));
      },

      /* ---------------- 网络 ---------------- */
      network(p) {
        p.appendChild(pageHead('网络和 Internet', Settings.wifi && !Settings.airplane ? 'DeepSeek-5G — 已连接，安全' : '未连接'));
        p.appendChild(group('', [
          card({ title: 'WLAN', desc: Settings.wifi ? '已连接到 DeepSeek-5G' : '已关闭', icon: 'wifi', action: Shell.toggle(Settings.wifi, v => { Settings.set('wifi', v); render(); }) }),
          card({ title: '以太网', desc: '未连接', icon: 'network' }),
          card({ title: 'VPN', desc: '添加、连接、管理', icon: 'shield', onClick: () => Notifications.toast({ title: 'VPN', body: '没有已配置的 VPN 连接。', icon: 'shield' }) }),
          card({ title: '移动热点', desc: '关闭', icon: 'wifi', action: Shell.toggle(false, () => { }) }),
          card({ title: '飞行模式', desc: Settings.airplane ? '已开启' : '已关闭', icon: 'airplane', action: Shell.toggle(Settings.airplane, v => { Settings.set('airplane', v); render(); }) }),
          card({ title: '代理', desc: '用于 Wi-Fi 和以太网连接的代理服务器', icon: 'globe' })
        ]));
        p.appendChild(group('高级网络设置', [
          card({ title: '网络属性', desc: 'IPv4：192.168.1.42 · DNS：192.168.1.1', icon: 'info' })
        ]));
      },

      /* ---------------- 个性化 ---------------- */
      personalization(p) {
        p.appendChild(pageHead('个性化'));
        p.appendChild(U.el('div.sg-preview', {}, [monitorPreview()]));
        p.appendChild(group('', [
          card({ title: '背景', desc: '图片、纯色、幻灯片放映', icon: 'image', onClick: () => goto('personalization', 'background') }),
          card({ title: '颜色', desc: '强调色、透明效果、颜色模式', icon: 'palette', onClick: () => goto('personalization', 'colors') }),
          card({ title: '主题', desc: '安装、创建、管理', icon: 'palette', onClick: () => goto('personalization', 'themes') }),
          card({ title: '锁屏界面', desc: '锁屏图片、通知', icon: 'lock', onClick: () => goto('personalization', 'lockscreen') }),
          card({ title: '任务栏', desc: '任务栏行为、系统托盘图标', icon: 'dock', onClick: () => goto('personalization', 'taskbar') }),
          card({ title: '开始', desc: '最近添加的应用、推荐项目、文件夹', icon: 'grid', onClick: () => goto('personalization', 'start') })
        ]));
        if (sub && this['_' + sub]) { U.clear(p); p.appendChild(pageHead(SUBTITLES[sub] || '个性化')); this['_' + sub](p); }
      },

      _background(p) {
        p.appendChild(U.el('div.sg-preview', {}, [monitorPreview()]));
        p.appendChild(group('个性化你的背景', [
          card({
            title: '背景类型', icon: 'image',
            action: Shell.combo('image', [{ value: 'image', label: '图片' }, { value: 'solid', label: '纯色' }, { value: 'slide', label: '幻灯片放映' }], (v) => {
              if (v !== 'image') Notifications.toast({ title: '背景', body: '此版本仅支持图片背景。', icon: 'image' });
            })
          }),
          card({
            title: '选择适合桌面的图片', icon: 'gallery',
            action: U.el('button.btn.btn--sm', {
              text: '浏览照片', onclick: async () => {
                const f = await U.imgFile();
                if (!f) return;
                const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
                await Settings.setWallpaper('custom', url);
                render();
                Notifications.toast({ title: '背景已更新', body: f.name, appIcon: 'photos' });
              }
            })
          }),
          card({
            title: '选择适合桌面图像的匹配度', icon: 'crop',
            action: Shell.combo(Settings.wallpaperFit, [
              { value: 'fill', label: '填充' }, { value: 'fit', label: '适应' }, { value: 'stretch', label: '拉伸' },
              { value: 'tile', label: '平铺' }, { value: 'center', label: '居中' }
            ], v => { Settings.set('wallpaperFit', v); render(); })
          })
        ]));
        const grid = U.el('div.sg-wallgrid');
        Settings.WALLPAPERS.forEach(w => {
          const c = U.el('div.sg-wall' + (Settings.wallpaper === w.id ? '.is-active' : ''), {
            style: { backgroundImage: 'url("' + w.url + '")' }, title: w.name
          }, U.el('div.sg-wall__chk', {}, Icons.ui('check', 12)));
          c.onclick = async () => {
            await Settings.setWallpaper(w.id);
            U.$$('.sg-wall', grid).forEach(x => x.classList.remove('is-active'));
            c.classList.add('is-active');
            if (w.theme && w.theme !== Settings.theme) { /* 不强制切换主题 */ }
          };
          grid.appendChild(c);
        });
        if (Settings.wallpaperCustom) {
          const c = U.el('div.sg-wall' + (Settings.wallpaper === 'custom' ? '.is-active' : ''), {
            style: { backgroundImage: 'url("' + Settings.wallpaperCustom + '")' }, title: '自定义图片'
          }, U.el('div.sg-wall__chk', {}, Icons.ui('check', 12)));
          c.onclick = async () => { await Settings.setWallpaper('custom', Settings.wallpaperCustom); render(); };
          grid.appendChild(c);
        }
        p.appendChild(group('最近使用的图像', grid));
      },

      _colors(p) {
        p.appendChild(U.el('div.sg-preview', {}, [monitorPreview()]));
        p.appendChild(group('', [
          card({
            title: '选择模式', desc: '更改 Windows 和应用的颜色模式', icon: Settings.theme === 'dark' ? 'dark' : 'light',
            action: Shell.combo(Settings.theme, [{ value: 'dark', label: '深色' }, { value: 'light', label: '浅色' }],
              v => { Settings.set('theme', v); render(); })
          }),
          card({ title: '透明效果', desc: '让窗口和表面呈现半透明', icon: 'eye', action: Shell.toggle(Settings.transparency, v => Settings.set('transparency', v)) }),
          card({
            title: '强调色', desc: '当前：' + Settings.accentObj().name, icon: 'palette',
            action: Shell.combo('manual', [{ value: 'manual', label: '手动' }, { value: 'auto', label: '自动（从背景）' }], () => { })
          }),
          card({ title: '在"开始"菜单和任务栏上显示强调色', icon: 'dock', action: Shell.toggle(Settings.accentOnTaskbar, v => { Settings.set('accentOnTaskbar', v); Taskbar.render(); }) }),
          card({ title: '在标题栏和窗口边框上显示强调色', icon: 'windowIcon', action: Shell.toggle(Settings.accentOnTitlebar, v => Settings.set('accentOnTitlebar', v)) })
        ]));
        const grid = U.el('div.sg-accents');
        Settings.ACCENTS.forEach(a => {
          const c = U.el('button.sg-accent' + (Settings.accent === a.id ? '.is-active' : ''), {
            style: { background: a.base }, title: a.name
          });
          c.onclick = () => { Settings.set('accent', a.id); render(); Sound.click(); };
          grid.appendChild(c);
        });
        p.appendChild(group('Windows 颜色', grid));
      },

      _themes(p) {
        const themes = [
          { name: 'Windows（浅色）', wp: 'bloom-light', theme: 'light', accent: 'blue' },
          { name: 'Windows（深色）', wp: 'bloom-dark', theme: 'dark', accent: 'blue' },
          { name: '暮色山峦', wp: 'dusk', theme: 'dark', accent: 'orange' },
          { name: '流光', wp: 'glow', theme: 'dark', accent: 'purple' },
          { name: '涌动', wp: 'flow', theme: 'light', accent: 'teal' },
          { name: '光影捕捉', wp: 'captured', theme: 'dark', accent: 'pink' }
        ];
        const grid = U.el('div.sg-themes');
        themes.forEach(t => {
          const w = Settings.WALLPAPERS.find(x => x.id === t.wp);
          const active = Settings.wallpaper === t.wp && Settings.theme === t.theme && Settings.accent === t.accent;
          const c = U.el('div.sg-theme' + (active ? '.is-active' : ''), {}, [
            U.el('div.sg-theme__pv', { style: { backgroundImage: 'url("' + w.url + '")' } }),
            U.el('div.sg-theme__n', { text: t.name })
          ]);
          c.onclick = async () => {
            Settings.set('theme', t.theme, true);
            Settings.set('accent', t.accent, true);
            await Settings.setWallpaper(t.wp);
            Settings.apply(); Taskbar.render(); render();
          };
          grid.appendChild(c);
        });
        p.appendChild(group('当前主题', grid));
        p.appendChild(group('相关设置', [
          card({ title: '桌面图标设置', desc: '选择要显示在桌面上的图标', icon: 'desktop', action: Shell.toggle(Settings.desktopShowIcons, v => Settings.set('desktopShowIcons', v)) }),
          card({
            title: '桌面图标大小', icon: 'grid',
            action: Shell.combo(Settings.desktopIconSize, [{ value: 'small', label: '小' }, { value: 'medium', label: '中' }, { value: 'large', label: '大' }], v => Settings.set('desktopIconSize', v))
          })
        ]));
      },

      _lockscreen(p) {
        const grid = U.el('div.sg-wallgrid');
        Settings.WALLPAPERS.forEach(w => {
          const c = U.el('div.sg-wall' + (Settings.lockWallpaper === w.id ? '.is-active' : ''), {
            style: { backgroundImage: 'url("' + w.url + '")' }, title: w.name
          }, U.el('div.sg-wall__chk', {}, Icons.ui('check', 12)));
          c.onclick = () => { Settings.set('lockWallpaper', w.id); render(); };
          grid.appendChild(c);
        });
        p.appendChild(group('个性化锁屏界面', grid));
        p.appendChild(group('', [
          card({ title: '在登录屏幕上显示锁屏界面背景图片', icon: 'image', action: Shell.toggle(true, () => { }) }),
          card({ title: '锁屏界面状态', desc: '天气、日历、邮件', icon: 'weather', action: Shell.combo('weather', [{ value: 'weather', label: '天气' }, { value: 'cal', label: '日历' }, { value: 'none', label: '无' }], () => { }) }),
          card({ title: '立即锁定', icon: 'lock', onClick: () => Shell.lock() })
        ]));
      },

      _taskbar(p) {
        p.appendChild(U.el('div.sg-preview', {}, [monitorPreview()]));
        p.appendChild(group('任务栏项', [
          card({
            title: '搜索', desc: '在任务栏上显示搜索', icon: 'search',
            action: Shell.combo(Settings.showSearchBox, [
              { value: 'hidden', label: '隐藏' }, { value: 'icon', label: '仅搜索图标' }, { value: 'box', label: '搜索框' }
            ], v => Settings.set('showSearchBox', v))
          }),
          card({ title: '任务视图', icon: 'taskview', action: Shell.toggle(Settings.showTaskView, v => Settings.set('showTaskView', v)) }),
          card({ title: '小组件', icon: 'widgets', action: Shell.toggle(Settings.showWidgets, v => Settings.set('showWidgets', v)) })
        ]));
        p.appendChild(group('任务栏行为', [
          card({
            title: '任务栏对齐方式', icon: 'dock',
            action: Shell.combo(Settings.taskbarAlign, [{ value: 'center', label: '居中' }, { value: 'left', label: '左对齐' }], v => Settings.set('taskbarAlign', v))
          }),
          card({
            title: '任务栏大小', icon: 'grid',
            action: Shell.combo(Settings.taskbarSize, [{ value: 'small', label: '小' }, { value: 'medium', label: '中' }, { value: 'large', label: '大' }], v => Settings.set('taskbarSize', v))
          }),
          card({ title: '自动隐藏任务栏', icon: 'eye', action: Shell.toggle(Settings.taskbarAutoHide, v => Settings.set('taskbarAutoHide', v)) }),
          card({ title: '在任务栏角落显示秒数', icon: 'time', action: Shell.toggle(Settings.showSeconds, v => Settings.set('showSeconds', v)) })
        ]));
      },

      _start(p) {
        p.appendChild(group('布局', [
          card({ title: '显示最近添加的应用', icon: 'apps', action: Shell.toggle(true, () => { }) }),
          card({ title: '显示最常用的应用', icon: 'star', action: Shell.toggle(true, () => { }) }),
          card({ title: '在"开始"菜单、跳转列表中显示最近打开的项目', icon: 'history', action: Shell.toggle(true, () => { }) }),
          card({ title: '已固定的应用数量', desc: '当前 ' + Settings.pinnedStart.length + ' 个', icon: 'pin', onClick: () => Flyout.open('start') })
        ]));
      },

      /* ---------------- 应用 ---------------- */
      apps(p) {
        p.appendChild(pageHead('应用'));
        const list = U.el('div.stg-group');
        Apps.all().sort((a, b) => a.name.localeCompare(b.name, 'zh')).forEach(a => {
          list.appendChild(U.el('div.stg-card', {}, [
            U.el('div.stg-card__ico', {}, Icons.app(a.icon, 28)),
            U.el('div.stg-card__txt', {}, [
              U.el('div.stg-card__t', { text: a.name }),
              U.el('div.stg-card__d', { text: (a.category || '应用') + ' · ' + (a.size.w + '×' + a.size.h) })
            ]),
            U.el('div.stg-card__act', {}, [
              U.el('button.btn.btn--sm', { text: '打开', onclick: () => Apps.launch(a.id) }),
              U.el('button.cmdbtn.cmdbtn--icon', {
                title: '更多', onclick: (e) => {
                  Menu.show([
                    { label: '固定到"开始"屏幕', icon: 'pin', onClick: () => { if (!Settings.pinnedStart.includes(a.id)) Settings.set('pinnedStart', Settings.pinnedStart.concat([a.id])); } },
                    { label: '固定到任务栏', icon: 'pin', onClick: () => { if (!Settings.pinnedTaskbar.includes(a.id)) { Settings.set('pinnedTaskbar', Settings.pinnedTaskbar.concat([a.id])); Taskbar.renderApps(); } } },
                    { separator: true },
                    { label: '卸载', icon: 'trash', danger: true, onClick: () => Notifications.dialog({ title: '卸载 ' + a.name, body: '内置系统组件无法卸载。', icon: 'warning' }) }
                  ], { x: e.clientX, y: e.clientY });
                }
              }, Icons.ui('more', 16))
            ])
          ]));
        });
        p.appendChild(group('已安装的应用（' + Apps.all().length + '）', list));
      },

      /* ---------------- 账户 ---------------- */
      accounts(p) {
        p.appendChild(pageHead('账户'));
        p.appendChild(U.el('div.stg-card', {}, [
          U.el('div.stg-card__ico', { style: { width: '48px', height: '48px' } }, Settings.userAvatar ? U.el('img', { src: Settings.userAvatar, style: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' } }) : Icons.app('user', 48)),
          U.el('div.stg-card__txt', {}, [
            U.el('div.stg-card__t', { text: Settings.userName }),
            U.el('div.stg-card__d', { text: Settings.userEmail + ' · 管理员' })
          ])
        ]));
        p.appendChild(group('账户设置', [
          card({
            title: '你的信息', desc: '更改用户名与头像', icon: 'person',
            action: U.el('div.row', { style: { gap: '8px' } }, [
              U.el('button.btn.btn--sm', {
                text: '改名', onclick: async () => {
                  const n = await Notifications.prompt('更改用户名', Settings.userName, '用户名');
                  if (n) { Settings.set('userName', n); VFS.user = n; Desktop.render(); render(); }
                }
              }),
              U.el('button.btn.btn--sm', {
                text: '换头像', onclick: async () => {
                  const f = await U.imgFile();
                  if (!f) return;
                  const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
                  Settings.set('userAvatar', url); render();
                  Notifications.toast({ title: '头像已更新', appIcon: 'user' });
                }
              })
            ])
          }),
          card({ title: '电子邮件和账户', desc: '管理用于邮件、日历的账户', icon: 'mail', onClick: () => Apps.launch('mail') }),
          card({ title: '登录选项', desc: 'Windows Hello、PIN、动态锁', icon: 'lock', onClick: () => Notifications.toast({ title: '登录选项', body: 'Web 版使用演示 PIN：任意 4 位数字。', icon: 'lock' }) }),
          card({ title: '其他用户', desc: '添加或移除其他账户', icon: 'person' })
        ]));
      },

      /* ---------------- 时间和语言 ---------------- */
      time(p) {
        p.appendChild(pageHead('时间和语言'));
        p.appendChild(group('日期和时间', [
          card({ title: '当前时间', desc: U.fmtDateLong() + ' ' + U.fmtTime(new Date(), true), icon: 'time' }),
          card({ title: '自动设置时间', icon: 'refresh', action: Shell.toggle(true, () => { }) }),
          card({
            title: '时区', desc: '(UTC+08:00) 北京，重庆，香港特别行政区，乌鲁木齐', icon: 'globe',
            action: Shell.combo('cst', [{ value: 'cst', label: 'UTC+08:00 北京' }, { value: 'utc', label: 'UTC+00:00 伦敦' }, { value: 'pst', label: 'UTC-08:00 太平洋' }], () => { })
          }),
          card({ title: '使用 24 小时制', icon: 'clock', action: Shell.toggle(Settings.hourFormat24, v => { Settings.set('hourFormat24', v); Taskbar.tickClock(); }) }),
          card({ title: '在任务栏时钟中显示秒数', icon: 'time', action: Shell.toggle(Settings.showSeconds, v => { Settings.set('showSeconds', v); Taskbar.tickClock(); }) })
        ]));
        p.appendChild(group('语言和区域', [
          card({ title: 'Windows 显示语言', desc: '中文（简体，中国）', icon: 'translate', action: Shell.combo('zh', [{ value: 'zh', label: '中文（简体）' }, { value: 'en', label: 'English (US)' }], v => { if (v !== 'zh') Notifications.toast({ title: '语言', body: '此版本仅提供简体中文界面。', icon: 'translate' }); }) }),
          card({ title: '首选语言', desc: '中文（简体，中国）· 微软拼音', icon: 'keyboard' })
        ]));
      },

      /* ---------------- 游戏 ---------------- */
      gaming(p) {
        p.appendChild(pageHead('游戏'));
        p.appendChild(group('', [
          card({ title: 'Xbox Game Bar', desc: '使用 Win+G 打开游戏栏', icon: 'game', action: Shell.toggle(false, () => { }) }),
          card({ title: '游戏捕获', desc: '录制游戏剪辑与屏幕截图', icon: 'camera2', onClick: () => Apps.launch('explorer', { path: VFS.special('videos') }) }),
          card({ title: '游戏模式', desc: '优化电脑以获得更好的游戏体验', icon: 'lightbulb', action: Shell.toggle(true, () => { }) }),
          card({ title: '玩个小游戏', desc: '打开扫雷', icon: 'minesweeper', appIcon: true, onClick: () => Apps.launch('minesweeper') })
        ]));
      },

      /* ---------------- 辅助功能 ---------------- */
      accessibility(p) {
        p.appendChild(pageHead('辅助功能'));
        p.appendChild(group('视觉', [
          card({ title: '动画效果', desc: '关闭可减少动态效果', icon: 'lightbulb', action: Shell.toggle(Settings.animations, v => Settings.set('animations', v)) }),
          card({ title: '透明效果', icon: 'eye', action: Shell.toggle(Settings.transparency, v => Settings.set('transparency', v)) }),
          card({ title: '文本大小', desc: '更改所有应用与文本的大小', icon: 'text', action: (() => { const s = Shell.slider(100, 100, 150, v => document.documentElement.style.fontSize = (v / 100 * 16) + 'px'); s.style.width = '160px'; return s; })() }),
          card({ title: '鼠标指针和触控', desc: '指针大小与颜色', icon: 'pcSmall' }),
          card({ title: '颜色滤镜', desc: '灰度、反转', icon: 'palette', action: Shell.combo('none', [{ value: 'none', label: '关闭' }, { value: 'gray', label: '灰度' }, { value: 'invert', label: '反转' }], v => {
            const os = document.getElementById('os');
            os.style.filter = v === 'gray' ? 'grayscale(1)' : v === 'invert' ? 'invert(1) hue-rotate(180deg)' : '';
          }) })
        ]));
        p.appendChild(group('听觉与交互', [
          card({ title: '单声道音频', icon: 'volume', action: Shell.toggle(false, () => { }) }),
          card({ title: '讲述人', desc: '朗读屏幕上的文本', icon: 'mic', action: Shell.toggle(false, v => { if (v) Notifications.toast({ title: '讲述人', body: 'Web 版不支持讲述人。', icon: 'mic' }); }) }),
          card({ title: '键盘', desc: '粘滞键、切换键、筛选键', icon: 'keyboard' })
        ]));
      },

      /* ---------------- 隐私和安全性 ---------------- */
      privacy(p) {
        p.appendChild(pageHead('隐私和安全性'));
        p.appendChild(group('安全性', [
          card({ title: 'Windows 安全中心', desc: '病毒和威胁防护、防火墙都正常', icon: 'shield', onClick: () => Notifications.toast({ title: 'Windows 安全中心', body: '设备受到保护，无需执行任何操作。', icon: 'shield', force: true }) }),
          card({ title: '查找我的设备', desc: '关闭', icon: 'globe', action: Shell.toggle(false, () => { }) }),
          card({ title: '面向开发人员', desc: '开发人员模式、终端设置', icon: 'apps', action: Shell.toggle(true, () => { }) })
        ]));
        p.appendChild(group('Windows 权限', [
          card({ title: '常规', desc: '广告 ID、本地内容、应用启动跟踪', icon: 'privacy', action: Shell.toggle(false, () => { }) }),
          card({ title: '语音', desc: '在线语音识别', icon: 'mic', action: Shell.toggle(false, () => { }) }),
          card({ title: '诊断和反馈', desc: '可选诊断数据', icon: 'info', action: Shell.toggle(false, () => { }) }),
          card({ title: '活动历史记录', icon: 'history', action: Shell.toggle(false, () => { }) })
        ]));
        p.appendChild(group('应用权限', [
          card({ title: '位置', desc: Settings.wifi ? '已允许 1 个应用' : '已关闭', icon: 'globe', action: Shell.toggle(false, () => { }) }),
          card({ title: '相机', desc: '未检测到相机', icon: 'camera2', action: Shell.toggle(false, () => { }) }),
          card({ title: '麦克风', icon: 'mic', action: Shell.toggle(false, () => { }) }),
          card({ title: '通知', icon: 'bell', action: Shell.toggle(!Settings.focusAssist, v => Settings.set('focusAssist', !v)) })
        ]));
      },

      /* ---------------- Windows 更新 ---------------- */
      update(p) {
        p.appendChild(pageHead('Windows 更新'));
        const box = U.el('div.sg-update');
        const ico = U.el('div.sg-update__ico', {}, Icons.ui('check', 24));
        const txt = U.el('div.stg-card__txt', {}, [
          U.el('div.stg-card__t', { text: '你使用的是最新版本' }),
          U.el('div.stg-card__d', { text: '上次检查时间：今天 ' + U.fmtTime() })
        ]);
        const btn = U.el('button.btn.btn--accent', { text: '检查更新' });
        btn.onclick = async () => {
          U.clear(ico).appendChild(U.el('div.spinner'));
          txt.firstChild.textContent = '正在检查更新…';
          txt.lastChild.textContent = '正在连接 Windows 更新服务';
          btn.disabled = true;
          await U.sleep(1800);
          txt.firstChild.textContent = '有可用的更新';
          txt.lastChild.textContent = '2025-06 适用于 Windows 11 Web 版的累积更新（KB5039212）';
          U.clear(ico).appendChild(Icons.ui('download', 24));
          const dl = U.el('button.btn.btn--accent', { text: '下载并安装' });
          btn.replaceWith(dl);
          dl.onclick = async () => {
            dl.disabled = true;
            const bar = U.el('div.progress-bar', { style: { width: '220px', marginTop: '8px' } }, U.el('i', { style: { width: '0%' } }));
            txt.appendChild(bar);
            for (let i = 0; i <= 100; i += 4) {
              bar.firstChild.style.width = i + '%';
              txt.lastChild.previousSibling ? null : null;
              txt.children[1].textContent = '正在下载 — ' + i + '%';
              await U.sleep(70);
            }
            txt.children[1].textContent = '需要重启以完成安装';
            U.clear(ico).appendChild(Icons.ui('refresh', 24));
            dl.replaceWith(U.el('button.btn.btn--accent', { text: '立即重启', onclick: () => Shell.restart() }));
          };
        };
        box.append(ico, txt, U.el('div.spacer'), btn);
        p.appendChild(box);
        p.appendChild(group('更多选项', [
          card({ title: '暂停更新', desc: '最多可暂停 5 周', icon: 'pause', action: Shell.combo('1', [{ value: '1', label: '暂停 1 周' }, { value: '2', label: '暂停 2 周' }], () => { }) }),
          card({ title: '更新历史记录', desc: '查看已安装的更新', icon: 'history', onClick: () => Notifications.toast({ title: '更新历史记录', body: '已成功安装 12 项更新。', icon: 'history' }) }),
          card({ title: '高级选项', desc: '传递优化、活动时间、可选更新', icon: 'settings' }),
          card({ title: '获取最新更新（预览体验计划）', icon: 'lightbulb', action: Shell.toggle(false, () => { }) })
        ]));
      }
    };

    const SUBTITLES = {
      display: '显示', sound: '声音', notifications: '通知', power: '电源和电池',
      storage: '存储', about: '关于', multitask: '多任务处理',
      background: '背景', colors: '颜色', themes: '主题', lockscreen: '锁屏界面',
      taskbar: '任务栏', start: '开始'
    };

    buildNav();
    render();

    const off = U.bus.on('settings:change', U.debounce(() => { if (win.el.isConnected) render(); }, 120));
    win.on('close', off);
    win.settingsGoto = goto;
  }

  Apps.register({
    id: 'settings', name: '设置', icon: 'settings', category: '系统',
    size: { w: 1080, h: 720 }, minSize: { w: 640, h: 420 },
    singleton: true, mount, sortKey: 'shezhi',
    onReactivate: (win, args) => { if (args && args.page && win.settingsGoto) win.settingsGoto(args.page, args.sub); }
  });
})(window);
