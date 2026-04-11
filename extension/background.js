chrome.runtime.onInstalled.addListener(() => {
  console.log('LeetCode AI Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken || null });
    });
    return true; // Indicates async response
  }
  
  if (message.type === 'LOGOUT') {
    chrome.storage.local.remove('authToken', () => {
      sendResponse({ success: true });
    });
    return true;
  }
});