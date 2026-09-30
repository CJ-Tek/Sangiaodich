'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Group,
  Image,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { notifications } from '@mantine/notifications';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { OwnerAssetReviewControls } from '@/components/owner/OwnerAssetReviewControls';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { bookingStatusColors } from '@/config/booking-status';
import { colors, radius } from '@/config/design-tokens';
import { useFormat } from '@/lib/i18n/use-format';
import { submitAssetForReview } from '@/lib/owner/submit-asset-for-review';
import { foldVn } from '@/lib/search/vn-fold';
import { locationMatchesCity, vnCityOptions } from '@/lib/geo/vn-cities';

const PAGE_SIZE = 10;
const PLACEHOLDER =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400';

const STATUS_OPTIONS = [
  'ACTIVE',
  'PENDING_REVIEW',
  'DRAFT',
  'INACTIVE',
  'REJECTED',
  'SUSPENDED',
] as const;

export type OwnerAssetListRow = {
  id: string;
  title: string;
  status: string;
  location: string | null;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  costWeekday: number;
  costWeekend: number;
  imageUrl?: string | null;
  discountRules: {
    minCheckedOutCount: number;
    costDiscountPercent: number;
  }[];
};

type DiscountFilter = 'all' | 'with' | 'without';

function statusTone(status: string) {
  if (status === 'ACTIVE') return bookingStatusColors.confirmed;
  if (status === 'PENDING_REVIEW') return bookingStatusColors.hold;
  if (status === 'SUSPENDED' || status === 'REJECTED') {
    return bookingStatusColors.cancelled;
  }
  return bookingStatusColors.blocked;
}

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const tone = statusTone(status);
  return (
    <Badge
      variant="outline"
      styles={{
        root: {
          background: tone.bg,
          color: tone.text,
          borderColor: tone.border,
        },
      }}
    >
      {label}
    </Badge>
  );
}

function statusLabel(
  t: (key: string) => string,
  status: string
) {
  if ((STATUS_OPTIONS as readonly string[]).includes(status)) {
    return t(`statuses.${status}`);
  }
  return status;
}

