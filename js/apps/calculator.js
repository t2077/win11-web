/* ============================================================
   calculator.js — 计算器（标准 / 科学 / 历史记录 / 内存）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('calculator', `
  .cc-root { display:flex; flex-direction:column; height:100%; min-height:0; background: var(--bg-solid); }
  [data-theme="dark"] .cc-root { background:#202020; }
  .cc-top { flex:none; display:flex; align-items:center; gap:6px; padding:4px 8px 0; }
  .cc-mode { font-family:var(--font-display); font-size:var(--fs-body-lg); font-weight:600; padding-left:6px; }
  .cc-main { flex:1 1 auto; min-height:0; display:flex; }
  .cc-pad { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; padding:0 6px 6px; }
  .cc-disp { flex:none; padding:12px 12px 6px; text-align:right; user-select:text; }
  .cc-expr { min-height:20px; font-size:var(--fs-caption); color:var(--text-tertiary); word-break:break-all; }
  .cc-out { font-family:var(--font-display); font-size:44px; font-weight:600; line-height:1.15; word-break:break-all;
    letter-spacing:-.01em; }
  .cc-mem { display:flex; gap:2px; padding:0 6px 6px; }
  .cc-mbtn { flex:1; height:26px; border-radius:var(--r-sm); font-size:var(--fs-caption); color:var(--text-primary);
    transition: background-color var(--dur-fast) linear; }
  .cc-mbtn:hover { background: var(--fill-subtle-hover); }
  .cc-mbtn:disabled { color: var(--text-disabled); }
  .cc-grid { flex:1 1 auto; min-height:0; display:grid; gap:2px; padding:0 0 0 0; }
  .cc-key { border-radius:var(--r-sm); font-size:var(--fs-body-lg); color:var(--text-primary);
    background: var(--fill-control); box-shadow: inset 0 0 0 1px var(--stroke-control);
    display:grid; place-items:center; transition: background-color var(--dur-fast) linear, transform 80ms var(--ease-decel); }
  [data-theme="dark"] .cc-key { background: rgba(255,255,255,.055); }
  .cc-key:hover { background: var(--fill-control-hover); }
  .cc-key:active { background: var(--fill-control-press); transform: scale(.97); }
  .cc-key--fn { font-size:var(--fs-body); background: var(--fill-control-alt); }
  [data-theme="dark"] .cc-key--fn { background: rgba(255,255,255,.03); }
  .cc-key--eq { background: var(--fill-accent); color: var(--text-onaccent); box-shadow:none; }
  .cc-key--eq:hover { background: var(--fill-accent-hover); }
  .cc-side { width:260px; flex:none; border-left:1px solid var(--stroke-divider); display:flex; flex-direction:column; }
  .cc-side__tabs { display:flex; gap:4px; padding:8px; }
  .cc-side__tab { flex:1; height:30px; border-radius:var(--r-sm); font-size:var(--fs-body); color:var(--text-secondary); }
  .cc-side__tab.is-active { color:var(--text-primary); font-weight:600; background: var(--fill-subtle-sel); }
  .cc-side__list { flex:1; overflow:auto; padding:0 8px 8px; }
  .cc-hitem { padding:8px; border-radius:var(--r-sm); text-align:right; cursor:default; }
  .cc-hitem:hover { background: var(--fill-subtle-hover); }
  .cc-hitem__e { font-size:var(--fs-caption); color:var(--text-tertiary); }
  .cc-hitem__r { font-size:var(--fs-body-lg); }
  .cc-empty { padding:24px 8px; text-align:center; color:var(--text-tertiary); font-size:var(--fs-caption); }
  `);

  function mount(win, args) {
    const S = {
      mode: 'standard', out: '0', expr: '', acc: null, op: null, fresh: true,
      mem: [], hist: [], side: 'hist', showSide: false
    };

    win.setBodyBg('');
    const root = U.el('div.cc-root');
    const top = U.el('div.cc-top');
    const main = U.el('div.cc-main');
    const pad = U.el('div.cc-pad');
    const side = U.el('div.cc-side', { hidden: true });
    root.append(top, main); main.append(pad, side);
    win.body.appendChild(root);

    /* 顶部：模式菜单 */
    const hb = U.el('button.cmdbtn.cmdbtn--icon', { title: '打开导航' }, Icons.ui('list', 16));
    hb.onclick = () => {
      Menu.show([
        { header: '计算器' },
        { label: '标准', icon: 'grid', checked: S.mode === 'standard', onClick: () => setMode('standard') },
        { label: '科学', icon: 'grid', checked: S.mode === 'scientific', onClick: () => setMode('scientific') },
        { label: '程序员', icon: 'grid', checked: S.mode === 'programmer', onClick: () => setMode('programmer') },
        { separator: true },
        { header: '转换器' },
        { label: '长度', icon: 'grid', onClick: () => setMode('length') },
        { label: '温度', icon: 'grid', onClick: () => setMode('temp') }
      ], { anchor: hb, align: 'bottom-left' });
    };
    const histBtn = U.el('button.cmdbtn.cmdbtn--icon', { title: '历史记录' }, Icons.ui('history', 16));
    histBtn.onclick = () => { S.showSide = !S.showSide; side.hidden = !S.showSide; renderSide(); };
    top.append(hb, U.el('div.cc-mode', { text: '标准' }), U.el('div.spacer'), histBtn);

    /* 显示区 */
    const disp = U.el('div.cc-disp');
    const exprEl = U.el('div.cc-expr');
    const outEl = U.el('div.cc-out', { text: '0' });
    disp.append(exprEl, outEl);
    const memRow = U.el('div.cc-mem');
    const grid = U.el('div.cc-grid');
    pad.append(disp, memRow, grid);

    function fmt(n) {
      if (n === Infinity || n === -Infinity) return '结果未定义';
      if (Number.isNaN(n)) return '结果无效';
      if (typeof n === 'string') return n;
      const abs = Math.abs(n);
      if (abs !== 0 && (abs >= 1e16 || abs < 1e-10)) return n.toExponential(9).replace('e', 'e');
      const s = String(parseFloat(n.toPrecision(16)));
      const [i, d] = s.split('.');
      return (+i).toLocaleString('en-US') + (d ? '.' + d : '');
    }
    const raw = () => parseFloat(String(S.out).replace(/,/g, '')) || 0;

    function render() {
      outEl.textContent = typeof S.out === 'number' ? fmt(S.out) : S.out;
      exprEl.textContent = S.expr;
      U.clear(memRow);
      const mb = (t, fn, dis) => { const b = U.el('button.cc-mbtn', { text: t, disabled: !!dis }); b.onclick = fn; return b; };
      memRow.append(
        mb('MC', () => { S.mem = []; render(); }, !S.mem.length),
        mb('MR', () => { if (S.mem.length) { S.out = S.mem[S.mem.length - 1]; S.fresh = true; render(); } }, !S.mem.length),
        mb('M+', () => { if (S.mem.length) S.mem[S.mem.length - 1] += raw(); else S.mem.push(raw()); render(); }),
        mb('M-', () => { if (S.mem.length) S.mem[S.mem.length - 1] -= raw(); else S.mem.push(-raw()); render(); }),
        mb('MS', () => { S.mem.push(raw()); render(); }),
        mb('M˅', () => {
          if (!S.mem.length) return;
          Menu.show(S.mem.slice().reverse().map(v => ({ label: fmt(v), onClick: () => { S.out = v; S.fresh = true; render(); } })), { anchor: memRow.lastChild, align: 'top-right' });
        }, !S.mem.length)
      );
      if (S.showSide) renderSide();
    }

    /* 按键定义 */
    const STD = [
      ['%', 'fn', () => { S.out = raw() / 100; S.fresh = true; }],
      ['CE', 'fn', () => { S.out = '0'; S.fresh = true; }],
      ['C', 'fn', () => { S.out = '0'; S.expr = ''; S.acc = null; S.op = null; S.fresh = true; }],
      ['⌫', 'fn', () => { let s = String(S.out).replace(/,/g, ''); s = s.length > 1 ? s.slice(0, -1) : '0'; S.out = s; }],
      ['⅟x', 'fn', () => { S.out = 1 / raw(); S.expr = '1/(' + fmt(raw()) + ')'; S.fresh = true; }],
      ['x²', 'fn', () => { const v = raw(); S.expr = 'sqr(' + fmt(v) + ')'; S.out = v * v; S.fresh = true; }],
      ['²√x', 'fn', () => { const v = raw(); S.expr = '√(' + fmt(v) + ')'; S.out = Math.sqrt(v); S.fresh = true; }],
      ['÷', 'fn', () => setOp('÷')],
      ['7', 'num'], ['8', 'num'], ['9', 'num'], ['×', 'fn', () => setOp('×')],
      ['4', 'num'], ['5', 'num'], ['6', 'num'], ['−', 'fn', () => setOp('−')],
      ['1', 'num'], ['2', 'num'], ['3', 'num'], ['+', 'fn', () => setOp('+')],
      ['+/−', 'fn', () => { S.out = -raw(); }], ['0', 'num'], ['.', 'num'], ['=', 'eq', equals]
    ];
    const SCI = [
      ['2ⁿᵈ', 'fn', () => { }], ['π', 'fn', () => { S.out = Math.PI; S.fresh = true; }], ['e', 'fn', () => { S.out = Math.E; S.fresh = true; }],
      ['C', 'fn', () => { S.out = '0'; S.expr = ''; S.acc = null; S.op = null; S.fresh = true; }], ['⌫', 'fn', () => { let s = String(S.out).replace(/,/g, ''); S.out = s.length > 1 ? s.slice(0, -1) : '0'; }],
      ['x²', 'fn', () => { const v = raw(); S.out = v * v; S.fresh = true; }], ['xʸ', 'fn', () => setOp('^')], ['sin', 'fn', () => { S.out = Math.sin(raw()); S.fresh = true; }],
      ['cos', 'fn', () => { S.out = Math.cos(raw()); S.fresh = true; }], ['tan', 'fn', () => { S.out = Math.tan(raw()); S.fresh = true; }],
      ['√x', 'fn', () => { S.out = Math.sqrt(raw()); S.fresh = true; }], ['10ˣ', 'fn', () => { S.out = Math.pow(10, raw()); S.fresh = true; }],
      ['log', 'fn', () => { S.out = Math.log10(raw()); S.fresh = true; }], ['ln', 'fn', () => { S.out = Math.log(raw()); S.fresh = true; }],
      ['n!', 'fn', () => { let n = Math.round(raw()), r = 1; for (let i = 2; i <= n; i++) r *= i; S.out = n > 170 ? Infinity : r; S.fresh = true; }],
      ['÷', 'fn', () => setOp('÷')], ['7', 'num'], ['8', 'num'], ['9', 'num'], ['×', 'fn', () => setOp('×')],
      ['1/x', 'fn', () => { S.out = 1 / raw(); S.fresh = true; }], ['4', 'num'], ['5', 'num'], ['6', 'num'], ['−', 'fn', () => setOp('−')],
      ['%', 'fn', () => { S.out = raw() / 100; S.fresh = true; }], ['1', 'num'], ['2', 'num'], ['3', 'num'], ['+', 'fn', () => setOp('+')],
      ['+/−', 'fn', () => { S.out = -raw(); }], ['0', 'num'], ['.', 'num'], ['=', 'eq', equals], ['exp', 'fn', () => { S.out = Math.exp(raw()); S.fresh = true; }]
    ];

    function digit(d) {
      let s = S.fresh ? '' : String(S.out).replace(/,/g, '');
      if (s === '0' && d !== '.') s = '';
      if (d === '.' && s.includes('.')) return;
      if (d === '.' && !s) s = '0';
      s = s + d;
      S.out = s;
      S.fresh = false;
    }
    function calc(a, b, op) {
      switch (op) {
        case '+': return a + b;
        case '−': return a - b;
        case '×': return a * b;
        case '÷': return b === 0 ? (a === 0 ? NaN : Infinity) : a / b;
        case '^': return Math.pow(a, b);
      }
      return b;
    }
    function setOp(op) {
      const v = raw();
      if (S.acc !== null && S.op && !S.fresh) { S.acc = calc(S.acc, v, S.op); S.out = S.acc; }
      else S.acc = v;
      S.op = op;
      S.expr = fmt(S.acc) + ' ' + op;
      S.fresh = true;
    }
    function equals() {
      if (S.op === null) { S.expr = fmt(raw()) + ' ='; return; }
      const b = raw();
      const r = calc(S.acc, b, S.op);
      const line = fmt(S.acc) + ' ' + S.op + ' ' + fmt(b) + ' =';
      S.hist.unshift({ e: line, r: fmt(r) });
      S.hist = S.hist.slice(0, 50);
      S.expr = line;
      S.out = r;
      S.acc = null; S.op = null; S.fresh = true;
    }

    function buildKeys() {
      U.clear(grid);
      const set = S.mode === 'scientific' ? SCI : STD;
      grid.style.gridTemplateColumns = S.mode === 'scientific' ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)';
      set.forEach(([label, kind, fn]) => {
        const b = U.el('button.cc-key' + (kind === 'fn' ? '.cc-key--fn' : kind === 'eq' ? '.cc-key--eq' : ''), { text: label });
        b.onclick = () => {
          Sound.click();
          if (kind === 'num') digit(label);
          else if (fn) fn();
          render();
        };
        grid.appendChild(b);
      });
    }

    function renderSide() {
      U.clear(side);
      const tabs = U.el('div.cc-side__tabs');
      [['hist', '历史记录'], ['mem', '内存']].forEach(([k, n]) => {
        const b = U.el('button.cc-side__tab' + (S.side === k ? '.is-active' : ''), { text: n });
        b.onclick = () => { S.side = k; renderSide(); };
        tabs.appendChild(b);
      });
      const list = U.el('div.cc-side__list');
      if (S.side === 'hist') {
        if (!S.hist.length) list.appendChild(U.el('div.cc-empty', { text: '暂无历史记录' }));
        S.hist.forEach(h => {
          const it = U.el('div.cc-hitem', {}, [U.el('div.cc-hitem__e', { text: h.e }), U.el('div.cc-hitem__r', { text: h.r })]);
          it.onclick = () => { S.out = parseFloat(h.r.replace(/,/g, '')); S.fresh = true; render(); };
          list.appendChild(it);
        });
      } else {
        if (!S.mem.length) list.appendChild(U.el('div.cc-empty', { text: '内存中没有保存任何内容' }));
        S.mem.slice().reverse().forEach(v => {
          const it = U.el('div.cc-hitem', {}, U.el('div.cc-hitem__r', { text: fmt(v) }));
          it.onclick = () => { S.out = v; S.fresh = true; render(); };
          list.appendChild(it);
        });
      }
      side.append(tabs, list);
    }

    function setMode(m) {
      S.mode = m;
      const names = { standard: '标准', scientific: '科学', programmer: '程序员', length: '长度', temp: '温度' };
      top.querySelector('.cc-mode').textContent = names[m] || '标准';
      if (m === 'programmer' || m === 'length' || m === 'temp') {
        Notifications.toast({ title: '计算器', body: '「' + names[m] + '」模式在此版本中尚未实现，已切换回标准模式。', appIcon: 'calculator', timeout: 3000 });
        S.mode = 'standard';
        top.querySelector('.cc-mode').textContent = '标准';
      }
      const wide = S.mode === 'scientific';
      buildKeys(); render();
    }

    /* 键盘 */
    win.body.tabIndex = 0;
    win.body.addEventListener('keydown', (e) => {
      const k = e.key;
      if (/^[0-9]$/.test(k)) { digit(k); render(); }
      else if (k === '.') { digit('.'); render(); }
      else if (k === '+') { setOp('+'); render(); }
      else if (k === '-') { setOp('−'); render(); }
      else if (k === '*') { setOp('×'); render(); }
      else if (k === '/') { e.preventDefault(); setOp('÷'); render(); }
      else if (k === 'Enter' || k === '=') { equals(); render(); }
      else if (k === 'Backspace') { let s = String(S.out).replace(/,/g, ''); S.out = s.length > 1 ? s.slice(0, -1) : '0'; render(); }
      else if (k === 'Escape') { S.out = '0'; S.expr = ''; S.acc = null; S.op = null; S.fresh = true; render(); }
      else if (k === '%') { S.out = raw() / 100; S.fresh = true; render(); }
      else return;
      Sound.key();
    });
    setTimeout(() => win.body.focus(), 50);

    buildKeys(); render();
  }

  Apps.register({
    id: 'calculator', name: '计算器', icon: 'calculator', category: 'Windows 工具',
    size: { w: 360, h: 560 }, minSize: { w: 320, h: 460 }, mount, sortKey: 'jisuanqi'
  });
})(window);
