/* ============================================================
   util.js — DOM / 动画 / 拖拽 / 工具提示 等底层工具
   全局命名空间: U
   ============================================================ */
(function (global) {
  'use strict';

  const U = {};

  /* -------------------- DOM -------------------- */
  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  /**
   * el('div.cls#id', {attrs}, [children])
   * 支持 class/id 简写、style 对象、on* 事件、dataset、html/text
   */
  U.el = function (spec, props, children) {
    let tag = 'div', cls = [], id = null;
    if (typeof spec === 'string') {
      const m = spec.match(/^([a-zA-Z0-9-]*)/);
      if (m && m[1]) tag = m[1];
      spec.replace(/\.([^.#\s]+)/g, (_, c) => { cls.push(c); return ''; });
      const im = spec.match(/#([^.#\s]+)/);
      if (im) id = im[1];
    }
    const node = document.createElement(tag);
    if (cls.length) node.className = cls.join(' ');
    if (id) node.id = id;
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'class') node.className = (node.className ? node.className + ' ' : '') + v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'value') node.value = v;
        else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') node[k] = !!v;
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    U.append(node, children);
    return node;
  };

  U.append = function (node, children) {
    if (children === null || children === undefined || children === false) return node;
    if (Array.isArray(children)) { children.forEach(c => U.append(node, c)); return node; }
    if (children instanceof Node) node.appendChild(children);
    else node.appendChild(document.createTextNode(String(children)));
    return node;
  };

  U.frag = function (children) {
    const f = document.createDocumentFragment();
    U.append(f, children);
    return f;
  };

  /** 从 HTML 字符串创建元素 */
  U.h = function (html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  U.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; };

  U.on = function (target, ev, fn, opts) {
    ev.split(/\s+/).forEach(e => target.addEventListener(e, fn, opts));
    return () => ev.split(/\s+/).forEach(e => target.removeEventListener(e, fn, opts));
  };

  /** 事件委托 */
  U.delegate = function (root, selector, ev, fn) {
    return U.on(root, ev, function (e) {
      const t = e.target.closest(selector);
      if (t && root.contains(t)) fn.call(t, e, t);
    });
  };

  /* -------------------- 数学 / 杂项 -------------------- */
  U.clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.uid = (p) => (p || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.sleep = (ms) => new Promise(r => setTimeout(r, ms));
  U.nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  U.debounce = function (fn, ms) {
    let t; return function () { clearTimeout(t); const a = arguments, s = this; t = setTimeout(() => fn.apply(s, a), ms); };
  };
  U.throttle = function (fn, ms) {
    let last = 0, timer = null;
    return function () {
      const now = Date.now(), a = arguments, s = this;
      if (now - last >= ms) { last = now; fn.apply(s, a); }
      else { clearTimeout(timer); timer = setTimeout(() => { last = Date.now(); fn.apply(s, a); }, ms - (now - last)); }
    };
  };
  U.escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* -------------------- 格式化 -------------------- */
  const WEEK_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const WEEK_CN_S = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  U.WEEK_CN = WEEK_CN; U.WEEK_CN_S = WEEK_CN_S;
  U.pad = (n, l) => String(n).padStart(l || 2, '0');
  U.fmtTime = (d, sec) => {
    d = d || new Date();
    return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) + (sec ? ':' + U.pad(d.getSeconds()) : '');
  };
  U.fmtTime12 = (d) => {
    d = d || new Date();
    let h = d.getHours(); const ap = h < 12 ? '上午' : '下午';
    h = h % 12 || 12;
    return ap + ' ' + h + ':' + U.pad(d.getMinutes());
  };
  U.fmtDateShort = (d) => { d = d || new Date(); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`; };
  U.fmtDateLong = (d) => { d = d || new Date(); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日，${WEEK_CN[d.getDay()]}`; };
  U.fmtDateFile = (d) => {
    d = d || new Date();
    return `${d.getFullYear()}/${U.pad(d.getMonth() + 1)}/${U.pad(d.getDate())} ${U.pad(d.getHours())}:${U.pad(d.getMinutes())}`;
  };
  U.fmtSize = function (bytes) {
    if (bytes === null || bytes === undefined) return '';
    if (bytes < 1024) return bytes + ' 字节';
    const u = ['KB', 'MB', 'GB', 'TB']; let i = -1, v = bytes;
    do { v /= 1024; i++; } while (v >= 1024 && i < u.length - 1);
    return (v >= 100 ? Math.round(v) : v.toFixed(v >= 10 ? 1 : 2)) + ' ' + u[i];
  };
  U.fmtKB = (bytes) => Math.max(1, Math.round(bytes / 1024)).toLocaleString('zh-CN') + ' KB';

  /* -------------------- 事件总线 -------------------- */
  class Emitter {
    constructor() { this._m = new Map(); }
    on(ev, fn) {
      if (!this._m.has(ev)) this._m.set(ev, new Set());
      this._m.get(ev).add(fn);
      return () => this.off(ev, fn);
    }
    once(ev, fn) { const off = this.on(ev, (...a) => { off(); fn(...a); }); return off; }
    off(ev, fn) { const s = this._m.get(ev); if (s) s.delete(fn); }
    emit(ev, ...args) {
      const s = this._m.get(ev);
      if (s) Array.from(s).forEach(fn => { try { fn(...args); } catch (e) { console.error('[emit]', ev, e); } });
      const a = this._m.get('*');
      if (a) Array.from(a).forEach(fn => { try { fn(ev, ...args); } catch (e) { } });
    }
  }
  U.Emitter = Emitter;
  U.bus = new Emitter();

  /* -------------------- 动画 -------------------- */
  /** WAAPI 包装，返回 Promise；动画关闭时立即完成 */
  U.anim = function (el, keyframes, opts) {
    if (!el) return Promise.resolve();
    const off = document.documentElement.dataset.animations === 'off';
    const o = Object.assign({ duration: 250, easing: 'cubic-bezier(0.1,0.9,0.2,1)', fill: 'both' }, opts || {});
    if (off) o.duration = 1;
    let a;
    try { a = el.animate(keyframes, o); } catch (e) { return Promise.resolve(); }
    return a.finished.catch(() => { }).then(() => a);
  };

  U.EASE = {
    accel: 'cubic-bezier(0.7,0,1,0.5)',
    decel: 'cubic-bezier(0.1,0.9,0.2,1)',
    standard: 'cubic-bezier(0.8,0,0.2,1)',
    soft: 'cubic-bezier(0.33,0,0.67,1)',
    back: 'cubic-bezier(0.34,1.32,0.64,1)'
  };

  /** 平滑数值补间 */
  U.tween = function (from, to, ms, onUpdate, easing) {
    const ease = easing || (t => 1 - Math.pow(1 - t, 3));
    const t0 = performance.now();
    let stopped = false;
    function step(now) {
      if (stopped) return;
      const t = U.clamp((now - t0) / ms, 0, 1);
      onUpdate(from + (to - from) * ease(t), t);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return () => { stopped = true; };
  };

  /* -------------------- 指针拖拽 -------------------- */
  /**
   * U.drag(handleEl, { onStart(e), onMove(dx,dy,e), onEnd(dx,dy,e), threshold, cursor })
   */
  U.drag = function (handle, o) {
    o = o || {};
    const onDown = function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (o.filter && !o.filter(e)) return;
      const sx = e.clientX, sy = e.clientY;
      let started = false;
      const th = o.threshold || 0;
      handle.setPointerCapture && e.pointerId !== undefined && handle.setPointerCapture(e.pointerId);
      const prevCursor = document.body.style.cursor;
      const move = function (ev) {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!started) {
          if (Math.abs(dx) < th && Math.abs(dy) < th) return;
          started = true;
          if (o.cursor) document.body.style.cursor = o.cursor;
          o.onStart && o.onStart(e, ev);
        }
        o.onMove && o.onMove(dx, dy, ev);
      };
      const up = function (ev) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        document.body.style.cursor = prevCursor;
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (started) o.onEnd && o.onEnd(dx, dy, ev);
        else o.onClick && o.onClick(ev);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
      if (o.preventDefault !== false) e.preventDefault();
    };
    handle.addEventListener('pointerdown', onDown);
    return () => handle.removeEventListener('pointerdown', onDown);
  };

  /* -------------------- 工具提示 -------------------- */
  let tipEl = null, tipTimer = null, tipTarget = null;
  function hideTip() {
    clearTimeout(tipTimer);
    if (tipEl) { tipEl.classList.remove('is-open'); const e = tipEl; tipEl = null; setTimeout(() => e.remove(), 160); }
    tipTarget = null;
  }
  U.hideTooltip = hideTip;
  /** 给元素挂 Fluent 工具提示；pos: 'top'|'bottom'|'right'|'left' */
  U.tooltip = function (el, text, pos) {
    el._tipText = text;
    if (el._tipBound) return el;
    el._tipBound = true;
    U.on(el, 'pointerenter', () => {
      if (!el._tipText) return;
      clearTimeout(tipTimer);
      tipTarget = el;
      tipTimer = setTimeout(() => {
        if (tipTarget !== el || !el.isConnected) return;
        hideTip();
        tipEl = U.el('div.tooltip', { text: el._tipText });
        document.body.appendChild(tipEl);
        const r = el.getBoundingClientRect(), t = tipEl.getBoundingClientRect();
        const p = el._tipPos || pos || 'top';
        let x, y;
        if (p === 'top') { x = r.left + r.width / 2 - t.width / 2; y = r.top - t.height - 8; }
        else if (p === 'bottom') { x = r.left + r.width / 2 - t.width / 2; y = r.bottom + 8; }
        else if (p === 'right') { x = r.right + 8; y = r.top + r.height / 2 - t.height / 2; }
        else { x = r.left - t.width - 8; y = r.top + r.height / 2 - t.height / 2; }
        tipEl.style.left = U.clamp(x, 4, innerWidth - t.width - 4) + 'px';
        tipEl.style.top = U.clamp(y, 4, innerHeight - t.height - 4) + 'px';
        requestAnimationFrame(() => tipEl && tipEl.classList.add('is-open'));
      }, 550);
    });
    U.on(el, 'pointerleave pointerdown', hideTip);
    return el;
  };

  /* -------------------- 视口定位 -------------------- */
  U.fitRect = function (w, h, x, y, margin) {
    const m = margin === undefined ? 8 : margin;
    return {
      x: U.clamp(x, m, Math.max(m, innerWidth - w - m)),
      y: U.clamp(y, m, Math.max(m, innerHeight - h - m))
    };
  };

  /* -------------------- 剪贴板 -------------------- */
  U.clipboard = { text: '', files: null, mode: 'copy' };
  U.copyText = async function (t) {
    U.clipboard.text = t;
    try { await navigator.clipboard.writeText(t); } catch (e) { }
  };
  U.readText = async function () {
    try { const t = await navigator.clipboard.readText(); if (t) U.clipboard.text = t; } catch (e) { }
    return U.clipboard.text;
  };

  /* -------------------- 杂 -------------------- */
  U.svg = function (markup, cls, size) {
    const w = U.el('div' + (cls ? '.' + cls : ''), { class: 'svg-icon', html: markup });
    if (size) { w.style.width = size + 'px'; w.style.height = size + 'px'; }
    return w;
  };
  U.glyph = function (code, size, cls) {
    return U.el('span.glyph' + (size ? '.glyph-' + size : '') + (cls ? '.' + cls : ''), { html: code });
  };
  /** 让元素在按下时轻微缩放（Fluent 触觉反馈） */
  U.pressable = function (el) { el.classList.add('press-scale'); return el; };

  /** 注入一次性样式表（应用自带样式，避免全局 CSS 冲突） */
  U.injectStyle = function (id, css) {
    if (document.getElementById('style-' + id)) return;
    const s = document.createElement('style');
    s.id = 'style-' + id;
    s.textContent = css;
    document.head.appendChild(s);
  };

  U.download = function (filename, content, mime) {    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const a = U.el('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };

  U.imgFile = function (accept) {
    return new Promise(res => {
      const i = U.el('input', { type: 'file', accept: accept || 'image/*', style: { display: 'none' } });
      document.body.appendChild(i);
      i.onchange = () => { res(i.files && i.files[0] || null); i.remove(); };
      i.click();
    });
  };

  global.U = U;
})(window);
