export function appHrefForRole(role?: string): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'OWNER') return '/owner';
  if (role === 'SALE') return '/sale';
  if (role === 'GUEST') return '/me';
  return '/marketplace';
}
