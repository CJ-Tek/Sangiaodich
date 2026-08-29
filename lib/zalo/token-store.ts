type ZaloTokenRow = {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
};

const memoryStore: { row: ZaloTokenRow | null } = { row: null };

const KV_ACCESS = 'zalo:oa_access_token';
const KV_REFRESH = 'zalo:oa_refresh_token';
const KV_EXPIRES = 'zalo:oa_expires_at_ms';

async function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  const { kv } = await import('@vercel/kv');
  return kv;
}

function seedFromEnv(): ZaloTokenRow | null {
  const refreshToken = process.env.ZALO_OA_REFRESH_TOKEN?.trim();
  const accessToken = process.env.ZALO_OA_ACCESS_TOKEN?.trim();
  if (!refreshToken) return null;

  const expiresInSec = Number(process.env.ZALO_OA_ACCESS_TOKEN_EXPIRES_IN || 0);
  const expiresAtMs =
    accessToken && expiresInSec > 0
      ? Date.now() + expiresInSec * 1000
      : Date.now() + 23 * 60 * 60 * 1000;

  return {
    accessToken: accessToken || '',
    refreshToken,
    expiresAtMs,
  };
}

export async function loadZaloTokens(): Promise<ZaloTokenRow | null> {
  const kv = await getKv();
  if (kv) {
    const [accessToken, refreshToken, expiresAtMs] = await Promise.all([
      kv.get<string>(KV_ACCESS),
      kv.get<string>(KV_REFRESH),
      kv.get<number>(KV_EXPIRES),
    ]);
    if (refreshToken) {
      return {
        accessToken: accessToken || '',
        refreshToken,
        expiresAtMs: expiresAtMs || 0,
      };
    }
  }

  if (memoryStore.row) return memoryStore.row;
  return seedFromEnv();
}

export async function saveZaloTokens(row: ZaloTokenRow): Promise<void> {
  memoryStore.row = row;
  const kv = await getKv();
  if (!kv) {
    if (row.refreshToken !== process.env.ZALO_OA_REFRESH_TOKEN?.trim()) {
      console.warn(
        '[zalo] Refresh token rotated but KV is not configured. Update ZALO_OA_REFRESH_TOKEN in your env.'
      );
    }
    return;
  }

  await Promise.all([
    kv.set(KV_ACCESS, row.accessToken),
    kv.set(KV_REFRESH, row.refreshToken),
    kv.set(KV_EXPIRES, row.expiresAtMs),
  ]);
}
