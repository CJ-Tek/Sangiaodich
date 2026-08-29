import { getTranslations } from 'next-intl/server';
import { Alert, Stack } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import { loadSaleLeads } from '@/lib/engines/sale-leads';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LeadCard } from '@/components/sale/LeadCard';
import { MarkLeadsSeen } from '@/components/sale/MarkLeadsSeen';

export default async function SaleLeadsPage() {
  const t = await getTranslations('sale.leads');
  const profile = await getSessionProfile();
  const active = await saleHasActiveSub(profile!.id);
  if (!active) {
    return (
      <Alert color="red" title={t('subInactiveTitle')}>
        {t('subInactive')}
      </Alert>
    );
  }

  const leads = await loadSaleLeads();

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <MarkLeadsSeen hasUnread={leads.some((lead) => lead.unread)} />
      {!leads.length ? (
        <EmptyState
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          actionLabel={t('openMarketplace')}
          href="/sale/marketplace"
        />
      ) : (
        <Stack gap="sm">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </Stack>
      )}
    </>
  );
}
