import { describe, expect, it } from 'vitest';
import { isNavItemActive } from '@/components/shells/nav-active';

const ownerHrefs = [
  '/owner',
  '/owner/assets',
  '/owner/pending',
  '/owner/bookings',
  '/owner/subscription',
  '/owner/profile',
];

describe('isNavItemActive', () => {
  it('highlights assets list on /owner/assets/new', () => {
    const pathname = '/owner/assets/new';
    expect(isNavItemActive(pathname, '/owner/assets', ownerHrefs, ['/owner'])).toBe(
      true
    );
  });

  it('highlights assets list on /owner/assets/[id]/edit', () => {
    const pathname = '/owner/assets/abc/edit';
    expect(isNavItemActive(pathname, '/owner/assets', ownerHrefs, ['/owner'])).toBe(
      true
    );
  });

  it('does not highlight owner home on nested routes', () => {
    expect(isNavItemActive('/owner/assets', '/owner', ownerHrefs, ['/owner'])).toBe(
      false
    );
    expect(isNavItemActive('/owner', '/owner', ownerHrefs, ['/owner'])).toBe(true);
  });
});
