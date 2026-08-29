/**
 * Returns true when `href` is the best nav match for `pathname`.
 * Prevents parent routes (e.g. /owner/assets) from staying active on child-only
 * pages (e.g. /owner/assets/new) when a more specific nav item exists.
 */
export function isNavItemActive(
  pathname: string,
  href: string,
  allHrefs: string[],
  exactMatchRoots: string[] = []
): boolean {
  const path = href.split('?')[0];

  if (exactMatchRoots.includes(path)) {
    return pathname === path;
  }

  if (pathname === path) return true;
  if (!pathname.startsWith(`${path}/`)) return false;

  const normalized = allHrefs.map((h) => h.split('?')[0]);
  const hasMoreSpecific = normalized.some(
    (other) =>
      other !== path &&
      other.startsWith(`${path}/`) &&
      (pathname === other || pathname.startsWith(`${other}/`))
  );

  return !hasMoreSpecific;
}
