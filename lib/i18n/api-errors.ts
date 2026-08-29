import { getTranslations } from 'next-intl/server';

export async function getApiErrorTranslator() {
  return getTranslations('errors');
}
