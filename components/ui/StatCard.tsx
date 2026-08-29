import { Text, Stack } from '@mantine/core';
import { colors, typography } from '@/config/design-tokens';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
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
    <SurfaceCard style={{ height: '100%' }}>
      <Stack gap={8}>
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          style={{
            color: colors.textSecondary,
            letterSpacing: typography.label.letterSpacing,
          }}
        >
          {label}
        </Text>
        <Text
          component="div"
          fw={600}
          className="vbnb-tabular-nums"
          style={{
            fontSize: isHero ? typography.data.fontSize : '1.375rem',
            letterSpacing: typography.data.letterSpacing,
            lineHeight: typography.data.lineHeight,
            color: colors.textPrimary,
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Text>
        {hint ? (
          <Text size="xs" c="dimmed" style={{ lineHeight: 1.45 }}>
            {hint}
          </Text>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}
