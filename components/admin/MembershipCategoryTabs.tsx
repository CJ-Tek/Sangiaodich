'use client';

import { Paper } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import {
  MembershipTiersEditor,
  type GuestTierRecord,
} from '@/components/admin/TierEditor';

export function MembershipCategoryTabs({
  guest,
}: {
  guest: GuestTierRecord[];
}) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      maw={640}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <MembershipTiersEditor kind="guest" tiers={guest} />
    </Paper>
  );
}
