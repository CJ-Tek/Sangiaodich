'use client';

import { Tabs } from '@mantine/core';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  parseSaleSettingTab,
  type SaleSettingTab,
} from '@/components/sale/sale-setting-tabs';

export function SaleSettingsTabs({
  tab,
  profile,
  payout,
  membership,
  subscription,
  hidePayout = false,
}: {
  tab: SaleSettingTab;
  profile: ReactNode;
  payout: ReactNode;
  membership: ReactNode;
  subscription: ReactNode;
  hidePayout?: boolean;
}) {
  const router = useRouter();

  return (
    <Tabs
      value={tab}
      onChange={(value) => {
        const next = parseSaleSettingTab(value, { hidePayout });
        router.replace(`/sale/settings?tab=${next}`);
      }}
      color="vbnbGreen"
    >
      <Tabs.List mb="md" style={{ flexWrap: 'wrap' }}>
        <Tabs.Tab value="profile">Profile</Tabs.Tab>
        {hidePayout ? null : (
          <Tabs.Tab value="payout">TK nhận tiền</Tabs.Tab>
        )}
        <Tabs.Tab value="membership">Membership</Tabs.Tab>
        <Tabs.Tab value="subscription">Subscription</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="profile">{profile}</Tabs.Panel>
      {hidePayout ? null : (
        <Tabs.Panel value="payout">{payout}</Tabs.Panel>
      )}
      <Tabs.Panel value="membership">{membership}</Tabs.Panel>
      <Tabs.Panel value="subscription">{subscription}</Tabs.Panel>
    </Tabs>
  );
}
