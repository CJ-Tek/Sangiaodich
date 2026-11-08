'use client';

import { Box, Text, Title } from '@mantine/core';
import type { ComponentType } from 'react';
import { colors, radius, typography } from '@/config/design-tokens';
import { Reveal } from '@/components/landing/Reveal';

export type FeatureItem = {
  key: string;
  icon: ComponentType<{ size?: number }>;
  title: string;
  body: string;
};

export function FeatureList({ items }: { items: FeatureItem[] }) {
  return (
    <ul className="vbnb-feature-list">
      {items.map(({ key, icon: Icon, title, body }, index) => (
        <Reveal as="li" key={key} delay={index * 70}>
          <Box style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <Box
              aria-hidden
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: radius.md,
                background: colors.primarySoft,
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={20} />
            </Box>
            <div>
              <Title
                order={3}
                fw={600}
                mb={4}
                style={{ fontSize: '1rem', lineHeight: 1.4, letterSpacing: '-0.01em' }}
              >
                {title}
              </Title>
              <Text c={colors.textSecondary} style={{ fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight }}>
                {body}
              </Text>
            </div>
          </Box>
        </Reveal>
      ))}
    </ul>
  );
}
