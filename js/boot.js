/* ============================================================
   boot.js — 系统外壳（开机 / 锁屏 / 登录 / 关机）+ 通用 Shell 工具
   全局: Shell
   ============================================================ */
(function (global) {
  'use strict';

  const Shell = {
    booted: false,
    locked: false,

    /* ================= 通用控件工厂 ================= */
    slider(value, min, max, onInput, onCommit) {
      const el = U.el('div.slider');
      const rail = U.el('div.slider__rail');
      const fill = U.el('div.slider__fill');
      const thumb = U.el('div.slider__thumb');
      const input = U.el('input', { type: 'range', min: min, max: max, value: value, step: 1 });
      el.append(rail, fill, thumb, input);
      const sync = () => {
        const p = (input.value - min) / (max - min) * 100;
        fill.style.width = p + '%';
        thumb.style.left = p + '%';
      };
      input.oninput = () => { sync(); onInput && onInput(+input.value); };
      input.onpointerdown = () => el.classList.add('is-dragging');
      input.onpointerup = () => { el.classList.remove('is-dragging'); onCommit && onCommit(+input.value); };
      input.onchange = () => onCommit && onCommit(+input.value);
      sync();
      el.setValue = (v) => { input.value = v; sync(); };
      return el;
    },

    toggle(checked, onChange, label) {
      const wrap = U.el('label.toggle');
      const input = U.el('input', { type: 'checkbox', checked: !!checked });
      const track = U.el('span.toggle__track', {}, U.el('span.toggle__thumb'));
      wrap.append(input, track);
      if (label) wrap.appendChild(U.el('span.toggle__label', { text: label }));
      input.onchange = () => { Sound.click(); onChange && onChange(input.checked); };
      return wrap;
    },

    combo(value, options, onChange, width) {
      const btn = U.el('button.combobox', { style: width ? { minWidth: width + 'px' } : null }, [
        U.el('span.combobox__val', { text: (options.find(o => o.value === value) || options[0] || {}).label || '' }),
        U.el('span.combobox__chevron', { html: Icons.UI.chevronDown })
      ]);
      btn.onclick = () => {
        Menu.show(options.map(o => ({
          label: o.label, checked: o.value === value,
          onClick: () => { btn.querySelector('.combobox__val').textContent = o.label; onChange && onChange(o.value); }
        })), { anchor: btn, align: 'bottom-left', gap: 2 });
      };
      return btn;
    },

    /* ================= 属性对话框 ================= */
    showProperties(path) {
      const node = VFS.get(path);
      if (!node) return;
      const isDir = node.type === 'dir';
      const size = isDir ? VFS.dirSize(node) : VFS.sizeOf(node);
      const cnt = isDir ? VFS.countIn(node) : null;
      const content = U.el('div.props');
      content.append(
        U.el('div.props__top', {}, [
          Icons.app(Icons.forFile(node.name || VFS.basename(path), isDir), 44),
          U.el('div.props__name', { text: node.name || VFS.basename(path) })
        ]),
        U.el('div.divider-h'),
        row('类型', isDir ? '文件夹' : ((VFS.ext(node.name || '') || '文件').toUpperCase() + ' 文件')),
        row('位置', VFS.parent(path) || '—'),
        row('大小', size ? U.fmtSize(size) + ' (' + size.toLocaleString('zh-CN') + ' 字节)' : '0 字节'),
        isDir ? row('包含', cnt.files + ' 个文件，' + cnt.dirs + ' 个文件夹') : null,
        U.el('div.divider-h'),
        row('创建时间', U.fmtDateFile(new Date(node.created || Date.now()))),
        row('修改时间', U.fmtDateFile(new Date(node.modified || Date.now()))),
        U.el('div.divider-h'),
        U.el('div.props__attrs', {}, [
          U.el('label.checkbox', {}, [U.el('input', { type: 'checkbox' }), U.el('span.checkbox__box'), U.el('span', { text: '只读' })]),
          U.el('label.checkbox', {}, [U.el('input', { type: 'checkbox', checked: !!node.hidden }), U.el('span.checkbox__box'), U.el('span', { text: '隐藏' })])
        ])
      );
      function row(k, v) {
        return U.el('div.props__row', {}, [U.el('div.props__k', { text: k }), U.el('div.props__v.selectable', { text: v })]);
      }
      Notifications.dialog({
        title: (node.name || VFS.basename(path)) + ' 属性',
        content, width: 400,
        buttons: [{ text: '确定', accent: true }, { text: '取消' }]
      });
    },

    /* ================= 运行对话框 ================= */
    runDialog() {
      const input = U.el('input', { placeholder: '', spellcheck: 'false' });
      const box = U.el('div.textbox', { style: { marginTop: '10px' } }, input);
      const content = U.el('div', {}, [
        U.el('div.run__row', {}, [
          Icons.ui('open', 32),
          U.el('div.text-secondary', { text: 'Windows 将根据你所输入的名称，为你打开相应的程序、文件夹、文档或 Internet 资源。' })
        ]),
        U.el('div.caption', { text: '打开：', style: { marginTop: '12px' } }),
        box
      ]);
      const api = Notifications.dialog({
        title: '运行', content, width: 420,
        buttons: [
          { text: '确定', accent: true, value: 'ok' },
          { text: '取消', value: null },
          { text: '浏览…', value: 'browse' }
        ],
        onClose: (v) => {
          if (v === 'ok') Shell.runCommand(input.value.trim());
          if (v === 'browse') Apps.launch('explorer');
        }
      });
      setTimeout(() => input.focus(), 80);
      input.onkeydown = (e) => { if (e.key === 'Enter') { const v = input.value.trim(); api.close('_'); Shell.runCommand(v); } };
    },

    runCommand(cmd) {
      if (!cmd) return;
      const c = cmd.toLowerCase().replace(/\.exe$/, '');
      const map = {
        notepad: 'notepad', calc: 'calculator', mspaint: 'paint', paint: 'paint',
        cmd: 'terminal', powershell: 'terminal', wt: 'terminal', pwsh: 'terminal',
        explorer: 'explorer', control: 'settings', 'ms-settings:': 'settings',
        taskmgr: 'taskmgr', mstsc: null, msedge: 'edge', edge: 'edge',
        photos: 'photos', store: 'store', mediaplayer: 'mediaplayer', clock: 'clock',
        calendar: 'calendar', mail: 'mail', snippingtool: 'snipping', charmap: null
      };
      if (c === 'winver') { Shell.winver(); return; }
      if (map[c] !== undefined && map[c]) { Apps.launch(map[c]); return; }
      if (VFS.exists(cmd)) { Apps.open(cmd); return; }
      if (/^https?:\/\//i.test(cmd) || /^www\./i.test(cmd)) { Apps.launch('edge', { url: cmd }); return; }
      Notifications.dialog({
        title: '运行', icon: 'error',
        body: 'Windows 找不到 "' + cmd + '"。请确定文件名是否正确后，再试一次。',
        buttons: [{ text: '确定', accent: true }]
      });
      Sound.error();
    },

    winver() {
      const content = U.el('div.winver', {}, [
        U.el('div.winver__logo', {}, Icons.app('start', 56)),
        U.el('div.winver__t', { text: 'Windows 11' }),
        U.el('div.text-secondary', { text: '版本 24H2（OS 内部版本 26100.1742）' }),
        U.el('div.text-secondary', { text: '© Microsoft Corporation。保留所有权利。', style: { marginTop: '10px' } }),
        U.el('div.text-secondary', { text: 'Windows 11 专业版 Web 复刻版 — 纯前端实现', style: { marginTop: '10px' } }),
        U.el('div.caption.text-tertiary', { text: '许可给：' + Settings.userName, style: { marginTop: '10px' } })
      ]);
      Notifications.dialog({ title: '关于 Windows', content, width: 420, buttons: [{ text: '确定', accent: true }] });
    },

    /* ================= 截图 ================= */
    screenshot() {
      const dir = VFS.special('screenshots');
      if (!VFS.exists(dir)) VFS.mkdir(VFS.special('pictures'), '屏幕截图');
      const n = VFS.list(dir).length + 1;
      const name = '屏幕截图 (' + n + ').png';
      VFS.createFile(dir, name, '', { src: Settings.wallpaperUrl(), size: 245760 });
      Sound.click();
      Notifications.toast({
        title: '截图已保存', body: '已保存到 图片 › 屏幕截图 › ' + name,
        appIcon: 'snipping',
        actions: [{ text: '打开', accent: true, onClick: () => Apps.launch('photos', { path: VFS.join(dir, name) }) }]
      });
    },

    /* ================= 电源 ================= */
    lock() {
      this.locked = true;
      const ls = document.getElementById('lockScreen');
      const os = document.getElementById('os');
      ls.hidden = false;
      document.getElementById('lockContent').hidden = false;
      document.getElementById('loginContent').hidden = true;
      ls.classList.remove('is-login');
      this.updateLockClock();
      U.anim(ls, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 });
      U.anim(os, [{ filter: 'blur(0px)', transform: 'scale(1)' }, { filter: 'blur(6px)', transform: 'scale(1.01)' }], { duration: 280 });
      Flyout.closeAll(true); Menu.close(true);
      this._bindLock();
    },

    _bindLock() {
      const ls = document.getElementById('lockScreen');
      if (ls._bound) return;
      ls._bound = true;
      const toLogin = () => {
        if (!this.locked) return;
        ls.classList.add('is-login');
        const lc = document.getElementById('lockContent'), gc = document.getElementById('loginContent');
        U.anim(lc, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-40px)' }], { duration: 300, easing: U.EASE.accel })
          .then(() => { lc.hidden = true; });
        gc.hidden = false;
        U.anim(gc, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: U.EASE.decel });
        setTimeout(() => { const p = document.getElementById('loginPin'); p && p.focus(); }, 260);
      };
      ls.addEventListener('pointerdown', (e) => { if (!ls.classList.contains('is-login')) toLogin(); });
      ls.addEventListener('wheel', () => { if (!ls.classList.contains('is-login')) toLogin(); });
      document.addEventListener('keydown', (e) => {
        if (!this.locked) return;
        if (!ls.classList.contains('is-login')) { toLogin(); e.preventDefault(); }
      });
      document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); this.unlock(); });
      document.getElementById('loginPin').addEventListener('input', (e) => {
        Sound.key();
        if (e.target.value.length >= 4) setTimeout(() => this.unlock(), 180);
      });
    },

    async unlock() {
      if (!this.locked) return;
      this.locked = false;
      const ls = document.getElementById('lockScreen');
      const os = document.getElementById('os');
      const gc = document.getElementById('loginContent');
      const pin = document.getElementById('loginPin');
      if (pin) pin.value = '';
      const wel = document.getElementById('loginWelcome');
      U.$$('.login-pin', gc).forEach(e => e.hidden = true);
      if (wel) { wel.hidden = false; wel.textContent = '欢迎'; }
      await U.sleep(500);
      U.anim(ls, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: U.EASE.accel });
      U.anim(os, [{ filter: 'blur(6px)', transform: 'scale(1.01)' }, { filter: 'blur(0px)', transform: 'scale(1)' }], { duration: 500, easing: U.EASE.decel });
      await U.sleep(430);
      ls.hidden = true;
      os.style.filter = ''; os.style.transform = '';
      Settings.apply();
      U.$$('.login-pin', gc).forEach(e => e.hidden = false);
      if (wel) wel.hidden = true;
      Sound.ding();
    },

    updateLockClock() {
      const t = document.getElementById('lockTime'), d = document.getElementById('lockDate');
      if (t) t.textContent = Settings.hourFormat24 ? U.fmtTime() : U.fmtTime12();
      if (d) d.textContent = U.fmtDateLong();
    },

    signOut() {
      Notifications.dialog({
        title: '注销', body: '将关闭所有应用并注销当前用户。',
        buttons: [{ text: '注销', accent: true, value: 'y' }, { text: '取消' }],
        onClose: (v) => {
          if (v !== 'y') return;
          WM.closeAll();
          setTimeout(() => this.lock(), 320);
        }
      });
    },

    sleep() {
      const sd = document.getElementById('shutdownScreen');
      document.getElementById('shutdownText').textContent = '';
      sd.hidden = false;
      sd.classList.add('is-sleep');
      U.anim(sd, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
      const wake = () => {
        sd.classList.remove('is-sleep');
        U.anim(sd, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).then(() => { sd.hidden = true; this.lock(); });
        document.removeEventListener('pointerdown', wake);
        document.removeEventListener('keydown', wake);
      };
      setTimeout(() => {
        document.addEventListener('pointerdown', wake);
        document.addEventListener('keydown', wake);
      }, 700);
    },

    async shutdown(restart) {
      Flyout.closeAll(true); Menu.close(true);
      const sd = document.getElementById('shutdownScreen');
      const txt = document.getElementById('shutdownText');
      sd.hidden = false; sd.classList.remove('is-sleep');
      txt.textContent = restart ? '正在重启' : '正在关机';
      Sound.shutdown();
      U.anim(sd, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
      await U.sleep(2600);
      if (restart) {
        txt.textContent = '正在重启';
        await U.sleep(600);
        location.reload();
        return;
      }
      txt.textContent = '';
      sd.classList.add('is-off');
      await U.sleep(600);
      const off = U.el('div.poweroff', {}, U.el('button.btn.btn--accent', {
        text: '重新开机', onclick: () => location.reload()
      }));
      sd.appendChild(off);
      U.anim(off, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: 1200 });
    },

    restart() { return this.shutdown(true); },

    shutdownDialog() {
      const content = U.el('div', {}, [
        U.el('div.text-secondary', { text: '希望计算机做什么？', style: { marginBottom: '8px' } }),
        Shell.combo('shutdown', [
          { value: 'shutdown', label: '关机' }, { value: 'restart', label: '重启' },
          { value: 'sleep', label: '睡眠' }, { value: 'signout', label: '注销' }
        ], (v) => { content._v = v; }, 240)
      ]);
      content._v = 'shutdown';
      Notifications.dialog({
        title: '关闭 Windows', content,
        buttons: [{ text: '确定', accent: true, value: 'ok' }, { text: '取消' }],
        onClose: (r) => {
          if (r !== 'ok') return;
          if (content._v === 'shutdown') this.shutdown();
          else if (content._v === 'restart') this.restart();
          else if (content._v === 'sleep') this.sleep();
          else this.signOut();
        }
      });
    },

    /* ================= 开机流程 ================= */
    async boot() {
      const bs = document.getElementById('bootScreen');
      const logo = document.getElementById('bootLogo');
      const spin = document.getElementById('bootSpinner');
      logo.appendChild(Icons.app('start', 88));
      const fast = /[?&]fast=1/.test(location.search) || sessionStorage.getItem('win11web.booted') === '1';

      if (fast) {
        bs.hidden = true;
        this.booted = true;
        document.getElementById('lockScreen').hidden = true;
        Sound.enabled = true;
        return;
      }
      sessionStorage.setItem('win11web.booted', '1');

      U.anim(logo, [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 900, easing: U.EASE.decel });
      await U.sleep(700);
      U.anim(spin, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
      await U.sleep(1900);

      /* 先把锁屏铺好并给桌面加上模糊（此时仍被开机画面完全遮挡），
         再淡出开机画面 —— 避免中间露出一帧桌面造成"闪一下" */
      this.locked = true;
      const ls = document.getElementById('lockScreen');
      const os = document.getElementById('os');
      os.style.filter = 'blur(6px)';
      ls.hidden = false;
      ls.style.opacity = '1';
      this.updateLockClock();
      this._bindLock();
      await U.nextFrame();

      Sound.startup();
      await U.anim(bs, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: U.EASE.soft });
      bs.hidden = true;
      this.booted = true;
    }
  };

  /* ================= 启动 ================= */
  function initSystem() {
    Settings.load();
    VFS.load();
    VFS.user = Settings.userName;
    Notifications.load();
    Settings.apply();

    /* 环形点阵加载动画的点 */
    U.$$('.dots').forEach(d => { for (let i = 0; i < 5; i++) d.appendChild(U.el('i')); });

    /* 通知中心浮出 */
    Flyout.define({
      id: 'notifications',
      className: 'ncf',
      material: 'acrylic-strong',
      width: 396,
      anchor: 'right',
      build: (root) => Notifications.buildCenter(root)
    });

    StartMenu.init();
    Search.init();
    Widgets.init();
    QuickSettings.init();
    Taskbar.init();
    Desktop.init();
    Shortcuts.init();

    /* 锁屏时钟 */
    setInterval(() => { if (Shell.locked) Shell.updateLockClock(); }, 1000);
    document.getElementById('loginName').textContent = Settings.userName;
    const av = document.getElementById('loginAvatar');
    U.clear(av).appendChild(Settings.userAvatar ? U.el('img', { src: Settings.userAvatar }) : Icons.app('user', 96));
    const lockTray = document.getElementById('lockTray');
    U.clear(lockTray);
    [['wifi', '网络'], ['accessibility', '辅助功能'], ['power', '电源']].forEach(([ic, label]) => {
      const b = U.el('button.lock-tray__btn', { title: label }, Icons.ui(ic, 18));
      if (ic === 'power') b.onclick = () => Menu.show([
        { label: '睡眠', icon: 'nightlight', onClick: () => Shell.sleep() },
        { label: '关机', icon: 'power', onClick: () => Shell.shutdown() },
        { label: '重启', icon: 'refresh', onClick: () => Shell.restart() }
      ], { anchor: b, align: 'top-right' });
      else if (ic === 'wifi') b.onclick = () => Notifications.toast({ title: 'DeepSeek-5G', body: '已连接', icon: 'wifi', force: true });
      else b.onclick = () => Notifications.toast({ title: '辅助功能', body: '轻松使用设置', icon: 'accessibility', force: true });
      lockTray.appendChild(b);
    });

    /* 首次运行欢迎通知 */
    Shell.boot().then(() => {
      if (Settings.firstRun) {
        Settings.set('firstRun', false, true);
        setTimeout(() => {
          Notifications.toast({
            title: '欢迎使用 Windows 11 Web 版',
            body: '按 Win 键打开开始菜单，拖动窗口到屏幕边缘可贴靠。右键桌面可个性化设置。',
            appIcon: 'start', timeout: 9000,
            actions: [{ text: '打开设置', accent: true, onClick: () => Apps.launch('settings') }]
          });
        }, 2200);
      }
    });

    /* 阻止浏览器默认右键与选择 */
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('input, textarea, .selectable, [contenteditable="true"]')) return;
      e.preventDefault();
    });
    document.addEventListener('dragstart', (e) => {
      if (!e.target.closest('[draggable="true"]')) e.preventDefault();
    });
    window.addEventListener('beforeunload', () => { Settings.save(); });
  }

  global.Shell = Shell;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSystem);
  else initSystem();
})(window);
