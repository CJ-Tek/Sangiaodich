import { getLocale, getTranslations } from 'next-intl/server';
import { pageTitle } from '@/lib/seo/page-title';
import { Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/LinkButton';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { loadAdminOverviewStats } from '@/lib/engines/admin-overview';
import { formatVnd } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import { colors, radius } from '@/config/design-tokens';

export const generateMetadata = pageTitle('admin.overview');

export default async function AdminHomePage() {
  const t = await getTranslations('admin.overview');
  const locale = (await getLocale()) as AppLocale;
  const stats = await loadAdminOverviewStats();
  const [year, month] = stats.yearMonth.split('-');

  return (
    <Stack gap={40}>
      <PageHeader title={t('title')} description={t('description')} />

      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Group justify="space-between" wrap="wrap">
          <div>
            <Text
              style={{
                fontSize: 40,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {stats.pendingAssets}
            </Text>
            <Text c="dimmed" mt={6}>
              {t('pendingAssets')}
            </Text>
          </div>
          <LinkButton href="/admin/assets" color="vbnbGreen">
            {t('reviewQueue')}
          </LinkButton>
        </Group>
      </Paper>

      <div>
        <SectionTitle mb="sm">{t('revenue')}</SectionTitle>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <StatCard
            label={t('revenueAll')}
            value={formatVnd(stats.revenueAll, locale)}
            hint={t('revenueAllHint')}
          />
          <StatCard
            label={t('monthLabel', { month, year })}
            value={formatVnd(stats.revenueMonth, locale)}
            hint={t('revenueMonthHint')}
          />
        </SimpleGrid>
      </div>

      <div>
        <SectionTitle mb="sm">{t('users')}</SectionTitle>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <StatCard
            label={t('activePaid')}
            value={stats.activePaidUsers}
            hint={t('activePaidHint')}
          />
          <StatCard label={t('guests')} value={stats.guests} />
          <StatCard label={t('owners')} value={stats.owners} />
          <StatCard label={t('sales')} value={stats.sales} />
        </SimpleGrid>
      </div>

      <div>
        <SectionTitle mb="sm">{t('operations')}</SectionTitle>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <StatCard label={t('totalAssets')} value={stats.totalAssets} />
          <StatCard label={t('firmBookings')} value={stats.firmBookings} />
          <StatCard
            label={t('completedBookings')}
            value={stats.completedBookings}
          />
          <StatCard label={t('leadRequests')} value={stats.leadRequests} />
        </SimpleGrid>
      </div>
    </Stack>
  );
}
