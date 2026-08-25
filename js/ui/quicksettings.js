/* ============================================================
   quicksettings.js — 快速设置面板（WLAN/蓝牙/飞行模式/亮度/音量…）
   ============================================================ */
(function (global) {
  'use strict';

  const NETWORKS = [
    { ssid: 'DeepSeek-5G', strength: 4, secure: true, connected: true },
    { ssid: 'HUAWEI-A1B2', strength: 3, secure: true },
    { ssid: 'TP-LINK_2.4G', strength: 3, secure: true },
    { ssid: 'CMCC-Free', strength: 2, secure: false },
    { ssid: 'Xiaomi_Router', strength: 2, secure: true },
    { ssid: 'Guest', strength: 1, secure: false }
  ];
  const DEVICES = [
    { name: 'Surface 蓝牙鼠标', icon: 'pcSmall', connected: true, battery: 78 },
    { name: 'WH-1000XM5', icon: 'music', connected: false },
    { name: 'Xbox 无线控制器', icon: 'game', connected: false },
    { name: 'iPhone 15', icon: 'phonelink', connected: false }
  ];

  const QuickSettings = {
    init() {
      Flyout.define({
        id: 'quicksettings',
        className: 'qs',
        material: 'acrylic-strong',
        width: 364,
        anchor: 'right',
        build: (root, f) => this.build(root, f)
      });
    },

    build(root) {
      const stage = U.el('div.qs__stage');
      root.appendChild(stage);
      this.stage = stage;
      this.showMain();
    },

    /**
     * 切换子页：旧页先脱离文档流（绝对定位）再淡出，避免两页同时占位导致的高度跳变；
     * 同时对面板高度做补间，得到 Windows 11 的平滑换页效果。
     */
    _page(title, content) {
      const stage = this.stage;
      const page = U.el('div.qs__page');
      if (title) {
        page.appendChild(U.el('div.qs__pagehead', {}, [
          U.el('button.qs__back', { title: '返回', onclick: () => this.showMain() }, Icons.ui('back', 16)),
          U.el('div.qs__pagetitle', { text: title })
        ]));
      }
      page.appendChild(content);

      const old = stage.firstElementChild;
      const oldH = old ? stage.offsetHeight : 0;

      if (old) {
        old.style.position = 'absolute';
        old.style.left = '0'; old.style.top = '0'; old.style.right = '0';
        old.style.pointerEvents = 'none';
        U.anim(old, [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(' + (title ? -20 : 20) + 'px)' }
        ], { duration: 140, easing: U.EASE.accel }).then(() => old.remove());
      }

      stage.appendChild(page);

      if (old) {
        const newH = page.offsetHeight;
        stage.style.height = oldH + 'px';
        requestAnimationFrame(() => {
          stage.style.transition = 'height 200ms var(--ease-decel)';
          stage.style.height = newH + 'px';
          setTimeout(() => { stage.style.transition = ''; stage.style.height = ''; }, 250);
        });
      }

      U.anim(page, [
        { opacity: 0, transform: 'translateX(' + (title ? 20 : -20) + 'px)' },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 220, easing: U.EASE.decel });
      return page;
    },

    /* ---------------- 主页 ---------------- */
    showMain() {
      const wrap = U.el('div.qs__main');
      const grid = U.el('div.qs__grid');
      const refreshers = [];

      /* label/icon/on 均为取值函数，便于原地刷新而不重建 DOM */
      const DEFS = [
        {
          label: () => Settings.airplane ? '未连接' : (Settings.wifi ? 'DeepSeek-5G' : 'WLAN'),
          icon: () => (Settings.wifi && !Settings.airplane) ? 'wifi' : 'globe',
          on: () => Settings.wifi && !Settings.airplane,
          tip: 'WLAN',
          toggle: () => Settings.set('wifi', !Settings.wifi),
          split: { title: '管理 WLAN 连接', onClick: () => this.showWifi() }
        },
        {
          label: () => '蓝牙', icon: () => 'bluetooth',
          on: () => Settings.bluetooth && !Settings.airplane,
          toggle: () => Settings.set('bluetooth', !Settings.bluetooth),
          split: { title: '管理蓝牙设备', onClick: () => this.showBluetooth() }
        },
        {
          label: () => '飞行模式', icon: () => 'airplane', on: () => Settings.airplane,
          toggle: () => {
            Settings.set('airplane', !Settings.airplane);
            if (Settings.airplane) Notifications.toast({ title: '飞行模式已开启', body: '无线通信已关闭。', icon: 'airplane' });
          }
        },
        {
          label: () => '节能模式', icon: () => 'battery', on: () => Settings.batterySaver,
          toggle: () => Settings.set('batterySaver', !Settings.batterySaver)
        },
        {
          label: () => '夜间模式', icon: () => 'nightlight', on: () => Settings.nightLight,
          toggle: () => Settings.set('nightLight', !Settings.nightLight)
        },
        {
          label: () => '辅助功能', icon: () => 'accessibility', on: () => false,
          toggle: () => this.showAccessibility()
        },
        {
          label: () => '投影', icon: () => 'cast', on: () => false,
          toggle: () => this.showCast()
        },
        {
          label: () => '专注助手', icon: () => Settings.focusAssist ? 'bellOff' : 'bell', on: () => Settings.focusAssist,
          toggle: () => Settings.set('focusAssist', !Settings.focusAssist)
        }
      ];

      DEFS.forEach(def => {
        const t = U.el('div.qs-tile' + (def.split ? '.is-split' : ''));
        const iconBox = U.el('div.qs-tile__icon');
        const labelBox = U.el('div.qs-tile__label');
        const main = U.el('button.qs-tile__main', {}, [iconBox, labelBox]);
        t.appendChild(main);
        if (def.split) {
          const chev = U.el('button.qs-tile__chev', { title: def.split.title }, Icons.ui('chevronRight', 16));
          chev.onclick = (e) => { e.stopPropagation(); def.split.onClick(); };
          t.appendChild(chev);
        }
        const refresh = () => {
          t.classList.toggle('is-on', !!def.on());
          labelBox.textContent = def.label();
          U.clear(iconBox).appendChild(Icons.ui(def.icon(), 16));
        };
        main.onclick = () => { def.toggle(); Sound.click(); refreshAll(); };
        U.tooltip(main, def.tip || def.label());
        refresh();
        refreshers.push(refresh);
        grid.appendChild(t);
      });
      wrap.appendChild(grid);

      /* ---- 亮度（尾部留出与音量行箭头等宽的占位，保证两条滑块右端对齐） ---- */
      wrap.appendChild(U.el('div.qs__slider-row', {}, [
        U.el('div.qs__slider-ico', {}, Icons.ui('brightness', 16)),
        Shell.slider(Settings.brightness, 0, 100, (v) => Settings.set('brightness', Math.round(v))),
        U.el('div.qs__slider-pad')
      ]));

      /* ---- 音量 ---- */
      const volIco = U.el('button.qs__slider-ico', { title: '静音' }, Icons.ui(Settings.muted ? 'volumeMute' : 'volume', 16));
      volIco.onclick = () => { Settings.set('muted', !Settings.muted); refreshAll(); };
      wrap.appendChild(U.el('div.qs__slider-row', {}, [
        volIco,
        Shell.slider(Settings.volume, 0, 100,
          (v) => { Settings.set('volume', Math.round(v), true); Sound.volume = Settings.volume; },
          () => Sound.volumeBeep()),
        U.el('button.qs__slider-chev', { title: '选择输出设备', onclick: () => this.showAudio() }, Icons.ui('chevronRight', 16))
      ]));

      /* ---- 底栏 ---- */
      wrap.appendChild(U.el('div.qs__foot', {}, [
        U.el('button.qs__batt', {}, [Icons.ui('battery', 16), U.el('span', { text: '86%' })]),
        U.el('div.spacer'),
        U.el('button.qs__footbtn', {
          title: '编辑快速设置',
          onclick: () => Notifications.toast({ title: '编辑快速设置', body: '布局编辑在此版本中为演示功能。', icon: 'edit' })
        }, Icons.ui('edit', 16)),
        U.el('button.qs__footbtn', {
          title: '所有设置',
          onclick: () => { Flyout.close('quicksettings'); Apps.launch('settings'); }
        }, Icons.ui('settings', 16))
      ]));

      /* 原地刷新：不重建 DOM → 不闪烁、不发生布局跳动 */
      function refreshAll() {
        refreshers.forEach(fn => fn());
        U.clear(volIco).appendChild(Icons.ui(Settings.muted ? 'volumeMute' : 'volume', 16));
      }
      this._refreshMain = refreshAll;

      const page = this._page(null, wrap);
      U.$$('.qs-tile', wrap).forEach((t, i) => U.anim(t,
        [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
        { duration: 240, delay: i * 16, easing: U.EASE.decel }));
      return page;
    },

    showWifi() {
      const c = U.el('div.qs__list');
      c.appendChild(U.el('div.qs__toggle-row', {}, [
        U.el('div', { text: 'WLAN' }), U.el('div.spacer'),
        Shell.toggle(Settings.wifi, (v) => { Settings.set('wifi', v); this.showWifi(); })
      ]));
      if (Settings.wifi) {
        NETWORKS.forEach(n => {
          const row = U.el('button.qs-net' + (n.connected ? '.is-connected' : ''), {}, [
            U.el('div.qs-net__ico', {}, Icons.ui('wifi', 16)),
            U.el('div.qs-net__txt', {}, [
              U.el('div', { text: n.ssid }),
              U.el('div.qs-net__sub', { text: n.connected ? '已连接，安全' : (n.secure ? '安全' : '开放') })
            ])
          ]);
          row.onclick = () => {
            NETWORKS.forEach(x => x.connected = false);
            n.connected = true;
            Sound.connect();
            Notifications.toast({ title: n.ssid, body: '已连接', icon: 'wifi' });
            this.showWifi();
          };
          c.appendChild(row);
        });
      } else {
        c.appendChild(U.el('div.qs__hint', { text: 'WLAN 已关闭。打开后可查看可用网络。' }));
      }
      c.appendChild(U.el('button.qs__link', {
        text: '更多 WLAN 设置',
        onclick: () => { Flyout.close('quicksettings'); Apps.launch('settings', { page: 'network' }); }
      }));
      this._page('WLAN', c);
    },

    showBluetooth() {
      const c = U.el('div.qs__list');
      c.appendChild(U.el('div.qs__toggle-row', {}, [
        U.el('div', { text: '蓝牙' }), U.el('div.spacer'),
        Shell.toggle(Settings.bluetooth, (v) => { Settings.set('bluetooth', v); this.showBluetooth(); })
      ]));
      if (Settings.bluetooth) {
        DEVICES.forEach(d => {
          const row = U.el('button.qs-net' + (d.connected ? '.is-connected' : ''), {}, [
            U.el('div.qs-net__ico', {}, Icons.ui(d.icon, 16)),
            U.el('div.qs-net__txt', {}, [
              U.el('div', { text: d.name }),
              U.el('div.qs-net__sub', { text: d.connected ? '已连接' + (d.battery ? ' · 电量 ' + d.battery + '%' : '') : '已配对' })
            ])
          ]);
          row.onclick = () => {
            d.connected = !d.connected;
            Sound.connect();
            Notifications.toast({ title: d.name, body: d.connected ? '已连接' : '已断开连接', icon: 'bluetooth' });
            this.showBluetooth();
          };
          c.appendChild(row);
        });
      } else c.appendChild(U.el('div.qs__hint', { text: '蓝牙已关闭。' }));
      c.appendChild(U.el('button.qs__link', {
        text: '更多蓝牙设置',
        onclick: () => { Flyout.close('quicksettings'); Apps.launch('settings', { page: 'bluetooth' }); }
      }));
      this._page('蓝牙', c);
    },

    showCast() {
      const c = U.el('div.qs__list');
      c.appendChild(U.el('div.qs__hint', { text: '正在查找显示器…' }));
      c.appendChild(U.el('div.qs__spinner', {}, U.el('div.spinner')));
      setTimeout(() => {
        if (!c.isConnected) return;
        U.clear(c);
        c.appendChild(U.el('div.qs__hint', { text: '未找到无线显示器。' }));
        c.appendChild(U.el('button.qs__link', {
          text: '其他显示设置',
          onclick: () => { Flyout.close('quicksettings'); Apps.launch('settings', { page: 'system', sub: 'display' }); }
        }));
      }, 2200);
      this._page('投影', c);
    },

    showAudio() {
      const c = U.el('div.qs__list');
      [['扬声器（Realtek High Definition Audio）', true], ['耳机（WH-1000XM5）', false], ['显示器（NVIDIA HDMI）', false]].forEach(([n, on]) => {
        const row = U.el('button.qs-net' + (on ? '.is-connected' : ''), {}, [
          U.el('div.qs-net__ico', {}, Icons.ui('volume', 16)),
          U.el('div.qs-net__txt', {}, [U.el('div', { text: n }), U.el('div.qs-net__sub', { text: on ? '默认设备' : '' })])
        ]);
        row.onclick = () => { Notifications.toast({ title: '输出设备', body: '已切换到：' + n, icon: 'volume' }); Sound.ding(); };
        c.appendChild(row);
      });
      this._page('选择播放声音的设备', c);
    },

    showAccessibility() {
      const c = U.el('div.qs__list');
      [['放大镜', 'zoomIn'], ['颜色滤镜', 'palette'], ['讲述人', 'mic'],
      ['单击锁定', 'keyboard'], ['实时字幕', 'text']].forEach(([n, ic]) => {
        c.appendChild(U.el('div.qs__toggle-row', {}, [
          U.el('div.qs-net__ico', {}, Icons.ui(ic, 16)),
          U.el('div', { text: n }), U.el('div.spacer'),
          Shell.toggle(false, (v) => Notifications.toast({ title: n, body: v ? '已启用' : '已关闭', icon: ic }))
        ]));
      });
      this._page('辅助功能', c);
    }
  };

  global.QuickSettings = QuickSettings;
})(window);
