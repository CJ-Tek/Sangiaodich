import { OwnerMobileShell } from '@/components/shells/OwnerMobileShell';
import { SubscriptionShell } from '@/components/auth/SubscriptionShell';
import { UiModeToggle } from '@/components/shells/UiModeToggle';
import { getSessionProfile } from '@/lib/auth/session';
import {
  getLatestSubscription,
} from '@/lib/engines/subscription-access';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import { createClient } from '@/lib/supabase/server';
import { mapPaymentInfo } from '@/lib/platform/payment-info';

export default async function OwnerLayout({
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

  const simple = isSimpleUi(profile?.uiMode);

  return (
    <OwnerMobileShell
      uiMode={profile?.uiMode ?? 'expert'}
      headerExtra={
        profile ? (
          <UiModeToggle
            mode={profile.uiMode}
            homeHref={simple ? '/owner' : '/owner/calendar'}
          />
        ) : null
      }
    >
      <SubscriptionShell
        active={active}
        role="OWNER"
        status={sub?.status ?? null}
        payment={mapPaymentInfo(fees)}
        phone={profile?.phone}
        email={profile?.email}
      >
        {children}
      </SubscriptionShell>
    </OwnerMobileShell>
  );
}
