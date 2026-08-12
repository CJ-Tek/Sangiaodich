'use client';

import { Stack, Text, Button, Title } from '@mantine/core';
import Link from 'next/link';
import { colors, radius } from '@/config/design-tokens';

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
    <Stack
      align="center"
      gap="sm"
      py={56}
      px="md"
      style={{
        background: colors.surface,
        borderRadius: radius.lg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Title order={4} fw={600}>
        {title}
      </Title>
      {description ? (
        <Text c="dimmed" size="sm" ta="center" maw={360}>
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
  );
}
