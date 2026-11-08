'use client';

import { Group } from '@mantine/core';
import type { ComponentType } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { colors } from '@/config/design-tokens';

export type RoleTabItem = {
  label: string;
  href: string;
  Icon: ComponentType<{ color: string }>;
};

/** Bottom tab bar for phones: icon plus a short label on every tab. */
export function RoleTabBar({
  items,
  isActive,
}: {
  items: RoleTabItem[];
  isActive: (href: string) => boolean;
}) {
  return (
    <Group component="nav" h="100%" px={4} grow gap={0} wrap="nowrap">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="vbnb-tabbar-item"
            data-active={active || undefined}
            aria-current={active ? 'page' : undefined}
          >
            <span className="vbnb-tabbar-item__icon" aria-hidden>
              <item.Icon color={active ? colors.primary : colors.textSecondary} />
            </span>
            <span className="vbnb-tabbar-item__label">{item.label}</span>
          </Link>
        );
      })}
    </Group>
  );
}
