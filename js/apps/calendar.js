/* ============================================================
   calendar.js — 日历（月 / 周 / 日视图，事件持久化）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('calendar', `
  .cl-root { display:flex; height:100%; min-height:0; }
  .cl-side { width:250px; flex:none; padding:12px 10px; display:flex; flex-direction:column; gap:14px; overflow:auto; }
  .cl-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column;
    background: var(--bg-solid); border-top-left-radius:8px; box-shadow: inset 1px 1px 0 var(--stroke-control); }
  [data-theme="dark"] .cl-main { background: rgba(255,255,255,.025); }
  .cl-bar { flex:none; display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--stroke-divider); }
  .cl-mtitle { font-family:var(--font-display); font-size:var(--fs-subtitle); font-weight:600; }
  .cl-mini { }
  .cl-mini__h { display:flex; align-items:center; gap:4px; margin-bottom:6px; }
  .cl-mini__t { font-size:var(--fs-body); font-weight:600; flex:1; }
  .cl-mini__g { display:grid; grid-template-columns:repeat(7,1fr); gap:1px; }
  .cl-mini__d { aspect-ratio:1; display:grid; place-items:center; font-size:11px; border-radius:50%; cursor:default; }
  .cl-mini__d:hover { background: var(--fill-subtle-hover); }
  .cl-mini__d.is-out { color: var(--text-disabled); }
  .cl-mini__d.is-today { background: var(--fill-accent); color: var(--text-onaccent); font-weight:600; }
  .cl-mini__d.is-sel { box-shadow: inset 0 0 0 1.5px var(--fill-accent); }
  .cl-mini__w { text-align:center; font-size:10px; color:var(--text-tertiary); }
  .cl-grid { flex:1 1 auto; min-height:0; display:grid; grid-template-rows:24px repeat(6,1fr); }
  .cl-wd { display:grid; grid-template-columns:repeat(7,1fr); border-bottom:1px solid var(--stroke-divider); }
  .cl-wd > div { text-align:center; font-size:var(--fs-caption); color:var(--text-secondary); }
  .cl-week { display:grid; grid-template-columns:repeat(7,1fr); border-bottom:1px solid var(--stroke-divider); }
  .cl-day { border-right:1px solid var(--stroke-divider); padding:4px 6px; overflow:hidden; cursor:default;
    display:flex; flex-direction:column; gap:2px; min-height:0; transition: background-color var(--dur-fast) linear; }
  .cl-day:hover { background: var(--fill-subtle-hover); }
  .cl-day.is-out { background: var(--bg-card-2); }
  .cl-day__n { font-size:var(--fs-caption); align-self:flex-start; width:22px; height:22px; display:grid; place-items:center; border-radius:50%; }
  .cl-day.is-today .cl-day__n { background: var(--fill-accent); color: var(--text-onaccent); font-weight:600; }
  .cl-ev { font-size:11px; padding:2px 6px; border-radius:3px; background: var(--fill-accent);
    color: var(--text-onaccent); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:none; }
  .cl-ev.c1 { background:#8764b8; color:#fff } .cl-ev.c2 { background:#107c10; color:#fff }
  .cl-ev.c3 { background:#c8382f; color:#fff } .cl-ev.c4 { background:#ca5010; color:#fff }
  .cl-daycol { display:flex; flex-direction:column; overflow:auto; }
  .cl-hour { display:grid; grid-template-columns:56px 1fr; min-height:48px; border-bottom:1px solid var(--stroke-divider); }
  .cl-hour__t { font-size:11px; color:var(--text-tertiary); padding:2px 8px; text-align:right; }
  .cl-hour__b { border-left:1px solid var(--stroke-divider); padding:2px 6px; display:flex; flex-direction:column; gap:2px; }
  .cl-agenda { display:flex; flex-direction:column; gap:6px; }
  .cl-aitem { display:flex; gap:10px; align-items:flex-start; padding:8px 10px; border-radius:var(--r-sm);
    background: var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card); }
  .cl-adot { width:8px; height:8px; border-radius:50%; margin-top:5px; flex:none; background: var(--fill-accent); }
  `);

  const KEY = 'win11web.calendar.v1';
  const COLORS = ['', 'c1', 'c2', 'c3', 'c4'];

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(evs) { try { localStorage.setItem(KEY, JSON.stringify(evs)); } catch (e) { } }

  function mount(win, args) {
    win.setBodyBg('');
    let evs = load();
    if (!evs.length) {
      const t = new Date();
      const d = (n) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + n);
      evs = [
        { id: U.uid('ev'), date: key(d(0)), time: '10:00', dur: 60, title: '团队周会', color: 0, loc: '会议室 A' },
        { id: U.uid('ev'), date: key(d(0)), time: '15:30', dur: 45, title: '设计评审：任务栏动效', color: 1, loc: 'Teams' },
        { id: U.uid('ev'), date: key(d(1)), time: '09:00', dur: 30, title: '每日站会', color: 2, loc: '' },
        { id: U.uid('ev'), date: key(d(3)), time: '14:00', dur: 120, title: '发布评审', color: 3, loc: '会议室 B' },
        { id: U.uid('ev'), date: key(d(-2)), time: '11:00', dur: 60, title: '客户沟通', color: 4, loc: '电话' }
      ];
      save(evs);
    }

    let view = 'month', ref = new Date(), sel = new Date(), miniRef = new Date();

    const root = U.el('div.cl-root');
    const side = U.el('div.cl-side');
    const main = U.el('div.cl-main');
    root.append(side, main);
    win.body.appendChild(root);

    function key(d) { return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); }
    function evsOn(d) { const k = key(d); return evs.filter(e => e.date === k).sort((a, b) => a.time.localeCompare(b.time)); }
    const sameDay = (a, b) => key(a) === key(b);

    /* ---------- 侧栏 ---------- */
    function buildSide() {
      U.clear(side);
      const add = U.el('button.btn.btn--accent', { style: { width: '100%' } }, [Icons.ui('plus', 14), U.el('span', { text: '新建活动' })]);
      add.onclick = () => editEvent(null, sel);
      side.appendChild(add);

      /* 迷你月历 */
      const mini = U.el('div.cl-mini');
      const h = U.el('div.cl-mini__h', {}, [
        U.el('div.cl-mini__t', { text: miniRef.getFullYear() + '年' + (miniRef.getMonth() + 1) + '月' }),
        (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '上一月' }, Icons.ui('chevronUp', 12)); b.onclick = () => { miniRef = new Date(miniRef.getFullYear(), miniRef.getMonth() - 1, 1); buildSide(); }; return b; })(),
        (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '下一月' }, Icons.ui('chevronDown', 12)); b.onclick = () => { miniRef = new Date(miniRef.getFullYear(), miniRef.getMonth() + 1, 1); buildSide(); }; return b; })()
      ]);
      const g = U.el('div.cl-mini__g');
      ['一', '二', '三', '四', '五', '六', '日'].forEach(w => g.appendChild(U.el('div.cl-mini__w', { text: w })));
      const today = new Date();
      const first = new Date(miniRef.getFullYear(), miniRef.getMonth(), 1);
      let st = first.getDay() - 1; if (st < 0) st = 6;
      const dim = new Date(miniRef.getFullYear(), miniRef.getMonth() + 1, 0).getDate();
      const prevDim = new Date(miniRef.getFullYear(), miniRef.getMonth(), 0).getDate();
      for (let i = st - 1; i >= 0; i--) g.appendChild(U.el('div.cl-mini__d.is-out', { text: prevDim - i }));
      for (let d = 1; d <= dim; d++) {
        const dd = new Date(miniRef.getFullYear(), miniRef.getMonth(), d);
        const cls = '.cl-mini__d' + (sameDay(dd, today) ? '.is-today' : '') + (sameDay(dd, sel) && !sameDay(dd, today) ? '.is-sel' : '');
        const c = U.el('div' + cls, { text: d });
        c.onclick = () => { sel = dd; ref = new Date(dd); buildSide(); render(); };
        g.appendChild(c);
      }
      mini.append(h, g);
      side.appendChild(mini);

      /* 日程 */
      side.appendChild(U.el('div', { text: U.fmtDateLong(sel), style: { fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginTop: '4px' } }));
      const ag = U.el('div.cl-agenda');
      const list = evsOn(sel);
      if (!list.length) ag.appendChild(U.el('div.caption.text-tertiary', { text: '这一天没有安排' }));
      list.forEach(e => {
        const it = U.el('div.cl-aitem', {}, [
          U.el('div.cl-adot', { style: e.color ? { background: ['#0078d4', '#8764b8', '#107c10', '#c8382f', '#ca5010'][e.color] } : null }),
          U.el('div', { style: { minWidth: 0, flex: 1 } }, [
            U.el('div', { text: e.title, style: { fontSize: 'var(--fs-body)' } }),
            U.el('div.caption.text-secondary', { text: e.time + ' · ' + e.dur + ' 分钟' + (e.loc ? ' · ' + e.loc : '') })
          ])
        ]);
        it.onclick = () => editEvent(e, sel);
        ag.appendChild(it);
      });
      side.appendChild(ag);

      side.appendChild(U.el('div.divider-h', { style: { marginTop: '8px' } }));
      const cals = U.el('div', {}, [
        U.el('div', { text: '日历', style: { fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', margin: '8px 0 6px' } }),
        U.el('label.checkbox', {}, [U.el('input', { type: 'checkbox', checked: true }), U.el('span.checkbox__box'), U.el('span', { text: '我的日历' })]),
        U.el('label.checkbox', { style: { marginTop: '6px' } }, [U.el('input', { type: 'checkbox', checked: true }), U.el('span.checkbox__box'), U.el('span', { text: '工作' })]),
        U.el('label.checkbox', { style: { marginTop: '6px' } }, [U.el('input', { type: 'checkbox' }), U.el('span.checkbox__box'), U.el('span', { text: '中国节假日' })])
      ]);
      side.appendChild(cals);
    }

    /* ---------- 主体 ---------- */
    function render() {
      U.clear(main);
      const bar = U.el('div.cl-bar');
      const title = view === 'month'
        ? ref.getFullYear() + '年' + (ref.getMonth() + 1) + '月'
        : view === 'week' ? weekLabel() : U.fmtDateLong(sel);
      bar.append(
        (() => { const b = U.el('button.btn.btn--sm', { text: '今天' }); b.onclick = () => { ref = new Date(); sel = new Date(); miniRef = new Date(); buildSide(); render(); }; return b; })(),
        (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '上一个' }, Icons.ui('chevronLeft', 14)); b.onclick = () => shift(-1); return b; })(),
        (() => { const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '下一个' }, Icons.ui('chevronRight', 14)); b.onclick = () => shift(1); return b; })(),
        U.el('div.cl-mtitle', { text: title }),
        U.el('div.spacer')
      );
      [['day', '日'], ['week', '周'], ['month', '月']].forEach(([id, n]) => {
        const b = U.el('button.cmdbtn' + (view === id ? '.is-active' : ''), { text: n });
        b.onclick = () => { view = id; render(); };
        bar.appendChild(b);
      });
      main.appendChild(bar);
      win.setTitle(title + ' - 日历');

      if (view === 'month') renderMonth();
      else if (view === 'week') renderWeek();
      else renderDay();
    }

    function shift(d) {
      if (view === 'month') ref = new Date(ref.getFullYear(), ref.getMonth() + d, 1);
      else if (view === 'week') ref = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + d * 7);
      else { sel = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() + d); ref = new Date(sel); }
      miniRef = new Date(ref);
      buildSide(); render();
    }

    function weekStart(d) { const x = new Date(d); let w = x.getDay() - 1; if (w < 0) w = 6; x.setDate(x.getDate() - w); return x; }
    function weekLabel() {
      const s = weekStart(ref), e = new Date(s); e.setDate(s.getDate() + 6);
      return (s.getMonth() + 1) + '月' + s.getDate() + '日 – ' + (e.getMonth() + 1) + '月' + e.getDate() + '日';
    }

    function renderMonth() {
      const grid = U.el('div.cl-grid');
      const wd = U.el('div.cl-wd');
      ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].forEach(w => wd.appendChild(U.el('div', { text: w })));
      grid.appendChild(wd);
      const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const start = weekStart(first);
      const today = new Date();
      for (let w = 0; w < 6; w++) {
        const row = U.el('div.cl-week');
        for (let i = 0; i < 7; i++) {
          const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i);
          const out = d.getMonth() !== ref.getMonth();
          const cell = U.el('div.cl-day' + (out ? '.is-out' : '') + (sameDay(d, today) ? '.is-today' : ''));
          cell.appendChild(U.el('div.cl-day__n', { text: d.getDate() === 1 ? (d.getMonth() + 1) + '月1日' : d.getDate() }));
          evsOn(d).slice(0, 3).forEach(e => {
            const ev = U.el('div.cl-ev' + (e.color ? '.' + COLORS[e.color] : ''), { text: e.time + ' ' + e.title, title: e.title });
            ev.onclick = (x) => { x.stopPropagation(); editEvent(e, d); };
            cell.appendChild(ev);
          });
          const more = evsOn(d).length - 3;
          if (more > 0) cell.appendChild(U.el('div.caption.text-tertiary', { text: '还有 ' + more + ' 项' }));
          cell.onclick = () => { sel = d; miniRef = new Date(d); buildSide(); U.$$('.cl-day', grid).forEach(x => x.style.outline = ''); cell.style.outline = '2px solid var(--fill-accent)'; cell.style.outlineOffset = '-2px'; };
          cell.ondblclick = () => editEvent(null, d);
          cell.oncontextmenu = (e2) => {
            e2.preventDefault();
            Menu.show([
              { label: '新建活动', icon: 'plus', onClick: () => editEvent(null, d) },
              { label: '切换到日视图', icon: 'calendar', onClick: () => { sel = d; view = 'day'; render(); } }
            ], { x: e2.clientX, y: e2.clientY });
          };
          row.appendChild(cell);
        }
        grid.appendChild(row);
      }
      main.appendChild(grid);
      U.anim(grid, [{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
    }

    function renderWeek() {
      const wrap = U.el('div.cl-daycol');
      const s = weekStart(ref);
      const head = U.el('div.cl-hour', { style: { position: 'sticky', top: 0, background: 'var(--bg-solid-3)', zIndex: 2, minHeight: '40px' } });
      head.appendChild(U.el('div.cl-hour__t', { text: '' }));
      const hb = U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderLeft: '1px solid var(--stroke-divider)' } });
      for (let i = 0; i < 7; i++) {
        const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i);
        hb.appendChild(U.el('div', {
          text: U.WEEK_CN_S[d.getDay()] + ' ' + d.getDate(),
          style: { textAlign: 'center', fontSize: 'var(--fs-caption)', padding: '10px 0', fontWeight: sameDay(d, new Date()) ? 600 : 400, color: sameDay(d, new Date()) ? 'var(--text-accent)' : '' }
        }));
      }
      head.appendChild(hb);
      wrap.appendChild(head);
      for (let h = 0; h < 24; h++) {
        const row = U.el('div.cl-hour');
        row.appendChild(U.el('div.cl-hour__t', { text: U.pad(h) + ':00' }));
        const cols = U.el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderLeft: '1px solid var(--stroke-divider)' } });
        for (let i = 0; i < 7; i++) {
          const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i);
          const cell = U.el('div.cl-hour__b');
          evsOn(d).filter(e => +e.time.split(':')[0] === h).forEach(e => {
            const ev = U.el('div.cl-ev' + (e.color ? '.' + COLORS[e.color] : ''), { text: e.title });
            ev.onclick = () => editEvent(e, d);
            cell.appendChild(ev);
          });
          cell.ondblclick = () => editEvent(null, d, U.pad(h) + ':00');
          cols.appendChild(cell);
        }
        row.appendChild(cols);
        wrap.appendChild(row);
      }
      main.appendChild(wrap);
      setTimeout(() => { wrap.scrollTop = 8 * 48; }, 20);
    }

    function renderDay() {
      const wrap = U.el('div.cl-daycol');
      for (let h = 0; h < 24; h++) {
        const row = U.el('div.cl-hour');
        row.appendChild(U.el('div.cl-hour__t', { text: U.pad(h) + ':00' }));
        const cell = U.el('div.cl-hour__b');
        evsOn(sel).filter(e => +e.time.split(':')[0] === h).forEach(e => {
          const ev = U.el('div.cl-ev' + (e.color ? '.' + COLORS[e.color] : ''), {
            text: e.time + ' ' + e.title + (e.loc ? ' · ' + e.loc : ''), style: { padding: '6px 8px', fontSize: 'var(--fs-caption)' }
          });
          ev.onclick = () => editEvent(e, sel);
          cell.appendChild(ev);
        });
        cell.ondblclick = () => editEvent(null, sel, U.pad(h) + ':00');
        row.appendChild(cell);
        wrap.appendChild(row);
      }
      main.appendChild(wrap);
      setTimeout(() => { wrap.scrollTop = 8 * 48; }, 20);
    }

    /* ---------- 活动编辑 ---------- */
    function editEvent(e, d, defTime) {
      const isNew = !e;
      const title = U.el('input', { value: e ? e.title : '', placeholder: '添加标题' });
      const time = U.el('input', { value: e ? e.time : (defTime || '09:00'), placeholder: 'HH:MM' });
      const dur = U.el('input', { value: e ? e.dur : 60, type: 'number', min: 15, step: 15 });
      const loc = U.el('input', { value: e ? e.loc || '' : '', placeholder: '位置（可选）' });
      let color = e ? e.color : 0;
      const colors = U.el('div', { style: { display: 'flex', gap: '8px', marginTop: '6px' } });
      ['#0078d4', '#8764b8', '#107c10', '#c8382f', '#ca5010'].forEach((c, i) => {
        const b = U.el('button', { style: { width: '24px', height: '24px', borderRadius: '50%', background: c, outline: i === color ? '2px solid var(--text-primary)' : 'none', outlineOffset: '2px' } });
        b.onclick = () => { color = i; U.$$('button', colors).forEach((x, j) => x.style.outline = j === i ? '2px solid var(--text-primary)' : 'none'); };
        colors.appendChild(b);
      });
      const content = U.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, [
        U.el('div.textbox', {}, title),
        U.el('div', { style: { display: 'flex', gap: '10px' } }, [
          U.el('div', { style: { flex: 1 } }, [U.el('div.caption.text-secondary', { text: '开始时间' }), U.el('div.textbox', {}, time)]),
          U.el('div', { style: { flex: 1 } }, [U.el('div.caption.text-secondary', { text: '时长（分钟）' }), U.el('div.textbox', {}, dur)])
        ]),
        U.el('div', {}, [U.el('div.caption.text-secondary', { text: '位置' }), U.el('div.textbox', {}, loc)]),
        U.el('div', {}, [U.el('div.caption.text-secondary', { text: '颜色' }), colors]),
        U.el('div.caption.text-tertiary', { text: '日期：' + U.fmtDateLong(d) })
      ]);
      const buttons = [{ text: '保存', accent: true, value: 'save' }, { text: '取消', value: null }];
      if (!isNew) buttons.push({ text: '删除', value: 'del' });
      Notifications.dialog({
        title: isNew ? '新建活动' : '编辑活动', content, width: 420, buttons,
        onClose: (v) => {
          if (v === 'save') {
            if (!title.value.trim()) return;
            if (isNew) evs.push({ id: U.uid('ev'), date: key(d), time: time.value || '09:00', dur: +dur.value || 60, title: title.value.trim(), color, loc: loc.value.trim() });
            else Object.assign(e, { time: time.value, dur: +dur.value || 60, title: title.value.trim(), color, loc: loc.value.trim() });
            save(evs); buildSide(); render();
            Notifications.toast({ title: isNew ? '已创建活动' : '已更新活动', body: title.value.trim() + ' · ' + U.fmtDateShort(d), appIcon: 'calendar', timeout: 2600 });
          } else if (v === 'del') {
            evs = evs.filter(x => x.id !== e.id);
            save(evs); buildSide(); render();
          }
        }
      });
      setTimeout(() => title.focus(), 80);
    }

    buildSide(); render();
  }

  Apps.register({
    id: 'calendar', name: '日历', icon: 'calendar', category: '生产效率',
    size: { w: 1120, h: 720 }, minSize: { w: 640, h: 440 }, mount, singleton: true, sortKey: 'rili'
  });
})(window);
