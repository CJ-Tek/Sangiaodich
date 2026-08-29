import { NextResponse } from 'next/server';
import { normalizePhone, verifyOtp } from '@/lib/auth/otp';
import { createPendingSubscription } from '@/lib/engines/subscription-access';
import { getDefaultPlanAmount } from '@/lib/engines/subscription-payment';
import { getApiErrorTranslator } from '@/lib/i18n/api-errors';
import { rateLimit } from '@/lib/kv/rate-limit';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { fail, ok, type UserRole } from '@/lib/types';

const REGISTER_ROLES = new Set<UserRole>(['OWNER', 'SALE']);

export async function POST(request: Request) {
  const t = await getApiErrorTranslator();
  const body = await request.json();
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  const password = String(body.password || '');
  const fullName = String(body.fullName || '').trim();
  const phone = normalizePhone(String(body.phone || ''));
  const otpCode = String(body.otpCode || body.code || '').trim();
  const role = String(body.role || '') as UserRole;

  if (!REGISTER_ROLES.has(role)) {
    return NextResponse.json(
      fail('INVALID', t('INVALID.ownerSaleRegisterOnly')),
      { status: 400 }
    );
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json(fail('INVALID', t('INVALID.invalidEmail')), {
      status: 400,
    });
  }
  if (password.length < 8) {
    return NextResponse.json(
      fail('INVALID', t('INVALID.passwordMinLength')),
      { status: 400 }
    );
  }
  if (!fullName) {
    return NextResponse.json(fail('INVALID', t('INVALID.fullNameRequired')), {
      status: 400,
    });
  }
  if (!phone) {
    return NextResponse.json(fail('INVALID', t('INVALID.invalidPhone')), {
      status: 400,
    });
  }
  if (!otpCode) {
    return NextResponse.json(
      fail('INVALID', t('INVALID.otpRequired')),
      { status: 400 }
    );
  }
  if (body.acceptedTerms !== true) {
    return NextResponse.json(
      fail('INVALID', t('INVALID.termsRequired')),
      { status: 400 }
    );
  }

  const rl = await rateLimit(`register:${email}`, 5, 60 * 60);
  if (!rl.success) {
    return NextResponse.json(fail('RATE_LIMIT', t('RATE_LIMIT.register')), {
      status: 429,
    });
  }

  const otpRl = await rateLimit(`otp:verify:${phone}`, 10, 60 * 15);
  if (!otpRl.success) {
    return NextResponse.json(fail('RATE_LIMIT', t('RATE_LIMIT.otpAttempts')), {
      status: 429,
    });
  }

  const verified = await verifyOtp(phone, otpCode);
  if (!verified.ok) {
    return NextResponse.json(fail('OTP_INVALID', t('OTP_INVALID')), {
      status: 401,
    });
  }

  const admin = createServiceClient();

  const { data: byEmail } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (byEmail) {
    return NextResponse.json(
      fail('CONFLICT', t('CONFLICT.emailExists')),
      { status: 409 }
    );
  }

  const { data: byPhone } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();
  if (byPhone) {
    return NextResponse.json(
      fail('CONFLICT', t('CONFLICT.phoneExists')),
      { status: 409 }
    );
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    phone,
    phone_confirm: true,
    email_confirm: true,
    // Role only via app_metadata (service-role writable). user_metadata is user-editable.
    app_metadata: { role },
    user_metadata: { full_name: fullName, phone },
  });

  if (error || !created.user) {
    return NextResponse.json(
      fail(
        'USER_CREATE_FAILED',
        error?.message || t('USER_CREATE_FAILED')
      ),
      { status: 500 }
    );
  }

  const userId = created.user.id;

  // GoTrue often applies app_metadata via UPDATE after INSERT; the insert
  // trigger may have created profiles.role=GUEST. Sync from auth metadata.
  const { error: roleSyncError } = await admin.rpc(
    'sync_profile_role_from_auth',
    { p_user_id: userId }
  );
  if (roleSyncError) {
    return NextResponse.json(
      fail('ROLE_SYNC_FAILED', roleSyncError.message || t('ROLE_SYNC_FAILED')),
      { status: 500 }
    );
  }

  // Consume OTP so it cannot be reused
  await admin.from('dev_otp_codes').delete().eq('phone', phone);

  await admin
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
      email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  const amount = await getDefaultPlanAmount(role === 'OWNER' ? 'OWNER' : 'SALE');

  try {
    await createPendingSubscription({ profileId: userId, amount });
  } catch (e) {
    return NextResponse.json(
      fail(
        'SUB_CREATE_FAILED',
        e instanceof Error ? e.message : t('SUB_CREATE_FAILED')
      ),
      { status: 500 }
    );
  }

  if (role === 'SALE') {
    await admin.from('sale_membership_states').upsert({
      sale_id: userId,
      current_tier_id: null,
      lifetime_cost_volume: 0,
    });
  }

  const supabase = await createClient();
  const { error: signError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signError) {
    return NextResponse.json(
      ok({
        userId,
        role,
        name: fullName,
        signedIn: false,
        message:
          'Tài khoản đã tạo. Đăng nhập bằng email/password. Chờ Admin mark paid để mở chức năng.',
      })
    );
  }

  return NextResponse.json(
    ok({
      userId,
      role,
      name: fullName,
      signedIn: true,
      message:
        'Đăng ký thành công. Liên hệ Admin thanh toán phí tháng để kích hoạt.',
    })
  );
}
