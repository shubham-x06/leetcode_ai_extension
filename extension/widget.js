/* ============================================================
   LEETAI WIDGET — LOGIC
   ============================================================ */
'use strict';

const API_BASE_URL    = 'http://localhost:3001';
const EXPANDED_HEIGHT = 520;
const COLLAPSED_HEIGHT = 52;

// ── State ──────────────────────────────────────────────────
let authToken    = null;
let currentUser  = null;
let problemTitle = '';
let problemDiff  = '';
let userCode     = '';
let minimized    = false;

// ── DOM refs ───────────────────────────────────────────────
const widget         = document.getElementById('widget');
const authGate       = document.getElementById('auth-gate');
const mainUI         = document.getElementById('main-ui');
const responseBox    = document.getElementById('response-box');
const problemTitleEl = document.getElementById('problem-title');
const diffBadgeEl    = document.getElementById('difficulty-badge');
const langSelect     = document.getElementById('lang-select');

// ── Init ───────────────────────────────────────────────────
(async function init() {
  await loadAuth();
  if (authToken) {
    showMainUI();
    await detectProblem();
    pingBackend();
  } else {
    showAuthGate();
  }
  setupMinimize();
  setupTabs();
  setupButtons();
})();

// ── Auth ───────────────────────────────────────────────────
async function loadAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'authUser'], (result) => {
      authToken   = result.authToken || null;
      currentUser = result.authUser ? tryParse(result.authUser) : null;
      resolve();
    });
  });
}

// ── UI Modes ───────────────────────────────────────────────
function showMainUI() {
  authGate.style.display = 'none';
  mainUI.style.cssText   = 'display:flex; flex:1; min-height:0; flex-direction:column; overflow:hidden;';
  if (currentUser) {
    const infoUser = document.getElementById('info-user');
    const infoLc   = document.getElementById('info-lc');
    if (infoUser) infoUser.textContent = currentUser.name || currentUser.email || 'Unknown';
    if (infoLc)   infoLc.textContent   = currentUser.leetcodeUsername || 'Not linked';
  }
}

function showAuthGate() {
  authGate.style.display = 'flex';
  mainUI.style.display   = 'none';
}

// ── Problem detection ─────────────────────────────────────
async function detectProblem() {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'GET_PROBLEM_CONTEXT' });
    if (resp && resp.title) {
      problemTitle = resp.title;
      problemDiff  = resp.difficulty || '';
      userCode     = resp.code || '';
      problemTitleEl.textContent = problemTitle;
      if (problemDiff) {
        diffBadgeEl.innerHTML = `<span class="difficulty-badge ${problemDiff}">${problemDiff}</span>`;
      }
      return;
    }
  } catch { /* fall through */ }

  // Fallback: parse URL
  try {
    const tabs = await new Promise(r => chrome.tabs.query({ active: true, currentWindow: true }, r));
    if (tabs?.[0]?.url) {
      const m = tabs[0].url.match(/problems\/([^/]+)/);
      if (m) {
        problemTitle = m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        problemTitleEl.textContent = problemTitle;
      }
    }
  } catch { /* ignore */ }
}

// ── Backend ping ──────────────────────────────────────────
async function pingBackend() {
  const statusEl = document.getElementById('api-status');
  const urlEl    = document.getElementById('api-url');
  if (urlEl) urlEl.textContent = API_BASE_URL.replace('http://', '');
  try {
    const r = await fetch(`${API_BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      if (statusEl) { statusEl.className = 'status-pill ok'; statusEl.innerHTML = '<span class="dot"></span>Online'; }
    } else throw new Error('non-ok');
  } catch {
    if (statusEl) { statusEl.className = 'status-pill err'; statusEl.innerHTML = '<span class="dot"></span>Offline'; }
  }
}

// Drag is handled entirely by the parent page (content_script.js)
// via a transparent overlay div — zero postMessage lag.

// ── Minimize — tells PARENT to resize iframe container ────
function setupMinimize() {
  const btn = document.getElementById('minimize-btn');

  btn.addEventListener('click', () => {
    minimized = !minimized;

    // Tell parent (content_script) to resize the iframe
    window.parent.postMessage({
      type:   'LEETAI_RESIZE',
      height: minimized ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT,
    }, '*');

    // Flip icon
    if (minimized) {
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>`;
      btn.title = 'Restore';
    } else {
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
      btn.title = 'Minimize';
    }
  });
}

// ── Tabs ──────────────────────────────────────────────────
function setupTabs() {
  const tabs   = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.panel).classList.add('active');
    });
  });
}

// ── AI Buttons ────────────────────────────────────────────
function setupButtons() {
  document.getElementById('hint-btn')?.addEventListener('click',     () => callAi('hint'));
  document.getElementById('solution-btn')?.addEventListener('click', () => callAi('solution'));
}

async function callAi(endpoint) {
  if (!authToken) { showAuthGate(); return; }
  setResponseLoading();

  const body = {
    problemDescription: problemTitle || 'LeetCode problem',
    userCode:           userCode || '',
    language:           langSelect?.value || 'Python',
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(30_000),
    });
    const data = await res.json();
    if (!res.ok) { setResponseError(data.error || `Error ${res.status}`); return; }
    setResponseSuccess(data.hint || data.solution || JSON.stringify(data, null, 2));
  } catch (e) {
    setResponseError('Network error: ' + e.message);
  }
}

// ── Response helpers ──────────────────────────────────────
function setResponseLoading() {
  responseBox.className = 'loading';
  responseBox.innerHTML = '<div class="thinking"><span></span><span></span><span></span></div>';
}
function setResponseError(msg)   { responseBox.className = 'error';   responseBox.textContent = '⚠ ' + msg; }
function setResponseSuccess(txt) { responseBox.className = 'success'; responseBox.textContent = txt; }

// ── Util ──────────────────────────────────────────────────
function tryParse(str) { try { return JSON.parse(str); } catch { return null; } }
