import { getTranslations } from 'next-intl/server';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import {
  listSavedCustomers,
  loadCancelledCustomersForSale,
  loadClosedCustomersForSale,
} from '@/lib/engines/sale-customers';
import { PageHeader } from '@/components/ui/PageHeader';
import { SaleCustomersTabs } from '@/components/sale/SaleCustomersTabs';
import { Alert } from '@mantine/core';

function parseTab(raw?: string): 'closed' | 'saved' | 'cancelled' {
  if (raw === 'saved' || raw === 'cancelled') return raw;
  return 'closed';
}

export default async function SaleCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const t = await getTranslations('sale.customers');
  const { tab: tabParam } = await searchParams;
  const tab = parseTab(tabParam);
  const profile = await getSessionProfile();
  const active = await saleHasActiveSub(profile!.id);

  if (!active) {
    return (
      <Alert color="red" title={t('subInactiveTitle')}>
        {t('subInactive')}
      </Alert>
    );
  }

  const [closed, cancelled, savedResult] = await Promise.all([
    loadClosedCustomersForSale(profile!.id),
    loadCancelledCustomersForSale(profile!.id),
    listSavedCustomers({ saleId: profile!.id, limit: 100 }),
  ]);

  const saved =
    'customers' in savedResult && savedResult.customers
      ? savedResult.customers
      : [];

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <SaleCustomersTabs
        closed={closed}
        saved={saved}
        cancelled={cancelled}
        defaultTab={tab}
      />
    </>
  );
}
