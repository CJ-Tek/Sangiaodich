'use client';

import { Anchor, Group, Text } from '@mantine/core';
import { Link } from '@/lib/i18n/navigation';
import { colors } from '@/config/design-tokens';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb">
      <Group gap={6} wrap="wrap" mb="xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const canLink = Boolean(item.href) && !isLast;

          return (
            <Group key={`${item.label}-${index}`} gap={6} wrap="nowrap">
              {index > 0 ? (
                <Text size="sm" c="dimmed" aria-hidden>
                  /
                </Text>
              ) : null}
              {canLink ? (
                <Anchor
                  component={Link}
                  href={item.href!}
                  size="sm"
                  c="dimmed"
                  underline="hover"
                  style={{ color: colors.textSecondary }}
                >
                  {item.label}
                </Anchor>
              ) : (
                <Text
                  size="sm"
                  fw={isLast ? 600 : 400}
                  c={isLast ? undefined : 'dimmed'}
                  style={isLast ? { color: colors.textPrimary } : undefined}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </Text>
              )}
            </Group>
          );
        })}
      </Group>
    </nav>
  );
}
