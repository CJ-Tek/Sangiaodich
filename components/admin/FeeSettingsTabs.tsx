'use client';

import { Tabs } from '@mantine/core';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  parseFeeSettingTab,
  type FeeSettingTab,
} from '@/components/admin/fee-setting-tabs';

export function FeeSettingsTabs({
  tab,
  subscription,
  payout,
}: {
  tab: FeeSettingTab;
  subscription: ReactNode;
  payout: ReactNode;
}) {
  const router = useRouter();

  return (
    <Tabs
      value={tab}
      onChange={(value) => {
        const next = parseFeeSettingTab(value);
        router.replace(`/admin/fees?tab=${next}`);
      }}
      color="vbnbGreen"
    >
      <Tabs.List mb="md" style={{ flexWrap: 'wrap' }}>
        <Tabs.Tab value="subscription">Gói subscription</Tabs.Tab>
        <Tabs.Tab value="payout">Tài khoản nhận tiền</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="subscription">{subscription}</Tabs.Panel>
      <Tabs.Panel value="payout">{payout}</Tabs.Panel>
    </Tabs>
  );
}
