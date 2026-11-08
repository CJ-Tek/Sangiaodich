import { Box, Text, Title } from '@mantine/core';
import { colors, typography } from '@/config/design-tokens';
import { Reveal } from '@/components/landing/Reveal';
import type { ReactNode } from 'react';

export function SectionShell({
  id,
  title,
  description,
  eyebrow,
  children,
  large = false,
  align = 'left',
  tone = 'default',
  headingId,
  containerClassName = 'vbnb-landing-container',
}: {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
  large?: boolean;
  align?: 'left' | 'center';
  /** `surface` = white band with hairline borders, to alternate with the page background. */
  tone?: 'default' | 'surface';
  headingId?: string;
  containerClassName?: string;
}) {
  const resolvedHeadingId = headingId ?? (id ? `${id}-heading` : undefined);
  const sectionClass = [
    'vbnb-landing-section',
    large ? 'vbnb-landing-section--lg' : '',
    tone === 'surface' ? 'vbnb-landing-section--surface' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Box
      component="section"
      id={id}
      className={sectionClass}
      aria-labelledby={title ? resolvedHeadingId : undefined}
    >
      <div className={containerClassName}>
        {title || description || eyebrow ? (
          <Reveal
            className={
              align === 'center'
                ? 'vbnb-section-head vbnb-section-head--center'
                : 'vbnb-section-head'
            }
          >
            {eyebrow ? <span className="vbnb-eyebrow">{eyebrow}</span> : null}
            {title ? (
              <Title
                id={resolvedHeadingId}
                order={2}
                fw={typography.title.fontWeight}
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
                className="vbnb-text-balance"
                style={{
                  color: colors.textSecondary,
                  lineHeight: typography.body.lineHeight,
                }}
              >
                {description}
              </Text>
            ) : null}
          </Reveal>
        ) : null}
        {children}
      </div>
    </Box>
  );
}
