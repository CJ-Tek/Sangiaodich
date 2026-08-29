import { localeRedirect } from '@/lib/i18n/navigation';
import { getSessionProfile } from '@/lib/auth/session';

/** Membership moved into the guest overview; kept for old links and bookmarks. */
export default async function MembershipPage() {
  const profile = await getSessionProfile();
  if (profile?.role === 'SALE') return await localeRedirect('/sale/settings?tab=membership');
  return await localeRedirect('/me');
}
