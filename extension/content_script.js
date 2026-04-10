(async () => {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'ai-hint-widget-container';
  document.body.appendChild(container);

  try {
    const widgetUrl = chrome.runtime.getURL('widget.html');
    const response = await fetch(widgetUrl);
    if (!response.ok) {
      return;
    }
    container.innerHTML = await response.text();
    const { bootWidget } = await import(chrome.runtime.getURL('widget.js'));
    bootWidget(container);
  } catch {
    /* ignore */
  }
})();
