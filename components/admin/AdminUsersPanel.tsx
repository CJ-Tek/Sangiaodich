'use client';

import {
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, radius } from '@/config/design-tokens';
import { bookingStatusColors } from '@/config/booking-status';
import { MarkPaidButton } from '@/components/admin/MarkPaidButton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  hardDeleteBlockedMessage,
  matchesAdminUserSearch,
  type AdminUserRow,
} from '@/lib/engines/admin-user-shared';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';
import type { UserRole } from '@/lib/types';

const ROLE_TABS: { value: UserRole | 'TRASH'; label: string }[] = [
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

export function AdminUsersPanel({
  users,
  plans,
  currentAdminId,
}: {
  users: AdminUserRow[];
  plans: SubscriptionPlan[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const activeUsers = useMemo(
    () => users.filter((u) => !u.deleted_at),
    [users]
  );
  const trashUsers = useMemo(
    () => users.filter((u) => Boolean(u.deleted_at)),
    [users]
  );

  const filteredByRole = useMemo(() => {
    const match = (list: AdminUserRow[]) =>
      list.filter((u) =>
        matchesAdminUserSearch(query, u.full_name, u.phone, u.email)
      );
    return {
      OWNER: match(activeUsers.filter((u) => u.role === 'OWNER')),
      SALE: match(activeUsers.filter((u) => u.role === 'SALE')),
      GUEST: match(activeUsers.filter((u) => u.role === 'GUEST')),
      ADMIN: match(activeUsers.filter((u) => u.role === 'ADMIN')),
      TRASH: match(trashUsers),
    } as const;
  }, [activeUsers, trashUsers, query]);

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

  const q = query.trim();

  return (
    <Stack gap="md">
      <TextInput
        label="Tìm kiếm"
        placeholder="Tên, SĐT hoặc email..."
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        maw={420}
      />

      <Tabs defaultValue="OWNER" color="vbnbGreen">
        <Tabs.List mb="md">
          {ROLE_TABS.map((tab) => (
            <Tabs.Tab key={tab.value} value={tab.value}>
              {tab.label} ({filteredByRole[tab.value].length})
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {ROLE_TABS.map((tab) => {
          const list = filteredByRole[tab.value];
          const mode = tab.value === 'TRASH' ? 'trash' : 'active';
          const emptyTitle = q
            ? `Không tìm thấy “${q}”`
            : tab.value === 'TRASH'
              ? 'Trash trống'
              : `Chưa có ${tab.label}`;

          return (
            <Tabs.Panel key={tab.value} value={tab.value}>
              {!list.length ? (
                <EmptyState
                  title={emptyTitle}
                  description={
                    q
                      ? 'Thử từ khóa khác hoặc đổi tab role / Trash.'
                      : tab.value === 'TRASH'
                        ? 'User soft-delete sẽ hiện ở đây để khôi phục.'
                        : 'User thuộc role này sẽ hiện tại đây.'
                  }
                />
              ) : (
                <Stack gap="sm">
                  {list.map((u) => (
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
          );
        })}
      </Tabs>
    </Stack>
  );
}
