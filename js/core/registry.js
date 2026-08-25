/* ============================================================
   registry.js — 应用注册表 / 启动器 / 文件关联
   全局: Apps
   ============================================================ */
(function (global) {
  'use strict';

  const defs = new Map();

  const Apps = {
    /** 注册应用
     * @param {object} d {id,name,icon,size,minSize,resizable,singleton,category,mount}
     */
    register(d) {
      if (!d || !d.id) return;
      defs.set(d.id, Object.assign({
        name: d.id, icon: 'file', category: '其他',
        size: { w: 900, h: 620 }, minSize: { w: 360, h: 220 },
        resizable: true, singleton: false, maximizable: true, minimizable: true,
        showInStart: true, showInSearch: true
      }, d));
    },
    get(id) { return defs.get(id) || null; },
    has(id) { return defs.has(id); },
    all() { return Array.from(defs.values()); },
    listForStart() {
      return this.all().filter(a => a.showInStart)
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    },

    /** 启动应用（返回窗口对象） */
    launch(id, args) {
      const d = defs.get(id);
      if (!d) { Notifications.toast({ title: '无法启动', body: '找不到应用：' + id, icon: 'error' }); return null; }

      /* 记录最近使用 */
      const r = Settings.recentApps.filter(x => x !== id);
      r.unshift(id);
      Settings.recentApps = r.slice(0, 12);
      Settings.save();
      U.bus.emit('apps:recent');

      if (d.singleton) {
        const exist = WM.windows.find(w => w.appId === id && !w.closing);
        if (exist) {
          if (exist.minimized) WM.restore(exist);
          WM.focus(exist);
          if (d.onReactivate) try { d.onReactivate(exist, args); } catch (e) { console.error(e); }
          return exist;
        }
      }
      const win = WM.create({
        appId: id, title: d.name, icon: d.icon,
        width: d.size.w, height: d.size.h,
        minWidth: d.minSize.w, minHeight: d.minSize.h,
        resizable: d.resizable, maximizable: d.maximizable, minimizable: d.minimizable,
        chromeless: d.chromeless, transparentChrome: d.transparentChrome,
        centered: d.centered, args: args
      });
      try {
        d.mount(win, args || {});
      } catch (e) {
        console.error('[app:' + id + ']', e);
        win.body.appendChild(U.el('div.app-error', { html: '<b>应用发生错误</b><br><code>' + U.escapeHtml(String(e && e.message || e)) + '</code>' }));
      }
      return win;
    },

    /** 文件关联 */
    fileHandler(name) {
      const ext = (name.split('.').pop() || '').toLowerCase();
      const map = {
        txt: 'notepad', md: 'notepad', log: 'notepad', ini: 'notepad', json: 'notepad', csv: 'notepad',
        js: 'notepad', css: 'notepad', xml: 'notepad', bat: 'notepad', ps1: 'notepad',
        png: 'photos', jpg: 'photos', jpeg: 'photos', gif: 'photos', bmp: 'photos', webp: 'photos', svg: 'photos', ico: 'photos',
        mp3: 'mediaplayer', wav: 'mediaplayer', flac: 'mediaplayer', m4a: 'mediaplayer',
        mp4: 'mediaplayer', mkv: 'mediaplayer', webm: 'mediaplayer', mov: 'mediaplayer',
        html: 'edge', htm: 'edge', url: 'edge',
        pdf: 'edge', docx: 'wordpad', doc: 'wordpad', xlsx: 'notepad',
        zip: 'explorer', exe: '_exe'
      };
      return map[ext] || null;
    },

    /** 打开一个 VFS 路径（文件夹→资源管理器，文件→关联应用） */
    open(path) {
      const node = VFS.get(path);
      if (!node) { Notifications.toast({ title: '找不到项目', body: path, icon: 'warning' }); return; }
      if (node.type === 'dir') return Apps.launch('explorer', { path });
      const h = this.fileHandler(node.name || VFS.basename(path));
      if (h === '_exe') {
        Notifications.dialog({
          title: '此应用无法在此设备上运行',
          body: '"' + VFS.basename(path) + '" 是一个可执行文件。在 Web 版 Windows 中不支持运行本机可执行程序。',
          icon: 'warning', buttons: [{ text: '确定', accent: true }]
        });
        return;
      }
      if (h && defs.has(h)) return Apps.launch(h, { path });
      /* 无关联：显示"打开方式" */
      Apps.openWith(path);
    },

    openWith(path) {
      const list = ['notepad', 'photos', 'mediaplayer', 'edge', 'paint'].filter(id => defs.has(id));
      const body = U.el('div.openwith');
      list.forEach(id => {
        const d = defs.get(id);
        const row = U.el('div.openwith__row', { tabindex: 0 }, [
          Icons.app(d.icon, 28), U.el('div', { text: d.name })
        ]);
        row.onclick = () => { dlg.close(); Apps.launch(id, { path }); };
        body.appendChild(row);
      });
      const dlg = Notifications.dialog({
        title: '你要如何打开此文件？',
        content: body,
        buttons: [{ text: '取消' }]
      });
    }
  };

  global.Apps = Apps;
})(window);
