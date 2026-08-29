'use client';

import { Button, Group, NumberInput, Stack, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('owner.discountRules');

  function update(i: number, patch: Partial<AssetDiscountRuleForm>) {
    onChange(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  return (
    <Stack gap="sm">
      <div>
        <Text size="sm" fw={500}>
          {t('title')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('description')}
        </Text>
      </div>
      {rules.map((r, i) => (
        <Group key={i} gap="sm" align="flex-end" wrap="wrap">
          <NumberInput
            label={t('threshold')}
            min={0}
            decimalScale={0}
            value={r.minCheckedOutCount}
            onChange={(v) =>
              update(i, { minCheckedOutCount: Math.max(0, Number(v) || 0) })
            }
            style={{ flex: 1, minWidth: 120 }}
          />
          <NumberInput
            label={t('percent')}
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
            {t('remove')}
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
          {t('add')}
        </Button>
      ) : null}
    </Stack>
  );
}
