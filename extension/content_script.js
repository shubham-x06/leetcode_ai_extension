// Content script to inject widget on LeetCode problem pages
function injectWidget() {
  if (document.querySelector('.leetcode-ai-widget')) return;

  const widget = document.createElement('div');
  widget.className = 'leetcode-ai-widget';
  widget.innerHTML = `
    <iframe src="${chrome.runtime.getURL('widget.html')}" style="border: none; width: 300px; height: 400px;"></iframe>
  `;
  widget.style.position = 'fixed';
  widget.style.top = '100px';
  widget.style.right = '20px';
  widget.style.zIndex = '10000';

  document.body.appendChild(widget);
}

injectWidget();