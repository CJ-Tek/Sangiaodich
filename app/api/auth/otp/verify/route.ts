import { NextResponse } from 'next/server';
import { verifyMockOtp, normalizePhone } from '@/lib/auth/otp';
import { rateLimit } from '@/lib/kv/rate-limit';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { fail, ok } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json();
  const phone = normalizePhone(String(body.phone || ''));
  const code = String(body.code || '');
  const intent = String(body.intent || 'login'); // login | register
  const fullName =
    String(body.fullName || '').trim() ||
    (intent === 'register' ? '' : 'Guest');
  const password = String(body.password || '');

  if (!phone) {
    return NextResponse.json(fail('INVALID_PHONE', 'Số điện thoại không hợp lệ'), {
      status: 400,
    });
  }

  if (intent === 'register' && !fullName) {
    return NextResponse.json(fail('INVALID', 'Họ tên bắt buộc'), {
      status: 400,
    });
  }

  if (intent === 'register' && password.length < 8) {
    return NextResponse.json(
      fail('INVALID', 'Mật khẩu tối thiểu 8 ký tự'),
      { status: 400 }
    );
  }

  if (intent === 'register' && body.acceptedTerms !== true) {
    return NextResponse.json(
      fail('INVALID', 'Vui lòng đồng ý điều khoản sử dụng'),
      { status: 400 }
    );
  }

  const rl = await rateLimit(`otp:verify:${phone}`, 10, 60 * 15);
  if (!rl.success) {
    return NextResponse.json(fail('RATE_LIMIT', 'Too many verify attempts'), {
      status: 429,
    });
  }

  const verified = await verifyMockOtp(phone, code);
  if (!verified.ok) {
    return NextResponse.json(fail('OTP_INVALID', verified.message), {
      status: 401,
    });
  }

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from('profiles')
    .select('id, email, role')
    .eq('phone', phone)
    .maybeSingle();

  if (existing && intent === 'register') {
    return NextResponse.json(
      fail('CONFLICT', 'SĐT đã có tài khoản. Hãy đăng nhập.'),
      { status: 409 }
    );
  }

  let email = existing?.email as string | undefined;
  let role = existing?.role || 'GUEST';

  if (!existing) {
    // OTP path only creates GUEST (login auto-provision or register-as-guest)
    email = `${phone.replace('+', '')}@phone.vbnb.local`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      phone,
      phone_confirm: true,
      email_confirm: true,
      password: intent === 'register' ? password : crypto.randomUUID(),
      // Role only via app_metadata (service-role writable). user_metadata is user-editable.
      app_metadata: { role: 'GUEST' },
      user_metadata: { full_name: fullName, phone },
    });
    if (error || !created.user) {
      return NextResponse.json(
        fail('USER_CREATE_FAILED', error?.message || 'Cannot create user'),
        { status: 500 }
      );
    }
    role = 'GUEST';
    await admin.from('guest_membership_states').upsert({
      guest_id: created.user.id,
      current_tier_id: null,
    });
    await admin
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', created.user.id);

    if (intent === 'register') {
      await admin.from('dev_otp_codes').delete().eq('phone', phone);
    }
  }

  if (!email) {
    return NextResponse.json(fail('NO_EMAIL', 'User missing email'), {
      status: 500,
    });
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

  if (linkError || !linkData.properties?.hashed_token) {
    return NextResponse.json(
      fail('SESSION_FAILED', linkError?.message || 'Cannot create session'),
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: linkData.properties.hashed_token,
  });

  if (otpError) {
    return NextResponse.json(fail('SESSION_FAILED', otpError.message), {
      status: 500,
    });
  }

  return NextResponse.json(ok({ phone, role }));
}
