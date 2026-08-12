import { PageHeader } from '@/components/ui/PageHeader';
import { AdminUsersPanel } from '@/components/admin/AdminUsersPanel';
import { listAdminUsers } from '@/lib/engines/admin-user-management';
import { getSessionProfile } from '@/lib/auth/session';

export default async function AdminUsersPage() {
  const profile = await getSessionProfile();
  const { users, plans } = await listAdminUsers();

  return (
    <>
      <PageHeader
        title="Users"
        description="Quản lý theo role, gỡ subscription, trash/restore. Mark paid là fallback khi SePay chưa nhận được."
      />
      <AdminUsersPanel
        users={users}
        plans={plans}
        currentAdminId={profile?.id || ''}
      />
    </>
  );
}
