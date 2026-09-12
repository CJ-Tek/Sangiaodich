'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type {
  NightBoardFilterValues,
  NightBoardSort,
} from '@/lib/engines/night-board-filters';
import { nightBoardFilterParams } from '@/lib/engines/night-board-filters';
import { isVnCityId, vnCityOptions } from '@/lib/geo/vn-cities';

const DEBOUNCE_MS = 250;

function toPrice(value: number | string): number | null {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function sameFilters(
  a: NightBoardFilterValues,
  b: NightBoardFilterValues
): boolean {
  return (
    a.q === b.q &&
    a.city === b.city &&
    a.propertyType === b.propertyType &&
    a.priceMin === b.priceMin &&
    a.priceMax === b.priceMax &&
    a.minBedrooms === b.minBedrooms &&
    a.sort === b.sort
  );
}

export function NightBoardSearch({
  href,
  from,
  today,
  initial,
  searchLabel,
  searchPlaceholder,
}: {
  href: string;
  from?: string;
  today?: string;
  initial: NightBoardFilterValues;
  searchLabel: string;
  searchPlaceholder: string;
}) {
  const t = useTranslations('inventory.boardFilters');
  const tPropertyTypes = useTranslations('propertyTypes');
  const locale = useLocale();
  const router = useRouter();
  const cityOptions = vnCityOptions(locale);

  const [q, setQ] = useState(initial.q);
  const [city, setCity] = useState<string | null>(initial.city);
  const [propertyType, setPropertyType] = useState<string | null>(
    initial.propertyType
  );
  const [priceMin, setPriceMin] = useState<number | string>(
    initial.priceMin ?? ''
  );
  const [priceMax, setPriceMax] = useState<number | string>(
    initial.priceMax ?? ''
  );
  const [minBedrooms, setMinBedrooms] = useState<string | null>(
    initial.minBedrooms != null ? String(initial.minBedrooms) : null
  );
  const [sort, setSort] = useState<NightBoardSort>(initial.sort);

  useEffect(() => {
    setQ(initial.q);
    setCity(initial.city);
    setPropertyType(initial.propertyType);
    setPriceMin(initial.priceMin ?? '');
    setPriceMax(initial.priceMax ?? '');
    setMinBedrooms(
      initial.minBedrooms != null ? String(initial.minBedrooms) : null
    );
    setSort(initial.sort);
  }, [
    initial.q,
    initial.city,
    initial.propertyType,
    initial.priceMin,
    initial.priceMax,
    initial.minBedrooms,
    initial.sort,
  ]);

  const draft: NightBoardFilterValues = {
    q: q.trim(),
    city: isVnCityId(city) ? city : null,
    propertyType:
      propertyType === 'VILLA' || propertyType === 'APARTMENT'
        ? propertyType
        : null,
    priceMin: toPrice(priceMin),
    priceMax: toPrice(priceMax),
    minBedrooms: minBedrooms ? Number(minBedrooms) : null,
    sort,
  };

  const filtersActive =
    Boolean(draft.q) ||
    Boolean(draft.city) ||
    Boolean(draft.propertyType) ||
    draft.priceMin != null ||
    draft.priceMax != null ||
    draft.minBedrooms != null ||
    draft.sort !== 'default';

  useEffect(() => {
    if (sameFilters(draft, initial)) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (from && today && from !== today) params.set('from', from);
      for (const [key, value] of Object.entries(
        nightBoardFilterParams(draft)
      )) {
        if (value) params.set(key, value);
      }
      const qs = params.toString();
      router.push(qs ? `${href}?${qs}` : href);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional field deps
  }, [
    draft.q,
    draft.city,
    draft.propertyType,
    draft.priceMin,
    draft.priceMax,
    draft.minBedrooms,
    draft.sort,
    initial.q,
    initial.city,
    initial.propertyType,
    initial.priceMin,
    initial.priceMax,
    initial.minBedrooms,
    initial.sort,
    from,
    today,
    href,
    router,
  ]);

  function resetFilters() {
    setQ('');
    setCity(null);
    setPropertyType(null);
    setPriceMin('');
    setPriceMax('');
    setMinBedrooms(null);
    setSort('default');
  }

  return (
    <Stack gap="sm">
      <Group gap="sm" align="flex-end" wrap="wrap">
        <TextInput
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Select
          label={t('city')}
          placeholder={t('cityAll')}
          clearable
          searchable
          value={city}
          onChange={setCity}
          data={cityOptions}
          w={200}
        />
        <Select
          label={t('type')}
          placeholder={t('typeAll')}
          clearable
          value={propertyType}
          onChange={setPropertyType}
          data={[
            { value: 'VILLA', label: tPropertyTypes('VILLA') },
            { value: 'APARTMENT', label: tPropertyTypes('APARTMENT') },
          ]}
          w={160}
        />
        <NumberInput
          label={t('priceMin')}
          placeholder="0"
          thousandSeparator="."
          decimalSeparator=","
          hideControls
          min={0}
          value={priceMin}
          onChange={setPriceMin}
          w={140}
        />
        <NumberInput
          label={t('priceMax')}
          placeholder="—"
          thousandSeparator="."
          decimalSeparator=","
          hideControls
          min={0}
          value={priceMax}
          onChange={setPriceMax}
          w={140}
        />
        <Select
          label={t('bedrooms')}
          placeholder={t('bedroomsAny')}
          clearable
          value={minBedrooms}
          onChange={setMinBedrooms}
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
          label={t('sort')}
          value={sort}
          onChange={(v) => setSort((v as NightBoardSort) || 'default')}
          data={[
            { value: 'default', label: t('sortDefault') },
            { value: 'title_asc', label: t('sortTitleAsc') },
            { value: 'title_desc', label: t('sortTitleDesc') },
            { value: 'price_asc', label: t('sortPriceAsc') },
            { value: 'price_desc', label: t('sortPriceDesc') },
            { value: 'beds_asc', label: t('sortBedsAsc') },
            { value: 'beds_desc', label: t('sortBedsDesc') },
          ]}
          w={200}
        />
      </Group>
      {filtersActive ? (
        <Group justify="flex-end">
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            onClick={resetFilters}
          >
            {t('reset')}
          </Button>
        </Group>
      ) : null}
    </Stack>
  );
}
