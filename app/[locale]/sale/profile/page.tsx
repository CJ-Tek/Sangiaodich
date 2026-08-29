import { localeRedirect } from '@/lib/i18n/navigation';

export default async function SaleProfilePage() {
  return await localeRedirect('/sale/settings?tab=profile');
}
