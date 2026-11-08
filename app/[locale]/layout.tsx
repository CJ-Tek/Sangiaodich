import type { Metadata, Viewport } from 'next';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { mantineHtmlProps } from '@mantine/core';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { routing, type AppLocale } from '@/lib/i18n/routing';
import { AppProviders } from '@/components/providers/AppProviders';
import { ogImage, siteUrl } from '@/lib/seo/site';
import { colors } from '@/config/design-tokens';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono',
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const image = ogImage(
    hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    t('appName')
  );

  return {
    metadataBase: new URL(siteUrl()),
    applicationName: t('appName'),
    robots: { index: true, follow: true },
    title: {
      default: t('appName'),
      template: `%s · ${t('appName')}`,
    },
    description: t('appDescription'),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: t('appName'),
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    },
    openGraph: {
      type: 'website',
      siteName: t('appName'),
      title: t('appName'),
      description: t('appDescription'),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      images: [image.url],
    },
  };
}

export const viewport: Viewport = {
  themeColor: colors.primary,
  width: 'device-width',
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontMono.variable}`}
      {...mantineHtmlProps}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders locale={locale as AppLocale}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
