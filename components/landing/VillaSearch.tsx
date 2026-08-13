'use client';

import { Box, Button, MultiSelect, Text, TextInput } from '@mantine/core';
import { useState } from 'react';
import { colors, radius, shadows } from '@/config/design-tokens';
import { ASSET_TAG_GROUPS, ASSET_TAGS } from '@/config/asset-tags';
import { IconMapPin, IconTag } from '@/components/landing/LandingIcons';

const TAG_SELECT_DATA = ASSET_TAG_GROUPS.map((group) => ({
  group: group.label,
  items: ASSET_TAGS.filter((t) => t.group === group.id).map((t) => ({
    value: t.id,
    label: t.label,
  })),
}));

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

export function VillaSearch({
  defaultQ = '',
  defaultTags = [],
  variant = 'landing',
  action = '/marketplace',
}: {
  defaultQ?: string;
  defaultTags?: string[];
  variant?: 'landing' | 'marketplace';
  /** Where the form submits — the guest dashboard searches its own route. */
  action?: string;
}) {
  const [tags, setTags] = useState<string[]>(defaultTags);

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
          <FieldLabel icon={<IconMapPin />} label="Địa điểm" />
          <TextInput
            name="q"
            defaultValue={defaultQ}
            variant="unstyled"
            placeholder="Bạn muốn đi đâu?"
            aria-label="Địa điểm"
            styles={{ input: { fontSize: 14, color: colors.textSecondary } }}
          />
        </Box>
        <Box className="vbnb-villa-search-divider">
          <FieldLabel icon={<IconTag />} label="Thuộc tính" />
          <MultiSelect
            data={TAG_SELECT_DATA}
            value={tags}
            onChange={setTags}
            variant="unstyled"
            placeholder="Hồ bơi, wifi, gần biển..."
            searchable
            clearable
            hidePickedOptions
            maxDropdownHeight={280}
            comboboxProps={{ withinPortal: true, zIndex: 300 }}
            aria-label="Thuộc tính villa"
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
          Tìm kiếm villas
        </Button>
      </Box>
    </Box>
  );
}
