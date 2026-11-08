import { Title, type TitleOrder, type TitleProps } from '@mantine/core';
import { colors, typography } from '@/config/design-tokens';
import type { ReactNode } from 'react';

const levels = {
  section: { order: 2, style: typography.section },
  card: { order: 3, style: typography.cardTitle },
} as const;

/**
 * In-app heading with a fixed visual size per level, so the semantic order can
 * follow the page outline (h1 page → h2 section → h3 card) without changing looks.
 */
export function SectionTitle({
  children,
  level = 'section',
  order,
  style,
  ...rest
}: Omit<TitleProps, 'order'> & {
  children: ReactNode;
  level?: keyof typeof levels;
  order?: TitleOrder;
}) {
  const preset = levels[level];
  return (
    <Title
      order={order ?? preset.order}
      {...rest}
      style={{
        color: colors.textPrimary,
        fontSize: preset.style.fontSize,
        lineHeight: preset.style.lineHeight,
        letterSpacing: preset.style.letterSpacing,
        fontWeight: preset.style.fontWeight,
        ...(typeof style === 'object' && !Array.isArray(style) ? style : null),
      }}
    >
      {children}
    </Title>
  );
}
