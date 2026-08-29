import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { MembershipCategoryTabs } from '@/components/admin/MembershipCategoryTabs';
import type { GuestTierRecord } from '@/components/admin/TierEditor';

export default async function AdminMembershipPage() {
  const t = await getTranslations('admin.membership');
  const admin = await createClient();
  const { data: guestTiers } = await admin
    .from('guest_membership_tiers')
    .select('*')
    .order('sort');

  const guest: GuestTierRecord[] = (guestTiers || []).map((tier) => ({
    id: tier.id,
    sort: tier.sort,
    label: tier.label || '',
    min_books: tier.min_books,
    min_gmv: Number(tier.min_gmv),
  }));

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <MembershipCategoryTabs guest={guest} />
    </>
  );
}
