import { createNavigation } from 'next-intl/navigation';
import { getLocale } from 'next-intl/server';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/** Server-only redirect that injects the active locale for next-intl. */
export async function localeRedirect(href: string): Promise<never> {
  return redirect({ href, locale: await getLocale() });
}
