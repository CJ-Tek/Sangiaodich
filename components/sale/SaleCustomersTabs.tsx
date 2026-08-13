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

function formatMoney(n: number) {
  return n.toLocaleString('vi-VN');
}

function timeLabel(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN');
}

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
          label="Tìm kiếm"
          placeholder="Tên hoặc số điện thoại..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <SaveCustomerButton />
      </Group>

      <Tabs defaultValue={defaultTab} color="vbnbGreen">
        <Tabs.List mb="md">
          <Tabs.Tab value="closed">
            Đã chốt ({filteredClosed.length})
          </Tabs.Tab>
          <Tabs.Tab value="saved">Đã lưu ({filteredSaved.length})</Tabs.Tab>
          <Tabs.Tab value="cancelled">
            Đã hủy ({filteredCancelled.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="closed">
          {!closed.length ? (
            <EmptyState
              title="Chưa có khách đã chốt"
              description="Khi bạn confirm booking, khách sẽ hiện ở đây với tier và tổng chi net."
              actionLabel="Open bookings"
              href="/sale/bookings"
            />
          ) : !filteredClosed.length ? (
            <EmptyState
              title={q ? `Không tìm thấy “${q}”` : 'Không có kết quả'}
              description="Thử tên hoặc số điện thoại khác — khách có thể còn ở tab Đã lưu / Đã hủy."
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
                        Tổng chi (net)
                      </Text>
                      <Text fw={600}>{formatMoney(c.totalPaidNet)}</Text>
                      <Text size="xs" c="dimmed">
                        {c.bookingCount} booking
                      </Text>
                    </Stack>
                  </Group>
                  <Text size="sm" mt="md">
                    {c.atMaxTier
                      ? 'Đã ở hạng cao nhất.'
                      : `Còn ${c.remainingBooks} booking · ${formatMoney(c.remainingGmv || 0)} để lên ${c.nextTierLabel}`}
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="saved">
          {!saved.length ? (
            <EmptyState
              title="Chưa lưu khách follow-up"
              description="Lưu khách đã liên hệ ngoài hệ thống để nhắc follow-up sau."
            />
          ) : !filteredSaved.length ? (
            <EmptyState
              title={q ? `Không tìm thấy “${q}”` : 'Không có kết quả'}
              description="Thử tên hoặc số điện thoại khác — khách có thể còn ở tab Đã chốt / Đã hủy."
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
                      <Text size="sm">{timeLabel(c.next_follow_up_at)}</Text>
                      <Text size="xs" c="dimmed">
                        Liên hệ gần nhất: {timeLabel(c.last_contact_at)}
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
              title="Chưa có khách hủy"
              description="Booking CANCELLED sẽ hiện ở đây để bạn follow lại sau."
            />
          ) : !filteredCancelled.length ? (
            <EmptyState
              title={q ? `Không tìm thấy “${q}”` : 'Không có kết quả'}
              description="Thử tên hoặc số điện thoại khác — khách có thể còn ở tab Đã chốt / Đã lưu."
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
                        {c.lastAssetTitle || 'Booking'}
                        {' · '}
                        {c.cancelCount} lần hủy
                      </Text>
                    </Stack>
                    <Stack gap={2} align="flex-end">
                      <Text size="xs" c="dimmed">
                        Hủy gần nhất
                      </Text>
                      <Text size="sm">{timeLabel(c.lastCancelledAt)}</Text>
                      <Text size="xs" c="dimmed">
                        Hoàn {formatMoney(c.lastRefundAmount)} · giữ{' '}
                        {formatMoney(c.lastKeptAmount)}
                      </Text>
                    </Stack>
                  </Group>
                  <Group mt="md">
                    <SaveCustomerButton
                      label="Lưu để follow-up"
                      size="xs"
                      variant="light"
                      initial={{
                        fullName: c.fullName,
                        phone: c.phone,
                        note: `Khách hủy trước đó (${c.lastAssetTitle || 'booking'})`,
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
