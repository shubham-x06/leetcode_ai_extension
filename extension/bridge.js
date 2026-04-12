/**
 * bridge.js — runs on localhost:5173 (the LeetAI dashboard)
 *
 * Syncs authToken + authUser from localStorage → chrome.storage.local so the
 * extension widget and popup can read the user's session.
 *
 * This is needed because regular web pages cannot write to chrome.storage
 * directly — only extension scripts can. This content script bridges the gap.
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'authToken';
  const USER_KEY  = 'authUser';

  function syncToExtension() {
    const token   = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);

    chrome.storage.local.set({
      [TOKEN_KEY]: token   || '',
      [USER_KEY]:  userRaw || '',
    });
  }

  // Sync immediately on page load
  syncToExtension();

  // Also sync whenever localStorage changes (login / logout)
  window.addEventListener('storage', (e) => {
    if (e.key === TOKEN_KEY || e.key === USER_KEY) {
      syncToExtension();
    }
  });

  // Fallback: poll every 2 seconds in case same-tab writes don't fire 'storage'
  setInterval(syncToExtension, 2000);
})();
