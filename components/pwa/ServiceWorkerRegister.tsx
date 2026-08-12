'use client';

import { useEffect } from 'react';

/** Registers the installability service worker once on the client. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Silent: install still works via Add to Home Screen on iOS without SW.
    });
  }, []);

  return null;
}
