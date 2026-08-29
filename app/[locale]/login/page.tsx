import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { GuestShell } from '@/components/shells/GuestShell';
import { LoginForm } from './LoginForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'login' });

  return {
    title: t('modeLogin'),
  };
}

export default function LoginPage() {
  return (
    <GuestShell>
      <Suspense>
        <LoginForm />
      </Suspense>
    </GuestShell>
  );
}
