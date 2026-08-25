/* ============================================================
   widgets.js — 小组件面板（天气 / 日历 / 待办 / 照片 / 财经 / 资讯）
   ============================================================ */
(function (global) {
  'use strict';

  const NEWS = [
    { t: 'Windows 11 发布新一轮功能更新，任务栏支持更多自定义', s: '科技日报', tag: '科技' },
    { t: '研究显示：Fluent Design 让界面阅读效率提升 12%', s: '设计观察', tag: '设计' },
    { t: '本周开源精选：十个值得关注的前端项目', s: 'GitHub 周报', tag: '开发' },
    { t: '如何用纯前端技术复刻一个操作系统桌面', s: '前端周刊', tag: '前端' },
    { t: '云端办公新趋势：浏览器成为新的操作系统', s: '商业评论', tag: '商业' },
    { t: '显卡新品评测：能效比再创新高', s: '硬件实验室', tag: '硬件' }
  ];
  const STOCKS = [
    { n: '上证指数', v: '3,142.68', d: +0.62 },
    { n: '纳斯达克', v: '16,384.47', d: +1.24 },
    { n: 'MSFT', v: '428.15', d: +0.87 },
    { n: '恒生指数', v: '18,204.13', d: -0.35 }
  ];

  const Widgets = {
    init() {
      Flyout.define({
        id: 'widgets',
        className: 'wg',
        material: 'acrylic-strong',
        width: 480,
        anchor: 'left',
        build: (root, f) => this.build(root, f)
      });
    },

    build(root) {
      /* 顶部 */
      const head = U.el('div.wg__head', {}, [
        U.el('button.wg__avatar', { title: Settings.userName },
          Settings.userAvatar ? U.el('img', { src: Settings.userAvatar }) : Icons.app('user', 32)),
        U.el('div.spacer'),
        (() => {
          const b = U.el('button.wg__searchbox', {}, [Icons.ui('search', 14), U.el('span', { text: '搜索网页' })]);
          b.onclick = () => { Flyout.close('widgets'); Apps.launch('edge'); };
          return b;
        })(),
        U.el('button.wg__add', { title: '添加小组件', onclick: () => Notifications.toast({ title: '小组件', body: '小组件库在此版本中为演示内容。', icon: 'plus' }) }, Icons.ui('plus', 16))
      ]);

      const board = U.el('div.wg__board.thin-scroll');

      /* 天气大卡 */
      const w = Weather.current();
      const wCard = U.el('div.wg-card.wg-card--weather.wg-card--lg');
      wCard.append(
        U.el('div.wg-card__head', {}, [U.el('span', { text: '北京' }), U.el('div.spacer'), U.el('button.wg-card__more', {}, Icons.ui('more', 14))]),
        U.el('div.wg-weather__now', {}, [
          Icons.app(w.icon, 56),
          U.el('div', {}, [
            U.el('div.wg-weather__temp', { text: w.temp + '°' }),
            U.el('div.wg-weather__txt', { text: w.text + ' · 空气质量 良' })
          ])
        ]),
        U.el('div.wg-weather__row', {}, Weather.forecast().slice(0, 5).map(f =>
          U.el('div.wg-weather__day', {}, [
            U.el('div.caption.text-secondary', { text: f.day }),
            Icons.app(f.icon, 20),
            U.el('div.caption', { text: f.hi + '°' }),
            U.el('div.caption.text-tertiary', { text: f.lo + '°' })
          ])
        ))
      );
      wCard.onclick = (e) => { if (!e.target.closest('.wg-card__more')) Notifications.toast({ title: '天气', body: '北京 ' + w.temp + '°C ' + w.text, appIcon: 'weather' }); };

      /* 日历卡 */
      const now = new Date();
      const calCard = U.el('div.wg-card.wg-card--sm', {}, [
        U.el('div.wg-card__head', {}, [U.el('span', { text: '日历' }), U.el('div.spacer')]),
        U.el('div.wg-cal', {}, [
          U.el('div.wg-cal__wd', { text: U.WEEK_CN[now.getDay()] }),
          U.el('div.wg-cal__day', { text: now.getDate() }),
          U.el('div.wg-cal__m', { text: (now.getMonth() + 1) + '月' })
        ]),
        U.el('div.wg-cal__evt', {}, [
          U.el('div.wg-cal__dot'),
          U.el('div', {}, [U.el('div.caption', { text: '团队周会' }), U.el('div.caption.text-tertiary', { text: '10:00 - 11:00' })])
        ])
      ]);
      calCard.onclick = () => { Flyout.close('widgets'); Apps.launch('calendar'); };

      /* 待办卡 */
      const todos = [{ t: '完成 Windows 11 Web 版任务栏', d: false }, { t: '评审窗口管理器动效', d: true }, { t: '整理设计令牌', d: false }];
      const todoCard = U.el('div.wg-card.wg-card--sm', {}, [
        U.el('div.wg-card__head', {}, [U.el('span', { text: '待办事项' }), U.el('div.spacer')]),
        U.el('div.wg-todo', {}, todos.map(t => {
          const row = U.el('label.wg-todo__row.checkbox', {}, [
            U.el('input', { type: 'checkbox', checked: t.d }),
            U.el('span.checkbox__box'),
            U.el('span' + (t.d ? '.is-done' : ''), { text: t.t })
          ]);
          row.querySelector('input').onchange = (e) => {
            row.querySelector('span:last-child').classList.toggle('is-done', e.target.checked);
            Sound.click();
          };
          return row;
        }))
      ]);

      /* 照片卡 */
      const pics = VFS.list(VFS.special('pictures')).filter(e => e.type === 'file' && e.src).slice(0, 4);
      const photoCard = U.el('div.wg-card.wg-card--sm', {}, [
        U.el('div.wg-card__head', {}, [U.el('span', { text: '照片' }), U.el('div.spacer')]),
        U.el('div.wg-photos', {}, pics.map(p => {
          const c = U.el('div.wg-photos__i', { style: { backgroundImage: 'url("' + p.src + '")' }, title: p.name });
          c.onclick = () => { Flyout.close('widgets'); Apps.launch('photos', { path: p.path }); };
          return c;
        }))
      ]);

      /* 财经卡 */
      const finCard = U.el('div.wg-card.wg-card--sm', {}, [
        U.el('div.wg-card__head', {}, [U.el('span', { text: '财经' }), U.el('div.spacer')]),
        U.el('div.wg-fin', {}, STOCKS.map(s =>
          U.el('div.wg-fin__row', {}, [
            U.el('div.truncate', { text: s.n }),
            U.el('div.spacer'),
            U.el('div.caption', { text: s.v }),
            U.el('div.wg-fin__d' + (s.d >= 0 ? '.is-up' : '.is-down'), { text: (s.d >= 0 ? '+' : '') + s.d.toFixed(2) + '%' })
          ])
        ))
      ]);

      /* 资讯流 */
      const feed = U.el('div.wg-feed');
      feed.appendChild(U.el('div.wg-feed__title', { text: '为你推荐' }));
      NEWS.forEach(n => {
        const card = U.el('button.wg-news', {}, [
          U.el('div.wg-news__txt', {}, [
            U.el('div.wg-news__t', { text: n.t }),
            U.el('div.wg-news__s', { text: n.s + ' · ' + n.tag })
          ]),
          U.el('div.wg-news__thumb', {}, Icons.ui('image', 20))
        ]);
        card.onclick = () => { Flyout.close('widgets'); Apps.launch('edge', { query: n.t }); };
        feed.appendChild(card);
      });

      board.append(
        U.el('div.wg__grid', {}, [wCard, calCard, todoCard, photoCard, finCard]),
        feed
      );
      root.append(head, board);

      U.$$('.wg-card, .wg-news', board).forEach((c, i) => U.anim(c,
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 300, delay: Math.min(i * 25, 250), easing: U.EASE.decel }));
    }
  };

  global.Widgets = Widgets;
})(window);
