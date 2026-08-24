import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { GUEST_INVOICE_TTL_MS } from '@/lib/engines/guest-invoice';
import { guestRemaining } from '@/lib/engines/guest-balance';
import {
  hasOwnerPayoutInfo,
  mapOwnerPayoutInfo,
} from '@/lib/owner/payout-info';

export type InvoicePayee = 'SALE' | 'OWNER';

export async function issueGuestInvoice(input: {
  bookingId: string;
  issuedBy: string;
  payee: InvoicePayee;
}) {
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select(
      'id, sale_id, asset_id, status, list_price, amount_collected, guest_paid_owner_amount'
    )
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { error: 'NOT_FOUND' as const };

  if (input.payee === 'SALE') {
    if (booking.sale_id !== input.issuedBy) return { error: 'FORBIDDEN' as const };
    if (booking.status !== 'PENDING' && booking.status !== 'AWAITING_OWNER') {
      return { error: 'INVALID_STATUS' as const };
    }
  } else {
    const { data: asset } = await admin
      .from('assets')
      .select('owner_id')
      .eq('id', booking.asset_id)
      .maybeSingle();
    if (!asset || asset.owner_id !== input.issuedBy) {
      return { error: 'FORBIDDEN' as const };
    }
    if (booking.status !== 'CONFIRMED' && booking.status !== 'CHECKED_IN') {
      return { error: 'INVALID_STATUS' as const };
    }
  }

  const list = Number(booking.list_price || 0);
  const collected = Number(booking.amount_collected || 0);
  const guestPaidOwner = Number(booking.guest_paid_owner_amount || 0);
  if (guestRemaining(list, collected, guestPaidOwner) <= 0) {
    return { error: 'ALREADY_PAID' as const };
  }

  let payoutSource: Parameters<typeof mapOwnerPayoutInfo>[0] = null;
  if (input.payee === 'SALE') {
    const { data: sale } = await admin
      .from('profiles')
      .select(
        'payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_qr_image_url, payout_note'
      )
      .eq('id', input.issuedBy)
      .maybeSingle();
    payoutSource = sale;
  } else {
    const { data: asset } = await admin
      .from('assets')
      .select('owner_id')
      .eq('id', booking.asset_id)
      .maybeSingle();
    if (asset?.owner_id) {
      const { data: owner } = await admin
        .from('profiles')
        .select(
          'payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_qr_image_url, payout_note'
        )
        .eq('id', asset.owner_id)
        .maybeSingle();
      payoutSource = owner;
    }
  }

  const payout = mapOwnerPayoutInfo(payoutSource);
  if (!hasOwnerPayoutInfo(payout)) {
    return { error: 'NO_PAYOUT' as const };
  }

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + GUEST_INVOICE_TTL_MS);
  const token = randomBytes(24).toString('base64url');

  const { data: row, error } = await admin
    .from('guest_invoices')
    .insert({
      token,
      booking_id: booking.id,
      sale_id: booking.sale_id,
      payee: input.payee,
      issued_by: input.issuedBy,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      payout_bank_name_snapshot: payout.bankName || null,
      payout_account_name_snapshot: payout.accountName || null,
      payout_account_number_snapshot: payout.accountNumber || null,
      payout_vietqr_bank_snapshot: payout.vietqrBank || null,
      payout_qr_image_url_snapshot: payout.qrImageUrl || null,
    })
    .select('token, expires_at')
    .single();

  if (error || !row) {
    return { error: 'INSERT_FAILED' as const, message: error?.message };
  }

  return {
    token: row.token as string,
    expiresAt: row.expires_at as string,
  };
}
