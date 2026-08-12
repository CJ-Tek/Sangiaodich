'use client';

import {
  Box,
  Burger,
  Drawer,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useWindowScroll } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors, motion } from '@/config/design-tokens';
import { landingContainer } from '@/components/landing/landing-media';
import { goToLandingSection } from '@/components/landing/landing-nav';
import { LinkButton } from '@/components/ui/LinkButton';

const nav = [
  { label: 'Khám phá villas', href: '/marketplace' },
  { label: 'Dành cho Chủ villa', href: '/#owner' },
  { label: 'Dành cho Sale', href: '/#sale' },
  { label: 'Bảng giá', href: '/#pricing' },
  { label: 'Về chúng tôi', href: '/#how' },
];

export function LandingHeader({
  isLoggedIn,
  appHref = '/marketplace',
  solid = false,
}: {
  isLoggedIn?: boolean;
  appHref?: string;
  solid?: boolean;
}) {
  const pathname = usePathname();
  const [{ y }] = useWindowScroll();
  const scrolled = solid || y > 12;
  const [opened, { toggle, close }] = useDisclosure(false);

  function isActive(href: string) {
    return href === '/marketplace' && pathname === '/marketplace';
  }

  function onNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (!href.startsWith('/#')) {
      close();
      return;
    }
    event.preventDefault();
    goToLandingSection(href.slice(2));
    close();
  }

  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 64,
        background: scrolled ? 'rgba(250, 250, 248, 0.94)' : 'transparent',
        borderBottom: scrolled ? `1px solid ${colors.border}` : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: `background ${motion.normal}ms ${motion.easing}, border-color ${motion.normal}ms ${motion.easing}`,
      }}
    >
      <Group h="100%" justify="space-between" wrap="nowrap" style={landingContainer}>
        <UnstyledButton component={Link} href="/" aria-label="VBNB trang chủ">
          <Text fw={700} c="vbnbGreen.6" style={{ letterSpacing: '-0.04em', fontSize: 22 }}>
            VBNB
          </Text>
        </UnstyledButton>

        <Group gap={22} visibleFrom="md">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <UnstyledButton
                key={item.label}
                component={Link}
                href={item.href}
                onClick={(event) => onNavClick(event, item.href)}
              >
                <Text
                  size="sm"
                  fw={active ? 600 : 500}
                  c={active ? colors.primaryDark : colors.textSecondary}
                  style={{
                    transition: `color ${motion.fast}ms ${motion.easing}`,
                  }}
                >
                  {item.label}
                </Text>
              </UnstyledButton>
            );
          })}
        </Group>

        <Group gap="sm" visibleFrom="md">
          {isLoggedIn ? (
            <LinkButton href={appHref} color="vbnbGreen" size="sm">
              Vào app
            </LinkButton>
          ) : (
            <>
              <UnstyledButton component={Link} href="/login">
                <Text size="sm" fw={500} c={colors.textPrimary}>
                  Đăng nhập
                </Text>
              </UnstyledButton>
              <LinkButton href="/login?mode=register" color="vbnbGreen" size="sm">
                Bắt đầu ngay
              </LinkButton>
            </>
          )}
        </Group>

        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="md"
          size="sm"
          color={colors.textPrimary}
          aria-label="Mở menu"
        />
      </Group>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="xs"
        hiddenFrom="md"
        title={
          <Text fw={700} c="vbnbGreen.6">
            VBNB
          </Text>
        }
      >
        <Stack gap="lg" pt="md">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <UnstyledButton
                key={item.label}
                component={Link}
                href={item.href}
                onClick={(event) => onNavClick(event, item.href)}
              >
                <Text size="md" fw={active ? 600 : 500}>
                  {item.label}
                </Text>
              </UnstyledButton>
            );
          })}
          {isLoggedIn ? (
            <LinkButton href={appHref} color="vbnbGreen">
              Vào app
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="default">
                Đăng nhập
              </LinkButton>
              <LinkButton href="/login?mode=register" color="vbnbGreen">
                Bắt đầu ngay
              </LinkButton>
            </>
          )}
        </Stack>
      </Drawer>
    </Box>
  );
}
