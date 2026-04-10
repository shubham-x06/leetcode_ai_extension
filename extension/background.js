chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'GET_GOOGLE_ACCESS_TOKEN') {
    const interactive = message.interactive !== false;
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true, token });
    });
    return true;
  }
  if (message?.type === 'REMOVE_GOOGLE_AUTH_TOKEN') {
    const token = message.token;
    if (token) {
      chrome.identity.removeCachedAuthToken({ token }, () => sendResponse({ ok: true }));
    } else {
      sendResponse({ ok: true });
    }
    return true;
  }
  return false;
});
