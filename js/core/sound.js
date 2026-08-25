/* ============================================================
   sound.js — WebAudio 合成 UI 音效（无外部资源）
   ============================================================ */
(function (global) {
  'use strict';
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, t0, dur, gain, type, glideTo) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime + t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + t0 + dur);
    const v = (gain === undefined ? .18 : gain) * (Sound.volume / 100) * (Sound.muted ? 0 : 1);
    g.gain.setValueAtTime(0, c.currentTime + t0);
    g.gain.linearRampToValueAtTime(v, c.currentTime + t0 + Math.min(.02, dur * .2));
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + .02);
  }

  function noise(t0, dur, gain, hp) {
    const c = ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 1200;
    const g = c.createGain();
    const v = (gain === undefined ? .06 : gain) * (Sound.volume / 100) * (Sound.muted ? 0 : 1);
    g.gain.setValueAtTime(v, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    s.connect(f); f.connect(g); g.connect(c.destination);
    s.start(c.currentTime + t0);
  }

  const Sound = {
    volume: 30,
    muted: false,
    enabled: true,

    /* Windows 11 启动音（近似：四音上行 + 尾音） */
    startup() {
      if (!this.enabled) return;
      const seq = [[523.25, 0], [659.25, .16], [783.99, .32], [1046.5, .48]];
      seq.forEach(([f, t]) => { tone(f, t, 1.1, .11, 'sine'); tone(f * 2, t, .8, .035, 'triangle'); });
      tone(261.63, 0, 2.0, .05, 'sine');
      tone(1567.98, .62, 1.6, .05, 'sine');
    },
    /* 通知音 */
    notify() {
      if (!this.enabled) return;
      tone(1174.66, 0, .35, .10, 'sine');
      tone(1567.98, .1, .5, .08, 'sine');
    },
    /* 错误音 */
    error() {
      if (!this.enabled) return;
      tone(415.3, 0, .22, .13, 'triangle');
      tone(311.13, .16, .42, .13, 'triangle');
    },
    /* 提示音 */
    ding() { if (this.enabled) { tone(880, 0, .28, .10, 'sine'); tone(1320, .04, .32, .05, 'sine'); } },
    /* 轻点 */
    click() { if (this.enabled) noise(0, .045, .035, 2600); },
    /* 悬停 */
    hover() { if (this.enabled) noise(0, .022, .012, 3600); },
    /* 窗口最小化/恢复 */
    swoosh(up) {
      if (!this.enabled) return;
      tone(up ? 300 : 700, 0, .22, .05, 'sine', up ? 800 : 260);
      noise(0, .18, .022, 900);
    },
    /* 插拔/连接 */
    connect() { if (this.enabled) { tone(659.25, 0, .18, .09, 'sine'); tone(987.77, .1, .3, .07, 'sine'); } },
    /* 关机 */
    shutdown() {
      if (!this.enabled) return;
      tone(783.99, 0, .5, .09, 'sine'); tone(587.33, .18, .55, .09, 'sine');
      tone(392, .38, .9, .09, 'sine'); tone(196, .38, 1.2, .05, 'sine');
    },
    /* 键盘敲击 */
    key() { if (this.enabled) noise(0, .018, .02, 4000); },
    /* 音量变化预览 */
    volumeBeep() { if (this.enabled) tone(1046.5, 0, .12, .12, 'sine'); }
  };

  global.Sound = Sound;
})(window);
