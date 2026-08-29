'use client';

import {
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useFormat } from '@/lib/i18n/use-format';
import { colors, radius } from '@/config/design-tokens';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';

export function SubscriptionPlansEditor({
  plans,
}: {
  plans: SubscriptionPlan[];
}) {
  const t = useTranslations('admin.fees');
  const router = useRouter();
  const onSaved = () => router.refresh();
  const owner = plans.filter((p) => p.role === 'OWNER');
  const sale = plans.filter((p) => p.role === 'SALE');

  return (
    <Tabs defaultValue="owner" color="vbnbGreen">
      <Tabs.List mb="md">
        <Tabs.Tab value="owner">Owner ({owner.length})</Tabs.Tab>
        <Tabs.Tab value="sale">Sale ({sale.length})</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="owner">
        <PlanRoleSection plans={owner} onSaved={onSaved} emptyLabel={t('noPlans')} />
      </Tabs.Panel>

      <Tabs.Panel value="sale">
        <PlanRoleSection plans={sale} onSaved={onSaved} emptyLabel={t('noPlans')} />
      </Tabs.Panel>
    </Tabs>
  );
}

function PlanRoleSection({
  plans,
  onSaved,
  emptyLabel,
}: {
  plans: SubscriptionPlan[];
  onSaved: () => void;
  emptyLabel: string;
}) {
  if (!plans.length) {
    return (
      <Text size="sm" c="dimmed">
        {emptyLabel}
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {plans.map((plan) => (
        <PlanRow key={plan.id} plan={plan} onSaved={onSaved} />
      ))}
    </Stack>
  );
}

function PlanRow({
  plan,
  onSaved,
}: {
  plan: SubscriptionPlan;
  onSaved: () => void;
}) {
  const t = useTranslations('admin.fees');
  const { formatVnd, planDurationLabel } = useFormat();
  const [amount, setAmount] = useState(plan.amount);
  const [compareAtAmount, setCompareAtAmount] = useState<number | ''>(
    plan.compare_at_amount ?? ''
  );
  const [label, setLabel] = useState(
    plan.label || planDurationLabel(plan.months)
  );
  const [active, setActive] = useState(plan.is_active);
  const [loading, setLoading] = useState(false);

  const preview =
    typeof compareAtAmount === 'number' && compareAtAmount > amount
      ? Math.round(((compareAtAmount - amount) / compareAtAmount) * 100)
      : null;

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_subscription_plan',
          id: plan.id,
          amount,
          compareAtAmount:
            compareAtAmount === '' ? null : Number(compareAtAmount),
          label,
          isActive: active,
          sortOrder: plan.sort_order,
          months: plan.months,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: t('savedPlan', { label }),
        });
        onSaved();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper
      p="md"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            {planDurationLabel(plan.months)}
            <Text span size="xs" c="dimmed" fw={400} ml={8}>
              {t('planMonthsCurrent', {
                months: plan.months,
                amount: formatVnd(plan.amount),
              })}
            </Text>
          </Text>
          <Switch
            label={t('planActive')}
            checked={active}
            onChange={(e) => setActive(e.currentTarget.checked)}
          />
        </Group>
        <TextInput
          label={t('planLabel')}
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
        />
        <NumberInput
          label={t('planAmount')}
          description={t('planAmountHint')}
          value={amount}
          onChange={(v) => setAmount(Number(v) || 0)}
          thousandSeparator="."
          decimalSeparator=","
          min={1000}
        />
        <NumberInput
          label={t('planCompareAt')}
          description={t('planCompareAtHint')}
          value={compareAtAmount}
          onChange={(v) =>
            setCompareAtAmount(v === '' || v == null ? '' : Number(v) || 0)
          }
          thousandSeparator="."
          decimalSeparator=","
          min={0}
          allowNegative={false}
        />
        {preview ? (
          <Text size="xs" c="vbnbGreen.6" fw={500}>
            {t('planDiscountTag', { percent: preview })}
          </Text>
        ) : null}
        <Button
          size="xs"
          color="vbnbGreen"
          loading={loading}
          onClick={save}
          w="fit-content"
        >
          {t('savePlan')}
        </Button>
      </Stack>
    </Paper>
  );
}
