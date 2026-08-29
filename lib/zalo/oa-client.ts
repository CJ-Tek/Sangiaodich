import { loadZaloTokens, saveZaloTokens } from '@/lib/zalo/token-store';

const REFRESH_BUFFER_MS = 5 * 60 * 1000;
const TOKEN_URL = 'https://oauth.zaloapp.com/v4/oa/access_token';
const SEND_TEMPLATE_URL = 'https://business.openapi.zalo.me/message/template';

type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number | string;
  error?: number;
  message?: string;
};

type ZaloApiResponse = {
  error?: number;
  message?: string;
};

export function isZaloOtpConfigured(): boolean {
  return Boolean(
    process.env.ZALO_APP_ID?.trim() &&
      process.env.ZALO_APP_SECRET?.trim() &&
      process.env.ZALO_OA_REFRESH_TOKEN?.trim() &&
      process.env.ZALO_OTP_TEMPLATE_ID?.trim()
  );
}

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
}> {
  const appId = process.env.ZALO_APP_ID?.trim();
  const appSecret = process.env.ZALO_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    throw new Error('ZALO_APP_ID or ZALO_APP_SECRET is missing');
  }

  const body = new URLSearchParams({
    app_id: appId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      secret_key: appSecret,
    },
    body,
  });

  const json = (await res.json()) as RefreshResponse;
  if (!res.ok || !json.access_token || !json.refresh_token) {
    throw new Error(
      json.message || `Zalo token refresh failed (${res.status})`
    );
  }

  const expiresInSec = Number(json.expires_in || 86_400);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  };
}

export async function getZaloOaAccessToken(): Promise<string> {
  const current = await loadZaloTokens();
  if (!current?.refreshToken) {
    throw new Error('ZALO_OA_REFRESH_TOKEN is missing');
  }

  const stillFresh =
    current.accessToken &&
    current.expiresAtMs - Date.now() > REFRESH_BUFFER_MS;

  if (stillFresh) return current.accessToken;

  const refreshed = await refreshAccessToken(current.refreshToken);
  await saveZaloTokens(refreshed);
  return refreshed.accessToken;
}

export async function sendZaloOtpTemplate(input: {
  phone: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const templateId = process.env.ZALO_OTP_TEMPLATE_ID?.trim();
  const templateParam = process.env.ZALO_OTP_TEMPLATE_PARAM?.trim() || 'otp';
  if (!templateId) {
    return { ok: false, message: 'ZALO_OTP_TEMPLATE_ID is missing' };
  }

  try {
    const accessToken = await getZaloOaAccessToken();
    const res = await fetch(SEND_TEMPLATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: accessToken,
      },
      body: JSON.stringify({
        phone: input.phone,
        template_id: templateId,
        template_data: {
          [templateParam]: input.code,
        },
      }),
    });

    const json = (await res.json()) as ZaloApiResponse;
    if (!res.ok || (json.error != null && json.error !== 0)) {
      return {
        ok: false,
        message: json.message || `Zalo send failed (${res.status})`,
      };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Zalo send failed',
    };
  }
}
