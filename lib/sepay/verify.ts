import { createHmac, timingSafeEqual } from 'crypto';

/** Verify SePay bank webhook HMAC-SHA256 (X-SePay-Signature + X-SePay-Timestamp). */
export function verifySePayWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  nowSec?: number;
  maxSkewSec?: number;
}): { ok: true } | { ok: false; reason: string } {
  const secret = input.secret;
  if (!secret) return { ok: false, reason: 'SECRET_MISSING' };

  const signature = input.signatureHeader || '';
  const timestamp = Number(input.timestampHeader || 0);
  const now = input.nowSec ?? Math.floor(Date.now() / 1000);
  const maxSkew = input.maxSkewSec ?? 300;

  if (!timestamp || Math.abs(now - timestamp) > maxSkew) {
    return { ok: false, reason: 'TIMESTAMP_EXPIRED' };
  }

  const expected =
    'sha256=' +
    createHmac('sha256', secret)
      .update(`${timestamp}.${input.rawBody}`)
      .digest('hex');

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'INVALID_SIGNATURE' };
    }
  } catch {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }

  return { ok: true };
}

/** Verify SePay Payment Gateway IPN via X-Secret-Key header. */
export function verifySePayIpnSecret(input: {
  headerSecret: string | null;
  expectedSecret: string;
}): boolean {
  if (!input.expectedSecret) return false;
  const a = Buffer.from(input.headerSecret || '');
  const b = Buffer.from(input.expectedSecret);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
