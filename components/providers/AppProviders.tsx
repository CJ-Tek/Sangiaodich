'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import { theme } from '@/config/theme';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import type { AppLocale } from '@/lib/i18n/routing';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';

const dayjsLocale: Record<AppLocale, string> = {
  vi: 'vi',
  en: 'en',
};

export function AppProviders({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: AppLocale;
}) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <DatesProvider
        settings={{ locale: dayjsLocale[locale], firstDayOfWeek: 1 }}
      >
        <Notifications position="top-right" zIndex={4000} />
        <ServiceWorkerRegister />
        {children}
      </DatesProvider>
    </MantineProvider>
  );
}
