import { SaleMobileShell } from '@/components/shells/SaleMobileShell';
import { SubscriptionShell } from '@/components/auth/SubscriptionShell';
import { UiModeToggle } from '@/components/shells/UiModeToggle';
import { getSessionProfile } from '@/lib/auth/session';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import {
  getLatestSubscription,
} from '@/lib/engines/subscription-access';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { createClient } from '@/lib/supabase/server';
import { mapPaymentInfo } from '@/lib/platform/payment-info';

export default async function SaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  const sub = profile ? await getLatestSubscription(profile.id) : null;
  const active = sub
    ? isSubscriptionActive({
        status: sub.status,
        periodEnd: sub.period_end,
      })
    : false;

  const admin = await createClient();
  const { data: fees } = await admin
    .from('platform_fee_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return (
    <SaleMobileShell
      uiMode={profile?.uiMode ?? 'expert'}
      headerExtra={
        profile && (profile.role === 'SALE') ? (
          <UiModeToggle
            mode={profile.uiMode}
            homeHref={
              isSimpleUi(profile.uiMode) ? '/sale' : '/sale/calendar'
            }
          />
        ) : null
      }
    >
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
