import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
};

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
