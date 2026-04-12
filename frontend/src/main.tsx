import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';
import { useAuthStore } from './store/useAuthStore';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

async function bootstrap() {
  // Rehydrate auth from storage before first render
  // This prevents the flash-to-login on page reload
  await useAuthStore.getState().rehydrate();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}

bootstrap();
