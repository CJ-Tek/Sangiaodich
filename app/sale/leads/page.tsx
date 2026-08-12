import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, Paper, Stack, Text, Group } from '@mantine/core';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { SaveCustomerButton } from '@/components/sale/SavedCustomerActions';
import { colors, radius } from '@/config/design-tokens';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

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

  const admin = await createClient();
  const { data: notes } = await admin
    .from('lead_notifications')
    .select(
      'id, created_at, lead_requests(created_at, assets(title, slug, location), profiles!lead_requests_guest_id_fkey(full_name, phone))'
    )
    .eq('sale_id', profile!.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeader
        title="Leads"
        description="Không claim — mọi sale ACTIVE đều thấy. Tự liên hệ guest."
      />
      {!notes?.length ? (
        <EmptyState
          title="No leads yet"
          description="Khi guest bấm “Cần liên lạc sale”, lead sẽ hiện tại đây."
          actionLabel="Open marketplace"
          href="/sale/marketplace"
        />
      ) : (
        <Stack gap="sm">
          {notes.map((n) => {
            const lead = n.lead_requests as unknown as {
              assets: { title: string; slug: string; location?: string };
              profiles: { full_name: string; phone: string };
            };
            return (
              <Paper
                key={n.id}
                p="lg"
                radius={radius.lg}
                style={{ border: `1px solid ${colors.border}` }}
              >
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <Stack gap={4}>
                    <Text fw={600} size="lg">
                      {lead?.profiles?.full_name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {lead?.assets?.title}
                      {lead?.assets?.location ? ` · ${lead.assets.location}` : ''}
                    </Text>
                    <Text size="sm" fw={500} mt={4}>
                      {lead?.profiles?.phone}
                    </Text>
                    <LinkAnchor
                      href={`/sale/marketplace/${lead?.assets?.slug}`}
                      size="sm"
                      c="vbnbGreen.6"
                    >
                      View property
                    </LinkAnchor>
                    <SaveCustomerButton
                      label="Lưu vào follow-up"
                      size="xs"
                      variant="light"
                      initial={{
                        fullName: lead?.profiles?.full_name || '',
                        phone: lead?.profiles?.phone || '',
                        note: lead?.assets?.title
                          ? `Lead từ ${lead.assets.title}`
                          : undefined,
                      }}
                    />
                  </Stack>
                  <Text size="xs" c="dimmed">
                    {timeAgo(n.created_at)}
                  </Text>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}
    </>
  );
}
