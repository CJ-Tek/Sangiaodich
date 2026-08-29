import { getTranslations } from 'next-intl/server';
import { DesktopRoleShell } from '@/components/shells/DesktopRoleShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('admin.layout');

  const nav = [
    { label: t('nav.overview'), href: '/admin' },
    { label: t('nav.assets'), href: '/admin/assets' },
    { label: t('nav.users'), href: '/admin/users' },
    { label: t('nav.fees'), href: '/admin/fees' },
    { label: t('nav.payments'), href: '/admin/payments' },
    { label: t('nav.membership'), href: '/admin/membership' },
  ];

  return (
    <DesktopRoleShell title={t('title')} nav={nav}>
      {children}
    </DesktopRoleShell>
  );
}
