import { Alert, Stack } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import { loadSaleLeads } from '@/lib/engines/sale-leads';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LeadCard } from '@/components/sale/LeadCard';
import { MarkLeadsSeen } from '@/components/sale/MarkLeadsSeen';

export default async function SaleLeadsPage() {
  const profile = await getSessionProfile();
  const active = await saleHasActiveSub(profile!.id);
  if (!active) {
    return (
      <Alert color="red" title="Subscription inactive">
        Không nhận lead mới.
      </Alert>
    );
  }

  const leads = await loadSaleLeads();

  return (
    <>
      <PageHeader
        title="Leads"
        description="Không claim — mọi sale ACTIVE đều thấy. Tự liên hệ guest."
      />
      <MarkLeadsSeen hasUnread={leads.some((lead) => lead.unread)} />
      {!leads.length ? (
        <EmptyState
          title="No leads yet"
          description="Khi guest bấm “Cần liên lạc sale”, lead sẽ hiện tại đây."
          actionLabel="Open marketplace"
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
