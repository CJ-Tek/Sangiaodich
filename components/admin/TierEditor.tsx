'use client';

import {
  Button,
  Divider,
  NumberInput,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors, radius } from '@/config/design-tokens';

export type SaleTierRecord = {
  id: string;
  sort: number;
  label: string;
  min_lifetime_cost_volume: number;
  cost_discount_percent: number;
};

export type GuestTierRecord = {
  id: string;
  sort: number;
  label: string;
  min_books: number;
  min_gmv: number;
  discount_percent: number;
};

export function MembershipTiersEditor({
  kind,
  tiers,
}: {
  kind: 'sale' | 'guest';
  tiers: SaleTierRecord[] | GuestTierRecord[];
}) {
  const router = useRouter();
  const onSaved = () => router.refresh();

  return (
    <Stack gap="md">
      {tiers.map((t) =>
        kind === 'sale' ? (
          <SaleTierRow
            key={t.id}
            tier={t as SaleTierRecord}
            onSaved={onSaved}
          />
        ) : (
          <GuestTierRow
            key={t.id}
            tier={t as GuestTierRecord}
            onSaved={onSaved}
          />
        )
      )}
      <Divider label="Thêm tier mới" labelPosition="left" />
      <TierEditor kind={kind} onSaved={onSaved} />
    </Stack>
  );
}

/** Blank form to create a tier, or edit when `initial` is passed. */
export function TierEditor({
  kind,
  initial,
  onSaved,
  compact,
}: {
  kind: 'sale' | 'guest';
  initial?: SaleTierRecord | GuestTierRecord;
  onSaved?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isSale = kind === 'sale';
  const saleInit = initial as SaleTierRecord | undefined;
  const guestInit = initial as GuestTierRecord | undefined;

  const [form, setForm] = useState({
    id: String(initial?.id || ''),
    sort: Number(initial?.sort ?? 0),
    label: String(initial?.label || ''),
    minLifetimeCostVolume: Number(saleInit?.min_lifetime_cost_volume ?? 0),
    costDiscountPercent: Number(saleInit?.cost_discount_percent ?? 0),
    minBooks: Number(guestInit?.min_books ?? 0),
    minGmv: Number(guestInit?.min_gmv ?? 0),
    discountPercent: Number(guestInit?.discount_percent ?? 0),
  });

  async function save() {
    setLoading(true);
    try {
      const action = isSale ? 'upsert_sale_tier' : 'upsert_guest_tier';
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...form,
          id: form.id || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
      } else {
        notifications.show({ color: 'vbnbGreen', message: 'Đã lưu tier' });
        if (!form.id) {
          setForm({
            id: '',
            sort: 0,
            label: '',
            minLifetimeCostVolume: 0,
            costDiscountPercent: 0,
            minBooks: 0,
            minGmv: 0,
            discountPercent: 0,
          });
        }
        onSaved?.();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="sm">
      {!compact ? (
        <Title order={5}>{form.id ? 'Sửa tier' : 'Thêm tier'}</Title>
      ) : null}
      <NumberInput
        label="Sort"
        value={form.sort}
        onChange={(v) => setForm((f) => ({ ...f, sort: Number(v) || 0 }))}
      />
      <TextInput
        label="Label"
        value={form.label}
        onChange={(e) =>
          setForm((f) => ({ ...f, label: e.currentTarget.value }))
        }
      />
      {isSale ? (
        <>
          <NumberInput
            label="Min lifetime cost volume"
            value={form.minLifetimeCostVolume}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                minLifetimeCostVolume: Number(v) || 0,
              }))
            }
            thousandSeparator="."
            decimalSeparator=","
          />
          <NumberInput
            label="Cost discount %"
            value={form.costDiscountPercent}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                costDiscountPercent: Number(v) || 0,
              }))
            }
            min={0}
            max={100}
            decimalScale={2}
          />
        </>
      ) : (
        <>
          <NumberInput
            label="Min books"
            value={form.minBooks}
            onChange={(v) =>
              setForm((f) => ({ ...f, minBooks: Number(v) || 0 }))
            }
            min={0}
          />
          <NumberInput
            label="Min GMV"
            value={form.minGmv}
            onChange={(v) =>
              setForm((f) => ({ ...f, minGmv: Number(v) || 0 }))
            }
            thousandSeparator="."
            decimalSeparator=","
          />
          <NumberInput
            label="Discount %"
            value={form.discountPercent}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                discountPercent: Number(v) || 0,
              }))
            }
            min={0}
            max={100}
            decimalScale={2}
          />
        </>
      )}
      <Button
        color="vbnbGreen"
        loading={loading}
        onClick={save}
        size={compact ? 'xs' : 'sm'}
        w="fit-content"
      >
        Lưu tier
      </Button>
    </Stack>
  );
}

function SaleTierRow({
  tier,
  onSaved,
}: {
  tier: SaleTierRecord;
  onSaved: () => void;
}) {
  return (
    <Paper
      p="md"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Text size="xs" c="dimmed" mb="xs">
        #{tier.sort} · hiện ≥{' '}
        {Number(tier.min_lifetime_cost_volume).toLocaleString('vi-VN')} →{' '}
        {tier.cost_discount_percent}% off cost
      </Text>
      <TierEditor kind="sale" initial={tier} onSaved={onSaved} compact />
    </Paper>
  );
}

function GuestTierRow({
  tier,
  onSaved,
}: {
  tier: GuestTierRecord;
  onSaved: () => void;
}) {
  return (
    <Paper
      p="md"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Text size="xs" c="dimmed" mb="xs">
        #{tier.sort} · hiện {tier.min_books} books +{' '}
        {Number(tier.min_gmv).toLocaleString('vi-VN')} GMV →{' '}
        {tier.discount_percent}%
      </Text>
      <TierEditor kind="guest" initial={tier} onSaved={onSaved} compact />
    </Paper>
  );
}
