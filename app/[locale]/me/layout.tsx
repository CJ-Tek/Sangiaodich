import { GuestDashboardShell } from '@/components/shells/GuestDashboardShell';
import { getSessionProfile } from '@/lib/auth/session';

/**
 * Every guest page shares the same chrome. Auth guards stay in the pages
 * because each one needs its own `?next=` when bouncing to /login.
 */
export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();
  return (
    <GuestDashboardShell
      guidebookCompleted={
        profile?.role === 'GUEST' ? profile.guidebookCompleted : undefined
      }
    >
      {children}
    </GuestDashboardShell>
  );
}
