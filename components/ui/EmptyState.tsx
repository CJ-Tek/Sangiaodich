'use client';

import { Stack, Text, Button, Box } from '@mantine/core';
import { colors, spacing } from '@/config/design-tokens';
import { Link } from '@/lib/i18n/navigation';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { SectionTitle } from '@/components/ui/SectionTitle';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  href,
  actionVariant = 'filled',
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  /** Use a quieter variant when the page already has its own primary action. */
  actionVariant?: 'filled' | 'light' | 'default';
}) {
  return (
    <SurfaceCard py={spacing['5xl']} px="md">
      <Stack align="center" gap="md">
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: colors.primarySoft,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Box
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: colors.primary,
              opacity: 0.6,
            }}
          />
        </Box>
        <SectionTitle ta="center" className="vbnb-text-balance">
          {title}
        </SectionTitle>
        {description ? (
          <Text c="dimmed" size="sm" ta="center" maw={360} style={{ lineHeight: 1.55 }}>
            {description}
          </Text>
        ) : null}
        {actionLabel && href ? (
          <Button
            component={Link}
            href={href}
            color="vbnbGreen"
            variant={actionVariant}
            mt="xs"
          >
            {actionLabel}
          </Button>
        ) : null}
        {actionLabel && onAction && !href ? (
          <Button
            onClick={onAction}
            color="vbnbGreen"
            variant={actionVariant}
            mt="xs"
          >
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}
