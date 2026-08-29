'use client';

import { Badge, Group, Stack, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { SaveCustomerButton } from '@/components/sale/SavedCustomerActions';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { colors } from '@/config/design-tokens';
import type { SaleLead } from '@/lib/engines/sale-leads';

export function LeadCard({ lead }: { lead: SaleLead }) {
  const t = useTranslations('sale.leads');

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return t('minsAgo', { mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('hoursAgo', { hours });
    return new Date(iso).toLocaleDateString('vi-VN');
  }

  return (
    <SurfaceCard
      style={{
        borderColor: lead.unread ? colors.success : undefined,
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
                {t('newBadge')}
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
            {t('viewProperty')}
          </LinkAnchor>
          <SaveCustomerButton
            label={t('saveFollowUp')}
            size="xs"
            variant="light"
            initial={{
              fullName: lead.guestName || '',
              phone: lead.guestPhone || '',
              note: lead.assetTitle
                ? t('leadFrom', { asset: lead.assetTitle })
                : undefined,
            }}
          />
        </Stack>
        <Text size="xs" c="dimmed">
          {timeAgo(lead.createdAt)}
        </Text>
      </Group>
    </SurfaceCard>
  );
}
