import type { ComponentType } from 'react';
import {
  IconCalendar,
  IconCompass,
  IconHome,
  IconUser,
} from '@/components/shells/NavIcons';

export type GuestNavItem = {
  label: string;
  href: string;
  Icon: ComponentType<{ color: string }>;
  /** Anonymous visitors get bounced to /login?next= instead of the page. */
  requiresLogin: boolean;
};

/**
 * Single source for guest navigation, shared by the desktop header and the
 * mobile tab bar. Keep the login requirement here rather than spreading
 * `isLoggedIn` checks across pages.
 */
export const guestNav: GuestNavItem[] = [
  { label: 'Trang chủ', href: '/me', Icon: IconHome, requiresLogin: true },
  {
    label: 'Khám phá',
    href: '/marketplace',
    Icon: IconCompass,
    requiresLogin: false,
  },
  {
    label: 'Booking',
    href: '/me/bookings',
    Icon: IconCalendar,
    requiresLogin: true,
  },
  { label: 'Tài khoản', href: '/me/profile', Icon: IconUser, requiresLogin: true },
];

/** Where a nav item should point for the current auth state. */
export function guestNavHref(item: GuestNavItem, isLoggedIn: boolean): string {
  if (item.requiresLogin && !isLoggedIn) {
    return `/login?next=${encodeURIComponent(item.href)}`;
  }
  return item.href;
}
