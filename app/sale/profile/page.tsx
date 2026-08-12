import { redirect } from 'next/navigation';

export default function SaleProfilePage() {
  redirect('/sale/settings?tab=profile');
}
