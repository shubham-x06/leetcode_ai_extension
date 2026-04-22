import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';
import { useAuthStore } from './store/useAuthStore';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

async function bootstrap() {
  try {
    // Race rehydration against a 3s timeout to prevent infinite loading on Vercel cold starts
    await Promise.race([
      useAuthStore.getState().rehydrate(),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  } catch {
    // Rehydration failed — proceed with empty state
    useAuthStore.setState({ _rehydrated: true });
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}

bootstrap();
