'use client';

import { Paper, Tabs } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import {
  MembershipTiersEditor,
  type GuestTierRecord,
  type SaleTierRecord,
} from '@/components/admin/TierEditor';

export function MembershipCategoryTabs({
  sale,
  guest,
}: {
  sale: SaleTierRecord[];
  guest: GuestTierRecord[];
}) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      maw={560}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Tabs defaultValue="sale" color="vbnbGreen">
        <Tabs.List mb="md">
          <Tabs.Tab value="sale">Sale ({sale.length})</Tabs.Tab>
          <Tabs.Tab value="guest">Guest ({guest.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sale">
          <MembershipTiersEditor kind="sale" tiers={sale} />
        </Tabs.Panel>

        <Tabs.Panel value="guest">
          <MembershipTiersEditor kind="guest" tiers={guest} />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
