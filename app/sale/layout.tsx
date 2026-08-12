import { SaleMobileShell } from '@/components/shells/SaleMobileShell';
import { SubscriptionShell } from '@/components/auth/SubscriptionShell';
import { getSessionProfile } from '@/lib/auth/session';
import {
  getLatestSubscription,
  profileHasActiveSubscription,
} from '@/lib/engines/subscription-access';
import { createClient } from '@/lib/supabase/server';
import { mapPaymentInfo } from '@/lib/platform/payment-info';

export default async function SaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  const active = profile
    ? await profileHasActiveSubscription(profile.id)
    : false;
  const sub = profile ? await getLatestSubscription(profile.id) : null;

  const admin = await createClient();
  const { data: fees } = await admin
    .from('platform_fee_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return (
    <SaleMobileShell>
      <SubscriptionShell
        active={active}
        role="SALE"
        status={sub?.status ?? null}
        payment={mapPaymentInfo(fees)}
        phone={profile?.phone}
        email={profile?.email}
      >
        {children}
      </SubscriptionShell>
    </SaleMobileShell>
  );
}
