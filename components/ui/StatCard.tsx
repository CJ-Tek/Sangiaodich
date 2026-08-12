import { Paper, Text, Stack } from '@mantine/core';
import { colors, radius, shadows } from '@/config/design-tokens';
import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
  emphasis = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  emphasis?: 'hero' | 'default';
}) {
  const isHero = emphasis === 'hero';

  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        boxShadow: shadows.card,
        height: '100%',
      }}
    >
      <Stack gap={8}>
        <Text
          size="sm"
          fw={500}
          style={{ color: colors.textSecondary, letterSpacing: '0.01em' }}
        >
          {label}
        </Text>
        <Text
          component="div"
          fw={600}
          style={{
            fontSize: isHero ? 36 : 28,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: colors.textPrimary,
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Text>
        {hint ? (
          <Text size="sm" style={{ color: colors.textMuted }}>
            {hint}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
}
