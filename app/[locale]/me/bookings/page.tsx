import { getLocale, getTranslations } from 'next-intl/server';
import { localeRedirect } from '@/lib/i18n/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Paper, Stack, Text, Group } from '@mantine/core';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { colors, radius } from '@/config/design-tokens';
import { formatCurrency } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import { loadGuestBookings } from '@/lib/engines/guest-bookings';

export default async function MyBookingsPage() {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('guest.bookings');
  const profile = await getSessionProfile();
  if (!profile) return await localeRedirect('/login?next=/me/bookings');
  if (profile.role === 'SALE') return await localeRedirect('/sale/bookings');

  const bookings = await loadGuestBookings(profile.id);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      {!bookings.length ? (
        <EmptyState
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          actionLabel={t('emptyAction')}
          href="/me/explore"
        />
      ) : (
        <Stack gap="sm">
          {bookings.map((b) => (
            <Paper
              key={b.id}
              p="lg"
              radius={radius.lg}
              style={{ border: `1px solid ${colors.border}` }}
            >
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <div>
                  <Text fw={600}>{b.assetTitle}</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {b.checkIn} → {b.checkOut}
                  </Text>
                  <LinkAnchor
                    href={`/me/bookings/${b.id}`}
                    size="sm"
                    c="vbnbGreen.6"
                    mt={6}
                    display="inline-block"
                  >
                    {t('viewDetail')}
                  </LinkAnchor>
                </div>
                <Stack gap={2} align="flex-end">
                  <BookingStatusBadge status={b.status} />
                  <Text size="sm" fw={600} mt={6}>
                    {formatCurrency(b.listPrice, locale)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {b.remaining > 0
                      ? b.remainderPayee === 'OWNER'
                        ? t('remainingOwner', {
                            amount: formatCurrency(b.remaining, locale),
                          })
                        : t('remainingSale', {
                            amount: formatCurrency(b.remaining, locale),
                          })
                      : t('paidFull')}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </>
  );
}
