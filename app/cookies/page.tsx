import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Chính sách cookie',
};

export default function CookiesPage() {
  return <LegalPage slug="cookies" />;
}
