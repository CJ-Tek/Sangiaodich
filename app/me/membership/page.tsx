import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';

/** Membership moved into the guest overview; kept for old links and bookmarks. */
export default async function MembershipPage() {
  const profile = await getSessionProfile();
  if (profile?.role === 'SALE') redirect('/sale/settings?tab=membership');
  redirect('/me');
}
