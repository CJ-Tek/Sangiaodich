import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { SaveCustomerButton } from '@/components/sale/SavedCustomerActions';
import { colors, radius } from '@/config/design-tokens';
import type { SaleLead } from '@/lib/engines/sale-leads';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export function LeadCard({ lead }: { lead: SaleLead }) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{
        border: `1px solid ${lead.unread ? colors.success : colors.border}`,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Stack gap={4}>
          <Group gap="xs">
            <Text fw={600} size="lg">
              {lead.guestName}
            </Text>
            {lead.unread ? (
              <Badge color="vbnbGreen" variant="light" size="sm">
                New
              </Badge>
            ) : null}
          </Group>
          <Text size="sm" c="dimmed">
            {lead.assetTitle}
            {lead.assetLocation ? ` · ${lead.assetLocation}` : ''}
          </Text>
          <Text size="sm" fw={500} mt={4}>
            {lead.guestPhone}
          </Text>
          <LinkAnchor
            href={`/sale/marketplace/${lead.assetSlug}`}
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
              fullName: lead.guestName || '',
              phone: lead.guestPhone || '',
              note: lead.assetTitle ? `Lead từ ${lead.assetTitle}` : undefined,
            }}
          />
        </Stack>
        <Text size="xs" c="dimmed">
          {timeAgo(lead.createdAt)}
        </Text>
      </Group>
    </Paper>
  );
}
