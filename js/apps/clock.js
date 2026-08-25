/* ============================================================
   clock.js — 时钟（焦点会话 / 计时器 / 闹钟 / 秒表 / 世界时钟）
   ============================================================ */
(function (global) {
  'use strict';

  U.injectStyle('clock', `
  .ck-root { display:flex; height:100%; min-height:0; }
  .ck-nav { width:196px; flex:none; padding:8px 4px 8px 8px; display:flex; flex-direction:column; gap:2px; }
  .ck-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; overflow:hidden;
    background: var(--bg-solid); border-top-left-radius:8px; box-shadow: inset 1px 1px 0 var(--stroke-control); }
  [data-theme="dark"] .ck-main { background: rgba(255,255,255,.025); }
  .ck-body { flex:1 1 auto; min-height:0; overflow:auto; padding:20px 24px 24px; }
  .ck-big { font-family:var(--font-display); font-size:64px; font-weight:600; font-variant-numeric:tabular-nums;
    letter-spacing:-.02em; line-height:1.1; }
  .ck-ms { font-size:28px; color:var(--text-secondary); }
  .ck-ring { width:240px; height:240px; position:relative; margin:0 auto 18px; }
  .ck-ring svg { transform:rotate(-90deg); }
  .ck-ring__c { position:absolute; inset:0; display:grid; place-items:center; text-align:center; }
  .ck-btns { display:flex; gap:10px; justify-content:center; margin-top:18px; }
  .ck-laps { margin-top:20px; max-height:220px; overflow:auto; }
  .ck-lap { display:flex; justify-content:space-between; padding:8px 12px; border-radius:var(--r-sm);
    font-variant-numeric:tabular-nums; font-size:var(--fs-body); }
  .ck-lap:nth-child(odd) { background: var(--fill-subtle-hover); }
  .ck-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
  .ck-card { border-radius:var(--r-lg); padding:16px; background:var(--bg-card);
    box-shadow: inset 0 0 0 1px var(--stroke-card); cursor:default;
    transition: background-color var(--dur-fast) linear; }
  .ck-card:hover { background:var(--bg-card-hover); }
  .ck-card__t { font-family:var(--font-display); font-size:30px; font-weight:600; font-variant-numeric:tabular-nums; }
  .ck-card__s { font-size:var(--fs-caption); color:var(--text-secondary); margin-top:2px; }
  .ck-world { display:flex; align-items:center; gap:16px; padding:14px 16px; border-radius:var(--r-lg);
    background:var(--bg-card); box-shadow: inset 0 0 0 1px var(--stroke-card); margin-bottom:8px; }
  .ck-analog { width:56px; height:56px; flex:none; }
  `);

  const ZONES = [
    { city: '北京', off: 8 }, { city: '东京', off: 9 }, { city: '新加坡', off: 8 },
    { city: '迪拜', off: 4 }, { city: '伦敦', off: 1 }, { city: '柏林', off: 2 },
    { city: '纽约', off: -4 }, { city: '洛杉矶', off: -7 }, { city: '悉尼', off: 10 }
  ];

  function mount(win, args) {
    win.setBodyBg('');
    const root = U.el('div.ck-root');
    const nav = U.el('div.ck-nav');
    const main = U.el('div.ck-main');
    root.append(nav, main);
    win.body.appendChild(root);

    let page = (args && args.page) || 'focus';
    const S = {
      sw: { t: 0, running: false, laps: [] },
      timer: { total: 300, left: 300, running: false },
      focus: { total: 1500, left: 1500, running: false, done: 0 },
      alarms: [{ h: 7, m: 30, on: true, label: '起床', days: '工作日' }, { h: 12, m: 0, on: false, label: '午休', days: '每天' }]
    };

    const NAVS = [
      { id: 'focus', name: '焦点会话', icon: 'lightbulb' },
      { id: 'timer', name: '计时器', icon: 'time' },
      { id: 'alarm', name: '闹钟', icon: 'bell' },
      { id: 'stopwatch', name: '秒表', icon: 'clock' },
      { id: 'world', name: '世界时钟', icon: 'globe' }
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
    }

    const fmtMs = (ms) => {
      const t = Math.floor(ms / 10);
      return U.pad(Math.floor(t / 6000)) + ':' + U.pad(Math.floor(t / 100) % 60) + '.' + U.pad(t % 100);
    };
    const fmtSec = (s) => {
      s = Math.max(0, Math.round(s));
      const h = Math.floor(s / 3600);
      return (h ? h + ':' : '') + U.pad(Math.floor(s / 60) % 60) + ':' + U.pad(s % 60);
    };

    function ring(pct, label, sub, color) {
      const r = 108, c = 2 * Math.PI * r;
      const wrap = U.el('div.ck-ring');
      wrap.innerHTML = '<svg width="240" height="240" viewBox="0 0 240 240">' +
        '<circle cx="120" cy="120" r="' + r + '" fill="none" stroke="var(--fill-control-strong)" stroke-opacity=".25" stroke-width="10"/>' +
        '<circle cx="120" cy="120" r="' + r + '" fill="none" stroke="' + (color || 'var(--fill-accent)') + '" stroke-width="10" stroke-linecap="round" ' +
        'stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct)) + '" style="transition:stroke-dashoffset .3s linear"/></svg>';
      wrap.appendChild(U.el('div.ck-ring__c', {}, [
        U.el('div.ck-big', { text: label, style: { fontSize: '44px' } }),
        sub ? U.el('div.caption.text-secondary', { text: sub }) : null
      ]));
      return wrap;
    }

    function analog(d) {
      const h = d.getHours() % 12, m = d.getMinutes();
      const ha = h * 30 + m * .5, ma = m * 6;
      return U.el('div.ck-analog', {
        html: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="none" stroke="var(--stroke-control-2)" stroke-width="2"/>' +
          '<line x1="28" y1="28" x2="' + (28 + 13 * Math.sin(ha * Math.PI / 180)) + '" y2="' + (28 - 13 * Math.cos(ha * Math.PI / 180)) + '" stroke="var(--text-primary)" stroke-width="2.6" stroke-linecap="round"/>' +
          '<line x1="28" y1="28" x2="' + (28 + 19 * Math.sin(ma * Math.PI / 180)) + '" y2="' + (28 - 19 * Math.cos(ma * Math.PI / 180)) + '" stroke="var(--accent-light2)" stroke-width="2" stroke-linecap="round"/>' +
          '<circle cx="28" cy="28" r="2" fill="var(--text-primary)"/></svg>'
      });
    }

    function render() {
      U.clear(main);
      buildNav();
      const body = U.el('div.ck-body');
      main.appendChild(body);
      const title = NAVS.find(n => n.id === page).name;
      body.appendChild(U.el('div', { text: title, style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-subtitle)', fontWeight: 600, marginBottom: '16px' } }));
      win.setTitle(title + ' - 时钟');

      if (page === 'stopwatch') {
        body.appendChild(ring(S.sw.t % 60000 / 60000, fmtMs(S.sw.t), S.sw.running ? '计时中' : '已暂停'));
        const btns = U.el('div.ck-btns');
        const p = U.el('button.btn.btn--accent.btn--wide', { text: S.sw.running ? '暂停' : (S.sw.t ? '继续' : '开始') });
        p.onclick = () => { S.sw.running = !S.sw.running; render(); };
        const l = U.el('button.btn.btn--wide', { text: '计次', disabled: !S.sw.running });
        l.onclick = () => { S.sw.laps.unshift(S.sw.t); render(); };
        const r = U.el('button.btn.btn--wide', { text: '重置', disabled: !S.sw.t });
        r.onclick = () => { S.sw = { t: 0, running: false, laps: [] }; render(); };
        btns.append(p, l, r);
        body.appendChild(btns);
        if (S.sw.laps.length) {
          const laps = U.el('div.ck-laps');
          S.sw.laps.forEach((t, i) => {
            const prev = S.sw.laps[i + 1] || 0;
            laps.appendChild(U.el('div.ck-lap', {}, [
              U.el('span', { text: '计次 ' + (S.sw.laps.length - i) }),
              U.el('span.text-secondary', { text: '+' + fmtMs(t - prev) }),
              U.el('span', { text: fmtMs(t) })
            ]));
          });
          body.appendChild(laps);
        }
      }

      else if (page === 'timer') {
        body.appendChild(ring(S.timer.total ? S.timer.left / S.timer.total : 0, fmtSec(S.timer.left), S.timer.running ? '倒计时中' : '已暂停', 'var(--accent-light1)'));
        const btns = U.el('div.ck-btns');
        const p = U.el('button.btn.btn--accent.btn--wide', { text: S.timer.running ? '暂停' : '开始' });
        p.onclick = () => { if (!S.timer.left) S.timer.left = S.timer.total; S.timer.running = !S.timer.running; render(); };
        const r = U.el('button.btn.btn--wide', { text: '重置' });
        r.onclick = () => { S.timer.left = S.timer.total; S.timer.running = false; render(); };
        btns.append(p, r);
        body.appendChild(btns);
        const presets = U.el('div.ck-cards', { style: { marginTop: '22px' } });
        [[60, '1 分钟'], [180, '3 分钟'], [300, '5 分钟'], [600, '10 分钟'], [1500, '25 分钟'], [3600, '1 小时']].forEach(([s, n]) => {
          const c = U.el('div.ck-card', {}, [U.el('div.ck-card__t', { text: fmtSec(s) }), U.el('div.ck-card__s', { text: n })]);
          c.onclick = () => { S.timer = { total: s, left: s, running: true }; render(); };
          presets.appendChild(c);
        });
        body.appendChild(presets);
      }

      else if (page === 'focus') {
        const done = S.focus.done;
        body.appendChild(ring(S.focus.total ? 1 - S.focus.left / S.focus.total : 0, fmtSec(S.focus.left),
          S.focus.running ? '专注中，加油' : '准备开始', 'var(--accent-light2)'));
        const btns = U.el('div.ck-btns');
        const p = U.el('button.btn.btn--accent.btn--wide', { text: S.focus.running ? '暂停会话' : '开始焦点会话' });
        p.onclick = () => { S.focus.running = !S.focus.running; render(); };
        const r = U.el('button.btn.btn--wide', { text: '跳过' });
        r.onclick = () => { S.focus.left = 0; render(); };
        btns.append(p, r);
        body.appendChild(btns);
        const cards = U.el('div.ck-cards', { style: { marginTop: '22px' } });
        cards.append(
          U.el('div.ck-card', {}, [U.el('div.ck-card__t', { text: String(done) }), U.el('div.ck-card__s', { text: '今日已完成会话' })]),
          U.el('div.ck-card', {}, [U.el('div.ck-card__t', { text: fmtSec(done * 1500) }), U.el('div.ck-card__s', { text: '累计专注时间' })]),
          (() => {
            const c = U.el('div.ck-card', {}, [U.el('div.ck-card__t', { text: '25:00' }), U.el('div.ck-card__s', { text: '会话时长 · 点击更改' })]);
            c.onclick = () => {
              Menu.show([15, 25, 30, 45, 60].map(m => ({
                label: m + ' 分钟', checked: S.focus.total === m * 60,
                onClick: () => { S.focus = { total: m * 60, left: m * 60, running: false, done }; render(); }
              })), { anchor: c, align: 'bottom-left' });
            };
            return c;
          })(),
          U.el('div.ck-card', {}, [U.el('div.ck-card__t', { text: '5:00' }), U.el('div.ck-card__s', { text: '休息时长' })])
        );
        body.appendChild(cards);
      }

      else if (page === 'alarm') {
        const list = U.el('div');
        S.alarms.forEach((a, i) => {
          const row = U.el('div.ck-world', {}, [
            U.el('div', { style: { flex: 1 } }, [
              U.el('div.ck-card__t', { text: U.pad(a.h) + ':' + U.pad(a.m) }),
              U.el('div.ck-card__s', { text: a.label + ' · ' + a.days })
            ]),
            Shell.toggle(a.on, v => { a.on = v; Notifications.toast({ title: '闹钟' + (v ? '已开启' : '已关闭'), body: U.pad(a.h) + ':' + U.pad(a.m) + ' ' + a.label, appIcon: 'clock' }); }),
            (() => {
              const b = U.el('button.cmdbtn.cmdbtn--icon', { title: '删除' }, Icons.ui('trash', 14));
              b.onclick = () => { S.alarms.splice(i, 1); render(); };
              return b;
            })()
          ]);
          list.appendChild(row);
        });
        body.appendChild(list);
        const add = U.el('button.btn.btn--accent', { style: { marginTop: '14px' } }, [Icons.ui('plus', 14), U.el('span', { text: '添加闹钟' })]);
        add.onclick = async () => {
          const v = await Notifications.prompt('添加闹钟', U.pad(new Date().getHours()) + ':' + U.pad(new Date().getMinutes()), '时间（HH:MM）');
          if (!v) return;
          const m = v.match(/^(\d{1,2})[:：](\d{1,2})$/);
          if (!m) { Notifications.toast({ title: '格式无效', body: '请使用 HH:MM 格式。', icon: 'warning' }); return; }
          S.alarms.push({ h: +m[1] % 24, m: +m[2] % 60, on: true, label: '闹钟', days: '仅一次' });
          S.alarms.sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m));
          render();
        };
        body.appendChild(add);
      }

      else if (page === 'world') {
        const now = new Date();
        const local = U.el('div.ck-world', {}, [
          analog(now),
          U.el('div', { style: { flex: 1 } }, [
            U.el('div.ck-card__t', { text: U.fmtTime(now, true) }),
            U.el('div.ck-card__s', { text: '本地时间 · ' + U.fmtDateLong(now) })
          ])
        ]);
        body.appendChild(local);
        ZONES.forEach(z => {
          const t = new Date(now.getTime() + (z.off * 60 - -now.getTimezoneOffset() * 0 - (now.getTimezoneOffset() * -1)) * 60000);
          const utc = now.getTime() + now.getTimezoneOffset() * 60000;
          const zt = new Date(utc + z.off * 3600000);
          const diff = z.off - (-now.getTimezoneOffset() / 60);
          body.appendChild(U.el('div.ck-world', {}, [
            analog(zt),
            U.el('div', { style: { flex: 1 } }, [
              U.el('div.ck-card__t', { text: U.fmtTime(zt) }),
              U.el('div.ck-card__s', { text: z.city + ' · ' + (diff === 0 ? '与本地相同' : (diff > 0 ? '快 ' + diff : '慢 ' + (-diff)) + ' 小时') })
            ]),
            U.el('span.caption.text-tertiary', { text: 'UTC' + (z.off >= 0 ? '+' : '') + z.off })
          ]));
        });
      }
    }

    /* 计时循环 */
    let last = performance.now();
    const loop = setInterval(() => {
      const now = performance.now(), dt = now - last; last = now;
      let need = false;
      if (S.sw.running) { S.sw.t += dt; need = page === 'stopwatch'; }
      if (S.timer.running) {
        S.timer.left -= dt / 1000;
        if (S.timer.left <= 0) {
          S.timer.left = 0; S.timer.running = false;
          Sound.notify();
          Notifications.toast({ title: '计时器结束', body: fmtSec(S.timer.total) + ' 已到时间。', appIcon: 'clock', force: true, timeout: 8000 });
        }
        need = need || page === 'timer';
      }
      if (S.focus.running) {
        S.focus.left -= dt / 1000;
        if (S.focus.left <= 0) {
          S.focus.left = 0; S.focus.running = false; S.focus.done++;
          Sound.notify();
          Notifications.toast({ title: '焦点会话完成', body: '休息一下吧，已完成 ' + S.focus.done + ' 个会话。', appIcon: 'clock', force: true, timeout: 8000 });
        }
        need = need || page === 'focus';
      }
      if (page === 'world') need = true;
      if (need) {
        if (page === 'stopwatch') { const b = main.querySelector('.ck-big'); if (b) b.textContent = fmtMs(S.sw.t); const c = main.querySelector('.ck-ring circle:last-child'); if (c) { const cc = 2 * Math.PI * 108; c.setAttribute('stroke-dashoffset', cc * (1 - (S.sw.t % 60000) / 60000)); } }
        else if (page === 'timer' || page === 'focus') {
          const st = page === 'timer' ? S.timer : S.focus;
          const b = main.querySelector('.ck-big'); if (b) b.textContent = fmtSec(st.left);
          const c = main.querySelector('.ck-ring circle:last-child');
          if (c) { const cc = 2 * Math.PI * 108; const p = page === 'timer' ? st.left / st.total : 1 - st.left / st.total; c.setAttribute('stroke-dashoffset', cc * (1 - p)); }
        }
        else if (page === 'world') render();
      }
    }, 100);
    win.on('close', () => clearInterval(loop));

    render();
  }

  Apps.register({
    id: 'clock', name: '时钟', icon: 'clock', category: '实用工具',
    size: { w: 880, h: 660 }, minSize: { w: 560, h: 440 }, mount, singleton: true, sortKey: 'shizhong'
  });
})(window);
