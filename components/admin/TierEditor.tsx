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
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useFormat } from '@/lib/i18n/use-format';
import { colors, radius } from '@/config/design-tokens';

export type GuestTierRecord = {
  id: string;
  sort: number;
  label: string;
  min_books: number;
  min_gmv: number;
};

export function MembershipTiersEditor({
  kind,
  tiers,
}: {
  kind: 'guest';
  tiers: GuestTierRecord[];
}) {
  const t = useTranslations('admin.membership');
  const router = useRouter();
  const onSaved = () => router.refresh();

  return (
    <Stack gap="md">
      {tiers.map((tier) => (
        <GuestTierRow key={tier.id} tier={tier} onSaved={onSaved} />
      ))}
      <Divider label={t('addTier')} labelPosition="left" />
      <TierEditor kind={kind} onSaved={onSaved} />
    </Stack>
  );
}

export function TierEditor({
  kind,
  initial,
  onSaved,
  compact,
}: {
  kind: 'guest';
  initial?: GuestTierRecord;
  onSaved?: () => void;
  compact?: boolean;
}) {
  const t = useTranslations('admin.membership');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  void kind;

  const [form, setForm] = useState({
    id: String(initial?.id || ''),
    sort: Number(initial?.sort ?? 0),
    label: String(initial?.label || ''),
    minBooks: Number(initial?.min_books ?? 0),
    minGmv: Number(initial?.min_gmv ?? 0),
  });

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_guest_tier',
          ...form,
          id: form.id || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || t('saveTierFailed'),
        });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: t('tierSaved'),
        });
        if (!form.id) {
          setForm({
            id: '',
            sort: 0,
            label: '',
            minBooks: 0,
            minGmv: 0,
          });
        }
        onSaved?.();
        router.refresh();
      }
    } catch {
      notifications.show({
        color: 'red',
        message: t('connectionFailed'),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="sm">
      {!compact ? (
        <Title order={5}>
          {form.id ? t('editTier') : t('addTierTitle')}
        </Title>
      ) : null}
      <NumberInput
        label={t('sort')}
        value={form.sort}
        onChange={(v) => setForm((f) => ({ ...f, sort: Number(v) || 0 }))}
      />
      <TextInput
        label={t('labelField')}
        value={form.label}
        onChange={(e) => {
          const label = e.currentTarget.value;
          setForm((f) => ({ ...f, label }));
        }}
      />
      <NumberInput
        label={t('minBooks')}
        value={form.minBooks}
        onChange={(v) =>
          setForm((f) => ({ ...f, minBooks: Number(v) || 0 }))
        }
        min={0}
      />
      <NumberInput
        label={t('minGmv')}
        value={form.minGmv}
        onChange={(v) =>
          setForm((f) => ({ ...f, minGmv: Number(v) || 0 }))
        }
        thousandSeparator="."
        decimalSeparator=","
      />
      <Button
        color="vbnbGreen"
        loading={loading}
        onClick={save}
        size={compact ? 'xs' : 'sm'}
        w="fit-content"
      >
        {t('saveTier')}
      </Button>
    </Stack>
  );
}

function GuestTierRow({
  tier,
  onSaved,
}: {
  tier: GuestTierRecord;
  onSaved: () => void;
}) {
  const t = useTranslations('admin.membership');
  const { formatNumber } = useFormat();

  return (
    <Paper
      p="md"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Text size="xs" c="dimmed" mb="xs">
        {t('tierRequirement', {
          sort: tier.sort,
          books: tier.min_books,
          gmv: formatNumber(Number(tier.min_gmv)),
        })}
      </Text>
      <TierEditor kind="guest" initial={tier} onSaved={onSaved} compact />
    </Paper>
  );
}
