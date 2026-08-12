import { isProductionRuntime } from '@/lib/security/secrets';

type RateLimitResult = { success: boolean; remaining: number };

const memory = new Map<string, { count: number; resetAt: number }>();

async function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  const { kv } = await import('@vercel/kv');
  return kv;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const kv = await getKv();
  if (!kv) {
    // Production must use shared KV — in-memory limits are bypassable across instances.
    if (isProductionRuntime()) {
      console.error('[rate-limit] KV not configured; rejecting request (fail closed)');
      return { success: false, remaining: 0 };
    }
    return memoryRateLimit(key, limit, windowSeconds);
  }

  const redisKey = `rl:${key}`;
  const count = await kv.incr(redisKey);
  if (count === 1) {
    await kv.expire(redisKey, windowSeconds);
  }
  return { success: count <= limit, remaining: Math.max(0, limit - count) };
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const row = memory.get(key);
  if (!row || row.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1 };
  }
  row.count += 1;
  return { success: row.count <= limit, remaining: Math.max(0, limit - row.count) };
}
