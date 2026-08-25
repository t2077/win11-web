/* ============================================================
   photos.js — 照片（图库网格 / 查看器 / 缩放旋转 / 幻灯片）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('photos', `
  .ph-root { display:flex; flex-direction:column; height:100%; min-height:0; }
  .ph-bar { flex:none; display:flex; align-items:center; gap:6px; padding:8px 12px; }
  .ph-title { font-family:var(--font-display); font-size:var(--fs-body-lg); font-weight:600; margin-right:8px; }
  .ph-grid { flex:1 1 auto; min-height:0; overflow:auto; padding:8px 16px 20px;
    display:grid; grid-template-columns:repeat(auto-fill,minmax(168px,1fr)); gap:10px; align-content:start; }
  .ph-cell { position:relative; aspect-ratio:1; border-radius:var(--r-lg); overflow:hidden; cursor:default;
    background: var(--fill-control); box-shadow: inset 0 0 0 1px var(--stroke-card);
    transition: transform var(--dur-normal) var(--ease-decel), box-shadow var(--dur-fast) linear; }
  .ph-cell:hover { transform:scale(1.02); box-shadow:0 6px 18px rgba(0,0,0,.28); }
  .ph-cell__img { position:absolute; inset:0; background-size:cover; background-position:center; }
  .ph-cell__cap { position:absolute; left:0; right:0; bottom:0; padding:22px 10px 8px; font-size:var(--fs-caption);
    color:#fff; background:linear-gradient(transparent, rgba(0,0,0,.72)); opacity:0;
    transition:opacity var(--dur-fast) linear; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ph-cell:hover .ph-cell__cap { opacity:1; }
  .ph-groupname { grid-column:1/-1; font-size:var(--fs-body); font-weight:600; padding:12px 2px 2px; }
  .ph-view { flex:1 1 auto; min-height:0; position:relative; display:flex; flex-direction:column; background:#111; }
  .ph-stage { flex:1 1 auto; min-height:0; display:grid; place-items:center; overflow:hidden; position:relative; }
  .ph-stage img { max-width:100%; max-height:100%; transition:transform var(--dur-normal) var(--ease-decel);
    user-select:none; -webkit-user-drag:none; }
  .ph-navbtn { position:absolute; top:50%; transform:translateY(-50%); width:44px; height:44px; border-radius:50%;
    background:rgba(0,0,0,.45); color:#fff; display:grid; place-items:center; backdrop-filter:blur(8px); }
  .ph-navbtn:hover { background:rgba(0,0,0,.65); }
  .ph-film { flex:none; height:78px; display:flex; gap:6px; padding:8px 12px; overflow-x:auto;
    background:rgba(0,0,0,.5); backdrop-filter:blur(12px); }
  .ph-film__i { width:96px; height:62px; flex:none; border-radius:var(--r-sm); background-size:cover;
    background-position:center; opacity:.6; transition:opacity var(--dur-fast) linear, transform var(--dur-fast) var(--ease-decel); }
  .ph-film__i:hover { opacity:.9; }
  .ph-film__i.is-active { opacity:1; box-shadow:0 0 0 2px var(--fill-accent); transform:translateY(-2px); }
  .ph-vbar { flex:none; display:flex; align-items:center; justify-content:center; gap:4px; padding:8px;
    background:rgba(0,0,0,.5); backdrop-filter:blur(12px); }
  .ph-vbtn { width:36px; height:36px; border-radius:var(--r-sm); display:grid; place-items:center; color:#fff; }
  .ph-vbtn:hover { background:rgba(255,255,255,.14); }
  .ph-empty { flex:1; display:grid; place-items:center; }
  `);

  const IMG_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'];

  function mount(win, args) {
    win.setBodyBg('');
    const root = U.el('div.ph-root');
    win.body.appendChild(root);

    let mode = 'grid', index = 0, zoom = 1, rot = 0, slideTimer = null;
    let items = [];

    function collect() {
      const out = [];
      const walk = (dir) => {
        VFS.list(dir).forEach(e => {
          if (e.type === 'dir') walk(e.path);
          else if (IMG_EXT.includes(e.ext)) {
            const n = e.node;
            const src = n.src || (n.content && /^data:image/.test(n.content) ? n.content : null);
            if (src) out.push({ name: e.name, path: e.path, src, modified: e.modified, size: e.size, dir: VFS.basename(dir) });
          }
        });
      };
      walk(VFS.special('pictures'));
      walk(VFS.special('desktop'));
      walk(VFS.special('downloads'));
      out.sort((a, b) => (b.modified || 0) - (a.modified || 0));
      return out;
    }

    function render() {
      U.clear(root);
      items = collect();
      if (mode === 'grid') renderGrid(); else renderView();
    }

    function renderGrid() {
      const bar = U.el('div.ph-bar', {}, [
        U.el('div.ph-title', { text: '图库' }),
        (() => { const b = U.el('button.cmdbtn', {}, [Icons.ui('image', 16), U.el('span', { text: '所有照片' })]); b.classList.add('is-active'); return b; })(),
        (() => {
          const b = U.el('button.cmdbtn', {}, [Icons.ui('folder', 16), U.el('span', { text: '文件夹' })]);
          b.onclick = () => Apps.launch('explorer', { path: VFS.special('pictures') });
          return b;
        })(),
        U.el('div.spacer'),
        (() => {
          const b = U.el('button.cmdbtn', {}, [Icons.ui('upload', 16), U.el('span', { text: '导入' })]);
          b.onclick = async () => {
            const f = await U.imgFile();
            if (!f) return;
            const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
            VFS.createFile(VFS.special('pictures'), f.name, '', { src: url, size: f.size });
            Notifications.toast({ title: '已导入', body: f.name, appIcon: 'photos' });
            render();
          };
          return b;
        })(),
        (() => {
          const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '幻灯片放映' }, Icons.ui('play', 16));
          b.onclick = () => { if (items.length) { index = 0; mode = 'view'; render(); startSlide(); } };
          return b;
        })()
      ]);
      root.appendChild(bar);

      if (!items.length) {
        root.appendChild(U.el('div.ph-empty', {}, U.el('div.empty-state', {}, [
          Icons.app('photos', 64),
          U.el('div.empty-state__title', { text: '这里还没有照片' }),
          U.el('div.caption', { text: '把图片放到「图片」文件夹，或点击上方"导入"。' })
        ])));
        return;
      }

      const grid = U.el('div.ph-grid');
      let lastGroup = null;
      items.forEach((it, i) => {
        const g = it.modified ? U.fmtDateShort(new Date(it.modified)) : '未知日期';
        if (g !== lastGroup) { grid.appendChild(U.el('div.ph-groupname', { text: g })); lastGroup = g; }
        const cell = U.el('div.ph-cell', { title: it.name }, [
          U.el('div.ph-cell__img', { style: { backgroundImage: 'url("' + it.src + '")' } }),
          U.el('div.ph-cell__cap', { text: it.name })
        ]);
        cell.onclick = () => { index = i; mode = 'view'; zoom = 1; rot = 0; render(); };
        cell.oncontextmenu = (e) => { e.preventDefault(); itemMenu(it, e.clientX, e.clientY); };
        grid.appendChild(cell);
      });
      root.appendChild(grid);
      U.$$('.ph-cell', grid).forEach((c, i) => U.anim(c,
        [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }],
        { duration: 280, delay: Math.min(i * 14, 240), easing: U.EASE.decel }));
    }

    function itemMenu(it, x, y) {
      Menu.show([
        { label: '打开', icon: 'open', onClick: () => { index = items.indexOf(it); mode = 'view'; render(); } },
        { label: '用画图编辑', appIcon: 'paint', onClick: () => Apps.launch('paint', { path: it.path }) },
        { separator: true },
        { label: '设为桌面背景', icon: 'image', onClick: async () => { await Settings.setWallpaper('custom', it.src); Notifications.toast({ title: '桌面背景已更新', body: it.name, appIcon: 'photos' }); } },
        { label: '设为锁屏背景', icon: 'lock', onClick: () => Notifications.toast({ title: '锁屏背景', body: '锁屏仅支持内置图片。', icon: 'info' }) },
        { separator: true },
        { label: '打开文件位置', icon: 'folder', onClick: () => Apps.launch('explorer', { path: VFS.parent(it.path) }) },
        { label: '复制路径', icon: 'link', onClick: () => U.copyText(it.path) },
        { label: '属性', icon: 'info', onClick: () => Shell.showProperties(it.path) },
        { separator: true },
        { label: '删除', icon: 'trash', danger: true, onClick: () => { VFS.remove(it.path); render(); } }
      ], { x, y });
    }

    function renderView() {
      const it = items[index];
      if (!it) { mode = 'grid'; render(); return; }
      win.setTitle(it.name + ' - 照片');

      const bar = U.el('div.ph-bar', {}, [
        (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '返回图库' }, Icons.ui('back', 16)); b.onclick = () => { stopSlide(); mode = 'grid'; render(); }; return b; })(),
        U.el('div.ph-title.truncate', { text: it.name }),
        U.el('div.spacer'),
        U.el('span.caption.text-secondary', { text: (index + 1) + ' / ' + items.length })
      ]);

      const view = U.el('div.ph-view');
      const stage = U.el('div.ph-stage');
      const img = U.el('img', { src: it.src, alt: it.name });
      img.style.transform = 'scale(' + zoom + ') rotate(' + rot + 'deg)';
      stage.appendChild(img);

      if (items.length > 1) {
        const prev = U.el('button.ph-navbtn', { style: { left: '16px' }, title: '上一张' }, Icons.ui('chevronLeft', 18));
        const next = U.el('button.ph-navbtn', { style: { right: '16px' }, title: '下一张' }, Icons.ui('chevronRight', 18));
        prev.onclick = () => step(-1);
        next.onclick = () => step(1);
        stage.append(prev, next);
      }

      const vbar = U.el('div.ph-vbar');
      const vb = (icon, label, fn) => { const b = U.el('button.ph-vbtn', { title: label }, Icons.ui(icon, 16)); b.onclick = fn; U.tooltip(b, label); return b; };
      vbar.append(
        vb('zoomOut', '缩小', () => { zoom = U.clamp(zoom / 1.25, .2, 8); img.style.transform = 'scale(' + zoom + ') rotate(' + rot + 'deg)'; }),
        vb('zoomIn', '放大', () => { zoom = U.clamp(zoom * 1.25, .2, 8); img.style.transform = 'scale(' + zoom + ') rotate(' + rot + 'deg)'; }),
        vb('fullscreen', '适应窗口', () => { zoom = 1; rot = 0; img.style.transform = 'none'; }),
        vb('rotate', '旋转', () => { rot = (rot + 90) % 360; img.style.transform = 'scale(' + zoom + ') rotate(' + rot + 'deg)'; }),
        vb('play', slideTimer ? '停止幻灯片' : '幻灯片放映', () => { slideTimer ? stopSlide() : startSlide(); renderView(); }),
        vb('pen', '用画图编辑', () => Apps.launch('paint', { path: it.path })),
        vb('image', '设为桌面背景', async () => { await Settings.setWallpaper('custom', it.src); Notifications.toast({ title: '桌面背景已更新', appIcon: 'photos' }); }),
        vb('info', '文件信息', () => Shell.showProperties(it.path)),
        vb('trash', '删除', async () => {
          if (await Notifications.confirm('删除照片', '要将"' + it.name + '"移到回收站吗？', '删除')) {
            VFS.remove(it.path);
            if (index >= items.length - 1) index = Math.max(0, index - 1);
            render();
          }
        })
      );

      const film = U.el('div.ph-film');
      items.forEach((x, i) => {
        const th = U.el('div.ph-film__i' + (i === index ? '.is-active' : ''), {
          style: { backgroundImage: 'url("' + x.src + '")' }, title: x.name
        });
        th.onclick = () => { index = i; zoom = 1; rot = 0; render(); };
        film.appendChild(th);
      });

      view.append(stage, vbar, film);
      root.append(bar, view);
      U.anim(img, [{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'scale(' + zoom + ') rotate(' + rot + 'deg)' }],
        { duration: 260, easing: U.EASE.decel });
      setTimeout(() => { const a = film.querySelector('.is-active'); a && a.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 40);
    }

    function step(d) {
      if (!items.length) return;
      index = (index + d + items.length) % items.length;
      zoom = 1; rot = 0;
      render();
    }
    function startSlide() { stopSlide(); slideTimer = setInterval(() => step(1), 3000); }
    function stopSlide() { if (slideTimer) { clearInterval(slideTimer); slideTimer = null; } }

    win.body.tabIndex = 0;
    win.body.addEventListener('keydown', (e) => {
      if (mode !== 'view') { if (e.key === 'Enter') { mode = 'view'; render(); } return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'Escape') { stopSlide(); mode = 'grid'; render(); }
      if (e.key === '+' || e.key === '=') { zoom = U.clamp(zoom * 1.25, .2, 8); renderView(); }
      if (e.key === '-') { zoom = U.clamp(zoom / 1.25, .2, 8); renderView(); }
      if (e.key === 'Delete') { const it = items[index]; if (it) { VFS.remove(it.path); render(); } }
    });
    win.on('close', stopSlide);
    const off = U.bus.on('vfs:change', U.debounce(() => { if (win.el.isConnected && mode === 'grid') render(); }, 200));
    win.on('close', off);

    if (args && args.path) {
      items = collect();
      const i = items.findIndex(x => x.path === args.path);
      if (i >= 0) { index = i; mode = 'view'; }
    }
    render();
  }

  Apps.register({
    id: 'photos', name: '照片', icon: 'photos', category: '媒体',
    size: { w: 1080, h: 720 }, minSize: { w: 520, h: 400 }, mount, sortKey: 'zhaopian'
  });
})(window);
