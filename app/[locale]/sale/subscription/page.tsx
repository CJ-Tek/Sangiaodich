import { localeRedirect } from '@/lib/i18n/navigation';

export default async function SaleSubscriptionPage() {
  return await localeRedirect('/sale/settings?tab=subscription');
}
