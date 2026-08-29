import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Container } from '@mantine/core';
import { GuestShell } from '@/components/shells/GuestShell';
import { GuestInvoiceView } from '@/components/pay/GuestInvoiceView';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { mapOwnerPayoutInfo } from '@/lib/owner/payout-info';

export default async function GuestPayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const t = await getTranslations('pay.invoice');
  const { token } = await params;
  const profile = await getSessionProfile();
  const admin = createServiceClient();

  const { data: invoice } = await admin
    .from('guest_invoices')
    .select(
      `token, expires_at, booking_id, payee,
       payout_bank_name_snapshot, payout_account_name_snapshot,
       payout_account_number_snapshot, payout_vietqr_bank_snapshot,
       payout_qr_image_url_snapshot`
    )
    .eq('token', token)
    .maybeSingle();

  if (!invoice) notFound();

  const { data: booking } = await admin
    .from('bookings')
    .select(
      `id, status, check_in, check_out, list_price, amount_collected,
       guest_paid_owner_amount, sale_id, asset_id`
    )
    .eq('id', invoice.booking_id)
    .maybeSingle();

  if (!booking) notFound();

  const [{ data: asset }, { data: sale }] = await Promise.all([
    admin.from('assets').select('title, slug').eq('id', booking.asset_id).maybeSingle(),
    admin
      .from('profiles')
      .select('full_name, phone')
      .eq('id', booking.sale_id)
      .maybeSingle(),
  ]);

  const payout = mapOwnerPayoutInfo({
    payout_bank_name: invoice.payout_bank_name_snapshot,
    payout_account_name: invoice.payout_account_name_snapshot,
    payout_account_number: invoice.payout_account_number_snapshot,
    payout_vietqr_bank: invoice.payout_vietqr_bank_snapshot,
    payout_qr_image_url: invoice.payout_qr_image_url_snapshot,
  });

  return (
    <GuestShell isLoggedIn={!!profile}>
      <Container size="sm" py="md">
        <GuestInvoiceView
          bookingId={booking.id}
          status={booking.status}
          villaTitle={asset?.title || t('villaFallback')}
          assetSlug={asset?.slug || null}
          checkIn={booking.check_in}
          checkOut={booking.check_out}
          listPrice={Number(booking.list_price || 0)}
          amountCollected={Number(booking.amount_collected || 0)}
          guestPaidOwner={Number(booking.guest_paid_owner_amount || 0)}
          payee={invoice.payee === 'OWNER' ? 'OWNER' : 'SALE'}
          saleName={sale?.full_name || t('saleFallback')}
          salePhone={sale?.phone || ''}
          expiresAt={invoice.expires_at}
          payout={payout}
        />
      </Container>
    </GuestShell>
  );
}
