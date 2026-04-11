import axios from 'axios';
import { env } from '../config/env';

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Verifies a Google ID token (JWT) via tokeninfo.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo> {
  const { data } = await axios.get<{
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    aud?: string;
    error?: string;
  }>('https://oauth2.googleapis.com/tokeninfo', {
    params: { id_token: idToken },
    timeout: 15000,
  });

  if (data.error || !data.sub || !data.email) {
    throw new Error('Invalid Google ID token');
  }
  if (env.googleClientId && data.aud && data.aud !== env.googleClientId) {
    throw new Error('Token audience mismatch');
  }

  return {
    sub: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

/**
 * Verifies a Chrome `chrome.identity.getAuthToken` access token.
 */
export async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleUserInfo> {
  if (env.googleClientId) {
    const { data: meta } = await axios.get<{ aud?: string; error?: string }>(
      'https://oauth2.googleapis.com/tokeninfo',
      { params: { access_token: accessToken }, timeout: 15000 }
    );
    if (meta.error || !meta.aud || meta.aud !== env.googleClientId) {
      throw new Error('Invalid or wrong-audience Google token');
    }
  }

  const { data } = await axios.get<{
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  }>('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });

  if (!data?.sub || !data?.email) {
    throw new Error('Invalid Google token response');
  }

  return {
    sub: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}
