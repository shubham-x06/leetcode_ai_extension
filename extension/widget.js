const DEFAULT_API = 'http://localhost:3001';
const WEAK_TTL_MS = 30 * 60 * 1000;
const MAX_HINTS = 5;
const RETRIES = 2;
const RETRY_BASE_MS = 800;

/** @type {{ apiBase: string, jwt?: string, weakTopics: string[], weakFetchedAt: number, hintHistory: { t: number, text: string }[] }} */
let state = {
  apiBase: DEFAULT_API,
  jwt: undefined,
  weakTopics: [],
  weakFetchedAt: 0,
  hintHistory: [],
};

function getCurrentLanguage() {
  const languages = [
    'C++',
    'Java',
    'Python',
    'Python3',
    'C',
    'C#',
    'JavaScript',
    'TypeScript',
    'Ruby',
    'Swift',
    'Go',
    'Scala',
    'Kotlin',
    'Rust',
    'PHP',
    'Dart',
    'Racket',
    'Erlang',
    'Elixir',
  ];
  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    const text = button.textContent.trim();
    if (languages.includes(text)) {
      const rect = button.getBoundingClientRect();
      if (rect.top < 400 && rect.top > 0 && button.offsetParent !== null) {
        return text;
      }
    }
  }
  return 'C++';
}

function getCodeFromEditor() {
  const codeLineElements = document.querySelectorAll('.view-lines .view-line');
  if (codeLineElements.length === 0) {
    return 'Error: Could not find any code lines. Is the editor visible?';
  }
  return Array.from(codeLineElements)
    .map((line) => line.textContent)
    .join('\n');
}

function getProblemDescription() {
  const descriptionElement = document.querySelector('div[data-track-load="description_content"]');
  return descriptionElement ? descriptionElement.innerText : 'Error: Could not find problem description.';
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

async function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

async function storageSet(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
}

async function loadState() {
  const s = await storageGet(['apiBaseUrl', 'jwt', 'weakTopics', 'weakTopicsFetchedAt', 'hintHistory']);
  state.apiBase = (s.apiBaseUrl && String(s.apiBaseUrl).trim()) || DEFAULT_API;
  state.jwt = s.jwt || undefined;
  state.weakTopics = Array.isArray(s.weakTopics) ? s.weakTopics : [];
  state.weakFetchedAt = typeof s.weakTopicsFetchedAt === 'number' ? s.weakTopicsFetchedAt : 0;
  state.hintHistory = Array.isArray(s.hintHistory) ? s.hintHistory.slice(-MAX_HINTS) : [];
}

async function refreshWeakTopicsIfNeeded() {
  if (!state.jwt) return;
  const now = Date.now();
  if (now - state.weakFetchedAt < WEAK_TTL_MS && state.weakTopics.length) return;
  try {
    const res = await fetch(`${state.apiBase}/api/user/me/context`, {
      headers: { Authorization: `Bearer ${state.jwt}` },
    });
    if (res.status === 401) {
      await storageSet({ jwt: null });
      state.jwt = undefined;
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    state.weakTopics = Array.isArray(data.weakTopics) ? data.weakTopics : [];
    state.weakFetchedAt = now;
    await storageSet({ weakTopics: state.weakTopics, weakTopicsFetchedAt: now });
  } catch {
    /* ignore */
  }
}

async function fetchWithRetry(url, options, attempt = 0) {
  try {
    return await fetch(url, options);
  } catch {
    if (attempt >= RETRIES) throw new Error('network');
    await new Promise((r) => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)));
    return fetchWithRetry(url, options, attempt + 1);
  }
}

function setStatus(el, text) {
  if (el) el.textContent = text || '';
}

function renderHintHistory(listEl, countEl) {
  if (!listEl) return;
  listEl.innerHTML = '';
  const hints = state.hintHistory.slice(-MAX_HINTS).reverse();
  if (countEl) countEl.textContent = `(${hints.length})`;
  hints.forEach((h) => {
    const li = document.createElement('li');
    li.textContent = h.text.slice(0, 200) + (h.text.length > 200 ? '…' : '');
    listEl.appendChild(li);
  });
}

async function pushHint(text) {
  state.hintHistory.push({ t: Date.now(), text });
  state.hintHistory = state.hintHistory.slice(-MAX_HINTS);
  await storageSet({ hintHistory: state.hintHistory });
}

/**
 * @param {HTMLElement} widgetContainer
 */
