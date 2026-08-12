import { Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/LinkButton';
import { loadAdminOverviewStats } from '@/lib/engines/admin-overview';
import { formatVnd } from '@/lib/engines/subscription-plans';
import { colors, radius } from '@/config/design-tokens';

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Title order={3} fw={600} mt={4}>
        {value}
      </Title>
      {hint ? (
        <Text size="xs" c="dimmed" mt={4}>
          {hint}
        </Text>
      ) : null}
    </Paper>
  );
}

function monthLabel(yearMonth: string) {
  const [y, m] = yearMonth.split('-');
  return `Tháng ${m}/${y}`;
}

export default async function AdminHomePage() {
  const stats = await loadAdminOverviewStats();

  return (
    <Stack gap={40}>
      <PageHeader
        title="Admin"
        description="Pending actions first — cấu hình sàn."
      />

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
              Assets awaiting approval
            </Text>
          </div>
          <LinkButton href="/admin/assets" color="vbnbGreen">
            Review queue
          </LinkButton>
        </Group>
      </Paper>

      <div>
        <Text fw={600} mb="sm">
          Doanh thu
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <StatCard
            label="Tổng đã thu"
            value={formatVnd(stats.revenueAll)}
            hint="SePay + Admin mark paid"
          />
          <StatCard
            label={monthLabel(stats.yearMonth)}
            value={formatVnd(stats.revenueMonth)}
            hint="User trả phí trong tháng"
          />
        </SimpleGrid>
      </div>

      <div>
        <Text fw={600} mb="sm">
          Người dùng
        </Text>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <StatCard
            label="Active"
            value={stats.activePaidUsers}
            hint="Owner/Sale còn hạn sub"
          />
          <StatCard label="Khách" value={stats.guests} />
          <StatCard label="Owner" value={stats.owners} />
          <StatCard label="Sale" value={stats.sales} />
        </SimpleGrid>
      </div>

      <div>
        <Text fw={600} mb="sm">
          Vận hành
        </Text>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
          <StatCard label="Total assets" value={stats.totalAssets} />
          <StatCard label="Booking đã chốt" value={stats.firmBookings} />
          <StatCard label="Đã hoàn thành" value={stats.completedBookings} />
          <StatCard label="Lead requests" value={stats.leadRequests} />
        </SimpleGrid>
      </div>
    </Stack>
  );
}
