// Background script for handling OAuth and storage
chrome.runtime.onInstalled.addListener(() => {
  console.log('LeetCode AI Extension installed');
});

// Handle OAuth token
chrome.identity.onSignInChanged.addListener((account, signedIn) => {
  if (signedIn) {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.storage.local.set({ authToken: token });
      }
    });
  } else {
    chrome.storage.local.remove('authToken');
  }
});