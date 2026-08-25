/* ============================================================
   icons.js — Fluent 风格图标库
   Icons.app(id, size)  彩色应用图标 (48x48 viewBox)
   Icons.ui(id, size)   单色界面图标 (16x16 viewBox, currentColor)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- 彩色应用图标 ---------------- */
  const APP = {

    /* Windows 徽标（开始按钮） */
    start: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="stg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#4fc3f7"/><stop offset="55%" stop-color="#1e93e6"/><stop offset="100%" stop-color="#0f6cbd"/></linearGradient></defs>
      <rect x="5" y="5" width="17" height="17" rx="1.6" fill="url(#stg)"/>
      <rect x="26" y="5" width="17" height="17" rx="1.6" fill="url(#stg)"/>
      <rect x="5" y="26" width="17" height="17" rx="1.6" fill="url(#stg)"/>
      <rect x="26" y="26" width="17" height="17" rx="1.6" fill="url(#stg)"/></svg>`,

    /* 搜索 */
    search: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sc1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7fdcff"/><stop offset="100%" stop-color="#1b7fd4"/></linearGradient></defs>
      <circle cx="21" cy="21" r="12.5" fill="none" stroke="url(#sc1)" stroke-width="3.6"/>
      <circle cx="21" cy="21" r="9" fill="#8fd8ff" opacity=".22"/>
      <path d="M30.5 30.5 L40 40" stroke="url(#sc1)" stroke-width="4.2" stroke-linecap="round"/></svg>`,

    /* 任务视图 */
    taskview: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="tv1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#8fd6ff"/><stop offset="100%" stop-color="#2b88d8"/></linearGradient></defs>
      <rect x="4" y="12" width="15" height="24" rx="2.5" fill="url(#tv1)" opacity=".55"/>
      <rect x="29" y="12" width="15" height="24" rx="2.5" fill="url(#tv1)" opacity=".55"/>
      <rect x="15" y="7" width="18" height="34" rx="3" fill="url(#tv1)"/>
      <rect x="17.5" y="9.5" width="13" height="29" rx="1.6" fill="#eaf6ff" opacity=".35"/></svg>`,

    /* 小组件 */
    widgets: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#67d6ff"/><stop offset="100%" stop-color="#1d7fd0"/></linearGradient>
        <linearGradient id="wg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b8e6ff"/><stop offset="100%" stop-color="#6fb8ea"/></linearGradient>
      </defs>
      <rect x="5" y="5" width="18" height="18" rx="3" fill="url(#wg1)"/>
      <rect x="27" y="5" width="16" height="12" rx="3" fill="url(#wg2)"/>
      <rect x="27" y="21" width="16" height="22" rx="3" fill="url(#wg1)" opacity=".8"/>
      <rect x="5" y="27" width="18" height="16" rx="3" fill="url(#wg2)"/></svg>`,

    /* 文件资源管理器 */
    explorer: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fe1" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stop-color="#ffd766"/><stop offset="100%" stop-color="#f0a92c"/></linearGradient>
        <linearGradient id="fe2" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="#ffe9a8"/><stop offset="100%" stop-color="#ffc23c"/></linearGradient>
        <linearGradient id="fe3" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#59c8ff"/><stop offset="55%" stop-color="#1f8ee0"/><stop offset="100%" stop-color="#0f63b5"/></linearGradient>
      </defs>
      <path d="M4 12.5A2.5 2.5 0 0 1 6.5 10h11l3.6 4.2H41A2.5 2.5 0 0 1 43.5 16.7v20.8A2.5 2.5 0 0 1 41 40H6.5A2.5 2.5 0 0 1 4 37.5z" fill="url(#fe1)"/>
      <path d="M4 18h39.5v19.5A2.5 2.5 0 0 1 41 40H6.5A2.5 2.5 0 0 1 4 37.5z" fill="url(#fe2)"/>
      <path d="M14 20.5h26.5a2 2 0 0 1 1.94 2.49l-3.2 14.5A2.5 2.5 0 0 1 36.8 39.5H8.4a1.4 1.4 0 0 1-1.36-1.74l3.5-15.3A2.5 2.5 0 0 1 14 20.5z" fill="url(#fe3)"/>
      <path d="M14 20.5h26.5a2 2 0 0 1 1.94 2.49l-.4 1.8H12.1l.04-.2A2.5 2.5 0 0 1 14 20.5z" fill="#a5e4ff" opacity=".55"/></svg>`,

    folder: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fd1" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#ffd35c"/><stop offset="100%" stop-color="#eaa221"/></linearGradient>
        <linearGradient id="fd2" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="#ffe9ab"/><stop offset="100%" stop-color="#ffc23c"/></linearGradient>
      </defs>
      <path d="M4 13A3 3 0 0 1 7 10h11l4 4.5h19a3 3 0 0 1 3 3v20A3 3 0 0 1 41 40H7a3 3 0 0 1-3-3z" fill="url(#fd1)"/>
      <path d="M4 19.5h40v18A2.5 2.5 0 0 1 41.5 40H6.5A2.5 2.5 0 0 1 4 37.5z" fill="url(#fd2)"/></svg>`,

    folderOpen: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fo1" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#ffd35c"/><stop offset="100%" stop-color="#eaa221"/></linearGradient>
        <linearGradient id="fo2" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="#ffe9ab"/><stop offset="100%" stop-color="#ffbb2e"/></linearGradient>
      </defs>
      <path d="M4 13A3 3 0 0 1 7 10h11l4 4.5h19a3 3 0 0 1 3 3v20A3 3 0 0 1 41 40H7a3 3 0 0 1-3-3z" fill="url(#fo1)"/>
      <path d="M11 21h33.5a2 2 0 0 1 1.95 2.45l-3.1 14.1A3 3 0 0 1 40.4 40H6.6a1.5 1.5 0 0 1-1.46-1.83l3.0-13.6A3 3 0 0 1 11 21z" fill="url(#fo2)"/></svg>`,

    /* 设置 */
    settings: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="st1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e9edf2"/><stop offset="45%" stop-color="#a9b4c0"/><stop offset="100%" stop-color="#6d7a89"/></linearGradient>
        <linearGradient id="st2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5fc4f5"/><stop offset="100%" stop-color="#1173c4"/></linearGradient>
      </defs>
      <path fill="url(#st1)" d="M24 3.5l3.1.28 1.5 4.6a16.8 16.8 0 0 1 4.2 1.75l4.3-2.2 2.2 2.2-2.2 4.3a16.8 16.8 0 0 1 1.75 4.2l4.6 1.5v3.1l-4.6 1.5a16.8 16.8 0 0 1-1.75 4.2l2.2 4.3-2.2 2.2-4.3-2.2a16.8 16.8 0 0 1-4.2 1.75l-1.5 4.6h-3.1l-1.5-4.6a16.8 16.8 0 0 1-4.2-1.75l-4.3 2.2-2.2-2.2 2.2-4.3a16.8 16.8 0 0 1-1.75-4.2l-4.6-1.5v-3.1l4.6-1.5a16.8 16.8 0 0 1 1.75-4.2l-2.2-4.3 2.2-2.2 4.3 2.2a16.8 16.8 0 0 1 4.2-1.75l1.5-4.6z"/>
      <circle cx="24" cy="24" r="8.6" fill="#f7f9fb"/>
      <circle cx="24" cy="24" r="6.2" fill="url(#st2)"/>
      <circle cx="24" cy="24" r="3" fill="#eaf7ff" opacity=".8"/></svg>`,

    /* Microsoft Edge */
    edge: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="eg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#37c6f4"/><stop offset="50%" stop-color="#1b90d8"/><stop offset="100%" stop-color="#0f5faa"/></linearGradient>
        <linearGradient id="eg2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#37e0a0"/><stop offset="45%" stop-color="#20b8c8"/><stop offset="100%" stop-color="#1b8fd6"/></linearGradient>
        <linearGradient id="eg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f5f9ff"/><stop offset="100%" stop-color="#bfe3ff"/></linearGradient>
      </defs>
      <path d="M41.5 31.6C39 38.2 32.9 43 25.4 43 15.3 43 7 35.2 7 24.6c0-4 1.3-7.3 3.1-9.6-.5 4.6 2.2 9.5 7.7 9.5 8 0 10.8-4.9 18-4.9 4.3 0 7.4 1.9 9 4.8-.3 2.6-1.4 5.1-3.3 7.2z" fill="url(#eg2)"/>
      <path d="M24.8 5C33.7 5 41 11.1 42.7 19.6c-2-2.4-5.1-3.9-9.2-3.9-8.7 0-11.6 5.1-19.7 5.1-4.2 0-6.4-2.6-6.4-5.6 0-1.4.5-2.9 1.4-4.2C12.3 7.1 18.1 5 24.8 5z" fill="url(#eg1)"/>
      <path d="M41.6 31.4c-1.4 3.5-3.9 6.6-7.4 8.5-6 3.2-12.6 1.6-15.4-2.5-1.9-2.9-1.2-6.5 1.6-8.6 2.7-2 7.6-3.1 12.1-3.1 4.2 0 7.7.9 9.6 2.4-.1 1.1-.3 2.2-.5 3.3z" fill="url(#eg3)" opacity=".92"/></svg>`,

    /* Microsoft Store */
    store: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ms1" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#4fd0f7"/><stop offset="55%" stop-color="#1f8ede"/><stop offset="100%" stop-color="#1358b0"/></linearGradient>
        <linearGradient id="ms2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/><stop offset="100%" stop-color="#ffffff" stop-opacity=".05"/></linearGradient>
      </defs>
      <path d="M9 15.5h30a3 3 0 0 1 3 3.2l-1.8 21A3 3 0 0 1 37.2 42.5H10.8a3 3 0 0 1-3-2.8l-1.8-21A3 3 0 0 1 9 15.5z" fill="url(#ms1)"/>
      <path d="M9 15.5h30a3 3 0 0 1 3 3.2l-.5 5.3H6.5L6 18.7A3 3 0 0 1 9 15.5z" fill="url(#ms2)"/>
      <path d="M16.5 18.5v-4a7.5 7.5 0 0 1 15 0v4" fill="none" stroke="#eaf7ff" stroke-width="3" stroke-linecap="round"/>
      <path d="M20 30.5h8m-4-4v8" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>`,

    /* 记事本 */
    notepad: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="np1" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e3eaf2"/></linearGradient>
        <linearGradient id="np2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5cc3f2"/><stop offset="100%" stop-color="#1573c4"/></linearGradient>
      </defs>
      <path d="M10 7h20l9 9v25a2.5 2.5 0 0 1-2.5 2.5h-26.5A2.5 2.5 0 0 1 7.5 40.5V9.5A2.5 2.5 0 0 1 10 7z" fill="url(#np1)"/>
      <path d="M30 7l9 9h-7a2 2 0 0 1-2-2z" fill="#b9c9d8"/>
      <g stroke="url(#np2)" stroke-width="2.4" stroke-linecap="round" opacity=".85">
        <path d="M14 21h18"/><path d="M14 27h18"/><path d="M14 33h11"/></g></svg>`,

    /* 计算器 */
    calculator: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cl1" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stop-color="#fdfefe"/><stop offset="100%" stop-color="#dde5ee"/></linearGradient>
        <linearGradient id="cl2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#59c2f0"/><stop offset="100%" stop-color="#1268b8"/></linearGradient>
      </defs>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="url(#cl1)"/>
      <rect x="11.5" y="8" width="25" height="9" rx="2" fill="url(#cl2)"/>
      <text x="33" y="15" font-family="Segoe UI,sans-serif" font-size="6.5" fill="#eaf8ff" text-anchor="end">1024</text>
      <g fill="#7e8b99">
        <rect x="11.5" y="21" width="6" height="5" rx="1.4"/><rect x="20.5" y="21" width="6" height="5" rx="1.4"/>
        <rect x="11.5" y="29" width="6" height="5" rx="1.4"/><rect x="20.5" y="29" width="6" height="5" rx="1.4"/>
        <rect x="11.5" y="37" width="15" height="5" rx="1.4"/></g>
      <g fill="url(#cl2)">
        <rect x="29.5" y="21" width="7" height="5" rx="1.4"/><rect x="29.5" y="29" width="7" height="13" rx="1.4"/></g></svg>`,

    /* 终端 */
    terminal: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tm1" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#3b4250"/><stop offset="100%" stop-color="#12161e"/></linearGradient>
        <linearGradient id="tm2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7fe3ff"/><stop offset="100%" stop-color="#2b9ee0"/></linearGradient>
      </defs>
      <rect x="4" y="8" width="40" height="32" rx="4.5" fill="url(#tm1)"/>
      <rect x="4" y="8" width="40" height="6" rx="4.5" fill="#4a5262" opacity=".7"/>
      <path d="M12 22l5 4.5-5 4.5" fill="none" stroke="url(#tm2)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M21 31.5h11" stroke="#e8f4ff" stroke-width="2.8" stroke-linecap="round" opacity=".85"/></svg>`,

    /* 画图 */
    paint: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pt1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdfdfd"/><stop offset="100%" stop-color="#dfe6ee"/></linearGradient>
        <linearGradient id="pt2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd45e"/><stop offset="100%" stop-color="#f08a1e"/></linearGradient>
      </defs>
      <path d="M24 5c10.5 0 19 7.2 19 16 0 5.2-3.6 8.2-8.4 8.2h-3.3c-2.4 0-4.3 1.9-4.3 4.3 0 1 .3 1.7.7 2.5.5.9.8 1.7.8 2.6 0 2.8-2.3 4.4-5 4.4C13.2 43 5 34.9 5 24.5S13.5 5 24 5z" fill="url(#pt1)"/>
      <circle cx="16" cy="17.5" r="3.4" fill="#e64b4b"/>
      <circle cx="26" cy="13.5" r="3.4" fill="#ffc93c"/>
      <circle cx="34.5" cy="19" r="3.4" fill="#3aa0f0"/>
      <circle cx="14" cy="28.5" r="3.4" fill="#4bc47d"/>
      <path d="M31 33.5l9.5-9.5a3.3 3.3 0 0 1 4.7 4.7L35.7 38.2a3 3 0 0 1-1.5.8l-4.4.9.9-4.4a3 3 0 0 1 .8-1.5z" fill="url(#pt2)" transform="translate(-1 2)"/></svg>`,

    /* 照片 */
    photos: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ph1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8fd8ff"/><stop offset="100%" stop-color="#2b7fd4"/></linearGradient>
        <linearGradient id="ph2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd76a"/><stop offset="100%" stop-color="#f5872c"/></linearGradient>
        <linearGradient id="ph3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5ddba0"/><stop offset="100%" stop-color="#1f9e7a"/></linearGradient>
      </defs>
      <rect x="10" y="6" width="30" height="24" rx="3" fill="#ffffff" opacity=".55" transform="rotate(-8 25 18)"/>
      <rect x="6" y="14" width="36" height="28" rx="3.5" fill="url(#ph1)"/>
      <path d="M6 34.5l9-8.5 7.5 6.5 8-9.5 11.5 12v3.5A3 3 0 0 1 39 42H9a3 3 0 0 1-3-3z" fill="url(#ph3)"/>
      <circle cx="16" cy="22" r="3.6" fill="url(#ph2)"/></svg>`,

    /* 媒体播放器 */
    mediaplayer: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mp1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4a5364"/><stop offset="100%" stop-color="#181d26"/></linearGradient>
        <linearGradient id="mp2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7de0ff"/><stop offset="100%" stop-color="#2183db"/></linearGradient>
      </defs>
      <rect x="4" y="9" width="40" height="30" rx="4.5" fill="url(#mp1)"/>
      <circle cx="24" cy="24" r="10.5" fill="url(#mp2)" opacity=".95"/>
      <path d="M21 18.5l9 5.5-9 5.5z" fill="#ffffff"/></svg>`,

    /* 任务管理器 */
    taskmgr: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tk1" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#f7fafc"/><stop offset="100%" stop-color="#dbe3ec"/></linearGradient>
        <linearGradient id="tk2" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#2fb8f0"/><stop offset="100%" stop-color="#0f5fb0"/></linearGradient>
        <linearGradient id="tk3" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#5fdca0"/><stop offset="100%" stop-color="#17996f"/></linearGradient>
      </defs>
      <rect x="5" y="8" width="38" height="32" rx="4" fill="url(#tk1)"/>
      <rect x="5" y="8" width="38" height="5.5" rx="4" fill="#c3cfdb"/>
      <rect x="10" y="26" width="5.5" height="10" rx="1.4" fill="url(#tk2)"/>
      <rect x="18" y="20" width="5.5" height="16" rx="1.4" fill="url(#tk3)"/>
      <rect x="26" y="23" width="5.5" height="13" rx="1.4" fill="url(#tk2)"/>
      <rect x="34" y="17" width="5.5" height="19" rx="1.4" fill="url(#tk3)"/></svg>`,

    /* 时钟 */
    clock: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ck1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6fd4ff"/><stop offset="100%" stop-color="#1568bd"/></linearGradient>
        <linearGradient id="ck2" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e2eaf3"/></linearGradient>
      </defs>
      <circle cx="24" cy="24" r="19" fill="url(#ck1)"/>
      <circle cx="24" cy="24" r="15" fill="url(#ck2)"/>
      <path d="M24 14.5V24l7 4.5" fill="none" stroke="#1a6fbd" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="24" cy="24" r="1.8" fill="#1a6fbd"/></svg>`,

    /* 日历 */
    calendar: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cd1" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stop-color="#fdfefe"/><stop offset="100%" stop-color="#e0e8f1"/></linearGradient>
        <linearGradient id="cd2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#3fb0ef"/><stop offset="100%" stop-color="#1064b8"/></linearGradient>
      </defs>
      <rect x="5" y="8" width="38" height="34" rx="4" fill="url(#cd1)"/>
      <path d="M5 12a4 4 0 0 1 4-4h30a4 4 0 0 1 4 4v6H5z" fill="url(#cd2)"/>
      <g fill="#8e9bab">
        <rect x="11" y="23" width="6" height="5" rx="1.2"/><rect x="21" y="23" width="6" height="5" rx="1.2"/><rect x="31" y="23" width="6" height="5" rx="1.2"/>
        <rect x="11" y="32" width="6" height="5" rx="1.2"/><rect x="31" y="32" width="6" height="5" rx="1.2"/></g>
      <rect x="21" y="32" width="6" height="5" rx="1.2" fill="#e5484d"/></svg>`,

    /* 邮件 */
    mail: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ml1" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#57c4f5"/><stop offset="100%" stop-color="#1163b5"/></linearGradient>
      </defs>
      <rect x="4" y="11" width="40" height="26" rx="4" fill="url(#ml1)"/>
      <path d="M6 14l18 13 18-13" fill="none" stroke="#eaf7ff" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M4 34.5L17 24M44 34.5L31 24" stroke="#ffffff" stroke-width="2" opacity=".45"/></svg>`,

    /* 扫雷 */
    minesweeper: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mn1" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#6b7686"/><stop offset="70%" stop-color="#2b323d"/><stop offset="100%" stop-color="#12161c"/></radialGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="5" fill="#cfd8e2"/>
      <rect x="7" y="7" width="34" height="34" rx="3" fill="#eaf0f6"/>
      <circle cx="24" cy="25" r="11" fill="url(#mn1)"/>
      <g stroke="#2b323d" stroke-width="3" stroke-linecap="round">
        <path d="M24 8v5"/><path d="M24 37v5"/><path d="M8 25h5"/><path d="M35 25h5"/></g>
      <circle cx="20" cy="21" r="2.6" fill="#ffffff" opacity=".55"/></svg>`,

    /* 回收站 */
    recyclebin: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rb1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dff1fb" stop-opacity=".95"/><stop offset="100%" stop-color="#9dc0d8" stop-opacity=".85"/></linearGradient>
        <linearGradient id="rb2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c3dced"/><stop offset="100%" stop-color="#8fb3ca"/></linearGradient>
      </defs>
      <path d="M13 14h22l-2.2 26.2a3 3 0 0 1-3 2.8H18.2a3 3 0 0 1-3-2.8z" fill="url(#rb1)"/>
      <path d="M13 14h22l-.35 4.2H13.35z" fill="url(#rb2)"/>
      <rect x="9.5" y="9" width="29" height="5" rx="2.5" fill="url(#rb2)"/>
      <path d="M20 8.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" fill="none" stroke="#8fb3ca" stroke-width="2"/>
      <g stroke="#7fa6bf" stroke-width="1.8" opacity=".8"><path d="M20 22v14"/><path d="M24 22v14"/><path d="M28 22v14"/></g></svg>`,

    recyclebinFull: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rf1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dff1fb" stop-opacity=".95"/><stop offset="100%" stop-color="#9dc0d8" stop-opacity=".85"/></linearGradient>
        <linearGradient id="rf2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c3dced"/><stop offset="100%" stop-color="#8fb3ca"/></linearGradient>
      </defs>
      <g transform="translate(0 -2)">
        <rect x="16" y="6" width="12" height="9" rx="1.5" fill="#fff" transform="rotate(-14 22 10)"/>
        <rect x="22" y="5" width="11" height="9" rx="1.5" fill="#f0f4f8" transform="rotate(12 27 9)"/>
      </g>
      <path d="M13 14h22l-2.2 26.2a3 3 0 0 1-3 2.8H18.2a3 3 0 0 1-3-2.8z" fill="url(#rf1)"/>
      <path d="M13 14h22l-.35 4.2H13.35z" fill="url(#rf2)"/>
      <rect x="9.5" y="9" width="29" height="5" rx="2.5" fill="url(#rf2)"/>
      <g stroke="#7fa6bf" stroke-width="1.8" opacity=".8"><path d="M20 22v14"/><path d="M24 22v14"/><path d="M28 22v14"/></g></svg>`,

    /* 此电脑 */
    thispc: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pc1" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#5d6b7c"/><stop offset="100%" stop-color="#2a323d"/></linearGradient>
        <linearGradient id="pc2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7fd8ff"/><stop offset="100%" stop-color="#1c7fd0"/></linearGradient>
      </defs>
      <rect x="4" y="9" width="40" height="26" rx="3.5" fill="url(#pc1)"/>
      <rect x="6.5" y="11.5" width="35" height="21" rx="2" fill="url(#pc2)"/>
      <path d="M6.5 11.5h35v7h-35z" fill="#ffffff" opacity=".18"/>
      <path d="M14 39.5h20l-2-4.5H16z" fill="#4a566380"/>
      <rect x="11" y="39" width="26" height="3.5" rx="1.75" fill="url(#pc1)"/></svg>`,

    drive: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="dr1" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stop-color="#eef3f8"/><stop offset="100%" stop-color="#b7c3d0"/></linearGradient></defs>
      <path d="M8 12.5A3.5 3.5 0 0 1 11.5 9h25a3.5 3.5 0 0 1 3.5 3.5V26H8z" fill="url(#dr1)"/>
      <path d="M8 26h32v9.5A3.5 3.5 0 0 1 36.5 39h-25A3.5 3.5 0 0 1 8 35.5z" fill="#93a3b4"/>
      <circle cx="34" cy="32.5" r="2" fill="#5fdc8f"/>
      <rect x="12" y="30.5" width="14" height="4" rx="2" fill="#ffffff" opacity=".35"/></svg>`,

    onedrive: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="od1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#41b8f5"/><stop offset="100%" stop-color="#0d63b8"/></linearGradient>
        <linearGradient id="od2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8fdcff"/><stop offset="100%" stop-color="#2f92dd"/></linearGradient>
      </defs>
      <path d="M17.5 14.5a10 10 0 0 1 18.2 4.2 8.2 8.2 0 0 1-.9 16.3H14a8.5 8.5 0 0 1-1.2-16.9 10 10 0 0 1 4.7-3.6z" fill="url(#od1)"/>
      <path d="M12.8 18.1A8.5 8.5 0 0 0 14 35h8.5l6-16.5a10 10 0 0 0-15.7-.4z" fill="url(#od2)" opacity=".8"/></svg>`,

    /* 天气 */
    weather: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wt1" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#fff3c4"/><stop offset="60%" stop-color="#ffc93c"/><stop offset="100%" stop-color="#f5911e"/></radialGradient>
        <linearGradient id="wt2" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#c8dcea"/></linearGradient>
      </defs>
      <circle cx="19" cy="18" r="9" fill="url(#wt1)"/>
      <g stroke="#ffc93c" stroke-width="2.4" stroke-linecap="round">
        <path d="M19 3.5v3.5"/><path d="M6.5 18h3.5"/><path d="M9.5 8.5l2.5 2.5"/><path d="M28.5 8.5L26 11"/></g>
      <path d="M22 39a7.5 7.5 0 0 1-.6-14.96A10 10 0 0 1 40.3 26.4 6.3 6.3 0 0 1 39 39z" fill="url(#wt2)"/></svg>`,

    /* 用户头像 */
    user: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="us1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7c6cf5"/><stop offset="50%" stop-color="#3f8ae0"/><stop offset="100%" stop-color="#2ec5c5"/></linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#us1)"/>
      <circle cx="24" cy="19" r="7.5" fill="#ffffff" opacity=".95"/>
      <path d="M9.5 41.5a15 15 0 0 1 29 0A23.9 23.9 0 0 1 24 48a23.9 23.9 0 0 1-14.5-6.5z" fill="#ffffff" opacity=".95"/></svg>`,

    /* 截图工具 */
    snipping: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sn1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6fd0f5"/><stop offset="100%" stop-color="#1b72c4"/></linearGradient></defs>
      <rect x="5" y="5" width="38" height="38" rx="5" fill="none" stroke="url(#sn1)" stroke-width="3" stroke-dasharray="7 5"/>
      <path d="M17 15l14 18M31 15L17 33" stroke="#8e9bab" stroke-width="3" stroke-linecap="round"/>
      <circle cx="16" cy="35" r="4.2" fill="none" stroke="url(#sn1)" stroke-width="3"/>
      <circle cx="32" cy="35" r="4.2" fill="none" stroke="url(#sn1)" stroke-width="3"/></svg>`,

    /* Office 系 */
    word: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5h16l10 10v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#fff"/>
      <path d="M28 5l10 10h-8a2 2 0 0 1-2-2z" fill="#c8d4e0"/>
      <rect x="6" y="20" width="24" height="20" rx="2.5" fill="#2b579a"/>
      <text x="18" y="34.5" font-family="Segoe UI,sans-serif" font-size="13" font-weight="600" fill="#fff" text-anchor="middle">W</text></svg>`,
    excel: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5h16l10 10v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#fff"/>
      <path d="M28 5l10 10h-8a2 2 0 0 1-2-2z" fill="#c8d4e0"/>
      <rect x="6" y="20" width="24" height="20" rx="2.5" fill="#217346"/>
      <text x="18" y="34.5" font-family="Segoe UI,sans-serif" font-size="13" font-weight="600" fill="#fff" text-anchor="middle">X</text></svg>`,
    pdf: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5h16l10 10v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#fff"/>
      <path d="M28 5l10 10h-8a2 2 0 0 1-2-2z" fill="#c8d4e0"/>
      <rect x="6" y="20" width="26" height="20" rx="2.5" fill="#c8382f"/>
      <text x="19" y="34.5" font-family="Segoe UI,sans-serif" font-size="10" font-weight="600" fill="#fff" text-anchor="middle">PDF</text></svg>`,

    /* 通用文件 */
    file: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="fl1" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#dde5ee"/></linearGradient></defs>
      <path d="M11 5h17l9 9v29a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="url(#fl1)"/>
      <path d="M28 5l9 9h-7a2 2 0 0 1-2-2z" fill="#b9c9d8"/>
      <g stroke="#aab8c6" stroke-width="2" stroke-linecap="round"><path d="M15 22h16"/><path d="M15 28h16"/><path d="M15 34h10"/></g></svg>`,

    image: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="im1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8fd8ff"/><stop offset="100%" stop-color="#2b7fd4"/></linearGradient>
      </defs>
      <rect x="5" y="9" width="38" height="30" rx="3.5" fill="#fff"/>
      <rect x="7.5" y="11.5" width="33" height="25" rx="2" fill="url(#im1)"/>
      <path d="M7.5 36.5l9-9 6.5 6 7-8 10.5 11z" fill="#4bc47d"/>
      <circle cx="16" cy="19" r="3.2" fill="#ffd45e"/></svg>`,

    audio: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="au1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8fe0c0"/><stop offset="100%" stop-color="#1b9e7a"/></linearGradient></defs>
      <circle cx="24" cy="24" r="19" fill="url(#au1)"/>
      <path d="M28 13v18.5a5.5 5.5 0 1 1-3-4.9V16.5l-9 2V32a5.5 5.5 0 1 1-3-4.9V16z" fill="#fff" opacity=".95"/></svg>`,

    video: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="vd1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a58cff"/><stop offset="100%" stop-color="#5b3fd0"/></linearGradient></defs>
      <rect x="5" y="11" width="38" height="26" rx="4" fill="url(#vd1)"/>
      <path d="M21 19l9 5-9 5z" fill="#fff"/>
      <g fill="#ffffff" opacity=".35"><rect x="5" y="11" width="4" height="26"/><rect x="39" y="11" width="4" height="26"/></g></svg>`,

    zip: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="zp1" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#ffd766"/><stop offset="100%" stop-color="#eba428"/></linearGradient></defs>
      <path d="M4 13A3 3 0 0 1 7 10h11l4 4.5h19a3 3 0 0 1 3 3v20A3 3 0 0 1 41 40H7a3 3 0 0 1-3-3z" fill="url(#zp1)"/>
      <rect x="20" y="10" width="8" height="22" rx="1.5" fill="#fff" opacity=".9"/>
      <g fill="#eba428"><rect x="22" y="13" width="4" height="2"/><rect x="22" y="17" width="4" height="2"/><rect x="22" y="21" width="4" height="2"/></g>
      <rect x="21" y="26" width="6" height="7" rx="1.6" fill="#8e9bab"/></svg>`,

    exe: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ex1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c8d4e0"/><stop offset="100%" stop-color="#8fa0b2"/></linearGradient></defs>
      <rect x="6" y="9" width="36" height="30" rx="4" fill="url(#ex1)"/>
      <rect x="9" y="12" width="30" height="24" rx="2" fill="#313a46"/>
      <path d="M15 20l4 4-4 4" stroke="#7fe3ff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 28h8" stroke="#e8f4ff" stroke-width="2.2" stroke-linecap="round"/></svg>`,

    /* Xbox / 游戏 */
    xbox: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill="#107c10"/>
      <path d="M24 20c4-5 9-8 12-6 3 2 4 8 1 14-2 4-5 7-6 6-2-2-5-7-7-14z" fill="#fff" opacity=".95"/>
      <path d="M24 20c-4-5-9-8-12-6-3 2-4 8-1 14 2 4 5 7 6 6 2-2 5-7 7-14z" fill="#fff" opacity=".95"/></svg>`,

    todo: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="td1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5fc4f5"/><stop offset="100%" stop-color="#1160b8"/></linearGradient></defs>
      <rect x="7" y="6" width="34" height="36" rx="4" fill="#fff"/>
      <rect x="7" y="6" width="7" height="36" fill="url(#td1)"/>
      <g stroke="#1c7fd0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 16l2.5 2.5L26 14"/><path d="M19 26l2.5 2.5L26 24"/></g>
      <g stroke="#aab8c6" stroke-width="2.2" stroke-linecap="round"><path d="M30 17h7"/><path d="M30 27h7"/><path d="M19 35h18"/></g></svg>`,

    camera: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="cm1" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#5b6675"/><stop offset="100%" stop-color="#242b34"/></linearGradient></defs>
      <rect x="4" y="13" width="40" height="26" rx="5" fill="url(#cm1)"/>
      <path d="M17 13l3-4h8l3 4z" fill="url(#cm1)"/>
      <circle cx="24" cy="26" r="9" fill="#7fd8ff"/>
      <circle cx="24" cy="26" r="5.5" fill="#12324a"/>
      <circle cx="21.5" cy="23.5" r="2" fill="#fff" opacity=".6"/></svg>`,

    phonelink: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="pl1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6fd0f5"/><stop offset="100%" stop-color="#1b6fc4"/></linearGradient></defs>
      <rect x="6" y="10" width="22" height="16" rx="2.5" fill="url(#pl1)"/>
      <rect x="26" y="18" width="16" height="24" rx="3" fill="#39424f"/>
      <rect x="28" y="21" width="12" height="16" rx="1.5" fill="#7fd8ff"/>
      <circle cx="34" cy="39.5" r="1.4" fill="#7fd8ff"/></svg>`
  };

  APP.desktopFolder = APP.folder;
  APP.docx = APP.word;
  APP.xlsx = APP.excel;
  APP.txt = APP.notepad;

  /* ---------------- 单色界面图标 (16x16) ---------------- */
  const S = (d, extra) => `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"${extra || ''}>${d}</svg>`;
  const F = (d) => `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">${d}</svg>`;

  const UI = {
    chevronDown: S('<path d="M3.5 6L8 10.5 12.5 6"/>'),
    chevronUp: S('<path d="M3.5 10L8 5.5 12.5 10"/>'),
    chevronRight: S('<path d="M6 3.5L10.5 8 6 12.5"/>'),
    chevronLeft: S('<path d="M10 3.5L5.5 8 10 12.5"/>'),
    close: S('<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>'),
    check: S('<path d="M3 8.5l3.5 3.5L13 5"/>'),
    plus: S('<path d="M8 3v10M3 8h10"/>'),
    minus: S('<path d="M3 8h10"/>'),
    more: F('<circle cx="3.2" cy="8" r="1.15"/><circle cx="8" cy="8" r="1.15"/><circle cx="12.8" cy="8" r="1.15"/>'),
    moreVert: F('<circle cx="8" cy="3.2" r="1.15"/><circle cx="8" cy="8" r="1.15"/><circle cx="8" cy="12.8" r="1.15"/>'),
    search: S('<circle cx="7" cy="7" r="4.3"/><path d="M10.2 10.2L13.5 13.5"/>'),
    back: S('<path d="M13 8H3.5M7 3.5L2.8 8 7 12.5"/>'),
    forward: S('<path d="M3 8h9.5M9 3.5L13.2 8 9 12.5"/>'),
    up: S('<path d="M8 13V3.5M3.5 7.5L8 3l4.5 4.5"/>'),
    down: S('<path d="M8 3v9.5M3.5 8.5L8 13l4.5-4.5"/>'),
    refresh: S('<path d="M13 8a5 5 0 1 1-1.6-3.7"/><path d="M13 2v3h-3"/>'),
    home: S('<path d="M2.5 7L8 2.5 13.5 7v6a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8z"/><path d="M6.3 13.8V9.5h3.4v4.3"/>'),
    folder: S('<path d="M1.8 4.2a1 1 0 0 1 1-1h2.9l1.3 1.6h6.2a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1z"/>'),
    file: S('<path d="M4 1.8h5l3 3v9a.8.8 0 0 1-.8.8H4a.8.8 0 0 1-.8-.8V2.6A.8.8 0 0 1 4 1.8z"/><path d="M9 1.8v3h3"/>'),
    copy: S('<rect x="5.5" y="5.5" width="8" height="8.5" rx="1"/><path d="M11 3.6V2.8a.8.8 0 0 0-.8-.8H3.3a.8.8 0 0 0-.8.8v7.4c0 .4.4.8.8.8h.9"/>'),
    cut: S('<circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M5.4 10.6L12 2M10.6 10.6L4 2"/>'),
    paste: S('<rect x="3.2" y="3.5" width="9.6" height="10.5" rx="1"/><path d="M6 3.5V2.4h4v1.1"/><path d="M5.8 7.5h4.4M5.8 10h4.4"/>'),
    rename: S('<path d="M2.5 12.2l7.3-7.3 2.3 2.3-7.3 7.3-2.7.4z"/><path d="M11 2.6l2.3 2.3"/>'),
    trash: S('<path d="M3 4.5h10"/><path d="M4.4 4.5l.6 8.4a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.6-8.4"/><path d="M6.4 4.5V3a.8.8 0 0 1 .8-.8h1.6a.8.8 0 0 1 .8.8v1.5"/>'),
    share: S('<circle cx="12" cy="3.6" r="1.9"/><circle cx="4" cy="8" r="1.9"/><circle cx="12" cy="12.4" r="1.9"/><path d="M5.7 7.1l4.6-2.6M5.7 8.9l4.6 2.6"/>'),
    sort: S('<path d="M2.5 4h11M4.5 8h7M6.5 12h3"/>'),
    view: S('<rect x="2.2" y="2.2" width="5" height="5" rx="1"/><rect x="8.8" y="2.2" width="5" height="5" rx="1"/><rect x="2.2" y="8.8" width="5" height="5" rx="1"/><rect x="8.8" y="8.8" width="5" height="5" rx="1"/>'),
    list: S('<path d="M5.5 4h8M5.5 8h8M5.5 12h8"/><circle cx="2.8" cy="4" r=".9" fill="currentColor" stroke="none"/><circle cx="2.8" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="2.8" cy="12" r=".9" fill="currentColor" stroke="none"/>'),
    newFolder: S('<path d="M1.8 4.2a1 1 0 0 1 1-1h2.9l1.3 1.6h6.2a1 1 0 0 1 1 1V9"/><path d="M1.8 4.2v8.1a1 1 0 0 0 1 1H8"/><path d="M12 10v4M10 12h4"/>'),
    pin: S('<path d="M9.5 1.8l4.7 4.7-1.6 1.6-1-.3-3 3 .5 3.6-1.2 1.2-2.6-3.9-3.1 2 5.6-5.6-.3-1z"/>'),
    unpin: S('<path d="M9.5 1.8l4.7 4.7-1.6 1.6-1-.3-3 3 .5 3.6-1.2 1.2-2.6-3.9-3.1 2 5.6-5.6-.3-1z"/><path d="M1.5 14.5l13-13"/>'),
    star: S('<path d="M8 1.8l1.9 4 4.3.6-3.1 3 .8 4.3L8 11.6l-3.9 2.1.8-4.3-3.1-3 4.3-.6z"/>'),
    settings: S('<circle cx="8" cy="8" r="2.4"/><path d="M8 1.5l.4 1.7a5.4 5.4 0 0 1 1.7.7l1.5-.9 1.4 1.4-.9 1.5c.3.5.6 1.1.7 1.7l1.7.4v2l-1.7.4a5.4 5.4 0 0 1-.7 1.7l.9 1.5-1.4 1.4-1.5-.9a5.4 5.4 0 0 1-1.7.7L8 14.5H7l-.4-1.7a5.4 5.4 0 0 1-1.7-.7l-1.5.9-1.4-1.4.9-1.5a5.4 5.4 0 0 1-.7-1.7L.5 8V7l1.7-.4c.1-.6.4-1.2.7-1.7l-.9-1.5 1.4-1.4 1.5.9a5.4 5.4 0 0 1 1.7-.7L7 1.5z"/>'),
    person: S('<circle cx="8" cy="5" r="2.8"/><path d="M2.8 14c0-2.6 2.3-4.4 5.2-4.4s5.2 1.8 5.2 4.4"/>'),
    power: S('<path d="M11.3 4.2a5.2 5.2 0 1 1-6.6 0"/><path d="M8 1.5v5.5"/>'),
    lock: S('<rect x="3.2" y="7" width="9.6" height="7" rx="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>'),
    wifi: S('<path d="M1.5 5.5a10 10 0 0 1 13 0"/><path d="M3.8 8.2a6.6 6.6 0 0 1 8.4 0"/><path d="M6 10.9a3.2 3.2 0 0 1 4 0"/><circle cx="8" cy="13.2" r=".8" fill="currentColor" stroke="none"/>'),
    bluetooth: S('<path d="M5.5 4.2L11 11.8 8 14V2l3 2.2-5.5 7.6"/>'),
    airplane: S('<path d="M8 1.8c.7 0 1.1.6 1.1 1.3v3.3l4.6 2.6v1.5L9.1 9.2v2.6l1.8 1.3v1.1L8 13.4l-2.9.8v-1.1l1.8-1.3V9.2L2.3 10.5V9L6.9 6.4V3.1c0-.7.4-1.3 1.1-1.3z"/>'),
    battery: S('<rect x="1.5" y="5" width="11" height="6" rx="1.4"/><path d="M14 7.2v1.6"/><rect x="2.8" y="6.3" width="6" height="3.4" rx=".6" fill="currentColor" stroke="none"/>'),
    volume: S('<path d="M2 6.2h2.2L7.5 3.4v9.2L4.2 9.8H2z"/><path d="M10 5.8a3 3 0 0 1 0 4.4"/><path d="M12 4a5.6 5.6 0 0 1 0 8"/>'),
    volumeMute: S('<path d="M2 6.2h2.2L7.5 3.4v9.2L4.2 9.8H2z"/><path d="M10.5 6l4 4M14.5 6l-4 4"/>'),
    brightness: S('<circle cx="8" cy="8" r="3"/><path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3 3l1.3 1.3M11.7 11.7L13 13M13 3l-1.3 1.3M4.3 11.7L3 13"/>'),
    nightlight: S('<path d="M13 9.6A5.6 5.6 0 0 1 6.4 3 6 6 0 1 0 13 9.6z"/>'),
    cast: S('<path d="M2 5.2V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9.5"/><path d="M2 13.5a1 1 0 0 0-1-1"/><path d="M2 10.8a3.7 3.7 0 0 1 3.7 3.7"/><path d="M2 8a6.5 6.5 0 0 1 6.5 6.5"/>'),
    accessibility: S('<circle cx="8" cy="3" r="1.4"/><path d="M3 6h10"/><path d="M6.5 6v3.2L5 14M9.5 6v3.2L11 14"/>'),
    keyboard: S('<rect x="1.2" y="4" width="13.6" height="8" rx="1.4"/><path d="M4.5 9.5h7"/><circle cx="4" cy="6.8" r=".7" fill="currentColor" stroke="none"/><circle cx="6.5" cy="6.8" r=".7" fill="currentColor" stroke="none"/><circle cx="9.5" cy="6.8" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="6.8" r=".7" fill="currentColor" stroke="none"/>'),
    save: S('<path d="M2.5 3.5A1 1 0 0 1 3.5 2.5h7L13.5 5.5v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z"/><path d="M5 2.5v3.5h5V2.5"/><rect x="5" y="9" width="6" height="4.5"/>'),
    open: S('<path d="M2 12.5V4a1 1 0 0 1 1-1h3l1.3 1.6h4.7a1 1 0 0 1 1 1v1"/><path d="M2 12.5l1.8-5h11L13 12.5z"/>'),
    print: S('<path d="M4.5 6V2.5h7V6"/><rect x="1.8" y="6" width="12.4" height="5" rx="1"/><path d="M4.5 9.5h7v4h-7z"/>'),
    undo: S('<path d="M3 8.5A5 5 0 1 1 8 13.5H5"/><path d="M3 5v3.5h3.5"/>'),
    redo: S('<path d="M13 8.5A5 5 0 1 0 8 13.5h3"/><path d="M13 5v3.5H9.5"/>'),
    zoomIn: S('<circle cx="7" cy="7" r="4.3"/><path d="M10.2 10.2L13.5 13.5"/><path d="M7 5.2v3.6M5.2 7h3.6"/>'),
    zoomOut: S('<circle cx="7" cy="7" r="4.3"/><path d="M10.2 10.2L13.5 13.5"/><path d="M5.2 7h3.6"/>'),
    play: F('<path d="M4.5 2.8l8.5 5.2-8.5 5.2z"/>'),
    pause: F('<rect x="4" y="3" width="2.8" height="10" rx="1"/><rect x="9.2" y="3" width="2.8" height="10" rx="1"/>'),
    stop: F('<rect x="3.5" y="3.5" width="9" height="9" rx="1.4"/>'),
    next: F('<path d="M3.5 3.2L10 8l-6.5 4.8z"/><rect x="10.8" y="3.2" width="1.8" height="9.6" rx=".9"/>'),
    prev: F('<path d="M12.5 3.2L6 8l6.5 4.8z"/><rect x="3.4" y="3.2" width="1.8" height="9.6" rx=".9"/>'),
    grid: S('<rect x="2" y="2" width="5.2" height="5.2" rx="1"/><rect x="8.8" y="2" width="5.2" height="5.2" rx="1"/><rect x="2" y="8.8" width="5.2" height="5.2" rx="1"/><rect x="8.8" y="8.8" width="5.2" height="5.2" rx="1"/>'),
    image: S('<rect x="1.8" y="3" width="12.4" height="10" rx="1.2"/><circle cx="5.4" cy="6.4" r="1.2"/><path d="M1.8 11l3.4-3 2.4 2.2 2.6-3 4 4.3"/>'),
    monitor: S('<rect x="1.5" y="2.5" width="13" height="9" rx="1.2"/><path d="M6 14h4M8 11.5V14"/>'),
    palette: S('<path d="M8 1.8a6.2 6.2 0 0 0 0 12.4c1 0 1.6-.6 1.6-1.4 0-.4-.2-.7-.3-1-.2-.3-.3-.6-.3-.9 0-.8.6-1.4 1.4-1.4h1c1.6 0 2.9-1 2.9-2.8C14.3 4 11.4 1.8 8 1.8z"/><circle cx="5.4" cy="5.6" r="1"/><circle cx="8.6" cy="4.4" r="1"/><circle cx="4.6" cy="9" r="1"/>'),
    globe: S('<circle cx="8" cy="8" r="6.2"/><path d="M1.8 8h12.4"/><path d="M8 1.8c1.8 2 2.6 4 2.6 6.2S9.8 12.2 8 14.2c-1.8-2-2.6-4-2.6-6.2S6.2 3.8 8 1.8z"/>'),
    shield: S('<path d="M8 1.8l5 1.8v4.6c0 3-2 5.2-5 6.2-3-1-5-3.2-5-6.2V3.6z"/><path d="M5.8 8l1.6 1.6L10.4 6.6"/>'),
    apps: S('<rect x="2" y="2" width="5.2" height="5.2" rx="1.4"/><rect x="8.8" y="2" width="5.2" height="5.2" rx="1.4"/><rect x="2" y="8.8" width="5.2" height="5.2" rx="1.4"/><path d="M11.4 9v4M9.4 11h4"/>'),
    clock: S('<circle cx="8" cy="8" r="6.2"/><path d="M8 4.5V8l2.6 1.8"/>'),
    calendar: S('<rect x="2" y="3.2" width="12" height="10.8" rx="1.2"/><path d="M2 6.4h12"/><path d="M5.2 2v2.4M10.8 2v2.4"/>'),
    mail: S('<rect x="1.5" y="3.5" width="13" height="9" rx="1.2"/><path d="M2 4.5l6 4.5 6-4.5"/>'),
    pen: S('<path d="M2.5 12.2l7.3-7.3 2.3 2.3-7.3 7.3-2.7.4z"/><path d="M9.8 2.6a1.2 1.2 0 0 1 1.7 0l1 1a1.2 1.2 0 0 1 0 1.7l-1 1-2.7-2.7z"/>'),
    eraser: S('<path d="M6.5 13.5H13"/><path d="M3 10.5l5-5 4.5 4.5-3.5 3.5H5.5z"/>'),
    text: S('<path d="M3 3.5h10M8 3.5v9M5.5 12.5h5"/>'),
    fill: S('<path d="M7 2.5l6 6-5 5-6-6z"/><path d="M11.5 11c1 1.2 1.5 2 1.5 2.6a1.5 1.5 0 0 1-3 0c0-.6.5-1.4 1.5-2.6z"/>'),
    shapes: S('<circle cx="5" cy="5" r="3.2"/><rect x="7.5" y="7.5" width="6.5" height="6.5" rx="1"/>'),
    crop: S('<path d="M4 1.8v10.4h10.2"/><path d="M1.8 4h10.4v10.2"/>'),
    rotate: S('<path d="M13.2 6.5A5.5 5.5 0 1 0 8 14"/><path d="M8.5 2.5L13.2 4l-1.5 4.5"/>'),
    fullscreen: S('<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>'),
    pip: S('<rect x="1.5" y="3" width="13" height="10" rx="1.2"/><rect x="8" y="8" width="5" height="4" rx=".8" fill="currentColor" stroke="none"/>'),
    download: S('<path d="M8 2v8M4.5 7L8 10.5 11.5 7"/><path d="M2.5 13h11"/>'),
    upload: S('<path d="M8 13V5M4.5 8L8 4.5 11.5 8"/><path d="M2.5 2.5h11"/>'),
    link: S('<path d="M6.5 9.5l3-3"/><path d="M8.8 5.2l1.4-1.4a2.4 2.4 0 0 1 3.4 3.4l-1.4 1.4"/><path d="M7.2 10.8l-1.4 1.4a2.4 2.4 0 0 1-3.4-3.4l1.4-1.4"/>'),
    filter: S('<path d="M2 3.5h12l-4.5 5v4.5l-3 1.5V8.5z"/>'),
    info: S('<circle cx="8" cy="8" r="6.2"/><path d="M8 7v4.5"/><circle cx="8" cy="4.8" r=".8" fill="currentColor" stroke="none"/>'),
    warning: S('<path d="M8 2.2l6 10.6H2z"/><path d="M8 6v3.4"/><circle cx="8" cy="11.2" r=".8" fill="currentColor" stroke="none"/>'),
    error: S('<circle cx="8" cy="8" r="6.2"/><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4"/>'),
    bell: S('<path d="M8 2a4 4 0 0 1 4 4v3l1.3 2.2H2.7L4 9V6a4 4 0 0 1 4-4z"/><path d="M6.3 11.2a1.8 1.8 0 0 0 3.4 0"/>'),
    bellOff: S('<path d="M8 2a4 4 0 0 1 4 4v3l1.3 2.2H2.7L4 9V6a4 4 0 0 1 4-4z"/><path d="M2 14L14 2"/>'),
    pcSmall: S('<rect x="1.8" y="3" width="12.4" height="8" rx="1.2"/><path d="M5 13.5h6"/>'),
    gallery: S('<rect x="2" y="4" width="9" height="8" rx="1"/><path d="M13.5 5.5v7a1 1 0 0 1-1 1H5"/><circle cx="5" cy="7" r="1"/>'),
    music: S('<circle cx="4.5" cy="12" r="2"/><circle cx="12" cy="10.5" r="2"/><path d="M6.5 12V4.5L14 3v7.5"/>'),
    video2: S('<rect x="1.8" y="4" width="9" height="8" rx="1.2"/><path d="M10.8 8l3.4-2.2v4.4L10.8 8z"/>'),
    doc: S('<path d="M4 1.8h5l3 3v9a.8.8 0 0 1-.8.8H4a.8.8 0 0 1-.8-.8V2.6A.8.8 0 0 1 4 1.8z"/><path d="M5.5 8h5M5.5 10.5h5"/>'),
    desktop: S('<rect x="1.8" y="3" width="12.4" height="8.5" rx="1.2"/><path d="M4.5 14h7l-.8-2.5h-5.4z"/>'),
    dock: S('<rect x="1.5" y="10" width="13" height="3.5" rx="1"/><rect x="1.5" y="2.5" width="13" height="6" rx="1"/>'),
    snapLeft: S('<rect x="1.8" y="2.8" width="12.4" height="10.4" rx="1.2"/><path d="M7 2.8v10.4" /><rect x="1.8" y="2.8" width="5.2" height="10.4" fill="currentColor" stroke="none" opacity=".55"/>'),
    eye: S('<path d="M8 3.5c3.6 0 6.5 4.5 6.5 4.5S11.6 12.5 8 12.5 1.5 8 1.5 8 4.4 3.5 8 3.5z"/><circle cx="8" cy="8" r="2.2"/>'),
    windowIcon: S('<rect x="2" y="3" width="12" height="10" rx="1.2"/><path d="M2 6h12"/>'),
    duplicate: S('<rect x="2.5" y="2.5" width="8" height="8" rx="1"/><path d="M5.5 13.5h7a1 1 0 0 0 1-1v-7"/>'),
    devices: S('<rect x="1.5" y="3" width="9" height="7" rx="1"/><rect x="11" y="6" width="3.5" height="7" rx="1"/><path d="M4 12.5h4"/>'),
    network: S('<rect x="5.5" y="1.8" width="5" height="4" rx="1"/><rect x="1.5" y="10.2" width="4.5" height="4" rx="1"/><rect x="10" y="10.2" width="4.5" height="4" rx="1"/><path d="M8 5.8v2.4M3.8 10.2V8.2h8.4v2"/>'),
    time: S('<circle cx="8" cy="8" r="6.2"/><path d="M8 4.5V8l2.6 1.8"/>'),
    game: S('<path d="M5.5 4h5a4.5 4.5 0 0 1 4.4 5.4l-.4 2A2 2 0 0 1 11 12l-1.4-1.6h-3.2L5 12a2 2 0 0 1-3.5-.6l-.4-2A4.5 4.5 0 0 1 5.5 4z"/><path d="M5 7.2v1.6M4.2 8h1.6"/><circle cx="10.8" cy="8" r=".8" fill="currentColor" stroke="none"/>'),
    privacy: S('<path d="M8 1.8l5 1.8v4.6c0 3-2 5.2-5 6.2-3-1-5-3.2-5-6.2V3.6z"/><circle cx="8" cy="7" r="1.4"/><path d="M8 8.4v2.2"/>'),
    update: S('<path d="M13.5 8a5.5 5.5 0 1 1-2-4.2"/><path d="M13.8 2.5V6h-3.4"/><path d="M8 5.5v3.2l2.2 1.4"/>'),
    edit: S('<path d="M2.5 12.2l7.3-7.3 2.3 2.3-7.3 7.3-2.7.4z"/><path d="M11 2.6l2.3 2.3"/>'),
    grid3: S('<path d="M2 2h4v4H2zM6.5 2h3.5v4H6.5zM10.5 2h3.5v4h-3.5zM2 6.5h4v3.5H2zM6.5 6.5h3.5v3.5H6.5zM10.5 6.5h3.5v3.5h-3.5zM2 10.5h4V14H2zM6.5 10.5h3.5V14H6.5zM10.5 10.5h3.5V14h-3.5z"/>'),
    tab: S('<path d="M1.8 12.5V5.5h4.4l1.2-2h6.8v9z"/>'),
    history: S('<path d="M2.8 8a5.2 5.2 0 1 0 5.2-5.2A5.2 5.2 0 0 0 3.4 6"/><path d="M2 3v3.2h3.2"/><path d="M8 5.6V8l2 1.4"/>'),
    favorite: S('<path d="M8 13.5S2.5 10.2 2.5 6.4A3 3 0 0 1 8 4.6a3 3 0 0 1 5.5 1.8c0 3.8-5.5 7.1-5.5 7.1z"/>'),
    collection: S('<rect x="2" y="4" width="12" height="9.5" rx="1.2"/><path d="M4 2.5h8"/><path d="M5 7.5h6M5 10h4"/>'),
    extension: S('<path d="M6.5 2.5h3v1.6a1.4 1.4 0 0 0 2.8 0V2.5h1.2v3.8h1.5a1.4 1.4 0 0 1 0 2.8h-1.5v4.4H9.8v-1.4a1.4 1.4 0 0 0-2.8 0v1.4H2.8V9.1h1.4a1.4 1.4 0 0 0 0-2.8H2.8V2.5z"/>'),
    lightbulb: S('<path d="M5.5 9.6A4 4 0 1 1 10.5 9.6l-.5 1.4h-4z"/><path d="M6.2 12.2h3.6M6.6 14h2.8"/>'),
    translate: S('<path d="M2 3.5h6.5M5.2 2v1.5"/><path d="M6.8 3.5C6.8 7 4.8 9.5 2 10.5"/><path d="M3.2 6.8c1 1.8 2.6 3 4.4 3.6"/><path d="M8.5 14l3-8 3 8M9.6 11.5h3.8"/>'),
    mic: S('<rect x="6" y="1.8" width="4" height="7.4" rx="2"/><path d="M3.8 8a4.2 4.2 0 0 0 8.4 0"/><path d="M8 12.2V14.2"/>'),
    camera2: S('<rect x="1.5" y="4.5" width="13" height="8" rx="1.4"/><path d="M5.5 4.5l1-1.8h3l1 1.8"/><circle cx="8" cy="8.5" r="2.4"/>'),
    dark: S('<path d="M13 9.6A5.6 5.6 0 0 1 6.4 3 6 6 0 1 0 13 9.6z"/>'),
    light: S('<circle cx="8" cy="8" r="3"/><path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3 3l1.3 1.3M11.7 11.7L13 13M13 3l-1.3 1.3M4.3 11.7L3 13"/>'),
    minimize: `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1"><path d="M0.5 5h9"/></svg>`,
    maximize: `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1"><rect x="0.5" y="0.5" width="9" height="9"/></svg>`,
    restore: `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1"><path d="M2.5 0.5h7v7"/><rect x="0.5" y="2.5" width="7" height="7"/></svg>`,
    xClose: `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1"><path d="M0.7 0.7l8.6 8.6M9.3 0.7L0.7 9.3"/></svg>`
  };

  /* Snap 布局示意图（用于最大化按钮悬停） */
  const SNAP = {
    'left-right': [[0, 0, 50, 100], [50, 0, 50, 100]],
    'left-topright-bottomright': [[0, 0, 50, 100], [50, 0, 50, 50], [50, 50, 50, 50]],
    'quad': [[0, 0, 50, 50], [50, 0, 50, 50], [0, 50, 50, 50], [50, 50, 50, 50]],
    'thirds': [[0, 0, 33.4, 100], [33.4, 0, 33.2, 100], [66.6, 0, 33.4, 100]],
    'wide-center': [[0, 0, 25, 100], [25, 0, 50, 100], [75, 0, 25, 100]],
    'left-big': [[0, 0, 66.6, 100], [66.6, 0, 33.4, 100]]
  };

  const Icons = {
    APP, UI, SNAP,
    /** 返回彩色应用图标元素 */
    app(id, size) {
      const svg = APP[id] || APP.file;
      const e = U.el('div.svg-icon', { html: svg });
      const s = size || 32;
      e.style.width = s + 'px'; e.style.height = s + 'px';
      return e;
    },
    appSvg(id) { return APP[id] || APP.file; },
    has(id) { return !!APP[id]; },
    /** 返回单色界面图标元素 */
    ui(id, size) {
      const svg = UI[id] || UI.file;
      const e = U.el('div.svg-icon', { html: svg });
      const s = size || 16;
      e.style.width = s + 'px'; e.style.height = s + 'px';
      return e;
    },
    uiSvg(id) { return UI[id] || UI.file; },
    /** 根据文件扩展名取图标 id */
    forFile(name, isDir) {
      if (isDir) return 'folder';
      const ext = (name.split('.').pop() || '').toLowerCase();
      const map = {
        txt: 'notepad', md: 'notepad', log: 'notepad', ini: 'notepad', json: 'notepad',
        png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', bmp: 'image', webp: 'image', svg: 'image', ico: 'image',
        mp3: 'audio', wav: 'audio', flac: 'audio', m4a: 'audio',
        mp4: 'video', mkv: 'video', avi: 'video', mov: 'video', webm: 'video',
        zip: 'zip', rar: 'zip', '7z': 'zip', tar: 'zip', gz: 'zip',
        exe: 'exe', msi: 'exe', bat: 'exe', cmd: 'exe', ps1: 'exe',
        doc: 'word', docx: 'word', rtf: 'word',
        xls: 'excel', xlsx: 'excel', csv: 'excel',
        pdf: 'pdf', htm: 'edge', html: 'edge', url: 'edge', lnk: 'exe'
      };
      return map[ext] || 'file';
    },
    /** 生成 Snap 布局缩略示意 */
    snapThumb(kind, activeIndex) {
      const parts = SNAP[kind] || SNAP['left-right'];
      const wrap = U.el('div.snap-thumb');
      parts.forEach((p, i) => {
        const b = U.el('i', {
          style: { left: p[0] + '%', top: p[1] + '%', width: p[2] + '%', height: p[3] + '%' },
          dataset: { index: i }
        });
        if (activeIndex === i) b.classList.add('is-active');
        wrap.appendChild(b);
      });
      return wrap;
    }
  };

  global.Icons = Icons;
})(window);
