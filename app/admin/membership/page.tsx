import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { MembershipCategoryTabs } from '@/components/admin/MembershipCategoryTabs';
import type {
  GuestTierRecord,
  SaleTierRecord,
} from '@/components/admin/TierEditor';

export default async function AdminMembershipPage() {
  const admin = await createClient();
  const [{ data: saleTiers }, { data: guestTiers }] = await Promise.all([
    admin.from('sale_membership_tiers').select('*').order('sort'),
    admin.from('guest_membership_tiers').select('*').order('sort'),
  ]);

  const sale: SaleTierRecord[] = (saleTiers || []).map((t) => ({
    id: t.id,
    sort: t.sort,
    label: t.label || '',
    min_lifetime_cost_volume: Number(t.min_lifetime_cost_volume),
    cost_discount_percent: Number(t.cost_discount_percent),
  }));

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
        description="Sale: ngưỡng volume và % discount trên base cost. Guest: ngưỡng book và GMV để lên hạng. Áp dụng booking mới."
      />
      <MembershipCategoryTabs sale={sale} guest={guest} />
    </>
  );
}
