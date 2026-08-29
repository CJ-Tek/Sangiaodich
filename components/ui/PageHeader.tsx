import { Title, Text, Stack, Group } from '@mantine/core';
import { colors, typography } from '@/config/design-tokens';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
}) {
  return (
    <Stack gap={8} mb="xl">
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      {eyebrow ? (
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          style={{
            letterSpacing: typography.label.letterSpacing,
            color: colors.primaryDark,
          }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Title
          order={2}
          fw={600}
          className="vbnb-text-balance"
          style={{
            color: colors.textPrimary,
            letterSpacing: typography.title.letterSpacing,
            fontSize: typography.title.fontSize,
            lineHeight: typography.title.lineHeight,
          }}
        >
          {title}
        </Title>
        {action}
      </Group>
      {description ? (
        <Text
          c="dimmed"
          size="sm"
          style={{ maxWidth: `${42}rem`, lineHeight: typography.body.lineHeight }}
        >
          {description}
        </Text>
      ) : null}
    </Stack>
  );
}
