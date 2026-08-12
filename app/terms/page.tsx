import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng · VBNB',
};

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
