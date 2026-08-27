import { NextResponse } from 'next/server';
import { getSessionProfile, writeAudit } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { fail, ok } from '@/lib/types';
import { activateSubscription } from '@/lib/engines/subscription-activate';
import { planDurationLabel } from '@/lib/engines/subscription-plans';
import {
  AdminUserError,
  hardDeleteUser,
  removeSubscription,
  restoreUser,
  softDeleteUser,
} from '@/lib/engines/admin-user-management';

function adminUserFail(e: unknown) {
  if (e instanceof AdminUserError) {
    const status =
      e.code === 'HARD_DELETE_DISABLED' || e.code === 'SELF_DELETE'
        ? 403
        : e.code === 'NOT_FOUND'
          ? 404
          : 400;
    return NextResponse.json(fail(e.code, e.message), { status });
  }
  return NextResponse.json(
    fail(
      'UPDATE_FAILED',
      e instanceof Error ? e.message : 'Admin user action failed'
    ),
    { status: 500 }
  );
}

async function requireAdmin() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'ADMIN') return null;
  return profile;
}

export async function PATCH(request: Request) {
  const adminProfile = await requireAdmin();
  if (!adminProfile) {
    return NextResponse.json(fail('UNAUTHORIZED', 'Admin only'), { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action || '');
  const db = createServiceClient();

  if (action === 'review_asset') {
    const assetId = String(body.assetId || '');
    const status = String(body.status || '');
    if (!['ACTIVE', 'REJECTED', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      return NextResponse.json(fail('INVALID', 'Invalid status'), { status: 400 });
    }
    const { data, error } = await db
      .from('assets')
      .update({
        status,
        rejection_reason: body.reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json(fail('UPDATE_FAILED', error.message), { status: 500 });
    }
    await writeAudit(adminProfile.id, 'review_asset', { assetId, status });
    return NextResponse.json(ok({ asset: data }));
  }

  if (action === 'update_fees') {
    // Upsert: bảng singleton (id=1) có thể chưa có row nếu seed chưa chạy.
    const { data, error } = await db
      .from('platform_fee_settings')
      .upsert(
        {
          id: 1,
          payment_bank_name: String(body.paymentBankName || '').trim() || null,
          payment_account_name:
            String(body.paymentAccountName || '').trim() || null,
          payment_account_number:
            String(body.paymentAccountNumber || '').trim() || null,
          payment_qr_image_url:
            String(body.paymentQrImageUrl || '').trim() || null,
          payment_transfer_note:
            String(body.paymentTransferNote || '').trim() || null,
          payment_contact: String(body.paymentContact || '').trim() || null,
          payment_vietqr_bank:
            String(body.paymentVietqrBank || '').trim() || null,
          updated_at: new Date().toISOString(),
          updated_by: adminProfile.id,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();
    if (error) {
      return NextResponse.json(fail('UPDATE_FAILED', error.message), { status: 500 });
    }
    await writeAudit(adminProfile.id, 'update_fees', body);
    return NextResponse.json(ok({ fees: data }));
  }

  if (action === 'upsert_subscription_plan') {
    const id = String(body.id || '');
    if (!id) {
      return NextResponse.json(fail('INVALID', 'id required'), { status: 400 });
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(fail('INVALID', 'amount invalid'), {
        status: 400,
      });
    }
    const months = Number(body.months);
    const label =
      String(body.label || '').trim() || planDurationLabel(months);
    const compareRaw = body.compareAtAmount;
    const compareAtAmount =
      compareRaw === null ||
      compareRaw === undefined ||
      compareRaw === ''
        ? null
        : Number(compareRaw);
    if (
      compareAtAmount != null &&
      (!Number.isFinite(compareAtAmount) || compareAtAmount <= 0)
    ) {
      return NextResponse.json(
        fail('INVALID', 'compareAtAmount invalid'),
        { status: 400 }
      );
    }
    if (compareAtAmount != null && compareAtAmount <= amount) {
      return NextResponse.json(
        fail(
          'INVALID',
          'Giá gốc (so sánh) phải lớn hơn giá gói thanh toán'
        ),
        { status: 400 }
      );
    }
    const { data, error } = await db
      .from('subscription_plans')
      .update({
        amount,
        compare_at_amount: compareAtAmount,
        label,
        is_active: body.isActive !== false,
        sort_order: Number(body.sortOrder ?? 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json(fail('UPDATE_FAILED', error.message), {
        status: 500,
      });
    }
    await writeAudit(adminProfile.id, 'upsert_subscription_plan', {
      id,
      amount,
      compareAtAmount,
      label,
    });
    return NextResponse.json(ok({ plan: data }));
  }

  if (action === 'mark_paid') {
    const profileId = String(body.profileId || '');
    const planId = String(body.planId || '');
    if (!profileId || !planId) {
      return NextResponse.json(
        fail('INVALID', 'profileId and planId required'),
        { status: 400 }
      );
    }

    const { data: plan, error: planErr } = await db
      .from('subscription_plans')
      .select('id, role, months, amount, is_active')
      .eq('id', planId)
      .maybeSingle();
    if (planErr || !plan || !plan.is_active) {
      return NextResponse.json(fail('INVALID', 'Plan not found'), {
        status: 400,
      });
    }

    const { data: target } = await db
      .from('profiles')
      .select('role')
      .eq('id', profileId)
      .maybeSingle();
    if (!target || target.role !== plan.role) {
      return NextResponse.json(
        fail('INVALID', 'Plan role does not match user'),
        { status: 400 }
      );
    }

    try {
      const result = await activateSubscription({
        profileId,
        months: plan.months,
        amount: Number(plan.amount),
        planId: plan.id,
        source: 'admin',
        markedPaidBy: adminProfile.id,
      });
      await writeAudit(adminProfile.id, 'mark_paid', {
        profileId,
        planId,
        months: plan.months,
        amount: Number(plan.amount),
        periodEnd: result.periodEnd,
      });
      return NextResponse.json(ok({ subscription: result }));
    } catch (e) {
      return NextResponse.json(
        fail(
          'UPDATE_FAILED',
          e instanceof Error ? e.message : 'Activate failed'
        ),
        { status: 500 }
      );
    }
  }

  if (action === 'upsert_guest_tier') {
    const id = String(body.id || '').trim();
    const row: Record<string, unknown> = {
      sort: Number(body.sort),
      min_books: Number(body.minBooks),
      min_gmv: Number(body.minGmv),
      label: String(body.label || ''),
    };
    if (id) row.id = id;
    const { data, error } = await db
      .from('guest_membership_tiers')
      .upsert(row)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json(fail('UPDATE_FAILED', error.message), { status: 500 });
    }
    await writeAudit(adminProfile.id, 'upsert_guest_tier', row);
    return NextResponse.json(ok({ tier: data }));
  }

  if (action === 'remove_subscription') {
    const profileId = String(body.profileId || '');
    if (!profileId) {
      return NextResponse.json(fail('INVALID', 'profileId required'), {
        status: 400,
      });
    }
    try {
      const result = await removeSubscription({
        actorId: adminProfile.id,
        profileId,
      });
      return NextResponse.json(ok({ subscription: result }));
    } catch (e) {
      return adminUserFail(e);
    }
  }

  if (action === 'soft_delete_user') {
    const profileId = String(body.profileId || '');
    if (!profileId) {
      return NextResponse.json(fail('INVALID', 'profileId required'), {
        status: 400,
      });
    }
    try {
      const result = await softDeleteUser({
        actorId: adminProfile.id,
        profileId,
        reason: body.reason != null ? String(body.reason) : null,
      });
      return NextResponse.json(ok({ user: result }));
    } catch (e) {
      return adminUserFail(e);
    }
  }

  if (action === 'restore_user') {
    const profileId = String(body.profileId || '');
    if (!profileId) {
      return NextResponse.json(fail('INVALID', 'profileId required'), {
        status: 400,
      });
    }
    try {
      const result = await restoreUser({
        actorId: adminProfile.id,
        profileId,
      });
      return NextResponse.json(ok({ user: result }));
    } catch (e) {
      return adminUserFail(e);
    }
  }

  if (action === 'hard_delete_user') {
    try {
      hardDeleteUser({
        actorId: adminProfile.id,
        profileId: String(body.profileId || ''),
      });
    } catch (e) {
      return adminUserFail(e);
    }
  }

  return NextResponse.json(fail('INVALID_ACTION', 'Unknown action'), {
    status: 400,
  });
}
