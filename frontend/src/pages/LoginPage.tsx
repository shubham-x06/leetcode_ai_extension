import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      if ((window as any).chrome && (window as any).chrome.identity) {
        // Extension context
        const token = await new Promise<string>((resolve, reject) => {
          (window as any).chrome.identity.getAuthToken({ interactive: true }, (result: any) => {
            if ((window as any).chrome.runtime.lastError) {
              reject((window as any).chrome.runtime.lastError);
            } else if (result) {
              resolve(result);
            }
          });
        });

        const response = await api.post('/auth/google', { token });
        setToken(response.data.token);
        setUser(response.data.user);
        navigate('/onboard');
      } else {
        // Web context - redirect to Google OAuth
        window.location.href = `https://accounts.google.com/oauth/authorize?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback')}&response_type=code&scope=email profile`;
      }
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to LeetCode AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your Google account to get started
          </p>
        </div>
        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}