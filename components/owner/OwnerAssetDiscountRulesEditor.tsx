'use client';

import { Button, Group, NumberInput, Stack, Text } from '@mantine/core';
import { MAX_ASSET_DISCOUNT_RULES } from '@/lib/engines/membership';

export type AssetDiscountRuleForm = {
  minCheckedOutCount: number;
  costDiscountPercent: number;
};

export function OwnerAssetDiscountRulesEditor({
  rules,
  onChange,
}: {
  rules: AssetDiscountRuleForm[];
  onChange: (next: AssetDiscountRuleForm[]) => void;
}) {
  function update(i: number, patch: Partial<AssetDiscountRuleForm>) {
    onChange(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  return (
    <Stack gap="sm">
      <div>
        <Text size="sm" fw={500}>
          Chiết khấu Sale theo căn
        </Text>
        <Text size="xs" c="dimmed">
          Để trống = 0%. Áp dụng khi Sale check-out trên căn này nhiều hơn mốc
          (21 lần mới được “trên 20”). Booking đã chốt không đổi. Không có trần
          Admin — lời/lỗ là của bạn.
        </Text>
      </div>
      {rules.map((r, i) => (
        <Group key={i} gap="sm" align="flex-end" wrap="wrap">
          <NumberInput
            label="Trên (lần)"
            min={0}
            decimalScale={0}
            value={r.minCheckedOutCount}
            onChange={(v) =>
              update(i, { minCheckedOutCount: Math.max(0, Number(v) || 0) })
            }
            style={{ flex: 1, minWidth: 120 }}
          />
          <NumberInput
            label="% giảm cost"
            min={0}
            max={100}
            decimalScale={2}
            value={r.costDiscountPercent}
            onChange={(v) =>
              update(i, {
                costDiscountPercent: Math.min(100, Math.max(0, Number(v) || 0)),
              })
            }
            style={{ flex: 1, minWidth: 120 }}
          />
          <Button
            variant="subtle"
            color="red"
            size="xs"
            onClick={() => onChange(rules.filter((_, j) => j !== i))}
          >
            Xóa
          </Button>
        </Group>
      ))}
      {rules.length < MAX_ASSET_DISCOUNT_RULES ? (
        <Button
          variant="light"
          color="vbnbGreen"
          size="xs"
          w="fit-content"
          onClick={() =>
            onChange([...rules, { minCheckedOutCount: 20, costDiscountPercent: 3 }])
          }
        >
          Thêm mốc
        </Button>
      ) : null}
    </Stack>
  );
}
