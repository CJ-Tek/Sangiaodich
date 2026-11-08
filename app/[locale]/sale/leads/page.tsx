import { getTranslations } from 'next-intl/server';
import { pageTitle } from '@/lib/seo/page-title';
import { Alert } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import { loadSaleLeads } from '@/lib/engines/sale-leads';
import { PageHeader } from '@/components/ui/PageHeader';
import { SaleLeadsList } from '@/components/sale/SaleLeadsList';
import { MarkLeadsSeen } from '@/components/sale/MarkLeadsSeen';

export const generateMetadata = pageTitle('sale.leads');

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
      <PageHeader title={t('title')} description={t('description')} guideId="sale-leads" />
      <MarkLeadsSeen hasUnread={leads.some((lead) => lead.unread)} />
      <SaleLeadsList leads={leads} />
    </>
  );
}
