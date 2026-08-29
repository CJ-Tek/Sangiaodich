import { routing, type AppLocale } from './routing';

/** Strip `/en` prefix for role/auth path matching; default locale stays unprefixed. */
export function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    const prefix = `/${locale}`;
    if (pathname === prefix) return '/';
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || '/';
    }
  }
  return pathname;
}

export function localeFromPath(pathname: string): AppLocale {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    const prefix = `/${locale}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

/** Prefix path for redirects when locale is not default. */
export function withLocalePath(pathname: string, locale: AppLocale): string {
  if (locale === routing.defaultLocale) return pathname;
  if (pathname === '/') return `/${locale}`;
  return `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}
