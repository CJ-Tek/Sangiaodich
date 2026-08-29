'use client';

import {
  Badge,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  SaveCustomerButton,
  SavedCustomerActions,
} from '@/components/sale/SavedCustomerActions';
import { matchesCustomerSearch } from '@/lib/engines/sale-customer-stats';
import type {
  CancelledCustomerCard,
  ClosedCustomerCard,
  SavedCustomerRow,
} from '@/lib/engines/sale-customers';
import { useFormat } from '@/lib/i18n/use-format';

export function SaleCustomersTabs({
  closed,
  saved,
  cancelled,
  defaultTab,
}: {
  closed: ClosedCustomerCard[];
  saved: SavedCustomerRow[];
  cancelled: CancelledCustomerCard[];
  defaultTab: 'closed' | 'saved' | 'cancelled';
}) {
  const t = useTranslations('sale.customers');
  const { formatNumber, formatDateTime } = useFormat();
  const [query, setQuery] = useState('');

  const filteredClosed = useMemo(
    () =>
      closed.filter((c) =>
        matchesCustomerSearch(query, c.fullName, c.phone)
      ),
    [closed, query]
  );
  const filteredSaved = useMemo(
    () =>
      saved.filter((c) =>
        matchesCustomerSearch(query, c.full_name, c.phone)
      ),
    [saved, query]
  );
  const filteredCancelled = useMemo(
    () =>
      cancelled.filter((c) =>
        matchesCustomerSearch(query, c.fullName, c.phone)
      ),
    [cancelled, query]
  );

  const q = query.trim();

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <TextInput
          label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <SaveCustomerButton />
      </Group>

      <Tabs defaultValue={defaultTab} color="vbnbGreen">
        <Tabs.List mb="md">
          <Tabs.Tab value="closed">
            {t('tabClosed', { count: filteredClosed.length })}
          </Tabs.Tab>
          <Tabs.Tab value="saved">
            {t('tabSaved', { count: filteredSaved.length })}
          </Tabs.Tab>
          <Tabs.Tab value="cancelled">
            {t('tabCancelled', { count: filteredCancelled.length })}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="closed">
          {!closed.length ? (
            <EmptyState
              title={t('emptyClosedTitle')}
              description={t('emptyClosedDesc')}
              actionLabel={t('openBookings')}
              href="/sale/bookings"
            />
          ) : !filteredClosed.length ? (
            <EmptyState
              title={q ? t('notFoundQuery', { query: q }) : t('noResults')}
              description={t('notFoundHint')}
            />
          ) : (
            <Stack gap="sm">
              {filteredClosed.map((c) => (
                <Paper
                  key={c.guestId}
                  p="lg"
                  radius={radius.lg}
                  style={{ border: `1px solid ${colors.border}` }}
                >
                  <Group
                    justify="space-between"
                    align="flex-start"
                    wrap="wrap"
                  >
                    <Stack gap={4}>
                      <Text fw={600} size="lg">
                        {c.fullName}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {c.phone}
                      </Text>
                      <Group gap="xs" mt={4}>
                        <Badge color="vbnbGreen" variant="light">
                          {c.tierLabel}
                        </Badge>
                      </Group>
                    </Stack>
                    <Stack gap={2} align="flex-end">
                      <Text size="xs" c="dimmed">
                        {t('totalSpend')}
                      </Text>
                      <Text fw={600}>{formatNumber(c.totalPaidNet)}</Text>
                      <Text size="xs" c="dimmed">
                        {t('bookingCount', { count: c.bookingCount })}
                      </Text>
                    </Stack>
                  </Group>
                  <Text size="sm" mt="md">
                    {c.atMaxTier
                      ? t('tierMax')
                      : t('tierProgress', {
                          bookings: c.remainingBooks ?? 0,
                          amount: formatNumber(c.remainingGmv || 0),
                          tier: c.nextTierLabel ?? '',
                        })}
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="saved">
          {!saved.length ? (
            <EmptyState
              title={t('emptySavedTitle')}
              description={t('emptySavedDesc')}
            />
          ) : !filteredSaved.length ? (
            <EmptyState
              title={q ? t('notFoundQuery', { query: q }) : t('noResults')}
              description={t('notFoundHint')}
            />
          ) : (
            <Stack gap="sm">
              {filteredSaved.map((c) => (
                <Paper
                  key={c.id}
                  p="lg"
                  radius={radius.lg}
                  style={{ border: `1px solid ${colors.border}` }}
                >
                  <Group
                    justify="space-between"
                    align="flex-start"
                    wrap="wrap"
                    mb="sm"
                  >
                    <Stack gap={4}>
                      <Text fw={600} size="lg">
                        {c.full_name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {c.phone}
                      </Text>
                      <Group gap="xs" mt={4}>
                        <Badge variant="light">{c.channel}</Badge>
                        <Badge
                          color={
                            c.intent_level === 'HOT'
                              ? 'red'
                              : c.intent_level === 'WARM'
                                ? 'yellow'
                                : 'gray'
                          }
                          variant="light"
                        >
                          {c.intent_level}
                        </Badge>
                        <Badge
                          color={
                            c.status === 'ACTIVE'
                              ? 'vbnbGreen'
                              : c.status === 'CONVERTED'
                                ? 'blue'
                                : 'gray'
                          }
                          variant="light"
                        >
                          {c.status}
                        </Badge>
                      </Group>
                    </Stack>
                    <Stack gap={2} align="flex-end">
                      <Text size="xs" c="dimmed">
                        Follow-up
                      </Text>
                      <Text size="sm">
                        {c.next_follow_up_at
                          ? formatDateTime(c.next_follow_up_at)
                          : '—'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Liên hệ gần nhất:{' '}
                        {c.last_contact_at
                          ? formatDateTime(c.last_contact_at)
                          : '—'}
                      </Text>
                    </Stack>
                  </Group>
                  {c.note ? (
                    <Text size="sm" c="dimmed" mb="sm">
                      {c.note}
                    </Text>
                  ) : null}
                  <SavedCustomerActions customer={c} />
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="cancelled">
          {!cancelled.length ? (
            <EmptyState
              title={t('emptyCancelledTitle')}
              description={t('emptyCancelledDesc')}
            />
          ) : !filteredCancelled.length ? (
            <EmptyState
              title={q ? t('notFoundQuery', { query: q }) : t('noResults')}
              description={t('notFoundHint')}
            />
          ) : (
            <Stack gap="sm">
              {filteredCancelled.map((c) => (
                <Paper
                  key={c.guestId}
                  p="lg"
                  radius={radius.lg}
                  style={{ border: `1px solid ${colors.border}` }}
                >
                  <Group
                    justify="space-between"
                    align="flex-start"
                    wrap="wrap"
                  >
                    <Stack gap={4}>
                      <Text fw={600} size="lg">
                        {c.fullName}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {c.phone}
                      </Text>
                      <Text size="sm" mt={4}>
                        {c.lastAssetTitle || t('bookingLabel')}
                        {' · '}
                        {t('cancelCount', { count: c.cancelCount })}
                      </Text>
                    </Stack>
                    <Stack gap={2} align="flex-end">
                      <Text size="xs" c="dimmed">
                        {t('lastCancelled')}
                      </Text>
                      <Text size="sm">
                        {c.lastCancelledAt
                          ? formatDateTime(c.lastCancelledAt)
                          : '—'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('refundShort', {
                          refund: formatNumber(c.lastRefundAmount),
                          kept: formatNumber(c.lastKeptAmount),
                        })}
                      </Text>
                    </Stack>
                  </Group>
                  <Group mt="md">
                    <SaveCustomerButton
                      label={t('saveFollowUp')}
                      size="xs"
                      variant="light"
                      initial={{
                        fullName: c.fullName,
                        phone: c.phone,
                        note: t('cancelledAsset', {
                          asset: c.lastAssetTitle || 'booking',
                        }),
                      }}
                    />
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
