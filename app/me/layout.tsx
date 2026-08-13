import { GuestDashboardShell } from '@/components/shells/GuestDashboardShell';

/**
 * Every guest page shares the same chrome. Auth guards stay in the pages
 * because each one needs its own `?next=` when bouncing to /login.
 */
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestDashboardShell>{children}</GuestDashboardShell>;
}
