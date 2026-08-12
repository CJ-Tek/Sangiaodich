import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { GUEST_INVOICE_TTL_MS } from '@/lib/engines/guest-invoice';
import {
  hasOwnerPayoutInfo,
  mapOwnerPayoutInfo,
} from '@/lib/owner/payout-info';

export async function issueGuestInvoice(input: {
  bookingId: string;
  saleId: string;
}) {
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, sale_id, status, list_price, amount_collected')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { error: 'NOT_FOUND' as const };
  if (booking.sale_id !== input.saleId) return { error: 'FORBIDDEN' as const };
  if (booking.status === 'CANCELLED' || booking.status === 'CHECKED_OUT') {
    return { error: 'INVALID_STATUS' as const };
  }

  const list = Number(booking.list_price || 0);
  const collected = Number(booking.amount_collected || 0);
  if (list > 0 && collected >= list) {
    return { error: 'ALREADY_PAID' as const };
  }

  const { data: sale } = await admin
    .from('profiles')
    .select(
      'payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_qr_image_url, payout_note'
    )
    .eq('id', input.saleId)
    .maybeSingle();

  const payout = mapOwnerPayoutInfo(sale);
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
      sale_id: input.saleId,
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
