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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import {
  formatVnd,
  planDurationLabel,
  type SubscriptionPlan,
} from '@/lib/engines/subscription-plans';

export function SubscriptionPlansEditor({
  plans,
}: {
  plans: SubscriptionPlan[];
}) {
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
        <PlanRoleSection plans={owner} onSaved={onSaved} />
      </Tabs.Panel>

      <Tabs.Panel value="sale">
        <PlanRoleSection plans={sale} onSaved={onSaved} />
      </Tabs.Panel>
    </Tabs>
  );
}

function PlanRoleSection({
  plans,
  onSaved,
}: {
  plans: SubscriptionPlan[];
  onSaved: () => void;
}) {
  if (!plans.length) {
    return (
      <Text size="sm" c="dimmed">
        Chưa có gói nào.
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
          message: `Đã lưu gói ${label}`,
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
              ({plan.months} tháng · hiện {formatVnd(plan.amount)})
            </Text>
          </Text>
          <Switch
            label="Bật"
            checked={active}
            onChange={(e) => setActive(e.currentTarget.checked)}
          />
        </Group>
        <TextInput
          label="Nhãn hiển thị"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
        />
        <NumberInput
          label="Giá gói thanh toán (VND)"
          description="Số tiền CK / SePay phải khớp chính xác."
          value={amount}
          onChange={(v) => setAmount(Number(v) || 0)}
          thousandSeparator="."
          decimalSeparator=","
          min={1000}
        />
        <NumberInput
          label="Giá gốc so sánh (VND)"
          description="Để trống nếu không giảm giá. Phải lớn hơn giá thanh toán."
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
            Tag: −{preview}%
          </Text>
        ) : null}
        <Button
          size="xs"
          color="vbnbGreen"
          loading={loading}
          onClick={save}
          w="fit-content"
        >
          Lưu gói
        </Button>
      </Stack>
    </Paper>
  );
}
