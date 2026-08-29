'use client';

import {
  Badge,
  Button,
  Group,
  Pagination,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bookingStatusColors } from '@/config/booking-status';
import { MarkPaidButton } from '@/components/admin/MarkPaidButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useFormat } from '@/lib/i18n/use-format';
import type { AdminUserRow } from '@/lib/engines/admin-user-shared';
import type {
  AdminUserTab,
  AdminUsersPage,
} from '@/lib/engines/admin-user-management';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';

const ROLE_TABS: AdminUserTab[] = [
  'OWNER',
  'SALE',
  'GUEST',
  'ADMIN',
  'TRASH',
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
  const t = useTranslations('admin.users');
  const tErrors = useTranslations('errors');
  const { formatDateTime } = useFormat();
  const sub = user.subscription;
  const active = sub?.status === 'ACTIVE';
  const tone = active
    ? bookingStatusColors.confirmed
    : bookingStatusColors.blocked;
  const rolePlans = plans.filter((p) => p.role === user.role);
  const loading = busyId === user.id;
  const isSelf = user.id === currentAdminId;

  return (
    <SurfaceCard>
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
              {t('trashSince', {
                date: formatDateTime(user.deleted_at),
              })}
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
            {sub ? `${sub.status} → ${sub.period_end}` : t('noSub')}
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
                      {t('removeSub')}
                    </Button>
                  ) : null}
                </>
              )}
              {isSelf ? (
                <Tooltip label={t('cannotTrashSelf')}>
                  <Button size="xs" variant="light" color="red" disabled>
                    {t('trash')}
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
                  {t('trash')}
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
                {t('restore')}
              </Button>
              <Tooltip label={tErrors('ADMIN_USER.HARD_DELETE_DISABLED')}>
                <Button size="xs" color="red" variant="outline" disabled>
                  {t('hardDelete')}
                </Button>
              </Tooltip>
            </>
          )}
        </Group>
      </Group>
    </SurfaceCard>
  );
}

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
  const t = useTranslations('admin.users');
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
        ? t('confirmRemoveSub')
        : action === 'soft_delete_user'
          ? t('confirmTrash')
          : t('confirmRestore');
    if (!window.confirm(confirmMsg)) return;

    setBusyId(profileId);
    try {
      const json = await patchAdmin({ action, profileId });
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || t('failed'),
        });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message:
          action === 'remove_subscription'
            ? t('removedSub')
            : action === 'soft_delete_user'
              ? t('trashed')
              : t('restored'),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const mode = tab === 'TRASH' ? 'trash' : 'active';

  return (
    <Stack gap="md">
      <TextInput
        label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
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
            <Tabs.Tab key={roleTab} value={roleTab}>
              {t(`tabs.${roleTab}`)} ({counts[roleTab]})
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value={tab}>
          {!users.length ? (
            <EmptyState
              title={
                q
                  ? t('emptySearch', { query: q })
                  : tab === 'TRASH'
                    ? t('emptyTrash')
                    : t('emptyRole', { role: t(`tabs.${tab}`) })
              }
              description={
                q
                  ? t('emptySearchHint')
                  : tab === 'TRASH'
                    ? t('emptyTrashHint')
                    : t('emptyRoleHint')
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
            {t('userCount', { count: total })}
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
