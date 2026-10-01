'use client';

import {
  Badge,
  Group,
  Paper,
  Stack,
  Table,
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
            <Paper radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
              <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
                <Table.Thead style={{ background: colors.surfaceMuted }}>
                  <Table.Tr>
                    <Table.Th>{t('colName')}</Table.Th>
                    <Table.Th>{t('colPhone')}</Table.Th>
                    <Table.Th>{t('colTier')}</Table.Th>
                    <Table.Th>{t('totalSpend')}</Table.Th>
                    <Table.Th>{t('colBookings')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredClosed.map((c) => (
                    <Table.Tr key={c.guestId}>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {c.fullName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {c.atMaxTier
                            ? t('tierMax')
                            : t('tierProgress', {
                                bookings: c.remainingBooks ?? 0,
                                amount: formatNumber(c.remainingGmv || 0),
                                tier: c.nextTierLabel ?? '',
                              })}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{c.phone}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="vbnbGreen" variant="light">
                          {c.tierLabel}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {formatNumber(c.totalPaidNet)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {t('bookingCount', { count: c.bookingCount })}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
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
            <Paper radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
              <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
                <Table.Thead style={{ background: colors.surfaceMuted }}>
                  <Table.Tr>
                    <Table.Th>{t('colName')}</Table.Th>
                    <Table.Th>{t('colPhone')}</Table.Th>
                    <Table.Th>{t('colChannel')}</Table.Th>
                    <Table.Th>{t('followUp')}</Table.Th>
                    <Table.Th>{t('colActions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredSaved.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {c.full_name}
                        </Text>
                        {c.note ? (
                          <Text size="xs" c="dimmed">
                            {c.note}
                          </Text>
                        ) : null}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{c.phone}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
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
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {c.next_follow_up_at
                            ? formatDateTime(c.next_follow_up_at)
                            : '—'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t('lastContact')}{' '}
                          {c.last_contact_at
                            ? formatDateTime(c.last_contact_at)
                            : '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td onClick={(e) => e.stopPropagation()}>
                        <SavedCustomerActions customer={c} />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
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
            <Paper radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
              <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
                <Table.Thead style={{ background: colors.surfaceMuted }}>
                  <Table.Tr>
                    <Table.Th>{t('colName')}</Table.Th>
                    <Table.Th>{t('colPhone')}</Table.Th>
                    <Table.Th>{t('bookingLabel')}</Table.Th>
                    <Table.Th>{t('lastCancelled')}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredCancelled.map((c) => (
                    <Table.Tr key={c.guestId}>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {c.fullName}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{c.phone}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {c.lastAssetTitle || t('bookingLabel')}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t('cancelCount', { count: c.cancelCount })}
                          {' · '}
                          {t('refundShort', {
                            refund: formatNumber(c.lastRefundAmount),
                            kept: formatNumber(c.lastKeptAmount),
                          })}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {c.lastCancelledAt
                            ? formatDateTime(c.lastCancelledAt)
                            : '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
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
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
