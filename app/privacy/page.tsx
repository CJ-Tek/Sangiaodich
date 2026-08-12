import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
};

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
