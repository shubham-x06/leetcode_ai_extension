chrome.runtime.onInstalled.addListener(() => {
  console.log('LeetCode AI Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Widget/popup requesting stored auth token
  if (message.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken || null });
    });
    return true;
  }

  // Widget requesting problem context from the active LeetCode tab
  if (message.type === 'GET_PROBLEM_CONTEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url?.includes('leetcode.com/problems/')) {
        sendResponse({ title: '', difficulty: '', code: '' });
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            // Title
            const titleEl = document.querySelector('[data-cy="question-title"], .mr-2.text-lg, h4.text-label-1');
            const title   = titleEl?.textContent?.trim() || document.title.split(' - ')[0] || '';

            // Difficulty
            const diffEl  = document.querySelector('[diff], .text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard');
            let difficulty = '';
            if (diffEl) {
              const cls = diffEl.className || '';
              if (cls.includes('easy'))   difficulty = 'Easy';
              if (cls.includes('medium')) difficulty = 'Medium';
              if (cls.includes('hard'))   difficulty = 'Hard';
              if (!difficulty) difficulty = diffEl.textContent?.trim();
            }

            // Code from Monaco editor (LeetCode uses it)
            let code = '';
            try {
              const editor = window.monaco?.editor?.getModels?.();
              if (editor && editor.length > 0) {
                code = editor[editor.length - 1].getValue();
              }
            } catch { /* cross-origin or unavailable */ }

            return { title, difficulty, code };
          },
        },
        (results) => {
          if (chrome.runtime.lastError || !results?.[0]?.result) {
            sendResponse({ title: '', difficulty: '', code: '' });
          } else {
            sendResponse(results[0].result);
          }
        }
      );
    });
    return true; // keep channel open for async
  }

  // Logout: clear stored session
  if (message.type === 'LOGOUT') {
    chrome.storage.local.remove(['authToken', 'authUser'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});