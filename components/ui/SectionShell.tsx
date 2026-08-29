import { Box, Stack, Text, Title } from '@mantine/core';
import { colors, layout, spacing, typography } from '@/config/design-tokens';
import type { ReactNode } from 'react';

export function SectionShell({
  id,
  title,
  description,
  eyebrow,
  children,
  large = false,
  containerClassName = 'vbnb-landing-container',
}: {
  id?: string;
  title?: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  large?: boolean;
  containerClassName?: string;
}) {
  return (
    <Box
      component="section"
      id={id}
      className={large ? 'vbnb-landing-section vbnb-landing-section--lg' : 'vbnb-landing-section'}
    >
      <Stack gap={spacing['3xl']} className={containerClassName}>
        {title || description || eyebrow ? (
          <Stack gap="sm" maw={layout.contentMax * 0.55}>
            {eyebrow ? <span className="vbnb-eyebrow">{eyebrow}</span> : null}
            {title ? (
              <Title
                order={2}
                fw={600}
                className="vbnb-text-balance"
                style={{
                  fontSize: typography.title.fontSize,
                  lineHeight: typography.title.lineHeight,
                  letterSpacing: typography.title.letterSpacing,
                  color: colors.textPrimary,
                }}
              >
                {title}
              </Title>
            ) : null}
            {description ? (
              <Text
                size="md"
                style={{
                  color: colors.textSecondary,
                  lineHeight: typography.body.lineHeight,
                  maxWidth: `${layout.proseMax}rem`,
                }}
              >
                {description}
              </Text>
            ) : null}
          </Stack>
        ) : null}
        {children}
      </Stack>
    </Box>
  );
}
