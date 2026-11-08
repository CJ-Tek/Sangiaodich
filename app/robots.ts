import type { MetadataRoute } from 'next';
import { routing } from '@/lib/i18n/routing';
import { siteUrl } from '@/lib/seo/site';

const PRIVATE_SEGMENTS = ['/admin', '/owner', '/sale', '/me', '/pay'];

export default function robots(): MetadataRoute.Robots {
  const prefixes = ['', ...routing.locales.filter((l) => l !== routing.defaultLocale).map((l) => `/${l}`)];
  const disallow = [
    '/api/',
    ...prefixes.flatMap((prefix) => PRIVATE_SEGMENTS.map((segment) => `${prefix}${segment}`)),
  ];

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
