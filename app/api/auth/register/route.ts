import { NextResponse } from 'next/server';
import { normalizePhone, verifyMockOtp } from '@/lib/auth/otp';
import { createPendingSubscription } from '@/lib/engines/subscription-access';
import { getDefaultPlanAmount } from '@/lib/engines/subscription-payment';
import { rateLimit } from '@/lib/kv/rate-limit';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { fail, ok, type UserRole } from '@/lib/types';

const REGISTER_ROLES = new Set<UserRole>(['OWNER', 'SALE']);

export async function POST(request: Request) {
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
      fail('INVALID', 'Chỉ đăng ký Owner hoặc Sale tại đây'),
      { status: 400 }
    );
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json(fail('INVALID', 'Email không hợp lệ'), {
      status: 400,
    });
  }
  if (password.length < 8) {
    return NextResponse.json(
      fail('INVALID', 'Mật khẩu tối thiểu 8 ký tự'),
      { status: 400 }
    );
  }
  if (!fullName) {
    return NextResponse.json(fail('INVALID', 'Họ tên bắt buộc'), {
      status: 400,
    });
  }
  if (!phone) {
    return NextResponse.json(fail('INVALID', 'Số điện thoại không hợp lệ'), {
      status: 400,
    });
  }
  if (!otpCode) {
    return NextResponse.json(
      fail('INVALID', 'Vui lòng nhập mã OTP đã gửi tới SĐT'),
      { status: 400 }
    );
  }
  if (body.acceptedTerms !== true) {
    return NextResponse.json(
      fail('INVALID', 'Vui lòng đồng ý điều khoản sử dụng'),
      { status: 400 }
    );
  }

  const rl = await rateLimit(`register:${email}`, 5, 60 * 60);
  if (!rl.success) {
    return NextResponse.json(fail('RATE_LIMIT', 'Too many register attempts'), {
      status: 429,
    });
  }

  const otpRl = await rateLimit(`otp:verify:${phone}`, 10, 60 * 15);
  if (!otpRl.success) {
    return NextResponse.json(fail('RATE_LIMIT', 'Too many OTP attempts'), {
      status: 429,
    });
  }

  const verified = await verifyMockOtp(phone, otpCode);
  if (!verified.ok) {
    return NextResponse.json(fail('OTP_INVALID', verified.message), {
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
      fail('CONFLICT', 'Email đã có tài khoản. Hãy đăng nhập.'),
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
      fail('CONFLICT', 'SĐT đã có tài khoản. Hãy đăng nhập.'),
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
      fail('USER_CREATE_FAILED', error?.message || 'Cannot create user'),
      { status: 500 }
    );
  }

  const userId = created.user.id;

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
        e instanceof Error ? e.message : 'Cannot create subscription'
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
