import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { mantineHtmlProps } from '@mantine/core';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'VBNB',
  description: 'Sàn giao dịch tài sản lưu trú',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" {...mantineHtmlProps}>
      <body className={montserrat.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
