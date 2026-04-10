const url = chrome.runtime.getURL('dashboard/index.html');
chrome.tabs.create({ url });
window.close();
