'use client';

import { useEffect } from 'react';
import { scrollToLandingHash } from '@/components/landing/landing-nav';

export function LandingHashScroll() {
  useEffect(() => {
    function scroll() {
      const hash = window.location.hash;
      if (!hash) return;
      requestAnimationFrame(() => {
        scrollToLandingHash(hash, 'smooth');
      });
    }

    const timer = window.setTimeout(scroll, 80);
    window.addEventListener('hashchange', scroll);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', scroll);
    };
  }, []);

  return null;
}
