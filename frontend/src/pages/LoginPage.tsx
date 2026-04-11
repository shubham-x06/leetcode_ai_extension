import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { loginWithGoogle } from '../api/auth';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await loginWithGoogle(response.credential);
      login(data.token, data.user);
      if (data.needsLeetCodeLink) {
        navigate('/onboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError('Google Login failed.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-3xl shadow-lg shadow-blue-500/30">
          🤖
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">LeetCode AI Mentor</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
          Sign in to analyze your code, get problem recommendations, and track your daily streaks.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="w-full flex justify-center py-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
            />
          </div>
        )}

      </div>
    </div>
  );
}
