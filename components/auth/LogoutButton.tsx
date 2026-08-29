'use client';

import { Button } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';

export function LogoutButton({ fullWidth }: { fullWidth?: boolean }) {
  const t = useTranslations('common');
  const router = useRouter();

  return (
    <Button
      color="red"
      variant="light"
      fullWidth={fullWidth}
      size="sm"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
      }}
    >
      {t('logout')}
    </Button>
  );
}
