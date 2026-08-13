'use client';

import {
  Badge,
  Button,
  Group,
  Pagination,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { colors, radius } from '@/config/design-tokens';
import { bookingStatusColors } from '@/config/booking-status';
import { MarkPaidButton } from '@/components/admin/MarkPaidButton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  hardDeleteBlockedMessage,
  type AdminUserRow,
} from '@/lib/engines/admin-user-shared';
import type {
  AdminUserTab,
  AdminUsersPage,
} from '@/lib/engines/admin-user-management';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';

const ROLE_TABS: { value: AdminUserTab; label: string }[] = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'SALE', label: 'Sale' },
  { value: 'GUEST', label: 'Guest' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TRASH', label: 'Trash' },
];

async function patchAdmin(body: Record<string, unknown>) {
  const res = await fetch('/api/admin', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function UserCard({
  user,
  plans,
  mode,
  busyId,
  currentAdminId,
  onAction,
}: {
  user: AdminUserRow;
  plans: SubscriptionPlan[];
  mode: 'active' | 'trash';
  busyId: string | null;
  currentAdminId: string;
  onAction: (
    action: 'remove_subscription' | 'soft_delete_user' | 'restore_user',
    profileId: string
  ) => Promise<void>;
}) {
  const sub = user.subscription;
  const active = sub?.status === 'ACTIVE';
  const tone = active
    ? bookingStatusColors.confirmed
    : bookingStatusColors.blocked;
  const rolePlans = plans.filter((p) => p.role === user.role);
  const loading = busyId === user.id;
  const isSelf = user.id === currentAdminId;

  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Group justify="space-between" wrap="wrap" align="flex-start">
        <div>
          <Text fw={600}>
            {user.full_name}{' '}
            <Text span size="sm" c="dimmed" fw={500}>
              · {user.role}
            </Text>
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            {user.phone || '—'} · {user.email || '—'}
          </Text>
          {mode === 'trash' && user.deleted_at ? (
            <Text size="xs" c="dimmed" mt={6}>
              Trash từ {new Date(user.deleted_at).toLocaleString('vi-VN')}
              {user.delete_reason ? ` · ${user.delete_reason}` : ''}
            </Text>
          ) : null}
        </div>
        <Group gap="xs">
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
            {sub ? `${sub.status} → ${sub.period_end}` : 'No sub'}
          </Badge>

          {mode === 'active' ? (
            <>
              {(user.role === 'OWNER' || user.role === 'SALE') && (
                <>
                  <MarkPaidButton profileId={user.id} plans={rolePlans} />
                  {active ? (
                    <Button
                      size="xs"
                      variant="light"
                      color="orange"
                      loading={loading}
                      onClick={() =>
                        onAction('remove_subscription', user.id)
                      }
                    >
                      Gỡ sub
                    </Button>
                  ) : null}
                </>
              )}
              {isSelf ? (
                <Tooltip label="Không thể đưa chính tài khoản đang đăng nhập vào trash">
                  <Button size="xs" variant="light" color="red" disabled>
                    Trash
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  loading={loading}
                  onClick={() => onAction('soft_delete_user', user.id)}
                >
                  Trash
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                size="xs"
                color="vbnbGreen"
                loading={loading}
                onClick={() => onAction('restore_user', user.id)}
              >
                Khôi phục
              </Button>
              <Tooltip label={hardDeleteBlockedMessage()}>
                <Button size="xs" color="red" variant="outline" disabled>
                  Xóa vĩnh viễn
                </Button>
              </Tooltip>
            </>
          )}
        </Group>
      </Group>
    </Paper>
  );
}

/**
 * Tab, search and page live in the URL: the list is paginated in the database,
 * so the server needs them to build the query. It used to receive every profile
 * and filter in the browser.
 */
export function AdminUsersPanel({
  users,
  plans,
  tab,
  q,
  page,
  totalPages,
  total,
  counts,
  currentAdminId,
}: AdminUsersPage & { currentAdminId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(q);
  const [debouncedQuery] = useDebouncedValue(query, 300);
  const [busyId, setBusyId] = useState<string | null>(null);
  const lastPushedQuery = useRef(q);

  function buildHref(next: { tab?: string; q?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === 1) params.delete(key);
      else params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  useEffect(() => {
    if (debouncedQuery === lastPushedQuery.current) return;
    lastPushedQuery.current = debouncedQuery;
    router.push(buildHref({ q: debouncedQuery, page: 1 }));
    // buildHref reads router-derived values that change together with the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  async function onAction(
    action: 'remove_subscription' | 'soft_delete_user' | 'restore_user',
    profileId: string
  ) {
    const confirmMsg =
      action === 'remove_subscription'
        ? 'Gỡ subscription ACTIVE của user này?'
        : action === 'soft_delete_user'
          ? 'Đưa user vào trash? (có thể khôi phục sau)'
          : 'Khôi phục user khỏi trash?';
    if (!window.confirm(confirmMsg)) return;

    setBusyId(profileId);
    try {
      const json = await patchAdmin({ action, profileId });
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Thất bại',
        });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message:
          action === 'remove_subscription'
            ? 'Đã gỡ subscription'
            : action === 'soft_delete_user'
              ? 'Đã đưa vào trash'
              : 'Đã khôi phục',
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const activeTab = ROLE_TABS.find((t) => t.value === tab) ?? ROLE_TABS[0];
  const mode = tab === 'TRASH' ? 'trash' : 'active';

  return (
    <Stack gap="md">
      <TextInput
        label="Tìm kiếm"
        placeholder="Tên, SĐT hoặc email..."
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        maw={420}
      />

      <Tabs
        value={tab}
        onChange={(value) =>
          router.push(buildHref({ tab: value || 'OWNER', page: 1 }))
        }
        color="vbnbGreen"
      >
        <Tabs.List mb="md">
          {ROLE_TABS.map((roleTab) => (
            <Tabs.Tab key={roleTab.value} value={roleTab.value}>
              {roleTab.label} ({counts[roleTab.value]})
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value={tab}>
          {!users.length ? (
            <EmptyState
              title={
                q
                  ? `Không tìm thấy “${q}”`
                  : tab === 'TRASH'
                    ? 'Trash trống'
                    : `Chưa có ${activeTab.label}`
              }
              description={
                q
                  ? 'Thử từ khóa khác hoặc đổi tab role / Trash.'
                  : tab === 'TRASH'
                    ? 'User soft-delete sẽ hiện ở đây để khôi phục.'
                    : 'User thuộc role này sẽ hiện tại đây.'
              }
            />
          ) : (
            <Stack gap="sm">
              {users.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  plans={plans}
                  mode={mode}
                  busyId={busyId}
                  currentAdminId={currentAdminId}
                  onAction={onAction}
                />
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

      {totalPages > 1 ? (
        <Group justify="center" mt="md" gap="md" wrap="wrap">
          <Text size="sm" c="dimmed">
            {total} user
          </Text>
          <Pagination
            value={page}
            onChange={(next) => router.push(buildHref({ page: next }))}
            total={totalPages}
            color="vbnbGreen"
            siblings={1}
            boundaries={1}
          />
        </Group>
      ) : null}
    </Stack>
  );
}
