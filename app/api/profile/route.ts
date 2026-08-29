import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { isIdDocStoragePath } from '@/lib/profile/id-docs';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { fail, ok } from '@/lib/types';

export async function PATCH(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json(fail('UNAUTHORIZED', t('UNAUTHORIZED.loginRequired')), {
      status: 401,
    });
  }

  const body = await request.json();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.fullName !== undefined) {
    const fullName = String(body.fullName || '').trim();
    if (!fullName) {
      return NextResponse.json(fail('INVALID', t('INVALID.fullNameRequired')), {
        status: 400,
      });
    }
    patch.full_name = fullName;
  }

  if (body.email !== undefined) {
    const email = String(body.email || '').trim();
    patch.email = email || null;
  }

  if (body.phone !== undefined) {
    const phone = String(body.phone || '').trim();
    patch.phone = phone || null;
  }

  if (body.avatarUrl !== undefined) {
    const avatarUrl = String(body.avatarUrl || '').trim().split('?')[0];
    patch.avatar_url = avatarUrl || null;
  }

  if (body.nationalId !== undefined) {
    const nationalId = String(body.nationalId || '')
      .trim()
      .replace(/\s+/g, '');
    if (nationalId && !/^\d{9}$|^\d{12}$/.test(nationalId)) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.nationalIdFormat')),
        { status: 400 }
      );
    }
    patch.national_id = nationalId || null;
  }

  if (body.nationalIdFrontUrl !== undefined) {
    const v = String(body.nationalIdFrontUrl || '').trim();
    if (v && !isIdDocStoragePath(v) && !/^https?:\/\//i.test(v)) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.nationalIdFrontInvalid')),
        { status: 400 }
      );
    }
    if (v && /^https?:\/\//i.test(v)) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.nationalIdFrontUploadOnly')),
        { status: 400 }
      );
    }
    patch.national_id_front_url = v || null;
  }

  if (body.nationalIdBackUrl !== undefined) {
    const v = String(body.nationalIdBackUrl || '').trim();
    if (v && !isIdDocStoragePath(v) && !/^https?:\/\//i.test(v)) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.nationalIdBackInvalid')),
        { status: 400 }
      );
    }
    if (v && /^https?:\/\//i.test(v)) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.nationalIdBackUploadOnly')),
        { status: 400 }
      );
    }
    patch.national_id_back_url = v || null;
  }

  const wantsPayoutUpdate =
    body.payoutBankName !== undefined ||
    body.payoutAccountName !== undefined ||
    body.payoutAccountNumber !== undefined ||
    body.payoutVietqrBank !== undefined ||
    body.payoutQrImageUrl !== undefined ||
    body.payoutNote !== undefined;

  if (wantsPayoutUpdate) {
    if (profile.role !== 'OWNER' && profile.role !== 'SALE') {
      return NextResponse.json(
        fail('FORBIDDEN', t('FORBIDDEN.payoutAccountOwnerSaleOnly')),
        { status: 403 }
      );
    }
    if (body.payoutBankName !== undefined) {
      patch.payout_bank_name =
        String(body.payoutBankName || '').trim() || null;
    }
    if (body.payoutAccountName !== undefined) {
      patch.payout_account_name =
        String(body.payoutAccountName || '').trim() || null;
    }
    if (body.payoutAccountNumber !== undefined) {
      patch.payout_account_number =
        String(body.payoutAccountNumber || '').trim() || null;
    }
    if (body.payoutVietqrBank !== undefined) {
      patch.payout_vietqr_bank =
        String(body.payoutVietqrBank || '').trim() || null;
    }
    if (body.payoutQrImageUrl !== undefined) {
      patch.payout_qr_image_url =
        String(body.payoutQrImageUrl || '').trim().split('?')[0] || null;
    }
    if (body.payoutNote !== undefined) {
      patch.payout_note = String(body.payoutNote || '').trim() || null;
    }
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', profile.id)
    .select(
      'id, role, phone, email, full_name, avatar_url, national_id, national_id_front_url, national_id_back_url, payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_qr_image_url, payout_note'
    )
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        fail('CONFLICT', t('CONFLICT.phoneOrNationalIdTaken')),
        { status: 409 }
      );
    }
    return NextResponse.json(fail('UPDATE_FAILED', error.message), {
      status: 500,
    });
  }

  return NextResponse.json(ok({ profile: data }));
}
