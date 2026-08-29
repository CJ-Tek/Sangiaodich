import { localeRedirect } from '@/lib/i18n/navigation';

export default async function SaleMembershipPage() {
  return await localeRedirect('/sale/settings?tab=membership');
}
