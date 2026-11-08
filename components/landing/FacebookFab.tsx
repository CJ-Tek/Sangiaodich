'use client';

import { useWindowScroll } from '@mantine/hooks';
import { useTranslations } from 'next-intl';
import { socialLinks } from '@/config/social-links';
import { IconFacebook } from '@/components/landing/LandingIcons';

const SHOW_AFTER_PX = 480;

/** Floating contact button for the landing page; shares the footer Facebook link. */
export function FacebookFab() {
  const t = useTranslations('landing.fab');
  const [{ y }] = useWindowScroll();
  const visible = y > SHOW_AFTER_PX;
  const href = socialLinks.facebook;

  return (
    <a
      className="vbnb-fab"
      data-visible={visible || undefined}
      href={href || undefined}
      target={href ? '_blank' : undefined}
      rel={href ? 'noopener noreferrer' : undefined}
      aria-label={t('ariaLabel')}
      aria-hidden={!visible || undefined}
      tabIndex={visible && href ? undefined : -1}
    >
      <span className="vbnb-fab__icon">
        <IconFacebook size={24} />
      </span>
      <span className="vbnb-fab__label">{t('label')}</span>
    </a>
  );
}
