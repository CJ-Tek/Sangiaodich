import { Title, Text, Stack, Group, type MantineSpacing } from '@mantine/core';
import { colors, typography } from '@/config/design-tokens';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  action,
  mb = 'xl',
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
  /** Pass 0 when the parent Stack already spaces its children. */
  mb?: MantineSpacing | 0;
}) {
  return (
    <Stack gap={8} mb={mb}>
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      {eyebrow ? (
        <Text
          size="xs"
          fw={600}
          tt="uppercase"
          style={{
            letterSpacing: typography.label.letterSpacing,
            color: colors.primary,
          }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Stack gap={8} style={{ flex: '1 1 20rem', minWidth: 0 }}>
          <Title
            order={1}
            className="vbnb-text-balance"
            style={{
              color: colors.textPrimary,
              letterSpacing: typography.title.letterSpacing,
              fontSize: typography.title.fontSize,
              lineHeight: typography.title.lineHeight,
              fontWeight: typography.title.fontWeight,
            }}
          >
            {title}
          </Title>
          {description ? (
            <Text
              c="dimmed"
              size="sm"
              style={{
                maxWidth: `${42}rem`,
                lineHeight: typography.body.lineHeight,
              }}
            >
              {description}
            </Text>
          ) : null}
        </Stack>
        {action}
      </Group>
    </Stack>
  );
}
