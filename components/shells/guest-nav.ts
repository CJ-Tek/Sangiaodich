import type { ComponentType } from 'react';
import {
  IconCalendar,
  IconCompass,
  IconHome,
  IconUser,
} from '@/components/shells/NavIcons';

export type GuestNavLabelKey =
  | 'home'
  | 'explore'
  | 'bookings'
  | 'profile';

export type GuestNavItem = {
  labelKey: GuestNavLabelKey;
  /** Dashboard route, used once the guest is signed in. */
  href: string;
  Icon: ComponentType<{ color: string }>;
  /**
   * Where anonymous visitors go instead. Omit to bounce them through
   * /login?next= — browsing villas is the only thing they can do signed out.
   */
  publicHref?: string;
};

/**
 * Single source for guest navigation, shared by the dashboard shell and the
 * public shell. Keep the auth branching here rather than spreading
 * `isLoggedIn` checks across pages.
 */
export const guestNav: GuestNavItem[] = [
  { labelKey: 'home', href: '/me', Icon: IconHome },
  {
    labelKey: 'explore',
    href: '/me/explore',
    Icon: IconCompass,
    publicHref: '/marketplace',
  },
  { labelKey: 'bookings', href: '/me/bookings', Icon: IconCalendar },
  { labelKey: 'profile', href: '/me/profile', Icon: IconUser },
];

/** Where a nav item should point for the current auth state. */
export function guestNavHref(item: GuestNavItem, isLoggedIn: boolean): string {
  if (isLoggedIn) return item.href;
  return item.publicHref ?? `/login?next=${encodeURIComponent(item.href)}`;
}
