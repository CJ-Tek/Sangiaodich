import { redirect } from 'next/navigation';

export default function SaleMembershipPage() {
  redirect('/sale/settings?tab=membership');
}
