import { DesktopRoleShell } from '@/components/shells/DesktopRoleShell';

const nav = [
  { label: 'Overview', href: '/admin' },
  { label: 'Asset approval', href: '/admin/assets' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Fees & TT', href: '/admin/fees' },
  { label: 'Membership', href: '/admin/membership' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DesktopRoleShell title="Admin" nav={nav}>
      {children}
    </DesktopRoleShell>
  );
}
