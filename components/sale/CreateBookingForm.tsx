'use client';

import {
  Button,
  NumberInput,
  Stack,
  Text,
  Title,
  Group,
  Paper,
  Stepper,
  Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useFormat } from '@/lib/i18n/use-format';
import {
  previewPricing,
  nightCostBreakdown,
  quoteAssetCosts,
  effectiveCost,
} from '@/lib/engines/pricing';
import {
  hasClosedConflict,
  hasConfirmedConflict,
  isNightBlocked,
  type DateRange,
} from '@/lib/engines/inventory';
import { colors, radius } from '@/config/design-tokens';
import { todayDateOnly } from '@/lib/dates';
import { GuestPicker } from '@/components/sale/GuestPicker';
import type { GuestOption } from '@/lib/engines/sale-guest-search';

export function CreateBookingForm({
  assetId,
  assetTitle,
  costWeekday,
  costWeekend,
  saleCostDiscountPercent = 0,
  guestSuggestions,
  confirmedRanges = [],
  awaitingOwnerRanges = [],
  closedNights = [],
  nightlyCosts = {},
}: {
  assetId: string;
  assetTitle?: string;
  costWeekday: number;
  costWeekend: number;
  saleCostDiscountPercent?: number;
  /** Saved customers only — the full list is searched on the server. */
  guestSuggestions: GuestOption[];
  confirmedRanges?: DateRange[];
  /** Soft-hold nights — highlight only, still selectable */
  awaitingOwnerRanges?: DateRange[];
  closedNights?: string[];
  nightlyCosts?: Record<string, number>;
}) {
  const router = useRouter();
  const t = useTranslations('sale.createBooking');
  const { formatNumber } = useFormat();
  const [step, setStep] = useState(0);
  const [guest, setGuest] = useState<GuestOption | null>(null);
  const guestId = guest?.value ?? null;
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  const [listPrice, setListPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const minDate = todayDateOnly();
  const quoted = quoteAssetCosts(
    costWeekday,
    costWeekend,
    saleCostDiscountPercent
  );

  function toDateOnly(value: string | Date) {
    if (typeof value === 'string') return value.slice(0, 10);
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function isPastDate(value: string | Date) {
    return toDateOnly(value) < minDate;
  }

  function getDayProps(date: string | Date) {
    const d = toDateOnly(date);
    if (isPastDate(d)) return {};
    if (isNightBlocked(d, confirmedRanges)) {
      return {
        disabled: true,
        style: {
          background: colors.dangerSoft,
          color: colors.danger,
          opacity: 1,
          textDecoration: 'line-through',
          fontWeight: 600,
        },
      };
    }
    if (closedNights.includes(d)) {
      return {
        disabled: true,
        style: {
          background: colors.surfaceMuted,
          color: colors.textMuted,
          opacity: 1,
          fontWeight: 600,
        },
      };
    }
    if (isNightBlocked(d, awaitingOwnerRanges)) {
      return {
        style: {
          background: colors.warningSoft,
          color: colors.warning,
          opacity: 1,
          fontWeight: 600,
        },
      };
    }
    return {};
  }

  const preview = useMemo(() => {
    if (!range[0] || !range[1]) return null;
    const checkIn = range[0];
    const checkOut = range[1];
    if (checkOut <= checkIn) return null;
    return previewPricing({
      checkIn,
      checkOut,
      costWeekday,
      costWeekend,
      listSelling: listPrice,
      saleCostDiscountPercent,
      nightlyCosts,
    });
  }, [
    range,
    listPrice,
    costWeekday,
    costWeekend,
    saleCostDiscountPercent,
    nightlyCosts,
  ]);

  const nights = useMemo(() => {
    if (!range[0] || !range[1] || range[1] <= range[0]) return [];
    return nightCostBreakdown(
      range[0],
      range[1],
      costWeekday,
      costWeekend,
      nightlyCosts
    ).map((row) => ({
      ...row,
      cost: effectiveCost(row.cost, saleCostDiscountPercent),
    }));
  }, [
    range,
    costWeekday,
    costWeekend,
    nightlyCosts,
    saleCostDiscountPercent,
  ]);

  const guestLabel = guest?.label;

  async function create() {
    if (!guestId || !range[0] || !range[1]) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          guestId,
          checkIn: range[0],
          checkOut: range[1],
          listPrice,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
        return;
      }
      notifications.show({ color: 'vbnbGreen', message: t('created') });
      router.push('/sale/bookings');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function canNext() {
    if (step === 1) return !!guestId;
    if (step === 2) {
      if (!range[0] || !range[1] || range[1] <= range[0] || range[0] < minDate) {
        return false;
      }
      return (
        !hasConfirmedConflict(
          { checkIn: range[0], checkOut: range[1] },
          confirmedRanges
        ) &&
        !hasClosedConflict(
          { checkIn: range[0], checkOut: range[1] },
          closedNights
        )
      );
    }
    if (step === 3)
      return listPrice > 0 && (!preview || listPrice >= preview.effectiveCost);
    return true;
  }

  return (
    <Stack gap="lg">
      <Stepper
        active={step}
        onStepClick={setStep}
        color="vbnbGreen"
        size="sm"
        allowNextStepsSelect={false}
      >
        <Stepper.Step label={t('stepProperty')} description={t('stepAsset')} />
        <Stepper.Step label={t('stepGuest')} description={t('stepGuestVi')} />
        <Stepper.Step label={t('stepDates')} description={t('stepDatesShort')} />
        <Stepper.Step label={t('stepPrice')} description={t('stepPriceVi')} />
        <Stepper.Step label={t('stepReview')} description={t('stepConfirm')} />
      </Stepper>

      {step === 0 ? (
        <Paper p="md" radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
          <Text size="sm" c="dimmed">
            {t('stepProperty')}
          </Text>
          <Title order={4} fw={600} mt={4}>
            {assetTitle || t('selectedAsset')}
          </Title>
          <Group mt="md" gap="xl">
            <div>
              <Text size="xs" c="dimmed">
                {t('costWd')}
                {quoted.discountPercent > 0
                  ? ` (−${quoted.discountPercent}%)`
                  : ''}
              </Text>
              <Text fw={500}>
                {formatNumber(quoted.effectiveWeekday)}
              </Text>
              {quoted.discountPercent > 0 ? (
                <Text size="xs" c="dimmed" td="line-through">
                  {formatNumber(costWeekday)}
                </Text>
              ) : null}
            </div>
            <div>
              <Text size="xs" c="dimmed">
                {t('costWe')}
                {quoted.discountPercent > 0
                  ? ` (−${quoted.discountPercent}%)`
                  : ''}
              </Text>
              <Text fw={500}>
                {formatNumber(quoted.effectiveWeekend)}
              </Text>
              {quoted.discountPercent > 0 ? (
                <Text size="xs" c="dimmed" td="line-through">
                  {formatNumber(costWeekend)}
                </Text>
              ) : null}
            </div>
          </Group>
        </Paper>
      ) : null}

      {step === 1 ? (
        <GuestPicker
          value={guest}
          onChange={setGuest}
          suggestions={guestSuggestions}
        />
      ) : null}

      {step === 2 ? (
        <Stack gap="sm">
          <DatePickerInput
            type="range"
            label={t('checkInOut')}
            description={t('legendFull')}
            minDate={minDate}
            weekendDays={[]}
            excludeDate={isPastDate}
            getDayProps={getDayProps}
            value={range}
            onChange={(value) =>
              setRange(value as [string | null, string | null])
            }
          />
          <Group gap="md" wrap="wrap">
            <Group gap={6}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: colors.dangerSoft,
                  border: `1px solid ${colors.danger}`,
                  display: 'inline-block',
                }}
              />
              <Text size="xs" c="dimmed">
                {t('legendLocked')}
              </Text>
            </Group>
            <Group gap={6}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: colors.warningSoft,
                  border: `1px solid ${colors.warning}`,
                  display: 'inline-block',
                }}
              />
              <Text size="xs" c="dimmed">
                {t('legendPending')}
              </Text>
            </Group>
          </Group>
          {range[0] &&
          range[1] &&
          range[1] > range[0] &&
          hasConfirmedConflict(
            { checkIn: range[0], checkOut: range[1] },
            confirmedRanges
          ) ? (
            <Text size="sm" c="red">
              {t('overlapError')}
            </Text>
          ) : null}
          {range[0] &&
          range[1] &&
          range[1] > range[0] &&
          !hasConfirmedConflict(
            { checkIn: range[0], checkOut: range[1] },
            confirmedRanges
          ) &&
          hasConfirmedConflict(
            { checkIn: range[0], checkOut: range[1] },
            awaitingOwnerRanges
          ) ? (
            <Text size="sm" c="yellow.8">
              {t('pendingWarning')}
            </Text>
          ) : null}
        </Stack>
      ) : null}

      {step === 3 ? (
        <Stack gap="md">
          {preview && nights.length > 0 ? (
            <Paper
              p="md"
              radius={radius.lg}
              style={{ border: `1px solid ${colors.border}` }}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-end">
                  <div>
                    <Text size="xs" c="dimmed">
                      {t('floorPrice')}
                    </Text>
                    <Text fw={700} size="xl">
                      {formatNumber(preview.effectiveCost)}
                    </Text>
                  </div>
                  <Text size="xs" c="dimmed">
                    {t('nights', { count: nights.length })} · {t('wd')}{' '}
                    {formatNumber(quoted.effectiveWeekday)} / {t('we')}{' '}
                    {formatNumber(quoted.effectiveWeekend)}
                  </Text>
                </Group>
                <Divider />
                <Stack gap={6}>
                  {nights.map((n) => (
                    <Group key={n.date} justify="space-between" gap="xs">
                      <Text size="sm">
                        {n.date}
                        <Text span size="xs" c="dimmed" ml={8}>
                          {n.weekend ? t('we') : t('wd')}
                        </Text>
                      </Text>
                      <Text size="sm" fw={500}>
                        {formatNumber(n.cost)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Text size="sm" c="dimmed">
              {t('pickDatesHint')}
            </Text>
          )}

          <NumberInput
            label={t('sellingPrice')}
            description={
              preview
                ? t('shouldBeFloor', {
                    amount: formatNumber(preview.effectiveCost),
                  })
                : undefined
            }
            value={listPrice}
            onChange={(v) => setListPrice(Number(v) || 0)}
            min={preview?.effectiveCost ?? 0}
            thousandSeparator="."
            decimalSeparator=","
          />
          {preview ? (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {t('margin')}
              </Text>
              <Text
                size="sm"
                fw={600}
                c={preview.saleMargin >= 0 ? 'vbnbGreen.6' : 'red'}
              >
                {formatNumber(preview.saleMargin)}
              </Text>
            </Group>
          ) : null}
        </Stack>
      ) : null}

      {step === 4 ? (
        <Paper p="md" radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
          <Stack gap="sm">
            <Title order={5} fw={600}>
              {t('stepReview')}
            </Title>
            <Text size="sm">
              <Text span c="dimmed">
                {t('summaryProperty')}{' '}
              </Text>
              {assetTitle}
            </Text>
            <Text size="sm">
              <Text span c="dimmed">
                {t('summaryGuest')}{' '}
              </Text>
              {guestLabel}
            </Text>
            <Text size="sm">
              <Text span c="dimmed">
                {t('summaryDates')}{' '}
              </Text>
              {range[0]} → {range[1]}
            </Text>
            <Text size="sm">
              <Text span c="dimmed">
                {t('summaryFloor')}{' '}
              </Text>
              {preview
                ? formatNumber(preview.effectiveCost)
                : '—'}
            </Text>
            <Text size="sm">
              <Text span c="dimmed">
                {t('summaryListPrice')}{' '}
              </Text>
              {formatNumber(listPrice)}
            </Text>
            {preview ? (
              <Text size="sm" c="vbnbGreen.6" fw={600}>
                {t('estMargin', {
                  amount: formatNumber(preview.saleMargin),
                })}
              </Text>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      <Group justify="space-between">
        <Button
          variant="default"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          {t('back')}
        </Button>
        {step < 4 ? (
          <Button
            color="vbnbGreen"
            disabled={!canNext()}
            onClick={() => setStep((s) => Math.min(4, s + 1))}
          >
            {t('continue')}
          </Button>
        ) : (
          <Button color="vbnbGreen" loading={loading} onClick={create}>
            {t('create')}
          </Button>
        )}
      </Group>
    </Stack>
  );
}
