import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUser } from '../api/user';

const tabs = [
  { name: 'Home', path: '/', icon: '🏠' },
  { name: 'Problems', path: '/problems', icon: '📝' },
  { name: 'Progress', path: '/progress', icon: '📊' },
  { name: 'Contest', path: '/contest', icon: '🏆' },
  { name: 'AI Mentor', path: '/ai', icon: '🤖' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { data: currentUser } = useUser();

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-indigo-600">LeetCode AI</h1>
        </div>

        {/* User Info */}
        {currentUser && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {currentUser.avatarUrl && (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name || currentUser.email}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {currentUser.name || currentUser.email}
                </p>
                <p className="text-xs text-gray-500 truncate">@{currentUser.leetcodeUsername || 'not set'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === tab.path
                    ? 'bg-indigo-100 text-indigo-700 font-semibold border-l-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}