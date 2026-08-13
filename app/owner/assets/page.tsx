import { Button, Badge, Paper, Group, Stack, Text } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { colors, radius } from '@/config/design-tokens';
import { bookingStatusColors } from '@/config/booking-status';

function statusTone(status: string) {
  if (status === 'ACTIVE') return bookingStatusColors.confirmed;
  if (status === 'PENDING_REVIEW') return bookingStatusColors.hold;
  if (status === 'SUSPENDED' || status === 'REJECTED') return bookingStatusColors.cancelled;
  return bookingStatusColors.blocked;
}

export default async function OwnerAssetsPage() {
  const profile = await getSessionProfile();
  const admin = await createClient();
  const { data: assets } = await admin
    .from('assets')
    .select('id, title, status, slug, location, property_type, bedrooms, bathrooms, asset_costs(cost_weekday, cost_weekend)')
    .eq('owner_id', profile!.id)
    .order('created_at', { ascending: false })
    .limit(LIST_VIEW_LIMIT);

  return (
    <>
      <PageHeader
        title="Properties"
        description="CRUD + cost WD/WE. Submit duyệt để lên sàn."
        action={
          <LinkButton href="/owner/assets/new" color="vbnbGreen">
            New asset
          </LinkButton>
        }
      />
      {!assets?.length ? (
        <EmptyState
          title="Chưa có asset"
          description="Tạo listing đầu tiên để gửi duyệt."
          actionLabel="New asset"
          href="/owner/assets/new"
        />
      ) : (
        <Stack gap="sm">
          {assets.map((a) => {
            const costs = a.asset_costs as unknown as {
              cost_weekday: number;
              cost_weekend: number;
            };
            const tone = statusTone(a.status);
            return (
              <Paper
                key={a.id}
                p="lg"
                radius={radius.lg}
                style={{ border: `1px solid ${colors.border}` }}
              >
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <div>
                    <Text fw={600}>{a.title}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {a.property_type === 'APARTMENT' ? 'Căn hộ' : 'Villa'}
                      {a.location ? ` · ${a.location}` : ''}
                      {` · ${Number(a.bedrooms) || 0} PN · ${Number(a.bathrooms) || 0} WC`}
                    </Text>
                    <Text size="sm" c="dimmed" mt={6}>
                      Cost WD {Number(costs?.cost_weekday || 0).toLocaleString('vi-VN')} · WE{' '}
                      {Number(costs?.cost_weekend || 0).toLocaleString('vi-VN')}
                    </Text>
                  </div>
                  <Group gap="sm" align="center">
                    <Badge
                      variant="outline"
                      styles={{
                        root: {
                          background: tone.bg,
                          color: tone.text,
                          borderColor: tone.border,
                        },
                      }}
                    >
                      {a.status}
                    </Badge>
                    <LinkButton
                      href={`/owner/assets/${a.id}/edit`}
                      variant="default"
                      size="compact-sm"
                    >
                      Edit
                    </LinkButton>
                  </Group>
                </Group>
                {(a.status === 'DRAFT' || a.status === 'REJECTED') && (
                  <SubmitButton assetId={a.id} />
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </>
  );
}

function SubmitButton({ assetId }: { assetId: string }) {
  return (
    <form
      action={async () => {
        'use server';
        const { createClient } = await import('@/lib/supabase/server');
        const { getSessionProfile } = await import('@/lib/auth/session');
        const profile = await getSessionProfile();
        const admin = await createClient();
        await admin
          .from('assets')
          .update({ status: 'PENDING_REVIEW' })
          .eq('id', assetId)
          .eq('owner_id', profile!.id);
      }}
    >
      <Button type="submit" mt="md" variant="light" color="vbnbGreen">
        Submit for review
      </Button>
    </form>
  );
}
