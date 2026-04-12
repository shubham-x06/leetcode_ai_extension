(function () {
  'use strict';

  const WIDGET_ID       = 'leetcode-ai-extension-widget';
  const EXPANDED_HEIGHT = 520;
  const EXPANDED_WIDTH  = 360;
  const HEADER_HEIGHT   = 52;

  function injectWidget() {
    if (document.getElementById(WIDGET_ID)) return;
    if (!location.pathname.includes('/problems/')) return;

    // ── Container ─────────────────────────────────────────
    const container = document.createElement('div');
    container.id = WIDGET_ID;
    Object.assign(container.style, {
      position:      'fixed',
      bottom:        '20px',
      right:         '20px',
      width:         EXPANDED_WIDTH + 'px',
      height:        EXPANDED_HEIGHT + 'px',
      zIndex:        '2147483647',
      borderRadius:  '14px',
      overflow:      'hidden',
      pointerEvents: 'all',
      willChange:    'transform',
    });

    // ── iframe ────────────────────────────────────────────
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('widget.html');
    Object.assign(iframe.style, {
      width: '100%', height: '100%', border: 'none', display: 'block',
    });
    container.appendChild(iframe);

    // ── Drag handle overlay (sits on top of the header) ───
    // This lives in the PARENT page so there's zero cross-frame lag.
    const dragHandle = document.createElement('div');
    Object.assign(dragHandle.style, {
      position:  'absolute',
      top:       '0',
      left:      '0',
      right:     '0',
      height:    HEADER_HEIGHT + 'px',
      zIndex:    '1',          // above iframe, below nothing else
      cursor:    'grab',
      userSelect:'none',
    });
    container.appendChild(dragHandle);

    document.body.appendChild(container);

    // ── Drag logic — 100% in parent, GPU-accelerated ──────
    let dragging  = false;
    let startX    = 0, startY = 0;
    let originLeft= 0, originTop = 0;
    let rafId     = null;
    let pendingDx = 0, pendingDy = 0;

    function getContainerOrigin() {
      const rect = container.getBoundingClientRect();
      return { left: rect.left, top: rect.top };
    }

    function commitPosition(left, top) {
      // Clamp within viewport
      const maxLeft = window.innerWidth  - container.offsetWidth;
      const maxTop  = window.innerHeight - container.offsetHeight;
      left = Math.max(0, Math.min(left, maxLeft));
      top  = Math.max(0, Math.min(top,  maxTop));

      container.style.right  = 'auto';
      container.style.bottom = 'auto';
      container.style.left   = left + 'px';
      container.style.top    = top  + 'px';
    }

    dragHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      dragHandle.style.cursor = 'grabbing';

      const origin = getContainerOrigin();
      originLeft = origin.left;
      originTop  = origin.top;
      startX     = e.clientX;
      startY     = e.clientY;
      pendingDx  = 0;
      pendingDy  = 0;
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      pendingDx = e.clientX - startX;
      pendingDy = e.clientY - startY;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (!dragging) return;
          const newLeft = originLeft + pendingDx;
          const newTop  = originTop  + pendingDy;
          const maxLeft = window.innerWidth  - container.offsetWidth;
          const maxTop  = window.innerHeight - container.offsetHeight;
          const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
          const clampedTop  = Math.max(0, Math.min(newTop,  maxTop));
          // Use transform during drag — no layout reflow, GPU composited
          container.style.right  = 'auto';
          container.style.bottom = 'auto';
          container.style.left   = originLeft + 'px';
          container.style.top    = originTop  + 'px';
          container.style.transform = `translate3d(${clampedLeft - originLeft}px, ${clampedTop - originTop}px, 0)`;
        });
      }
    }, { passive: true });

    document.addEventListener('mouseup', (e) => {
      if (!dragging) return;
      dragging = false;
      dragHandle.style.cursor = 'grab';
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

      // Commit final real position and clear transform
      const newLeft = originLeft + pendingDx;
      const newTop  = originTop  + pendingDy;
      container.style.transform = '';
      commitPosition(newLeft, newTop);
    });

    // ── Resize messages from widget iframe ────────────────
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'LEETAI_RESIZE') {
        container.style.transition = 'height 0.22s cubic-bezier(0.4,0,0.2,1)';
        container.style.height = msg.height + 'px';
        setTimeout(() => { container.style.transition = ''; }, 250);
      }
    });
  }

  // Initial inject
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }

  // Re-inject on LeetCode SPA navigation
  let lastPath = location.pathname;
  const observer = new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      const existing = document.getElementById(WIDGET_ID);
      if (existing) existing.remove();
      setTimeout(injectWidget, 600);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();