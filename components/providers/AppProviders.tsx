'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import { theme } from '@/config/theme';
import 'dayjs/locale/vi';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <DatesProvider settings={{ locale: 'vi', firstDayOfWeek: 1 }}>
        <Notifications position="top-right" zIndex={4000} />
        {children}
      </DatesProvider>
    </MantineProvider>
  );
}
