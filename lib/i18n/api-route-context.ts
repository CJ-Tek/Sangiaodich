import { getLocale } from 'next-intl/server';
import { getApiErrorTranslator } from '@/lib/i18n/api-errors';
import { formatNumber } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';

export async function getApiRouteContext() {
  const t = await getApiErrorTranslator();
  const locale = (await getLocale()) as AppLocale;
  return {
    t,
    locale,
    formatAmount: (amount: number) => formatNumber(amount, locale),
  };
}
