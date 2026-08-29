'use client';

import {
  Box,
  Button,
  Collapse,
  MultiSelect,
  NumberInput,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { colors, radius, shadows } from '@/config/design-tokens';
import {
  ASSET_TAG_GROUPS,
  ASSET_TAGS,
  assetTagGroupLabel,
  assetTagLabel,
} from '@/config/asset-tags';
import { hasAdvancedExploreDefaults } from '@/lib/engines/explore-filters';
import { todayDateOnly } from '@/lib/dates';
import {
  IconCalendar,
  IconChevronDown,
  IconCoins,
  IconMapPin,
  IconTag,
  IconUsers,
} from '@/components/landing/LandingIcons';

function FieldLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Box mb={2} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Box c={colors.primary} style={{ display: 'flex' }}>
        {icon}
      </Box>
      <Text size="sm" fw={600} c={colors.textPrimary}>
        {label}
      </Text>
    </Box>
  );
}

function toNumberValue(
  value: string | number | undefined
): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return undefined;
}

function toDateOnly(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const slice = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : null;
  }
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function VillaSearch({
  defaultQ = '',
  defaultTags = [],
  defaultBudgetMin,
  defaultBudgetMax,
  defaultGuests,
  defaultCheckIn = '',
  defaultCheckOut = '',
  variant = 'landing',
  action = '/marketplace',
}: {
  defaultQ?: string;
  defaultTags?: string[];
  defaultBudgetMin?: number;
  defaultBudgetMax?: number;
  defaultGuests?: number;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  variant?: 'landing' | 'marketplace';
  /** Where the form submits — the guest dashboard searches its own route. */
  action?: string;
}) {
  const t = useTranslations('landing.villaSearch');
  const tTags = useTranslations('assetTags');
  const tagSelectData = useMemo(
    () =>
      ASSET_TAG_GROUPS.map((group) => ({
        group: assetTagGroupLabel(group.id, tTags),
        items: ASSET_TAGS.filter((tag) => tag.group === group.id).map(
          (tag) => ({
            value: tag.id,
            label: assetTagLabel(tag.id, tTags),
          })
        ),
      })),
    [tTags]
  );
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [budgetMin, setBudgetMin] = useState<string | number>(
    defaultBudgetMin ?? ''
  );
  const [budgetMax, setBudgetMax] = useState<string | number>(
    defaultBudgetMax ?? ''
  );
  const [guests, setGuests] = useState<string | number>(defaultGuests ?? '');
  const [range, setRange] = useState<[string | null, string | null]>([
    toDateOnly(defaultCheckIn || null),
    toDateOnly(defaultCheckOut || null),
  ]);
  const minDate = todayDateOnly();
  const [advanced, setAdvanced] = useState(() =>
    hasAdvancedExploreDefaults({
      budgetMin: defaultBudgetMin,
      budgetMax: defaultBudgetMax,
      guests: defaultGuests,
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
    })
  );

  const budgetMinValue = toNumberValue(budgetMin);
  const budgetMaxValue = toNumberValue(budgetMax);
  const guestsValue = toNumberValue(guests);

  return (
    <Box
      component="form"
      action={action}
      method="get"
      className={variant === 'landing' ? 'vbnb-landing-fade-up-delay' : undefined}
      style={{
        background: colors.surface,
        borderRadius: radius.xl,
        boxShadow: variant === 'landing' ? shadows.float : undefined,
        border: `1px solid ${colors.border}`,
        padding: 16,
      }}
    >
      {tags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}
      {budgetMinValue ? (
        <input type="hidden" name="budgetMin" value={budgetMinValue} />
      ) : null}
      {budgetMaxValue ? (
        <input type="hidden" name="budgetMax" value={budgetMaxValue} />
      ) : null}
      {guestsValue ? (
        <input type="hidden" name="guests" value={guestsValue} />
      ) : null}
      {range[0] ? (
        <input type="hidden" name="checkIn" value={range[0]} />
      ) : null}
      {range[1] ? (
        <input type="hidden" name="checkOut" value={range[1]} />
      ) : null}
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 16,
          alignItems: 'end',
        }}
        className="vbnb-villa-search-grid"
      >
        <Box>
          <FieldLabel icon={<IconMapPin />} label={t('locationLabel')} />
          <TextInput
            name="q"
            defaultValue={defaultQ}
            variant="unstyled"
            placeholder={t('locationPlaceholder')}
            aria-label={t('locationAria')}
            styles={{ input: { fontSize: 14, color: colors.textSecondary } }}
          />
        </Box>
        <Box className="vbnb-villa-search-divider">
          <FieldLabel icon={<IconTag />} label={t('tagsLabel')} />
          <MultiSelect
            data={tagSelectData}
            value={tags}
            onChange={setTags}
            variant="unstyled"
            placeholder={t('tagsPlaceholder')}
            searchable
            clearable
            hidePickedOptions
            maxDropdownHeight={280}
            comboboxProps={{ withinPortal: true, zIndex: 300 }}
            aria-label={t('tagsAria')}
            styles={{
              input: { fontSize: 14, minHeight: 28 },
              pillsList: { gap: 4 },
            }}
          />
        </Box>
        <Button
          type="submit"
          color="vbnbGreen"
          radius={radius.sm}
          h={46}
          px={22}
          fw={600}
          style={{ fontSize: 14 }}
        >
          {t('submit')}
        </Button>
      </Box>

      <UnstyledButton
        type="button"
        onClick={() => setAdvanced((open) => !open)}
        aria-expanded={advanced}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 12,
          color: colors.primary,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <Box
          style={{
            display: 'flex',
            transform: advanced ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        >
          <IconChevronDown size={16} />
        </Box>
        {t('advancedToggle')}
      </UnstyledButton>

      <Collapse expanded={advanced} keepMounted keepMountedMode="display-none">
        <Box className="vbnb-villa-search-advanced">
          <Box>
            <FieldLabel icon={<IconCoins />} label={t('budgetLabel')} />
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <NumberInput
                value={budgetMin}
                onChange={setBudgetMin}
                min={0}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={0}
                hideControls
                variant="unstyled"
                placeholder={t('budgetFrom')}
                aria-label={t('budgetFromAria')}
                styles={{ input: { fontSize: 14, color: colors.textSecondary } }}
              />
              <NumberInput
                value={budgetMax}
                onChange={setBudgetMax}
                min={0}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={0}
                hideControls
                variant="unstyled"
                placeholder={t('budgetTo')}
                aria-label={t('budgetToAria')}
                styles={{ input: { fontSize: 14, color: colors.textSecondary } }}
              />
            </Box>
            <Text size="xs" c="dimmed" mt={4}>
              {t('budgetHint')}
            </Text>
          </Box>
          <Box>
            <FieldLabel icon={<IconCalendar />} label={t('datesLabel')} />
            <DatePickerInput
              type="range"
              variant="unstyled"
              placeholder={t('datesPlaceholder')}
              valueFormat="DD/MM/YYYY"
              labelSeparator="–"
              minDate={minDate}
              weekendDays={[]}
              excludeDate={(date) => (toDateOnly(date) ?? '') < minDate}
              value={range}
              onChange={(value) => {
                const [start, end] = (value ?? [null, null]) as [
                  string | Date | null,
                  string | Date | null,
                ];
                setRange([toDateOnly(start), toDateOnly(end)]);
              }}
              clearable
              popoverProps={{ withinPortal: true, zIndex: 300 }}
              aria-label={t('datesAria')}
              styles={{ input: { fontSize: 14, color: colors.textSecondary } }}
            />
          </Box>
          <Box>
            <FieldLabel icon={<IconUsers />} label={t('guestsLabel')} />
            <NumberInput
              value={guests}
              onChange={setGuests}
              min={1}
              max={50}
              hideControls
              variant="unstyled"
              placeholder={t('guestsPlaceholder')}
              aria-label={t('guestsAria')}
              styles={{ input: { fontSize: 14, color: colors.textSecondary } }}
            />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
