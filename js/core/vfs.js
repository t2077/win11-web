/* ============================================================
   vfs.js — 虚拟文件系统（含回收站、特殊文件夹、持久化）
   全局: VFS
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'win11web.vfs.v1';
  const now = () => Date.now();

  function dir(name, children, extra) {
    return Object.assign({ name, type: 'dir', children: children || {}, created: now(), modified: now() }, extra || {});
  }
  function file(name, content, extra) {
    return Object.assign({
      name, type: 'file', content: content === undefined ? '' : content,
      created: now(), modified: now()
    }, extra || {});
  }

  function seed() {
    const U_ = 'DeepSeek';
    const desktop = dir('桌面', {});
    const docs = dir('文档', {
      '读我.txt': file('读我.txt',
        '欢迎使用 Windows 11 Web 版！\r\n\r\n' +
        '这是一个用 HTML / CSS / JavaScript 实现的 Windows 11 桌面环境。\r\n' +
        '• 双击桌面图标或从「开始」菜单启动应用\r\n' +
        '• 拖动标题栏移动窗口，拖到屏幕边缘可贴靠\r\n' +
        '• 悬停最大化按钮 0.5 秒可选择贴靠布局\r\n' +
        '• Win 键打开开始菜单，Alt+Tab 切换窗口\r\n' +
        '• 右键桌面可更改个性化设置\r\n'),
      '会议记录.txt': file('会议记录.txt', '2024 年度规划会议\r\n\r\n1. 目标对齐\r\n2. 里程碑评审\r\n3. 资源分配\r\n'),
      '预算表.xlsx': file('预算表.xlsx', '', { size: 18432 }),
      '项目方案.docx': file('项目方案.docx', '', { size: 45120 }),
      '产品手册.pdf': file('产品手册.pdf', '', { size: 1048576 })
    });
    const pics = dir('图片', {
      'Windows 花簇.svg': file('Windows 花簇.svg', '', { src: 'assets/wallpapers/bloom-dark.svg', size: 6930 }),
      '暮色山峦.svg': file('暮色山峦.svg', '', { src: 'assets/wallpapers/dusk.svg', size: 3946 }),
      '流光.svg': file('流光.svg', '', { src: 'assets/wallpapers/glow.svg', size: 3473 }),
      '涌动.svg': file('涌动.svg', '', { src: 'assets/wallpapers/flow.svg', size: 2327 }),
      '光影捕捉.svg': file('光影捕捉.svg', '', { src: 'assets/wallpapers/captured.svg', size: 2996 }),
      '屏幕截图': dir('屏幕截图', {})
    });
    const music = dir('音乐', {
      '示例音乐.mp3': file('示例音乐.mp3', '', { size: 4194304 })
    });
    const videos = dir('视频', {
      '捕获': dir('捕获', {})
    });
    const downloads = dir('下载', {
      '安装程序.exe': file('安装程序.exe', '', { size: 15728640 }),
      '归档.zip': file('归档.zip', '', { size: 2097152 })
    });

    return dir('', {
      'C:': dir('本地磁盘 (C:)', {
        'Users': dir('用户', {
          [U_]: dir(U_, {
            '桌面': desktop, '文档': docs, '图片': pics, '音乐': music, '视频': videos, '下载': downloads,
            'AppData': dir('AppData', { 'Local': dir('Local', {}), 'Roaming': dir('Roaming', {}) })
          }),
          '公用': dir('公用', {})
        }),
        'Windows': dir('Windows', {
          'System32': dir('System32', {
            'cmd.exe': file('cmd.exe', '', { size: 289792 }),
            'notepad.exe': file('notepad.exe', '', { size: 201216 }),
            'calc.exe': file('calc.exe', '', { size: 27648 }),
            'drivers': dir('drivers', {}),
            'config': dir('config', {})
          }),
          'Fonts': dir('Fonts', {}),
          'Temp': dir('Temp', {}),
          'explorer.exe': file('explorer.exe', '', { size: 5033472 })
        }),
        'Program Files': dir('Program Files', {
          'Microsoft': dir('Microsoft', { 'Edge': dir('Edge', {}) }),
          'Windows NT': dir('Windows NT', {})
        }),
        'Program Files (x86)': dir('Program Files (x86)', {}),
        'PerfLogs': dir('PerfLogs', {})
      }, { drive: true, label: '本地磁盘', total: 512 * 1024 * 1024 * 1024, used: 178 * 1024 * 1024 * 1024 }),
      'D:': dir('数据 (D:)', {
        '项目': dir('项目', {
          'win11-web': dir('win11-web', {
            'index.html': file('index.html', '<!DOCTYPE html>', { size: 5730 }),
            'README.md': file('README.md', '# Windows 11 Web\r\n\r\n纯前端实现的 Windows 11 桌面环境。')
          })
        }),
        '备份': dir('备份', {})
      }, { drive: true, label: '数据', total: 1024 * 1024 * 1024 * 1024, used: 312 * 1024 * 1024 * 1024 })
    });
  }

  const VFS = {
    tree: null,
    recycle: [],
    user: 'DeepSeek',

    /* ---------- 路径工具 ---------- */
    split(p) { return String(p || '').split(/[\\/]+/).filter(Boolean); },
    join(...parts) {
      const s = parts.filter(x => x !== null && x !== undefined && x !== '').join('\\');
      return s.replace(/[\\/]+/g, '\\');
    },
    parent(p) { const a = this.split(p); a.pop(); return a.join('\\'); },
    basename(p) { const a = this.split(p); return a[a.length - 1] || ''; },
    ext(name) { const i = name.lastIndexOf('.'); return i > 0 ? name.slice(i + 1).toLowerCase() : ''; },
    stem(name) { const i = name.lastIndexOf('.'); return i > 0 ? name.slice(0, i) : name; },
    normalize(p) { return this.split(p).join('\\'); },

    /* 特殊文件夹 */
    home() { return 'C:\\Users\\' + this.user; },
    special(k) {
      const m = {
        desktop: '桌面', documents: '文档', pictures: '图片', music: '音乐',
        videos: '视频', downloads: '下载', screenshots: '图片\\屏幕截图'
      };
      return this.home() + '\\' + (m[k] || k);
    },

    /* ---------- 查询 ---------- */
    get(p) {
      const parts = this.split(p);
      let node = this.tree;
      for (const seg of parts) {
        if (!node || node.type !== 'dir') return null;
        const key = Object.keys(node.children).find(k => k.toLowerCase() === seg.toLowerCase());
        if (key === undefined) return null;
        node = node.children[key];
      }
      return node;
    },
    realPath(p) {
      const parts = this.split(p); let node = this.tree; const out = [];
      for (const seg of parts) {
        if (!node || node.type !== 'dir') return null;
        const key = Object.keys(node.children).find(k => k.toLowerCase() === seg.toLowerCase());
        if (key === undefined) return null;
        out.push(key); node = node.children[key];
      }
      return out.join('\\');
    },
    exists(p) { return !!this.get(p); },
    isDir(p) { const n = this.get(p); return !!n && n.type === 'dir'; },

    /** 列目录 → [{name, path, type, size, modified, icon, ...}] */
    list(p, opts) {
      const n = this.get(p);
      if (!n || n.type !== 'dir') return [];
      const real = this.realPath(p) || p;
      const showHidden = opts && opts.hidden;
      return Object.keys(n.children).map(k => {
        const c = n.children[k];
        return {
          name: c.name || k, key: k, path: this.join(real, k), type: c.type,
          size: c.type === 'file' ? this.sizeOf(c) : null,
          modified: c.modified, created: c.created, node: c,
          hidden: !!c.hidden, drive: !!c.drive, src: c.src || null,
          ext: c.type === 'file' ? this.ext(k) : ''
        };
      }).filter(e => showHidden || !e.hidden);
    },

    sizeOf(node) {
      if (node.type === 'dir') return null;
      if (node.size !== undefined) return node.size;
      if (node.src) return 4096;
      return new Blob([node.content || '']).size;
    },
    dirSize(node) {
      if (!node) return 0;
      if (node.type === 'file') return this.sizeOf(node) || 0;
      return Object.values(node.children).reduce((s, c) => s + this.dirSize(c), 0);
    },
    countIn(node) {
      if (!node || node.type !== 'dir') return { files: 0, dirs: 0 };
      let files = 0, dirs = 0;
      Object.values(node.children).forEach(c => {
        if (c.type === 'dir') { dirs++; const r = this.countIn(c); files += r.files; dirs += r.dirs; }
        else files++;
      });
      return { files, dirs };
    },

    /* ---------- 修改 ---------- */
    uniqueName(parentPath, name) {
      const n = this.get(parentPath);
      if (!n) return name;
      const keys = Object.keys(n.children).map(k => k.toLowerCase());
      if (!keys.includes(name.toLowerCase())) return name;
      const stem = this.stem(name), ext = this.ext(name);
      let i = 2;
      while (true) {
        const cand = stem + ' (' + i + ')' + (ext ? '.' + ext : '');
        if (!keys.includes(cand.toLowerCase())) return cand;
        i++;
      }
    },

    mkdir(parentPath, name) {
      const p = this.get(parentPath);
      if (!p || p.type !== 'dir') return null;
      const nm = this.uniqueName(parentPath, name || '新建文件夹');
      p.children[nm] = dir(nm, {});
      p.modified = now();
      this.save(); U.bus.emit('vfs:change', parentPath);
      return this.join(this.realPath(parentPath), nm);
    },

    createFile(parentPath, name, content, extra) {
      const p = this.get(parentPath);
      if (!p || p.type !== 'dir') return null;
      const nm = this.uniqueName(parentPath, name || '新建文本文档.txt');
      p.children[nm] = file(nm, content || '', extra);
      p.modified = now();
      this.save(); U.bus.emit('vfs:change', parentPath);
      return this.join(this.realPath(parentPath), nm);
    },

    writeFile(path, content) {
      let n = this.get(path);
      if (!n) {
        const par = this.parent(path);
        if (!this.isDir(par)) return false;
        this.get(par).children[this.basename(path)] = file(this.basename(path), content);
        n = this.get(path);
      } else {
        if (n.type !== 'file') return false;
        n.content = content;
        delete n.size;
      }
      n.modified = now();
      this.save(); U.bus.emit('vfs:change', this.parent(path));
      return true;
    },

    readFile(path) {
      const n = this.get(path);
      return n && n.type === 'file' ? (n.content || '') : null;
    },

    rename(path, newName) {
      const par = this.parent(path), n = this.get(path);
      const pn = this.get(par);
      if (!n || !pn) return false;
      const key = Object.keys(pn.children).find(k => pn.children[k] === n);
      if (newName.toLowerCase() === key.toLowerCase()) { n.name = newName; return true; }
      if (Object.keys(pn.children).some(k => k.toLowerCase() === newName.toLowerCase())) return false;
      delete pn.children[key];
      n.name = newName; n.modified = now();
      pn.children[newName] = n;
      this.save(); U.bus.emit('vfs:change', par);
      return true;
    },

    remove(path, permanent) {
      const par = this.parent(path), pn = this.get(par), n = this.get(path);
      if (!n || !pn) return false;
      const key = Object.keys(pn.children).find(k => pn.children[k] === n);
      delete pn.children[key];
      if (!permanent) {
        this.recycle.push({ id: U.uid('rb'), name: n.name || key, origin: path, deleted: now(), node: n, size: this.dirSize(n), type: n.type });
      }
      this.save(); U.bus.emit('vfs:change', par); U.bus.emit('vfs:recycle');
      return true;
    },

    restore(id) {
      const i = this.recycle.findIndex(r => r.id === id);
      if (i < 0) return false;
      const r = this.recycle[i];
      const par = this.parent(r.origin);
      if (!this.isDir(par)) return false;
      const nm = this.uniqueName(par, r.name);
      this.get(par).children[nm] = r.node;
      this.recycle.splice(i, 1);
      this.save(); U.bus.emit('vfs:change', par); U.bus.emit('vfs:recycle');
      return true;
    },

    emptyRecycle() { this.recycle = []; this.save(); U.bus.emit('vfs:recycle'); },

    copy(srcPath, destDir, cut) {
      const n = this.get(srcPath), d = this.get(destDir);
      if (!n || !d || d.type !== 'dir') return null;
      const clone = JSON.parse(JSON.stringify(n));
      const base = this.basename(srcPath);
      const nm = this.uniqueName(destDir, base);
      clone.name = nm; clone.modified = now();
      d.children[nm] = clone;
      if (cut) this.remove(srcPath, true);
      this.save(); U.bus.emit('vfs:change', destDir);
      return this.join(this.realPath(destDir), nm);
    },

    /** 递归搜索 */
    search(query, root, limit) {
      const q = String(query || '').toLowerCase();
      if (!q) return [];
      const out = [];
      const max = limit || 200;
      const walk = (node, path) => {
        if (out.length >= max || !node || node.type !== 'dir') return;
        for (const k of Object.keys(node.children)) {
          if (out.length >= max) return;
          const c = node.children[k], p = this.join(path, k);
          if (k.toLowerCase().includes(q)) {
            out.push({ name: c.name || k, path: p, type: c.type, size: this.sizeOf(c), modified: c.modified, ext: c.type === 'file' ? this.ext(k) : '' });
          }
          if (c.type === 'dir') walk(c, p);
        }
      };
      const start = root ? this.get(root) : this.tree;
      walk(start, root ? (this.realPath(root) || root) : '');
      return out;
    },

    drives() {
      return Object.keys(this.tree.children).filter(k => this.tree.children[k].drive).map(k => {
        const d = this.tree.children[k];
        return { key: k, name: d.name, total: d.total, used: d.used, free: d.total - d.used };
      });
    },

    /* ---------- 持久化 ---------- */
    save: U.debounce(function () {
      try { localStorage.setItem(KEY, JSON.stringify({ tree: VFS.tree, recycle: VFS.recycle })); } catch (e) { }
    }, 300),

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const o = JSON.parse(raw);
          if (o && o.tree) { this.tree = o.tree; this.recycle = o.recycle || []; return; }
        }
      } catch (e) { console.warn('[vfs] load failed', e); }
      this.tree = seed();
      this.recycle = [];
    },

    resetFS() { this.tree = seed(); this.recycle = []; this.save(); U.bus.emit('vfs:change', ''); }
  };

  global.VFS = VFS;
})(window);
