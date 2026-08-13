import { PageHeader } from '@/components/ui/PageHeader';
import { AdminUsersPanel } from '@/components/admin/AdminUsersPanel';
import { listAdminUsers } from '@/lib/engines/admin-user-management';
import { getSessionProfile } from '@/lib/auth/session';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab, q, page } = await searchParams;
  const profile = await getSessionProfile();
  const result = await listAdminUsers({
    tab,
    q,
    page: Number(page) || 1,
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Quản lý theo role, gỡ subscription, trash/restore. Mark paid là fallback khi SePay chưa nhận được."
      />
      <AdminUsersPanel
        {...result}
        currentAdminId={profile?.id || ''}
      />
    </>
  );
}
