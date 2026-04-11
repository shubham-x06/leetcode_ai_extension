(function() {
  if (document.getElementById('leetcode-ai-extension-widget')) return;

  const container = document.createElement('div');
  container.id = 'leetcode-ai-extension-widget';
  Object.assign(container.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '350px',
    height: '500px',
    border: 'none',
    zIndex: '999999',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    overflow: 'hidden'
  });

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('widget.html');
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
  });

  container.appendChild(iframe);
  document.body.appendChild(container);
})();