export function OwnerAssetsList({
  rows,
  truncated,
}: {
  rows: OwnerAssetListRow[];
  truncated?: boolean;
}) {
  const t = useTranslations('owner.assets');
  const tReview = useTranslations('owner.reviewControls');
  const tPropertyTypes = useTranslations('propertyTypes');
  const locale = useLocale();
  const cityOptions = vnCityOptions(locale);
  const { formatNumber } = useFormat();
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 768px)') === true;

  const [query, setQuery] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState<number | string>('');
  const [priceMax, setPriceMax] = useState<number | string>('');
  const [minBedrooms, setMinBedrooms] = useState<string | null>(null);
  const [discount, setDiscount] = useState<DiscountFilter>('all');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const withDiscount = rows.filter((r) => r.discountRules.length > 0).length;

  const filtered = useMemo(() => {
    const q = foldVn(query.trim());
    const min =
      priceMin === '' || priceMin == null ? null : Number(priceMin);
    const max =
      priceMax === '' || priceMax == null ? null : Number(priceMax);
    const beds = minBedrooms ? Number(minBedrooms) : 0;

    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (city && !locationMatchesCity(r.location, city)) return false;
      if (propertyType && r.propertyType !== propertyType) return false;
      if (discount === 'with' && r.discountRules.length === 0) return false;
      if (discount === 'without' && r.discountRules.length > 0) return false;
      if (min != null && !Number.isNaN(min) && r.costWeekday < min) return false;
      if (max != null && !Number.isNaN(max) && r.costWeekday > max) return false;
      if (beds > 0 && r.bedrooms < beds) return false;
      if (!q) return true;
      return (
        foldVn(r.title).includes(q) || foldVn(r.location || '').includes(q)
      );
    });
  }, [
    rows,
    query,
    city,
    status,
    propertyType,
    discount,
    priceMin,
    priceMax,
    minBedrooms,
  ]);

  const filtersActive =
    Boolean(query.trim()) ||
    Boolean(city) ||
    Boolean(status) ||
    Boolean(propertyType) ||
    priceMin !== '' ||
    priceMax !== '' ||
    Boolean(minBedrooms) ||
    discount !== 'all';

  function resetFilters() {
    setQuery('');
    setCity(null);
    setStatus(null);
    setPropertyType(null);
    setPriceMin('');
    setPriceMax('');
    setMinBedrooms(null);
    setDiscount('all');
    setShown(PAGE_SIZE);
  }

  async function submitReview(assetId: string) {
    setSubmittingId(assetId);
    try {
      const result = await submitAssetForReview(assetId);
      if (!result.success) {
        notifications.show({
          color: 'red',
          message: result.message || tReview('submitFailed'),
        });
        return;
      }
      notifications.show({ color: 'vbnbGreen', message: tReview('submitted') });
      router.refresh();
    } finally {
      setSubmittingId(null);
    }
  }

  const visible = filtered.slice(0, shown);
  const selected = rows.find((r) => r.id === openId) ?? null;

  const filterBar = (
    <Paper
      p="md"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Stack gap="sm">
        <Group gap="sm" align="flex-end" wrap="wrap">
          <TextInput
            label={t('colProperty')}
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setShown(PAGE_SIZE);
            }}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            label={t('filterCity')}
            placeholder={t('filterCityAll')}
            clearable
            searchable
            value={city}
            onChange={(v) => {
              setCity(v);
              setShown(PAGE_SIZE);
            }}
            data={cityOptions}
            w={200}
          />
          <Select
            label={t('filterStatus')}
            placeholder={t('filterStatusAll')}
            clearable
            value={status}
            onChange={(v) => {
              setStatus(v);
              setShown(PAGE_SIZE);
            }}
            data={STATUS_OPTIONS.map((s) => ({
              value: s,
              label: statusLabel(t, s),
            }))}
            w={180}
          />
          <Select
            label={t('filterType')}
            placeholder={t('filterTypeAll')}
            clearable
            value={propertyType}
            onChange={(v) => {
              setPropertyType(v);
              setShown(PAGE_SIZE);
            }}
            data={[
              { value: 'VILLA', label: tPropertyTypes('VILLA') },
              { value: 'APARTMENT', label: tPropertyTypes('APARTMENT') },
            ]}
            w={160}
          />
          <NumberInput
            label={t('filterPriceMin')}
            placeholder="0"
            thousandSeparator="."
            decimalSeparator=","
            hideControls
            min={0}
            value={priceMin}
            onChange={(v) => {
              setPriceMin(v);
              setShown(PAGE_SIZE);
            }}
            w={140}
          />
          <NumberInput
            label={t('filterPriceMax')}
            placeholder="—"
            thousandSeparator="."
            decimalSeparator=","
            hideControls
            min={0}
            value={priceMax}
            onChange={(v) => {
              setPriceMax(v);
              setShown(PAGE_SIZE);
            }}
            w={140}
          />
          <Select
            label={t('filterBedrooms')}
            placeholder={t('filterBedroomsAny')}
            clearable
            value={minBedrooms}
            onChange={(v) => {
              setMinBedrooms(v);
              setShown(PAGE_SIZE);
            }}
            data={[
              { value: '1', label: '1+' },
              { value: '2', label: '2+' },
              { value: '3', label: '3+' },
              { value: '4', label: '4+' },
              { value: '5', label: '5+' },
            ]}
            w={120}
          />
          <Select
            label={t('filterDiscount')}
            value={discount}
            onChange={(v) => {
              setDiscount((v as DiscountFilter) || 'all');
              setShown(PAGE_SIZE);
            }}
            data={[
              { value: 'all', label: t('filterAll', { count: rows.length }) },
              {
                value: 'with',
                label: t('filterWithDiscount', { count: withDiscount }),
              },
              {
                value: 'without',
                label: t('filterNoDiscount', {
                  count: rows.length - withDiscount,
                }),
              },
            ]}
            w={200}
          />
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {t('resultCount', { count: filtered.length })}
            {truncated ? ` · ${t('showingRecent', { count: rows.length })}` : ''}
          </Text>
          {filtersActive ? (
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={resetFilters}
            >
              {t('filterReset')}
            </Button>
          ) : null}
        </Group>
      </Stack>
    </Paper>
  );

  function actionsFor(a: OwnerAssetListRow) {
    const has = a.discountRules.length > 0;
    const canSubmit = a.status === 'DRAFT' || a.status === 'REJECTED';
    return (
      <Group gap={6} wrap="wrap" justify="flex-end">
        <Button
          variant="light"
          color="vbnbGreen"
          size="compact-xs"
          onClick={() => setOpenId(a.id)}
        >
          {has
            ? t('discountCount', { count: a.discountRules.length })
            : t('discount')}
        </Button>
        {canSubmit ? (
          <Button
            variant="light"
            color="vbnbGreen"
            size="compact-xs"
            loading={submittingId === a.id}
            onClick={() => void submitReview(a.id)}
          >
            {tReview('submit')}
          </Button>
        ) : null}
        <LinkButton
          href={`/owner/assets/${a.id}/edit`}
          variant="default"
          size="compact-xs"
        >
          {tReview('edit')}
        </LinkButton>
      </Group>
    );
  }

  return (
    <Stack gap="md">
      {filterBar}

      {!filtered.length ? (
        <EmptyState
          title={t('noMatch')}
          description={
            filtersActive ? t('noMatchHint') : t('emptyCreateHint')
          }
        />
      ) : isDesktop ? (
        <Paper
          radius={radius.lg}
          style={{ border: `1px solid ${colors.border}` }}
        >
          <Table
            horizontalSpacing="md"
            verticalSpacing="sm"
            highlightOnHover
            layout="fixed"
            w="100%"
          >
            <Table.Thead
              style={{
                background: colors.surfaceMuted,
              }}
            >
              <Table.Tr>
                <Table.Th>{t('colProperty')}</Table.Th>
                <Table.Th style={{ width: 100 }}>{t('colType')}</Table.Th>
                <Table.Th style={{ width: 80 }}>{t('colRooms')}</Table.Th>
                <Table.Th style={{ width: 110 }}>{t('colCostWd')}</Table.Th>
                <Table.Th style={{ width: 110 }}>{t('colCostWe')}</Table.Th>
                <Table.Th style={{ width: 120 }}>{t('colStatus')}</Table.Th>
                <Table.Th style={{ width: 160, textAlign: 'right' }}>
                  {t('colActions')}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visible.map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                      <Box
                        style={{
                          width: 64,
                          height: 48,
                          flexShrink: 0,
                          borderRadius: radius.sm,
                          overflow: 'hidden',
                          background: colors.surfaceMuted,
                        }}
                      >
                        <Image
                          src={a.imageUrl || PLACEHOLDER}
                          alt={a.title}
                          w={64}
                          h={48}
                          fit="cover"
                        />
                      </Box>
                        <div style={{ minWidth: 0 }}>
                          <Text
                            component={Link}
                            href={`/owner/assets/${a.id}/edit`}
                            fw={600}
                            size="sm"
                            lineClamp={1}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {a.title}
                          </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {a.location || '—'}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {a.propertyType === 'APARTMENT'
                        ? tPropertyTypes('APARTMENT')
                        : tPropertyTypes('VILLA')}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" className="vbnb-tabular-nums">
                      {a.bedrooms} / {a.bathrooms}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500} className="vbnb-tabular-nums">
                      {formatNumber(a.costWeekday)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500} className="vbnb-tabular-nums">
                      {formatNumber(a.costWeekend)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge
                      status={a.status}
                      label={statusLabel(t, a.status)}
                    />
                  </Table.Td>
                  <Table.Td>{actionsFor(a)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : (
        <Stack gap="sm">
          {visible.map((a) => (
            <Paper
              key={a.id}
              p="md"
              radius={radius.lg}
              style={{
                position: 'relative',
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
              }}
            >
              <Link
                href={`/owner/assets/${a.id}/edit`}
                aria-label={a.title}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 0,
                  borderRadius: 'inherit',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
              <OwnerAssetReviewControls
                assetId={a.id}
                status={a.status}
                extraActions={
                  <Button
                    variant="light"
                    color="vbnbGreen"
                    size="compact-sm"
                    onClick={() => setOpenId(a.id)}
                  >
                    {a.discountRules.length
                      ? t('discountCount', {
                          count: a.discountRules.length,
                        })
                      : t('discount')}
                  </Button>
                }
              >
                <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <Box
                    style={{
                      width: 88,
                      height: 66,
                      flexShrink: 0,
                      borderRadius: radius.md,
                      overflow: 'hidden',
                      background: colors.surfaceMuted,
                    }}
                  >
                    <Image
                      src={a.imageUrl || PLACEHOLDER}
                      alt={a.title}
                      w={88}
                      h={66}
                      fit="cover"
                    />
                  </Box>
                  <div style={{ minWidth: 0 }}>
                    <Text fw={600}>{a.title}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {a.propertyType === 'APARTMENT'
                        ? tPropertyTypes('APARTMENT')
                        : tPropertyTypes('VILLA')}
                      {a.location ? ` · ${a.location}` : ''}
                      {` · ${t('bedroomsBathrooms', {
                        bedrooms: a.bedrooms,
                        bathrooms: a.bathrooms,
                      })}`}
                    </Text>
                    <Text size="sm" c="dimmed" mt={6}>
                      {t('costWd')} {formatNumber(a.costWeekday)} ·{' '}
                      {t('costWe')} {formatNumber(a.costWeekend)}
                    </Text>
                  </div>
                </Group>
              </OwnerAssetReviewControls>
              </div>
            </Paper>
          ))}
        </Stack>
      )}

      {filtered.length > shown ? (
        <Button
          variant="subtle"
          color="vbnbGreen"
          size="xs"
          w="fit-content"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
        >
          {t('showMore', { count: filtered.length - shown })}
        </Button>
      ) : null}

      <Modal
        opened={Boolean(selected)}
        onClose={() => setOpenId(null)}
        title={selected?.title || t('discount')}
        centered
      >
        {selected ? (
          <Stack gap="sm">
            {selected.location ? (
              <Text size="sm" c="dimmed">
                {selected.location}
              </Text>
            ) : null}
            {selected.discountRules.length ? (
              selected.discountRules.map((r) => (
                <Text key={r.minCheckedOutCount} size="sm">
                  {t('tierRule', {
                    count: r.minCheckedOutCount,
                    percent: r.costDiscountPercent,
                  })}
                </Text>
              ))
            ) : (
              <Text size="sm" c="dimmed">
                {t('noDiscount')}
              </Text>
            )}
            <LinkButton
              href={`/owner/assets/${selected.id}/edit`}
              color="vbnbGreen"
              size="sm"
            >
              {t('editOnSetup')}
            </LinkButton>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
