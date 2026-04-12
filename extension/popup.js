const DASHBOARD_URL = 'http://localhost:5173';

const statusDot  = document.getElementById('status-dot');
const statusName = document.getElementById('status-name');
const statusSub  = document.getElementById('status-sub');
const logoutBtn  = document.getElementById('logout-btn');

// --- Load auth state ---
chrome.storage.local.get(['authToken', 'authUser'], (result) => {
  const token = result.authToken || null;
  const user  = result.authUser  ? tryParse(result.authUser) : null;

  if (token && user) {
    statusDot.className  = 'status-dot logged-in';
    statusName.textContent = user.name || user.email || 'Logged in';
    statusSub.textContent  = user.email || 'Session active';
    logoutBtn.classList.remove('hidden');
  } else {
    statusDot.className  = 'status-dot logged-out';
    statusName.textContent = 'Not logged in';
    statusSub.textContent  = 'Open dashboard to sign in';
    logoutBtn.classList.add('hidden');
  }
});

// --- Open dashboard ---
document.getElementById('open-dashboard-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: DASHBOARD_URL });
  window.close();
});

// --- Logout ---
logoutBtn.addEventListener('click', () => {
  chrome.storage.local.remove(['authToken', 'authUser'], () => {
    window.close();
  });
});

function tryParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}
