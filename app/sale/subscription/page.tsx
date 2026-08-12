import { redirect } from 'next/navigation';

export default function SaleSubscriptionPage() {
  redirect('/sale/settings?tab=subscription');
}
