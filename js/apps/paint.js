/* ============================================================
   paint.js — 画图（画布 / 工具 / 颜色 / 撤销重做 / 保存到 VFS）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('paint', `
  .pt-root { display:flex; flex-direction:column; height:100%; min-height:0; }
  .pt-ribbon { flex:none; display:flex; align-items:center; gap:10px; padding:8px 10px;
    border-bottom:1px solid var(--stroke-divider); flex-wrap:wrap; }
  .pt-group { display:flex; align-items:center; gap:4px; padding:0 8px; }
  .pt-group + .pt-group { border-left:1px solid var(--stroke-divider); }
  .pt-glabel { font-size:11px; color:var(--text-tertiary); text-align:center; margin-top:2px; }
  .pt-tool { width:34px; height:34px; border-radius:var(--r-sm); display:grid; place-items:center;
    color:var(--text-primary); transition: background-color var(--dur-fast) linear; }
  .pt-tool:hover { background: var(--fill-subtle-hover); }
  .pt-tool.is-active { background: var(--fill-accent-subtle); box-shadow: inset 0 0 0 1px var(--fill-accent); }
  .pt-swatches { display:grid; grid-template-rows:repeat(2,18px); grid-auto-flow:column; gap:3px; }
  .pt-sw { width:18px; height:18px; border-radius:3px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.25); }
  .pt-sw.is-active { outline:2px solid var(--fill-accent); outline-offset:1px; }
  .pt-colorbig { width:36px; height:36px; border-radius:var(--r-sm); box-shadow: inset 0 0 0 1px var(--stroke-control-2); }
  .pt-canvaswrap { flex:1 1 auto; min-height:0; overflow:auto; background: var(--bg-solid-2); padding:18px;
    display:flex; align-items:flex-start; justify-content:center; }
  [data-theme="dark"] .pt-canvaswrap { background:#1a1a1a; }
  .pt-canvas { background:#fff; box-shadow:0 2px 14px rgba(0,0,0,.28); cursor:crosshair; touch-action:none; image-rendering:pixelated; }
  .pt-status { flex:none; height:26px; display:flex; align-items:center; gap:18px; padding:0 12px;
    border-top:1px solid var(--stroke-divider); font-size:var(--fs-caption); color:var(--text-secondary); }
  .pt-size input { width:110px; }
  `);

  const TOOLS = [
    { id: 'pencil', name: '铅笔', icon: 'pen' },
    { id: 'brush', name: '画笔', icon: 'palette' },
    { id: 'eraser', name: '橡皮擦', icon: 'eraser' },
    { id: 'fill', name: '用颜色填充', icon: 'fill' },
    { id: 'picker', name: '颜色选取器', icon: 'eye' },
    { id: 'line', name: '直线', icon: 'minus' },
    { id: 'rect', name: '矩形', icon: 'crop' },
    { id: 'ellipse', name: '椭圆', icon: 'shapes' },
    { id: 'text', name: '文本', icon: 'text' }
  ];
  const PALETTE = [
    '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'
  ];

  function mount(win, args) {
    const S = { tool: 'pencil', color: '#000000', color2: '#ffffff', size: 3, zoom: 1, dirty: false, path: null, name: '无标题' };
    win.setBodyBg('solid');

    const root = U.el('div.pt-root');
    const ribbon = U.el('div.pt-ribbon');
    const wrap = U.el('div.pt-canvaswrap');
    const status = U.el('div.pt-status');
    root.append(ribbon, wrap, status);
    win.body.appendChild(root);

    const W = 900, H = 560;
    const canvas = U.el('canvas.pt-canvas', { width: W, height: H });
    wrap.appendChild(canvas);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.lineJoin = ctx.lineCap = 'round';

    const undoStack = [], redoStack = [];
    const snapshot = () => { undoStack.push(ctx.getImageData(0, 0, W, H)); if (undoStack.length > 30) undoStack.shift(); redoStack.length = 0; };
    const undo = () => { if (!undoStack.length) return; redoStack.push(ctx.getImageData(0, 0, W, H)); ctx.putImageData(undoStack.pop(), 0, 0); };
    const redo = () => { if (!redoStack.length) return; undoStack.push(ctx.getImageData(0, 0, W, H)); ctx.putImageData(redoStack.pop(), 0, 0); };

    /* ---------- 功能区 ---------- */
    function buildRibbon() {
      U.clear(ribbon);

      const g0 = U.el('div.pt-group');
      const mkBtn = (icon, label, fn) => { const b = U.el('button.pt-tool', { title: label }, Icons.ui(icon, 16)); b.onclick = fn; U.tooltip(b, label); return b; };
      g0.append(
        mkBtn('save', '保存 (Ctrl+S)', save),
        mkBtn('open', '打开 (Ctrl+O)', openImg),
        mkBtn('undo', '撤销 (Ctrl+Z)', () => { undo(); }),
        mkBtn('redo', '重做 (Ctrl+Y)', () => { redo(); })
      );
      ribbon.appendChild(g0);

      const g1 = U.el('div.pt-group');
      TOOLS.forEach(t => {
        const b = U.el('button.pt-tool' + (S.tool === t.id ? '.is-active' : ''), { title: t.name }, Icons.ui(t.icon, 16));
        b.onclick = () => { S.tool = t.id; buildRibbon(); canvas.style.cursor = t.id === 'picker' ? 'copy' : t.id === 'text' ? 'text' : 'crosshair'; };
        U.tooltip(b, t.name);
        g1.appendChild(b);
      });
      ribbon.appendChild(g1);

      const g2 = U.el('div.pt-group.pt-size');
      const sl = Shell.slider(S.size, 1, 48, v => { S.size = v; renderStatus(); });
      sl.style.width = '110px';
      g2.append(U.el('div', {}, [U.el('div.caption', { text: '粗细' }), sl]));
      ribbon.appendChild(g2);

      const g3 = U.el('div.pt-group');
      const big = U.el('div.pt-colorbig', { style: { background: S.color }, title: '当前颜色' });
      const swWrap = U.el('div.pt-swatches');
      PALETTE.forEach(c => {
        const sw = U.el('button.pt-sw' + (c === S.color ? '.is-active' : ''), { style: { background: c }, title: c });
        sw.onclick = () => { S.color = c; buildRibbon(); };
        sw.oncontextmenu = (e) => { e.preventDefault(); S.color2 = c; buildRibbon(); };
        swWrap.appendChild(sw);
      });
      const picker = U.el('input', { type: 'color', value: S.color, style: { width: '36px', height: '26px', border: 0, background: 'none' } });
      picker.oninput = () => { S.color = picker.value; buildRibbon(); };
      g3.append(big, swWrap, U.el('div', {}, [picker, U.el('div.pt-glabel', { text: '自定义' })]));
      ribbon.appendChild(g3);

      const g4 = U.el('div.pt-group');
      g4.append(
        mkBtn('zoomIn', '放大', () => setZoom(S.zoom * 1.25)),
        mkBtn('zoomOut', '缩小', () => setZoom(S.zoom / 1.25)),
        mkBtn('trash', '清空画布', async () => {
          if (await Notifications.confirm('画图', '要清空整个画布吗？', '清空')) {
            snapshot(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); S.dirty = true;
          }
        }),
        mkBtn('image', '设为桌面背景', async () => {
          const url = canvas.toDataURL('image/png');
          await Settings.setWallpaper('custom', url);
          Notifications.toast({ title: '已设为桌面背景', appIcon: 'paint' });
        })
      );
      ribbon.appendChild(g4);
    }

    function setZoom(z) {
      S.zoom = U.clamp(z, .25, 8);
      canvas.style.width = Math.round(W * S.zoom) + 'px';
      canvas.style.height = Math.round(H * S.zoom) + 'px';
      renderStatus();
    }

    let mx = 0, my = 0;
    function renderStatus() {
      U.clear(status);
      status.append(
        U.el('span', {}, [Icons.ui('image', 12)]),
        U.el('span', { text: mx + ', ' + my + ' 像素' }),
        U.el('span', { text: W + ' × ' + H + ' 像素' }),
        U.el('span', { text: '粗细 ' + S.size }),
        U.el('div.spacer'),
        U.el('span', { text: Math.round(S.zoom * 100) + '%' })
      );
    }

    /* ---------- 绘制 ---------- */
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.round((e.clientX - r.left) / S.zoom),
        y: Math.round((e.clientY - r.top) / S.zoom)
      };
    };

    let drawing = false, start = null, before = null;

    canvas.addEventListener('pointermove', (e) => {
      const p = pos(e); mx = p.x; my = p.y; renderStatus();
      if (!drawing) return;
      if (S.tool === 'pencil' || S.tool === 'brush' || S.tool === 'eraser') {
        ctx.strokeStyle = S.tool === 'eraser' ? '#ffffff' : S.color;
        ctx.lineWidth = S.tool === 'brush' ? S.size * 2 : S.tool === 'eraser' ? S.size * 3 : S.size;
        ctx.globalAlpha = S.tool === 'brush' ? .85 : 1;
        ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (['line', 'rect', 'ellipse'].includes(S.tool)) {
        ctx.putImageData(before, 0, 0);
        ctx.strokeStyle = S.color; ctx.lineWidth = S.size;
        ctx.beginPath();
        if (S.tool === 'line') { ctx.moveTo(start.x, start.y); ctx.lineTo(p.x, p.y); }
        else if (S.tool === 'rect') { ctx.rect(start.x, start.y, p.x - start.x, p.y - start.y); }
        else {
          ctx.ellipse((start.x + p.x) / 2, (start.y + p.y) / 2, Math.abs(p.x - start.x) / 2, Math.abs(p.y - start.y) / 2, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
    });

    canvas.addEventListener('pointerdown', (e) => {
      const p = pos(e);
      canvas.setPointerCapture(e.pointerId);
      if (S.tool === 'picker') {
        const d = ctx.getImageData(p.x, p.y, 1, 1).data;
        S.color = '#' + [d[0], d[1], d[2]].map(x => x.toString(16).padStart(2, '0')).join('');
        buildRibbon();
        return;
      }
      if (S.tool === 'fill') { snapshot(); floodFill(p.x, p.y, S.color); S.dirty = true; return; }
      if (S.tool === 'text') { addText(p); return; }
      snapshot();
      drawing = true; start = p;
      before = ctx.getImageData(0, 0, W, H);
      if (['pencil', 'brush', 'eraser'].includes(S.tool)) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.strokeStyle = S.tool === 'eraser' ? '#ffffff' : S.color;
        ctx.lineWidth = S.tool === 'brush' ? S.size * 2 : S.tool === 'eraser' ? S.size * 3 : S.size;
        ctx.lineTo(p.x + .01, p.y); ctx.stroke();
      }
      S.dirty = true;
    });
    canvas.addEventListener('pointerup', () => { drawing = false; before = null; });
    canvas.addEventListener('pointerleave', () => { drawing = false; });

    function addText(p) {
      const input = U.el('input', {
        style: {
          position: 'absolute', left: '0', top: '0', font: (S.size * 5) + 'px "Segoe UI", sans-serif',
          color: S.color, background: 'transparent', border: '1px dashed var(--fill-accent)', outline: 'none',
          userSelect: 'text', minWidth: '80px'
        }, placeholder: '输入文本'
      });
      const r = canvas.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      input.style.left = (r.left - wr.left + p.x * S.zoom + wrap.scrollLeft) + 'px';
      input.style.top = (r.top - wr.top + p.y * S.zoom + wrap.scrollTop - S.size * 3) + 'px';
      wrap.style.position = 'relative';
      wrap.appendChild(input);
      input.focus();
      const commit = () => {
        const v = input.value;
        input.remove();
        if (!v) return;
        snapshot();
        ctx.fillStyle = S.color;
        ctx.font = (S.size * 5) + 'px "Segoe UI Variable Text","Segoe UI","Microsoft YaHei UI",sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(v, p.x, p.y - S.size * 3 + 2);
        S.dirty = true;
      };
      input.onblur = commit;
      input.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') commit(); if (e.key === 'Escape') input.remove(); };
    }

    function floodFill(sx, sy, hex) {
      const img = ctx.getImageData(0, 0, W, H);
      const d = img.data;
      const idx = (x, y) => (y * W + x) * 4;
      const t = idx(sx, sy);
      const target = [d[t], d[t + 1], d[t + 2], d[t + 3]];
      const rgb = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
      if (target.every((v, i) => v === rgb[i])) return;
      const match = (i) => Math.abs(d[i] - target[0]) < 24 && Math.abs(d[i + 1] - target[1]) < 24 &&
        Math.abs(d[i + 2] - target[2]) < 24 && Math.abs(d[i + 3] - target[3]) < 24;
      const stack = [[sx, sy]];
      while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = idx(x, y);
        if (!match(i)) continue;
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      ctx.putImageData(img, 0, 0);
    }

    /* ---------- 文件 ---------- */
    async function save() {
      const name = S.path ? VFS.basename(S.path) : await Notifications.prompt('保存为', S.name + '.png', '文件名（保存到「图片」）');
      if (!name) return;
      const url = canvas.toDataURL('image/png');
      if (S.path && VFS.exists(S.path)) {
        const n = VFS.get(S.path);
        n.src = url; n.modified = Date.now(); VFS.save();
      } else {
        S.path = VFS.createFile(VFS.special('pictures'), name, '', { src: url, size: Math.round(url.length * .75) });
      }
      S.name = VFS.stem(VFS.basename(S.path));
      S.dirty = false;
      win.setTitle(S.name + ' - 画图');
      Notifications.toast({ title: '已保存', body: S.path, appIcon: 'paint' });
      U.bus.emit('vfs:change', VFS.special('pictures'));
    }

    async function openImg() {
      const imgs = VFS.list(VFS.special('pictures')).filter(e => e.type === 'file' && e.src);
      const list = U.el('div.openwith');
      if (!imgs.length) list.appendChild(U.el('div.caption.text-tertiary', { text: '「图片」文件夹中没有图像' }));
      imgs.forEach(f => {
        const row = U.el('div.openwith__row', {}, [
          U.el('div', { style: { width: '40px', height: '30px', backgroundImage: 'url("' + f.src + '")', backgroundSize: 'cover', borderRadius: '3px' } }),
          U.el('div', { text: f.name })
        ]);
        row.onclick = () => { dlg.close(); loadImage(f.src, f.path); };
        list.appendChild(row);
      });
      const up = U.el('button.btn', { text: '从本机上传…', style: { marginTop: '10px' } });
      up.onclick = async () => {
        dlg.close();
        const f = await U.imgFile();
        if (!f) return;
        const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
        loadImage(url, null);
      };
      list.appendChild(up);
      const dlg = Notifications.dialog({ title: '打开', content: list, width: 420, buttons: [{ text: '取消' }] });
    }

    function loadImage(src, path) {
      const img = new Image();
      img.onload = () => {
        snapshot();
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        const r = Math.min(W / img.width, H / img.height, 1);
        ctx.drawImage(img, 0, 0, img.width * r, img.height * r);
        S.path = path; S.name = path ? VFS.stem(VFS.basename(path)) : '导入的图像';
        win.setTitle(S.name + ' - 画图');
        S.dirty = false;
      };
      img.onerror = () => Notifications.toast({ title: '打开失败', body: '无法解析该图像。', icon: 'error' });
      img.src = src;
    }

    win.body.tabIndex = 0;
    win.body.addEventListener('keydown', (e) => {
      if (e.target.matches('input')) return;
      if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); openImg(); }
      if (e.key === '[') S.size = Math.max(1, S.size - 1), buildRibbon();
      if (e.key === ']') S.size = Math.min(48, S.size + 1), buildRibbon();
    });

    win.onClose(async () => {
      if (!S.dirty) return true;
      const r = await new Promise(res => Notifications.dialog({
        title: '画图', body: '是否将更改保存到 ' + S.name + '？',
        buttons: [{ text: '保存', accent: true, value: 'y' }, { text: '不保存', value: 'n' }, { text: '取消', value: null }],
        onClose: res
      }));
      if (r === null) return false;
      if (r === 'y') await save();
      return true;
    });

    buildRibbon(); setZoom(1); renderStatus();
    win.setTitle('无标题 - 画图');
    if (args && args.path) {
      const n = VFS.get(args.path);
      if (n && n.src) loadImage(n.src, args.path);
    }
  }

  Apps.register({
    id: 'paint', name: '画图', icon: 'paint', category: 'Windows 工具',
    size: { w: 1080, h: 740 }, minSize: { w: 620, h: 460 }, mount, sortKey: 'huatu'
  });
})(window);
