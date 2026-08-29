'use client';

import { Tabs } from '@mantine/core';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
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
  const t = useTranslations('admin.fees');
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
        <Tabs.Tab value="subscription">{t('tabs.subscription')}</Tabs.Tab>
        <Tabs.Tab value="payout">{t('tabs.payout')}</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="subscription">{subscription}</Tabs.Panel>
      <Tabs.Panel value="payout">{payout}</Tabs.Panel>
    </Tabs>
  );
}
