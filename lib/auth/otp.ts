import { createServiceClient } from '@/lib/supabase/server';

const MOCK_CODE = process.env.MOCK_OTP_CODE || '000000';

export async function sendMockOtp(phone: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, message: 'Số điện thoại không hợp lệ' };

  const admin = createServiceClient();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await admin.from('dev_otp_codes').upsert({
    phone: normalized,
    code: MOCK_CODE,
    expires_at: expires,
  });

  if (error) return { ok: false, message: error.message };

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[mock-otp] phone=${normalized} code=${MOCK_CODE}`);
  }

  return { ok: true };
}

export async function verifyMockOtp(
  phone: string,
  code: string
): Promise<{ ok: true; phone: string } | { ok: false; message: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, message: 'Số điện thoại không hợp lệ' };
  if (code !== MOCK_CODE) {
    // also accept stored code
    const admin = createServiceClient();
    const { data } = await admin
      .from('dev_otp_codes')
      .select('code, expires_at')
      .eq('phone', normalized)
      .maybeSingle();
    if (!data || data.code !== code || new Date(data.expires_at) < new Date()) {
      return { ok: false, message: 'Mã OTP không đúng hoặc đã hết hạn' };
    }
  }
  return { ok: true, phone: normalized };
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`;
  if (digits.startsWith('84')) return `+${digits}`;
  return `+${digits}`;
}
