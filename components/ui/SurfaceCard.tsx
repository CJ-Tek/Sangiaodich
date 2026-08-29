'use client';

import { Paper, type PaperProps } from '@mantine/core';
import { colors, radius, shadows } from '@/config/design-tokens';
import type { ReactNode } from 'react';

type SurfaceCardProps = PaperProps & {
  children: ReactNode;
  interactive?: boolean;
  flat?: boolean;
};

export function SurfaceCard({
  children,
  interactive = false,
  flat = false,
  p = 'lg',
  className,
  ...props
}: SurfaceCardProps) {
  const classes = [
    flat ? 'vbnb-surface-flat' : 'vbnb-surface-card',
    interactive ? 'vbnb-surface-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Paper
      p={p}
      radius={radius.lg}
      shadow={flat ? 'none' : 'xs'}
      className={classes}
      {...props}
      style={{
        background: colors.surface,
        ...(flat
          ? {
              border: 'none',
              boxShadow: 'none',
            }
          : {
              border: `1px solid ${colors.border}`,
              boxShadow: shadows.card,
            }),
        ...props.style,
      }}
    >
      {children}
    </Paper>
  );
}
