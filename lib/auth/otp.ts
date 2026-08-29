import { randomInt } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { isZaloOtpConfigured, sendZaloOtpTemplate } from '@/lib/zalo/oa-client';
import { formatPhoneForZalo } from '@/lib/zalo/phone';

const MOCK_CODE = process.env.MOCK_OTP_CODE || '000000';
const OTP_TTL_MS = 10 * 60 * 1000;

function generateOtpCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

function useMockOtpOnly(): boolean {
  return !isZaloOtpConfigured();
}

async function storeOtpCode(
  phone: string,
  code: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createServiceClient();
  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const { error } = await admin.from('dev_otp_codes').upsert({
    phone,
    code,
    expires_at: expires,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function sendOtp(
  phone: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, message: 'Số điện thoại không hợp lệ' };

  if (useMockOtpOnly()) {
    const stored = await storeOtpCode(normalized, MOCK_CODE);
    if (!stored.ok) return stored;
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[mock-otp] phone=${normalized} code=${MOCK_CODE}`);
    }
    return { ok: true };
  }

  const code = generateOtpCode();
  const stored = await storeOtpCode(normalized, code);
  if (!stored.ok) return stored;

  const sent = await sendZaloOtpTemplate({
    phone: formatPhoneForZalo(normalized),
    code,
  });
  if (!sent.ok) {
    return sent;
  }

  return { ok: true };
}

/** @deprecated Use sendOtp */
export const sendMockOtp = sendOtp;

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ ok: true; phone: string } | { ok: false; message: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, message: 'Số điện thoại không hợp lệ' };

  if (useMockOtpOnly() && code === MOCK_CODE) {
    return { ok: true, phone: normalized };
  }

  const admin = createServiceClient();
  const { data } = await admin
    .from('dev_otp_codes')
    .select('code, expires_at')
    .eq('phone', normalized)
    .maybeSingle();

  if (!data || data.code !== code || new Date(data.expires_at) < new Date()) {
    return { ok: false, message: 'Mã OTP không đúng hoặc đã hết hạn' };
  }

  return { ok: true, phone: normalized };
}

/** @deprecated Use verifyOtp */
export const verifyMockOtp = verifyOtp;

/** VN mobile subscriber number (9 digits after trunk 0 / +84). */
const VN_MOBILE = /^[35789]\d{8}$/;

export function normalizePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/[^\d+]/g, '');
  if (!digits) return null;

  if (digits.startsWith('+')) {
    const national = digits.slice(1);
    if (!national.startsWith('84')) return null;
    const mobile = national.slice(2);
    return VN_MOBILE.test(mobile) ? `+84${mobile}` : null;
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('84')) {
    digits = digits.slice(2);
  }

  if (!VN_MOBILE.test(digits)) return null;
  return `+84${digits}`;
}

export function otpDeliveryMode(): 'mock' | 'zalo' {
  return useMockOtpOnly() ? 'mock' : 'zalo';
}
