import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/auth/otp';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { fail, ok } from '@/lib/types';

/** Email or phone + password. Phone lookup works for every role. */
export async function POST(request: Request) {
  const body = await request.json();
  const password = String(body.password || '');
  const identifier = String(
    body.identifier || body.email || body.phone || ''
  ).trim();

  if (!password) {
    return NextResponse.json(fail('INVALID', 'Mật khẩu bắt buộc'), {
      status: 400,
    });
  }
  if (!identifier) {
    return NextResponse.json(
      fail('INVALID', 'Email hoặc số điện thoại bắt buộc'),
      { status: 400 }
    );
  }

  let email = identifier.toLowerCase();

  if (!identifier.includes('@')) {
    const phone = normalizePhone(identifier);
    if (!phone) {
      return NextResponse.json(fail('INVALID', 'Số điện thoại không hợp lệ'), {
        status: 400,
      });
    }

    const lookup = createServiceClient();
    const { data: byPhone } = await lookup
      .from('profiles')
      .select('email')
      .eq('phone', phone)
      .maybeSingle();

    if (!byPhone?.email) {
      return NextResponse.json(
        fail('AUTH_FAILED', 'SĐT hoặc mật khẩu không đúng'),
        { status: 401 }
      );
    }
    email = String(byPhone.email).trim().toLowerCase();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      fail('AUTH_FAILED', error.message || 'Invalid login credentials'),
      { status: 401 }
    );
  }

  // Use service client: cookie session is set for the browser, but the SSR
  // anon client may not attach the new JWT to the following PostgREST call.
  const admin = createServiceClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', data.user.id)
    .maybeSingle();

  return NextResponse.json(
    ok({ userId: data.user.id, role: profile?.role, name: profile?.full_name })
  );
}
