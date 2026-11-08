export type GuideRole = 'OWNER' | 'SALE' | 'GUEST';

export type GuideStep = {
  id: string;
  /** Locale-free path. The next-intl router adds the locale. */
  href: string;
  /** Matches `data-guide` on the screen this step points at. */
  target: string;
};

export type GuideChapter = {
  id: string;
  steps: GuideStep[];
};

export const GUIDE_CHAPTERS: Record<GuideRole, GuideChapter[]> = {
  OWNER: [
    {
      id: 'owner-overview',
      steps: [{ id: 'owner-overview', href: '/owner', target: 'owner-overview' }],
    },
    {
      id: 'owner-villas',
      steps: [{ id: 'owner-villas', href: '/owner/assets', target: 'owner-assets' }],
    },
    {
      id: 'owner-calendar',
      steps: [{ id: 'owner-calendar', href: '/owner/calendar', target: 'owner-calendar' }],
    },
    {
      id: 'owner-confirm',
      steps: [{ id: 'owner-confirm', href: '/owner/pending', target: 'owner-pending' }],
    },
    {
      id: 'owner-settlement',
      steps: [{ id: 'owner-settlement', href: '/owner/bookings', target: 'owner-bookings' }],
    },
    {
      id: 'owner-subscription',
      steps: [
        {
          id: 'owner-subscription',
          href: '/owner/subscription',
          target: 'owner-subscription',
        },
      ],
    },
  ],
  SALE: [
    {
      id: 'sale-home',
      steps: [{ id: 'sale-home', href: '/sale', target: 'sale-home' }],
    },
    {
      id: 'sale-calendar',
      steps: [{ id: 'sale-calendar', href: '/sale/calendar', target: 'sale-calendar' }],
    },
    {
      id: 'sale-marketplace',
      steps: [
        { id: 'sale-marketplace', href: '/sale/marketplace', target: 'sale-marketplace' },
      ],
    },
    {
      id: 'sale-booking',
      steps: [{ id: 'sale-booking', href: '/sale/bookings', target: 'sale-booking' }],
    },
    {
      id: 'sale-people',
      steps: [
        { id: 'sale-leads', href: '/sale/leads', target: 'sale-leads' },
        { id: 'sale-customers', href: '/sale/customers', target: 'sale-customers' },
      ],
    },
    {
      id: 'sale-membership',
      steps: [
        { id: 'sale-membership', href: '/sale/settings', target: 'sale-membership' },
      ],
    },
  ],
  GUEST: [
    {
      id: 'guest-explore',
      steps: [{ id: 'guest-explore', href: '/me/explore', target: 'guest-explore' }],
    },
    {
      id: 'guest-contact',
      steps: [{ id: 'guest-contact', href: '/me/explore', target: 'guest-explore' }],
    },
    {
      id: 'guest-bookings',
      steps: [{ id: 'guest-bookings', href: '/me/bookings', target: 'guest-bookings' }],
    },
  ],
};

const NAV_TARGETS: Record<string, string> = {
  '/owner': 'owner-overview',
  '/owner/assets': 'owner-assets',
  '/owner/calendar': 'owner-calendar',
  '/owner/pending': 'owner-pending',
  '/owner/bookings': 'owner-bookings',
  '/owner/subscription': 'owner-subscription',
  '/sale': 'sale-home',
  '/sale/calendar': 'sale-calendar',
  '/sale/marketplace': 'sale-marketplace',
  '/sale/bookings': 'sale-booking',
  '/sale/leads': 'sale-leads',
  '/sale/customers': 'sale-customers',
  '/sale/settings': 'sale-membership',
  '/me/explore': 'guest-explore',
  '/me/bookings': 'guest-bookings',
};

export function guideTargetForHref(href: string): string | undefined {
  return NAV_TARGETS[href.split('?')[0]];
}

export function guideStepsFor(role: GuideRole): GuideStep[] {
  return GUIDE_CHAPTERS[role].flatMap((chapter) => chapter.steps);
}

export function isGuideStepId(role: GuideRole, stepId: string): boolean {
  return guideStepsFor(role).some((step) => step.id === stepId);
}
