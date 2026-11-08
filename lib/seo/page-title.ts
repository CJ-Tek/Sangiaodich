import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * `generateMetadata` for in-app pages: the root layout's `%s · VBNB` template
 * turns this into a distinct browser tab title per page.
 */
export function pageTitle(namespace: string, key = 'title') {
  return async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations(namespace);
    return { title: t(key) };
  };
}
