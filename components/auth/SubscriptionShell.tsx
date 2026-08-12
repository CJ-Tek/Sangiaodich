'use client';

import { usePathname } from 'next/navigation';
import { SubscriptionLocked } from '@/components/auth/SubscriptionLocked';
import type { PlatformPaymentInfo } from '@/lib/platform/payment-info';

const SALE_ALLOWED = [
  '/sale/settings',
  '/sale/subscription',
  '/sale/profile',
  '/sale/membership',
];

const OWNER_ALLOWED = ['/owner/subscription', '/owner/profile'];

export function SubscriptionShell({
  active,
  role,
  status,
  payment,
  phone,
  email,
  children,
}: {
  active: boolean;
  role: 'SALE' | 'OWNER';
  status?: string | null;
  payment: PlatformPaymentInfo;
  phone?: string | null;
  email?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const allowed = role === 'SALE' ? SALE_ALLOWED : OWNER_ALLOWED;
  // Exact home only — do not prefix-match `/sale` or `/owner` (would unlock all routes).
  const homePath = role === 'SALE' ? '/sale' : '/owner';
  const ok =
    active ||
    pathname === homePath ||
    allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (ok) return <>{children}</>;
  return (
    <SubscriptionLocked
      role={role}
      status={status}
      payment={payment}
      phone={phone}
      email={email}
    />
  );
}