export function bootWidget(widgetContainer) {
  const chatHistoryDiv = widgetContainer.querySelector('#ai-chat-history');
  const toggleBtn = widgetContainer.querySelector('#toggle-widget-body');
  const widgetBody = widgetContainer.querySelector('.ai-widget-body');
  const offlineBanner = widgetContainer.querySelector('#offline-banner');
  const authBanner = widgetContainer.querySelector('#auth-banner');
  const getHintBtn = widgetContainer.querySelector('#get-hint-btn');
  const getSolutionBtn = widgetContainer.querySelector('#get-solution-btn');
  const analyzeBtn = widgetContainer.querySelector('#analyze-code-btn');
  const statusEl = widgetContainer.querySelector('#widget-status');
  const hintList = widgetContainer.querySelector('#hint-history-list');
  const hintCount = widgetContainer.querySelector('#hint-count');

  function setAiDisabled(disabled) {
    [getHintBtn, getSolutionBtn, analyzeBtn].forEach((b) => {
      if (b) b.disabled = disabled;
    });
  }

  function updateOnlineUi() {
    const online = navigator.onLine;
    if (offlineBanner) {
      offlineBanner.classList.toggle('lc-ai-banner--hidden', online);
    }
    setAiDisabled(!online);
    if (authBanner) {
      authBanner.classList.toggle('lc-ai-banner--hidden', !!state.jwt);
    }
  }

  window.addEventListener('online', updateOnlineUi);
  window.addEventListener('offline', updateOnlineUi);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.jwt || changes.apiBaseUrl) {
      loadState().then(() => {
        updateOnlineUi();
        renderHintHistory(hintList, hintCount);
      });
    }
  });

  loadState().then(() => {
    updateOnlineUi();
    renderHintHistory(hintList, hintCount);
    refreshWeakTopicsIfNeeded();
  });

  if (toggleBtn && widgetBody) {
    toggleBtn.addEventListener('click', () => {
      const hidden = widgetBody.style.display === 'none';
      widgetBody.style.display = hidden ? 'block' : 'none';
      toggleBtn.textContent = hidden ? '−' : '+';
    });
  }

  const header = widgetContainer.querySelector('.ai-widget-header');
  let isDragging = false;
  let initialX = 0;
  let initialY = 0;
  if (header) {
    header.addEventListener('mousedown', (e) => {
      if (e.target === toggleBtn) return;
      isDragging = true;
      initialX = e.clientX - widgetContainer.offsetLeft;
      initialY = e.clientY - widgetContainer.offsetTop;
    });
  }
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    widgetContainer.style.left = `${e.clientX - initialX}px`;
    widgetContainer.style.top = `${e.clientY - initialY}px`;
    widgetContainer.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  async function runAi(path, body, loadingText, onOk) {
    if (!state.jwt) {
      if (chatHistoryDiv) {
        chatHistoryDiv.innerHTML =
          '<div class="hint-message" style="color:#fb4934">Sign in from the dashboard (extension icon) to use AI. JWT is required.</div>';
      }
      return;
    }
    if (!navigator.onLine) {
      if (chatHistoryDiv) {
        chatHistoryDiv.innerHTML =
          '<div class="hint-message" style="color:#fb4934">You are offline. Connect to use AI.</div>';
      }
      return;
    }
    await loadState();
    await refreshWeakTopicsIfNeeded();
    if (chatHistoryDiv) {
      chatHistoryDiv.innerHTML = `<div class="hint-message">${loadingText}</div>`;
    }
    setStatus(statusEl, '');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${state.jwt}` };
    try {
      const res = await fetchWithRetry(`${state.apiBase}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...body,
          weakTopics: state.weakTopics.length ? state.weakTopics : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (
        res.status === 429 ||
        data.code === 'AI_RATE_LIMIT' ||
        data.code === 'AI_RATE_LIMIT_WINDOW'
      ) {
        if (chatHistoryDiv) {
          chatHistoryDiv.innerHTML =
            '<div class="hint-message" style="color:#fabd2f">AI is busy or rate limited — try again in a few seconds.</div>';
        }
        return;
      }
      if (!res.ok) {
        if (chatHistoryDiv) {
          chatHistoryDiv.innerHTML = `<div class="hint-message" style="color:#fb4934">${data.error || data.message || 'Request failed'}</div>`;
        }
        return;
      }
      onOk(data);
    } catch {
      if (chatHistoryDiv) {
        chatHistoryDiv.innerHTML = `<div class="hint-message" style="color:#fb4934">Could not reach API at ${state.apiBase}. Is the backend running?</div>`;
      }
    }
  }

  if (getHintBtn) {
    getHintBtn.addEventListener('click', () => {
      const problemDescription = getProblemDescription();
      const userCode = getCodeFromEditor();
      const language = getCurrentLanguage();
      runAi(
        '/api/ai/hint',
        { problemDescription, userCode, language },
        'Getting hint…',
        async (data) => {
          const hint = data.hint || '';
          if (chatHistoryDiv) {
            chatHistoryDiv.innerHTML = `<div class="hint-message"><strong>Hint:</strong><br>${hint.replace(/</g, '&lt;')}</div>`;
          }
          if (hint) {
            await pushHint(hint);
            renderHintHistory(hintList, hintCount);
          }
        }
      );
    });
  }

  if (getSolutionBtn) {
    getSolutionBtn.addEventListener('click', () => {
      const problemDescription = getProblemDescription();
      const userCode = getCodeFromEditor();
      const language = getCurrentLanguage();
      runAi(
        '/api/ai/solution',
        { problemDescription, userCode, language },
        'Generating solution…',
        (data) => {
          const solution = data.solution || '';
          if (!chatHistoryDiv) return;
          const safe = solution.replace(/</g, '&lt;').replace(/\n/g, '<br>');
          chatHistoryDiv.innerHTML = `
              <div class="hint-message">
                <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
                  <strong>Solution (${language})</strong>
                  <button type="button" id="copy-solution-btn" style="background:#b8bb26;color:#282828;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:bold;">Copy</button>
                </div>
                <div>${safe}</div>
              </div>`;
          const copyBtn = chatHistoryDiv.querySelector('#copy-solution-btn');
          if (copyBtn) {
            copyBtn.addEventListener('click', () => {
              copyToClipboard(solution);
              copyBtn.textContent = 'Copied';
              setTimeout(() => {
                copyBtn.textContent = 'Copy';
              }, 2000);
            });
          }
        }
      );
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      const problemDescription = getProblemDescription();
      const userCode = getCodeFromEditor();
      const language = getCurrentLanguage();
      runAi(
        '/api/ai/analyze-code',
        { problemDescription, userCode, language },
        'Analyzing code…',
        (data) => {
          const analysis = data.analysis || '';
          if (chatHistoryDiv) {
            chatHistoryDiv.innerHTML = `<div class="hint-message"><strong>Analysis</strong><pre style="white-space:pre-wrap;margin-top:8px;">${analysis.replace(/</g, '&lt;')}</pre></div>`;
          }
        }
      );
    });
  }
}
