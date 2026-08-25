/* ============================================================
   mediaplayer.js — 媒体播放器（音乐库 / 播放控制 / 可视化）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('mediaplayer', `
  .mp-root { display:flex; flex-direction:column; height:100%; min-height:0; }
  .mp-body { flex:1 1 auto; min-height:0; display:flex; }
  .mp-nav { width:200px; flex:none; padding:8px 4px 8px 8px; display:flex; flex-direction:column; gap:2px; }
  .mp-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; overflow:hidden;
    background: var(--bg-solid); border-top-left-radius:8px; box-shadow: inset 1px 1px 0 var(--stroke-control); }
  [data-theme="dark"] .mp-main { background: rgba(255,255,255,.025); }
  .mp-head { flex:none; display:flex; align-items:flex-end; gap:20px; padding:22px 24px 16px; }
  .mp-art { width:132px; height:132px; border-radius:var(--r-lg); flex:none; display:grid; place-items:center;
    background:linear-gradient(140deg,#2b7fd4,#7c4dff); box-shadow:0 8px 24px rgba(0,0,0,.3); }
  .mp-scroll { flex:1 1 auto; min-height:0; overflow:auto; padding:0 12px 16px; }
  .mp-trow { display:grid; grid-template-columns:32px 2.4fr 1.4fr 1fr 64px; align-items:center; height:44px;
    padding:0 12px; border-radius:var(--r-sm); font-size:var(--fs-body); cursor:default; }
  .mp-trow:hover { background: var(--fill-subtle-hover); }
  .mp-trow.is-playing { background: var(--fill-accent-subtle); color: var(--text-accent); }
  .mp-thead { display:grid; grid-template-columns:32px 2.4fr 1.4fr 1fr 64px; height:30px; padding:0 12px;
    font-size:var(--fs-caption); color:var(--text-secondary); border-bottom:1px solid var(--stroke-divider); align-items:center; }
  .mp-bar { flex:none; height:84px; display:flex; align-items:center; gap:14px; padding:0 18px;
    border-top:1px solid var(--stroke-divider); background: var(--bg-card-2); }
  .mp-nowart { width:52px; height:52px; border-radius:var(--r-sm); flex:none; display:grid; place-items:center;
    background:linear-gradient(140deg,#2b7fd4,#7c4dff); }
  .mp-ctrls { display:flex; align-items:center; gap:6px; }
  .mp-cbtn { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; color:var(--text-primary);
    transition: background-color var(--dur-fast) linear, transform 80ms var(--ease-decel); }
  .mp-cbtn:hover { background: var(--fill-subtle-hover); }
  .mp-cbtn:active { transform:scale(.92); }
  .mp-play { width:40px; height:40px; background:var(--fill-accent); color:var(--text-onaccent); }
  .mp-play:hover { background:var(--fill-accent-hover); }
  .mp-seek { flex:1; min-width:80px; display:flex; align-items:center; gap:10px; }
  .mp-viz { display:flex; align-items:flex-end; gap:2px; height:28px; width:70px; }
  .mp-viz i { flex:1; background:var(--fill-accent); border-radius:1px; height:20%; transition:height .12s linear; }
  .mp-empty { flex:1; display:grid; place-items:center; }
  `);

  const AUDIO_EXT = ['mp3', 'wav', 'flac', 'm4a', 'ogg'];
  const VIDEO_EXT = ['mp4', 'mkv', 'webm', 'mov', 'avi'];

  const ARTISTS = ['Fluent Ensemble', 'Acrylic Waves', 'Mica Quartet', 'Bloom Collective', 'Aurora Signal'];
  const ALBUMS = ['Design Tokens', 'Windows Chimes', 'Layers', 'Depth of Field', 'Snap Layouts'];

  function mount(win, args) {
    win.setBodyBg('');
    const root = U.el('div.mp-root');
    const body = U.el('div.mp-body');
    const nav = U.el('div.mp-nav');
    const main = U.el('div.mp-main');
    const bar = U.el('div.mp-bar');
    body.append(nav, main);
    root.append(body, bar);
    win.body.appendChild(root);

    let page = 'music', tracks = [], idx = -1, playing = false, pos = 0, dur = 0, vol = Settings.volume, shuffle = false, repeat = false;
    let timer = null, vizTimer = null;

    function collect() {
      const out = [];
      const walk = (dir, kind) => {
        VFS.list(dir).forEach(e => {
          if (e.type === 'dir') walk(e.path, kind);
          else {
            const isA = AUDIO_EXT.includes(e.ext), isV = VIDEO_EXT.includes(e.ext);
            if ((kind === 'music' && isA) || (kind === 'video' && isV)) {
              const seed = e.name.length + (e.size || 0) % 97;
              out.push({
                name: VFS.stem(e.name), file: e.name, path: e.path, video: isV,
                artist: ARTISTS[seed % ARTISTS.length], album: ALBUMS[seed % ALBUMS.length],
                dur: 120 + (seed * 7) % 200, size: e.size
              });
            }
          }
        });
      };
      if (page === 'music') { walk(VFS.special('music'), 'music'); walk(VFS.special('downloads'), 'music'); }
      else if (page === 'video') { walk(VFS.special('videos'), 'video'); walk(VFS.special('downloads'), 'video'); }
      return out;
    }

    const NAVS = [
      { id: 'home', name: '主页', icon: 'home' },
      { id: 'music', name: '音乐库', icon: 'music' },
      { id: 'video', name: '视频库', icon: 'video2' },
      { id: 'play', name: '播放列表', icon: 'list' }
    ];

    function buildNav() {
      U.clear(nav);
      NAVS.forEach(n => {
        const it = U.el('div.navitem' + (n.id === page ? '.is-active' : ''), { tabindex: 0 }, [
          U.el('div.navitem__ico', {}, Icons.ui(n.icon, 16)),
          U.el('div.navitem__label', { text: n.name })
        ]);
        it.onclick = () => { page = n.id; render(); };
        nav.appendChild(it);
      });
      nav.appendChild(U.el('div.spacer'));
      const add = U.el('div.navitem', {}, [U.el('div.navitem__ico', {}, Icons.ui('plus', 16)), U.el('div.navitem__label', { text: '添加文件夹' })]);
      add.onclick = () => Apps.launch('explorer', { path: VFS.special('music') });
      nav.appendChild(add);
    }

    const fmt = (s) => Math.floor(s / 60) + ':' + U.pad(Math.floor(s % 60));

    function render() {
      U.clear(main);
      buildNav();
      tracks = collect();

      if (page === 'home') {
        main.appendChild(U.el('div.mp-head', {}, [
          U.el('div.mp-art', {}, Icons.app('mediaplayer', 64)),
          U.el('div', {}, [
            U.el('div.caption.text-secondary', { text: '媒体播放器' }),
            U.el('div', { text: '你的音乐与视频', style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-title)', fontWeight: 600 } }),
            U.el('div.caption.text-secondary', { text: '音乐 ' + collectCount('music') + ' 首 · 视频 ' + collectCount('video') + ' 个' })
          ])
        ]));
        const sc = U.el('div.mp-scroll');
        [['音乐库', 'music', 'music'], ['视频库', 'video', 'video2'], ['播放列表', 'play', 'list']].forEach(([n, id, ic]) => {
          const c = U.el('div.stg-card.stg-card--btn', {}, [
            U.el('div.stg-card__ico', {}, Icons.ui(ic, 20)),
            U.el('div.stg-card__txt', {}, [U.el('div.stg-card__t', { text: n })]),
            U.el('div.stg-card__act', {}, Icons.ui('chevronRight', 14))
          ]);
          c.onclick = () => { page = id; render(); };
          sc.appendChild(c);
        });
        main.appendChild(sc);
        return;
      }
      if (page === 'play') {
        main.appendChild(U.el('div.mp-empty', {}, U.el('div.empty-state', {}, [
          Icons.ui('list', 48), U.el('div.empty-state__title', { text: '还没有播放列表' }),
          U.el('div.caption', { text: '在音乐库中右键歌曲即可加入新建列表。' })
        ])));
        return;
      }

      const isVideo = page === 'video';
      main.appendChild(U.el('div.mp-head', {}, [
        U.el('div.mp-art', {}, Icons.ui(isVideo ? 'video2' : 'music', 56)),
        U.el('div', {}, [
          U.el('div.caption.text-secondary', { text: isVideo ? '视频库' : '音乐库' }),
          U.el('div', { text: isVideo ? '所有视频' : '所有曲目', style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-title)', fontWeight: 600 } }),
          U.el('div.caption.text-secondary', { text: tracks.length + ' 个项目 · ' + fmt(tracks.reduce((s, t) => s + t.dur, 0)) }),
          (() => {
            const w = U.el('div', { style: { marginTop: '12px', display: 'flex', gap: '8px' } });
            const p = U.el('button.btn.btn--accent', {}, [Icons.ui('play', 14), U.el('span', { text: '全部播放' })]);
            p.onclick = () => { if (tracks.length) { idx = 0; start(); } };
            const s = U.el('button.btn', {}, [Icons.ui('refresh', 14), U.el('span', { text: '随机播放' })]);
            s.onclick = () => { if (tracks.length) { shuffle = true; idx = U.randInt(0, tracks.length - 1); start(); } };
            w.append(p, s);
            return w;
          })()
        ])
      ]));

      if (!tracks.length) {
        main.appendChild(U.el('div.mp-empty', {}, U.el('div.empty-state', {}, [
          Icons.app('mediaplayer', 56),
          U.el('div.empty-state__title', { text: isVideo ? '视频库为空' : '音乐库为空' }),
          U.el('div.caption', { text: '把媒体文件放到「' + (isVideo ? '视频' : '音乐') + '」文件夹即可显示在此处。' })
        ])));
        return;
      }

      const sc = U.el('div.mp-scroll');
      sc.appendChild(U.el('div.mp-thead', {}, [
        U.el('div', { text: '#' }), U.el('div', { text: '标题' }),
        U.el('div', { text: isVideo ? '文件夹' : '艺术家' }), U.el('div', { text: isVideo ? '大小' : '专辑' }),
        U.el('div', { text: '时长', style: { textAlign: 'right' } })
      ]));
      tracks.forEach((t, i) => {
        const row = U.el('div.mp-trow' + (i === idx ? '.is-playing' : ''), {}, [
          U.el('div', {}, i === idx && playing ? viz(true) : U.el('span', { text: String(i + 1) })),
          U.el('div.truncate', {}, [Icons.ui(t.video ? 'video2' : 'music', 14), U.el('span', { text: '  ' + t.name })]),
          U.el('div.truncate', { text: isVideo ? VFS.basename(VFS.parent(t.path)) : t.artist }),
          U.el('div.truncate', { text: isVideo ? U.fmtSize(t.size || 0) : t.album }),
          U.el('div', { text: fmt(t.dur), style: { textAlign: 'right' } })
        ]);
        row.ondblclick = () => { idx = i; start(); };
        row.onclick = () => { U.$$('.mp-trow', sc).forEach(r => r.classList.remove('is-sel')); row.classList.add('is-sel'); };
        row.oncontextmenu = (e) => {
          e.preventDefault();
          Menu.show([
            { label: '播放', icon: 'play', onClick: () => { idx = i; start(); } },
            { label: '添加到播放列表', icon: 'plus', onClick: () => Notifications.toast({ title: '播放列表', body: '已添加：' + t.name, appIcon: 'mediaplayer' }) },
            { separator: true },
            { label: '打开文件位置', icon: 'folder', onClick: () => Apps.launch('explorer', { path: VFS.parent(t.path) }) },
            { label: '属性', icon: 'info', onClick: () => Shell.showProperties(t.path) }
          ], { x: e.clientX, y: e.clientY });
        };
        sc.appendChild(row);
      });
      main.appendChild(sc);
    }

    function collectCount(kind) {
      const save = page; page = kind; const n = collect().length; page = save; return n;
    }

    function viz(small) {
      const v = U.el('div.mp-viz', small ? { style: { width: '18px', height: '16px' } } : null);
      for (let i = 0; i < (small ? 3 : 7); i++) v.appendChild(U.el('i'));
      return v;
    }

    /* ---------- 播放控制 ---------- */
    function start() {
      const t = tracks[idx];
      if (!t) return;
      pos = 0; dur = t.dur; playing = true;
      Sound.ding();
      run();
      render(); renderBar();
      Notifications.toast({ title: '正在播放', body: t.name + ' — ' + t.artist, appIcon: 'mediaplayer', timeout: 2400 });
    }
    function run() {
      clearInterval(timer);
      timer = setInterval(() => {
        if (!playing) return;
        pos++;
        if (pos >= dur) {
          if (repeat) pos = 0;
          else if (idx < tracks.length - 1) { idx = shuffle ? U.randInt(0, tracks.length - 1) : idx + 1; pos = 0; dur = tracks[idx].dur; render(); }
          else { playing = false; pos = dur; }
        }
        renderBar(true);
      }, 1000);
      clearInterval(vizTimer);
      vizTimer = setInterval(() => {
        U.$$('.mp-viz i').forEach(b => { b.style.height = (playing ? U.randInt(18, 100) : 12) + '%'; });
      }, 140);
    }
    function toggle() { playing = !playing; if (playing) run(); renderBar(); render(); }
    function step(d) {
      if (!tracks.length) return;
      idx = U.clamp(idx + d, 0, tracks.length - 1);
      start();
    }

    function renderBar(seekOnly) {
      const t = tracks[idx];
      if (seekOnly && bar._seek) {
        bar._seek.setValue(dur ? pos / dur * 100 : 0);
        if (bar._time) bar._time.textContent = fmt(pos);
        return;
      }
      U.clear(bar);
      bar.append(
        U.el('div.mp-nowart', {}, Icons.ui(t && t.video ? 'video2' : 'music', 22)),
        U.el('div', { style: { width: '190px', minWidth: 0 } }, [
          U.el('div.truncate', { text: t ? t.name : '未在播放', style: { fontSize: 'var(--fs-body)' } }),
          U.el('div.truncate.caption.text-secondary', { text: t ? t.artist + ' · ' + t.album : '从库中选择一首曲目' })
        ])
      );
      const ctrls = U.el('div.mp-ctrls');
      const cb = (icon, label, fn, cls) => { const b = U.el('button.mp-cbtn' + (cls ? '.' + cls : ''), { title: label }, Icons.ui(icon, cls === 'mp-play' ? 18 : 15)); b.onclick = fn; U.tooltip(b, label); return b; };
      ctrls.append(
        cb('refresh', shuffle ? '随机播放：开' : '随机播放：关', () => { shuffle = !shuffle; renderBar(); }),
        cb('prev', '上一首', () => step(-1)),
        cb(playing ? 'pause' : 'play', playing ? '暂停' : '播放', toggle, 'mp-play'),
        cb('next', '下一首', () => step(1)),
        cb('history', repeat ? '循环：开' : '循环：关', () => { repeat = !repeat; renderBar(); })
      );
      if (shuffle) ctrls.children[0].style.color = 'var(--text-accent)';
      if (repeat) ctrls.children[4].style.color = 'var(--text-accent)';
      bar.appendChild(ctrls);

      const seekWrap = U.el('div.mp-seek');
      const cur = U.el('span.caption', { text: fmt(pos), style: { width: '38px', textAlign: 'right' } });
      const sl = Shell.slider(dur ? pos / dur * 100 : 0, 0, 100, (v) => { pos = Math.round(v / 100 * dur); cur.textContent = fmt(pos); });
      seekWrap.append(cur, sl, U.el('span.caption', { text: fmt(dur), style: { width: '38px' } }));
      bar._seek = sl; bar._time = cur;
      bar.appendChild(seekWrap);

      bar.appendChild(viz());
      const volWrap = U.el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', width: '130px' } });
      const vi = U.el('button.mp-cbtn', { title: '音量' }, Icons.ui(vol === 0 ? 'volumeMute' : 'volume', 15));
      const vs = Shell.slider(vol, 0, 100, v => { vol = v; Settings.set('volume', v, true); Sound.volume = v; U.clear(vi).appendChild(Icons.ui(v === 0 ? 'volumeMute' : 'volume', 15)); });
      vi.onclick = () => { vol = vol === 0 ? 30 : 0; vs.setValue(vol); Settings.set('volume', vol, true); U.clear(vi).appendChild(Icons.ui(vol === 0 ? 'volumeMute' : 'volume', 15)); };
      volWrap.append(vi, vs);
      bar.append(volWrap,
        U.el('button.mp-cbtn', { title: '全屏', onclick: () => win.toggleMax() }, Icons.ui('fullscreen', 15)));
    }

    win.body.tabIndex = 0;
    win.body.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.key === 'ArrowRight' && e.ctrlKey) step(1);
      if (e.key === 'ArrowLeft' && e.ctrlKey) step(-1);
    });
    win.on('close', () => { clearInterval(timer); clearInterval(vizTimer); });

    if (args && args.path) {
      const isV = VIDEO_EXT.includes(VFS.ext(VFS.basename(args.path)));
      page = isV ? 'video' : 'music';
      tracks = collect();
      const i = tracks.findIndex(t => t.path === args.path);
      render();
      if (i >= 0) { idx = i; start(); }
      else renderBar();
      return;
    }
    render(); renderBar(); run();
  }

  Apps.register({
    id: 'mediaplayer', name: '媒体播放器', icon: 'mediaplayer', category: '媒体',
    size: { w: 1060, h: 700 }, minSize: { w: 620, h: 420 }, mount, singleton: true, sortKey: 'meiti'
  });
})(window);
