'use client';

import { Stack, Text, Button, Title, Box } from '@mantine/core';
import { colors, spacing } from '@/config/design-tokens';
import { Link } from '@/lib/i18n/navigation';
import { SurfaceCard } from '@/components/ui/SurfaceCard';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  href,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
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
        <Title order={4} fw={600} ta="center" className="vbnb-text-balance">
          {title}
        </Title>
        {description ? (
          <Text c="dimmed" size="sm" ta="center" maw={360} style={{ lineHeight: 1.55 }}>
            {description}
          </Text>
        ) : null}
        {actionLabel && href ? (
          <Button component={Link} href={href} color="vbnbGreen" mt="xs">
            {actionLabel}
          </Button>
        ) : null}
        {actionLabel && onAction && !href ? (
          <Button onClick={onAction} color="vbnbGreen" mt="xs">
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}
