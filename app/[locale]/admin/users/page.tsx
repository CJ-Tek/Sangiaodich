import { getTranslations } from 'next-intl/server';
import { pageTitle } from '@/lib/seo/page-title';
import { PageHeader } from '@/components/ui/PageHeader';
import { AdminUsersPanel } from '@/components/admin/AdminUsersPanel';
import { listAdminUsers } from '@/lib/engines/admin-user-management';
import { getSessionProfile } from '@/lib/auth/session';

export const generateMetadata = pageTitle('admin.users');

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab, q, page } = await searchParams;
  const t = await getTranslations('admin.users');
  const profile = await getSessionProfile();
  const result = await listAdminUsers({
    tab,
    q,
    page: Number(page) || 1,
  });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <AdminUsersPanel
        {...result}
        currentAdminId={profile?.id || ''}
      />
    </>
  );
}
