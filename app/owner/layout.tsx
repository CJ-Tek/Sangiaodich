import { DesktopRoleShell } from '@/components/shells/DesktopRoleShell';
import { SubscriptionShell } from '@/components/auth/SubscriptionShell';
import { getSessionProfile } from '@/lib/auth/session';
import {
  getLatestSubscription,
} from '@/lib/engines/subscription-access';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { createClient } from '@/lib/supabase/server';
import { mapPaymentInfo } from '@/lib/platform/payment-info';

const nav = [
  { label: 'Properties', href: '/owner' },
  { label: 'Assets', href: '/owner/assets' },
  { label: 'Chờ xác nhận', href: '/owner/pending' },
  { label: 'Settlements', href: '/owner/bookings' },
  { label: 'New asset', href: '/owner/assets/new' },
  { label: 'Subscription', href: '/owner/subscription' },
  { label: 'Profile', href: '/owner/profile' },
];

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

  return (
    <DesktopRoleShell
      title="Owner"
      nav={nav}
      accountHref="/owner/profile"
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
    </DesktopRoleShell>
  );
}
