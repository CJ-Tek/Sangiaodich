import type { AppLocale } from './routing';
import { withLocalePath } from './locale-path';

export function appHrefForRole(
  role?: string,
  locale: AppLocale = 'vi'
): string {
  let path = '/marketplace';
  if (role === 'ADMIN') path = '/admin';
  else if (role === 'OWNER') path = '/owner';
  else if (role === 'SALE') path = '/sale';
  else if (role === 'GUEST') path = '/me';
  return withLocalePath(path, locale);
}
