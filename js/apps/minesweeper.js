/* ============================================================
   minesweeper.js — 扫雷（三种难度 / 旗标 / 计时 / 首击安全）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('minesweeper', `
  .ms-root { display:flex; flex-direction:column; height:100%; min-height:0; align-items:center;
    background: var(--bg-solid-2); padding:12px; overflow:auto; }
  [data-theme="dark"] .ms-root { background:#1c1c1c; }
  .ms-bar { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .ms-panel { display:flex; align-items:center; gap:14px; padding:8px 14px; border-radius:var(--r-lg);
    background: var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card); }
  .ms-count { font-family:var(--font-mono); font-size:22px; font-weight:600; color:#e5484d;
    background:#1a1a1a; padding:2px 10px; border-radius:4px; min-width:64px; text-align:center; }
  .ms-face { width:40px; height:40px; border-radius:var(--r-sm); display:grid; place-items:center; font-size:22px;
    background: var(--fill-control); box-shadow: inset 0 0 0 1px var(--stroke-control-2); }
  .ms-face:hover { background: var(--fill-control-hover); }
  .ms-board { display:grid; gap:2px; padding:8px; border-radius:var(--r-lg);
    background: var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card); }
  .ms-cell { width:30px; height:30px; border-radius:3px; display:grid; place-items:center;
    font-family:var(--font-display); font-size:16px; font-weight:700; cursor:default; user-select:none;
    background: linear-gradient(160deg, var(--fill-control-hover), var(--fill-control));
    box-shadow: inset 0 0 0 1px var(--stroke-control-2), inset 0 -1.5px 0 rgba(0,0,0,.12);
    transition: background-color 80ms linear, transform 80ms var(--ease-decel); }
  .ms-cell:hover:not(.is-open) { background: var(--fill-control-alt-hover); transform:scale(1.04); }
  .ms-cell.is-open { background: var(--bg-card-2); box-shadow: inset 0 0 0 1px var(--stroke-divider); }
  .ms-cell.is-mine { background:#e5484d; }
  .ms-cell.is-wrong { background:#8a4a4a; }
  .ms-n1 { color:#3b82f6 } .ms-n2 { color:#16a34a } .ms-n3 { color:#dc2626 } .ms-n4 { color:#7c3aed }
  .ms-n5 { color:#b45309 } .ms-n6 { color:#0891b2 } .ms-n7 { color:#7f7f7f } .ms-n8 { color:#c026d3 }
  .ms-stat { font-size:var(--fs-caption); color:var(--text-secondary); margin-top:10px; }
  `);

  const LEVELS = {
    easy: { name: '初级', w: 9, h: 9, m: 10 },
    med: { name: '中级', w: 16, h: 16, m: 40 },
    hard: { name: '高级', w: 30, h: 16, m: 99 }
  };
  const BEST_KEY = 'win11web.minesweeper.best';

  function mount(win, args) {
    win.setBodyBg('');
    const root = U.el('div.ms-root');
    win.body.appendChild(root);

    let lv = 'easy', cells = [], first = true, over = false, wonFlag = false, flags = 0, opened = 0, time = 0, timer = null;
    let best = {};
    try { best = JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); } catch (e) { }

    function newGame(level) {
      lv = level || lv;
      const L = LEVELS[lv];
      cells = [];
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) cells.push({ x, y, mine: false, open: false, flag: false, n: 0 });
      first = true; over = false; wonFlag = false; flags = 0; opened = 0; time = 0;
      clearInterval(timer); timer = null;
      render();
    }

    const at = (x, y) => {
      const L = LEVELS[lv];
      if (x < 0 || y < 0 || x >= L.w || y >= L.h) return null;
      return cells[y * L.w + x];
    };
    const around = (c) => {
      const out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const n = at(c.x + dx, c.y + dy);
        if (n) out.push(n);
      }
      return out;
    };

    function place(safe) {
      const L = LEVELS[lv];
      const forbidden = new Set([safe].concat(around(safe)).map(c => c.y * L.w + c.x));
      let placed = 0;
      while (placed < L.m) {
        const i = U.randInt(0, cells.length - 1);
        if (forbidden.has(i) || cells[i].mine) continue;
        cells[i].mine = true; placed++;
      }
      cells.forEach(c => { c.n = around(c).filter(n => n.mine).length; });
    }

    function open(c) {
      if (over || c.open || c.flag) return;
      if (first) { place(c); first = false; startTimer(); }
      const stack = [c];
      while (stack.length) {
        const k = stack.pop();
        if (k.open || k.flag) continue;
        k.open = true; opened++;
        if (k.mine) { boom(k); return; }
        if (k.n === 0) around(k).forEach(n => { if (!n.open && !n.flag) stack.push(n); });
      }
      Sound.click();
      checkWin();
      paint();
    }

    function chord(c) {
      if (!c.open || over || c.n === 0) return;
      const nb = around(c);
      if (nb.filter(n => n.flag).length !== c.n) return;
      nb.forEach(n => { if (!n.flag && !n.open) open(n); });
    }

    function flag(c) {
      if (over || c.open) return;
      c.flag = !c.flag;
      flags += c.flag ? 1 : -1;
      Sound.hover();
      checkWin();
      paint();
    }

    function boom(c) {
      over = true; clearInterval(timer);
      cells.forEach(k => { if (k.mine) k.open = true; });
      c.hit = true;
      Sound.error();
      paint();
      setTimeout(() => Notifications.dialog({
        title: '游戏结束', icon: 'error',
        body: '你踩到了地雷！用时 ' + time + ' 秒。',
        buttons: [{ text: '再来一局', accent: true, value: 'again' }, { text: '关闭' }],
        onClose: (v) => { if (v === 'again') newGame(); }
      }), 420);
    }

    function checkWin() {
      const L = LEVELS[lv];
      const total = L.w * L.h;
      const safeOpen = cells.filter(c => c.open && !c.mine).length;
      if (safeOpen === total - L.m) {
        over = true; wonFlag = true; clearInterval(timer);
        cells.forEach(c => { if (c.mine) c.flag = true; });
        flags = L.m;
        Sound.notify();
        const b = best[lv];
        const isBest = !b || time < b;
        if (isBest) { best[lv] = time; try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch (e) { } }
        paint();
        setTimeout(() => Notifications.dialog({
          title: '恭喜，你赢了！', icon: 'check',
          body: '难度：' + LEVELS[lv].name + '　用时：' + time + ' 秒' + (isBest ? '\n这是你的新纪录！' : (b ? '\n最佳成绩：' + b + ' 秒' : '')),
          buttons: [{ text: '再来一局', accent: true, value: 'again' }, { text: '关闭' }],
          onClose: (v) => { if (v === 'again') newGame(); }
        }), 420);
      }
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(() => { time++; const t = root.querySelector('.ms-time'); if (t) t.textContent = U.pad(Math.min(999, time), 3); }, 1000);
    }

    /* ---------- 渲染 ---------- */
    let boardEl = null;
    function render() {
      U.clear(root);
      const L = LEVELS[lv];
      const bar = U.el('div.ms-bar');
      const lvBtn = U.el('button.btn.btn--sm', { text: '难度：' + L.name });
      lvBtn.onclick = () => Menu.show(Object.keys(LEVELS).map(k => ({
        label: LEVELS[k].name + '（' + LEVELS[k].w + '×' + LEVELS[k].h + '，' + LEVELS[k].m + ' 雷）',
        checked: lv === k, onClick: () => newGame(k)
      })).concat([
        { separator: true },
        { label: '最佳成绩', icon: 'star', onClick: () => Notifications.dialog({
          title: '最佳成绩',
          html: Object.keys(LEVELS).map(k => LEVELS[k].name + '：' + (best[k] ? best[k] + ' 秒' : '暂无记录')).join('<br>'),
          buttons: [{ text: '确定', accent: true }]
        }) }
      ]), { anchor: lvBtn, align: 'bottom-left' });

      const panel = U.el('div.ms-panel', {}, [
        U.el('div.ms-count', { text: U.pad(Math.max(0, L.m - flags), 3) }),
        (() => {
          const f = U.el('button.ms-face', { title: '新游戏', text: over ? (wonFlag ? '😎' : '😵') : '🙂' });
          f.onclick = () => newGame();
          return f;
        })(),
        U.el('div.ms-count.ms-time', { text: U.pad(Math.min(999, time), 3) })
      ]);
      bar.append(lvBtn, panel,
        (() => { const b = U.el('button.btn.btn--sm', { text: '新游戏' }); b.onclick = () => newGame(); return b; })());
      root.appendChild(bar);

      boardEl = U.el('div.ms-board', { style: { gridTemplateColumns: 'repeat(' + L.w + ', 30px)' } });
      cells.forEach(c => {
        const el = U.el('div.ms-cell', { dataset: { i: c.y * L.w + c.x } });
        el.onpointerdown = (e) => {
          if (e.button === 2) { e.preventDefault(); flag(c); return; }
          if (e.button === 1) { e.preventDefault(); chord(c); return; }
        };
        el.onclick = () => { if (c.open) chord(c); else open(c); };
        el.oncontextmenu = (e) => e.preventDefault();
        el.ondblclick = () => chord(c);
        boardEl.appendChild(el);
      });
      root.appendChild(boardEl);
      root.appendChild(U.el('div.ms-stat', {
        text: '左键翻开 · 右键标记 · 双击/中键快速展开　|　最佳：' + (best[lv] ? best[lv] + ' 秒' : '暂无')
      }));
      paint();
      win.setTitle('扫雷 — ' + L.name);
    }

    function paint() {
      if (!boardEl) return;
      const L = LEVELS[lv];
      U.$$('.ms-cell', boardEl).forEach((el, i) => {
        const c = cells[i];
        el.className = 'ms-cell' + (c.open ? ' is-open' : '');
        el.textContent = '';
        if (c.flag && !c.open) { el.textContent = '🚩'; el.style.fontSize = '14px'; return; }
        if (c.flag && c.open && c.mine && wonFlag) { el.textContent = '🚩'; el.style.fontSize = '14px'; return; }
        if (!c.open) return;
        if (c.mine) {
          el.classList.add(c.hit ? 'is-mine' : 'is-wrong');
          el.textContent = '💥';
          el.style.fontSize = '15px';
          if (!c.hit) el.textContent = '💣';
          return;
        }
        if (c.n) { el.textContent = c.n; el.classList.add('ms-n' + c.n); el.style.fontSize = '16px'; }
      });
      const cnt = root.querySelector('.ms-count');
      if (cnt) cnt.textContent = U.pad(Math.max(0, L.m - flags), 3);
      const face = root.querySelector('.ms-face');
      if (face) face.textContent = over ? (wonFlag ? '😎' : '😵') : '🙂';
    }

    win.on('close', () => clearInterval(timer));
    newGame(args && args.level);
  }

  Apps.register({
    id: 'minesweeper', name: '扫雷', icon: 'minesweeper', category: '游戏',
    size: { w: 620, h: 620 }, minSize: { w: 380, h: 420 }, mount, sortKey: 'saolei'
  });
})(window);
