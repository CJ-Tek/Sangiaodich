import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { MembershipCategoryTabs } from '@/components/admin/MembershipCategoryTabs';
import type { GuestTierRecord } from '@/components/admin/TierEditor';

export default async function AdminMembershipPage() {
  const admin = await createClient();
  const { data: guestTiers } = await admin
    .from('guest_membership_tiers')
    .select('*')
    .order('sort');

  const guest: GuestTierRecord[] = (guestTiers || []).map((t) => ({
    id: t.id,
    sort: t.sort,
    label: t.label || '',
    min_books: t.min_books,
    min_gmv: Number(t.min_gmv),
  }));

  return (
    <>
      <PageHeader
        title="Membership"
        description="Guest: ngưỡng book và GMV để lên hạng. Chiết khấu cost Sale do Owner set trên từng asset (mặc định 0%)."
      />
      <MembershipCategoryTabs guest={guest} />
    </>
  );
}
