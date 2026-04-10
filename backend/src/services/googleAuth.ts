import axios from 'axios';
import { env } from '../config/env';

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Verifies a Chrome `chrome.identity.getAuthToken` access token and returns user info.
 * Optionally checks audience when GOOGLE_CLIENT_ID is set (recommended).
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
