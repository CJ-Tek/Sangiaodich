import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import enMessages from '../../messages/en';
import viMessages from '../../messages/vi';
import { routing } from './routing';

const catalogs = {
  vi: viMessages,
  en: enMessages,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: catalogs[locale],
  };
});
