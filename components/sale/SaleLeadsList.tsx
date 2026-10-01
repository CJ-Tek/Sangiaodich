'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { SaveCustomerButton } from '@/components/sale/SavedCustomerActions';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radius } from '@/config/design-tokens';
import type { SaleLead } from '@/lib/engines/sale-leads';
import { foldVn } from '@/lib/search/vn-fold';

export function SaleLeadsList({ leads }: { leads: SaleLead[] }) {
  const t = useTranslations('sale.leads');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = foldVn(query.trim());
    if (!q) return leads;
    return leads.filter((lead) => {
      const hay = foldVn(
        [lead.guestName, lead.guestPhone, lead.assetTitle, lead.assetLocation]
          .filter(Boolean)
          .join(' ')
      );
      return hay.includes(q);
    });
  }, [leads, query]);

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return t('minsAgo', { mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('hoursAgo', { hours });
    return new Date(iso).toLocaleDateString('vi-VN');
  }

  const q = query.trim();

  return (
    <Stack gap="md">
      <TextInput
        label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        style={{ maxWidth: 420 }}
      />
      {!filtered.length ? (
        <EmptyState
          title={q ? t('notFound') : t('emptyTitle')}
          description={q ? t('notFoundHint') : t('emptyDesc')}
          actionLabel={q ? undefined : t('openMarketplace')}
          href={q ? undefined : '/sale/marketplace'}
        />
      ) : (
        <Paper radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
          <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead style={{ background: colors.surfaceMuted }}>
              <Table.Tr>
                <Table.Th>{t('colGuest')}</Table.Th>
                <Table.Th>{t('colVilla')}</Table.Th>
                <Table.Th>{t('colPhone')}</Table.Th>
                <Table.Th>{t('colWhen')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((lead) => (
                <Table.Tr
                  key={lead.id}
                  style={{
                    background: lead.unread ? colors.primarySoft : undefined,
                  }}
                >
                  <Table.Td>
                    <Group gap="xs">
                      <Text size="sm" fw={600}>
                        {lead.guestName}
                      </Text>
                      {lead.unread ? (
                        <Badge color="vbnbGreen" variant="light" size="sm">
                          {t('newBadge')}
                        </Badge>
                      ) : null}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{lead.assetTitle}</Text>
                    {lead.assetLocation ? (
                      <Text size="xs" c="dimmed">
                        {lead.assetLocation}
                      </Text>
                    ) : null}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{lead.guestPhone}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {timeAgo(lead.createdAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="wrap">
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
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
