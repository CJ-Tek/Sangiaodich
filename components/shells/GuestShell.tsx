'use client';

import { AppShell, Group, Text, UnstyledButton } from '@mantine/core';
import { RoleTabBar } from '@/components/shells/RoleTabBar';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { colors, radius } from '@/config/design-tokens';
import { guestNav, guestNavHref } from '@/components/shells/guest-nav';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { VbnbLogo } from '@/components/brand/VbnbLogo';

export function GuestShell({
  children,
  isLoggedIn,
}: {
  children: React.ReactNode;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();
  const tNav = useTranslations('guest.nav');
  const tShell = useTranslations('guest.shell');
  const isCompact = useMediaQuery('(max-width: 1023px)');
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/');

  // Match on the resolved target so anonymous visitors still light up
  // "Khám phá" while they are on /marketplace.
  const items = guestNav.map((item) => ({
    ...item,
    target: guestNavHref(item, Boolean(isLoggedIn)),
  }));

  // Longest match wins, otherwise `/me` would light up on `/me/bookings` too.
  const activeTarget = items
    .filter(
      (item) =>
        pathname === item.target || pathname.startsWith(`${item.target}/`)
    )
    .sort((a, b) => b.target.length - a.target.length)
    .at(0)?.target;

  return (
    <AppShell
      header={{ height: 64 }}
      footer={isCompact && !isLoginPage ? { height: 68 } : undefined}
      padding="md"
    >
      <AppShell.Header>
        <Group
          h="100%"
          px="md"
          justify="space-between"
          maw={1200}
          mx="auto"
          w="100%"
        >
          <Group gap="xl">
            <UnstyledButton component={Link} href="/">
              <VbnbLogo height={28} priority />
            </UnstyledButton>
            {!isCompact && !isLoginPage ? (
            <Group gap="md">
              {items.map((item) => {
                const active = activeTarget === item.target;
                return (
                  <UnstyledButton
                    key={item.href}
                    component={Link}
                    href={item.target}
                  >
                    <Text
                      size="sm"
                      fw={active ? 600 : 500}
                      c={active ? colors.primary : colors.textSecondary}
                    >
                      {tNav(item.labelKey)}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Group>
            ) : null}
          </Group>
          <Group gap={4} wrap="nowrap">
            <LanguageSwitcher compact />
            {isLoggedIn ? (
              <UnstyledButton
                component={Link}
                href="/me/profile"
                className="vbnb-hit"
                visibleFrom="lg"
              >
                <Text size="sm" c="dimmed">
                  {tShell('account')}
                </Text>
              </UnstyledButton>
            ) : isLoginPage ? null : (
              <UnstyledButton
                component={Link}
                href="/login"
                ml={4}
                style={{
                  background: colors.primary,
                  color: '#fff',
                  borderRadius: radius.sm,
                  padding: '8px 14px',
                  fontSize: 14,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {tShell('login')}
              </UnstyledButton>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main pb={isCompact && !isLoginPage ? 84 : 24}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
      </AppShell.Main>

      {isCompact && !isLoginPage ? (
        <AppShell.Footer>
          <RoleTabBar
            items={items.map((item) => ({
              label: tNav(item.labelKey),
              href: item.target,
              Icon: item.Icon,
            }))}
            isActive={(href) => activeTarget === href}
          />
        </AppShell.Footer>
      ) : null}
    </AppShell>
  );
}
