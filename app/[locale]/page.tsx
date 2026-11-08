import { createServiceClient } from '@/lib/supabase/server';
import { getSessionRoleHint } from '@/lib/auth/session-role';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHashScroll } from '@/components/landing/LandingHashScroll';
import { HeroSection } from '@/components/landing/HeroSection';
import { CommitmentStrip } from '@/components/landing/CommitmentStrip';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SalesFeatureSection } from '@/components/landing/SalesFeatureSection';
import { OwnerFeatureSection } from '@/components/landing/OwnerFeatureSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FeaturedStays } from '@/components/landing/FeaturedStays';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { FaqSection, type FaqItem } from '@/components/landing/FaqSection';
import { FacebookFab } from '@/components/landing/FacebookFab';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { listAllPlans } from '@/lib/engines/subscription-payment';
import type { AssetCardData } from '@/components/marketplace/AssetCard';
import { appHrefForRole } from '@/lib/i18n/app-href';
import { routing, type AppLocale } from '@/lib/i18n/routing';
import {
  absoluteUrl,
  languageAlternates,
  localizedPath,
  ogImage,
  openGraphLocale,
  serializeJsonLd,
  siteUrl,
} from '@/lib/seo/site';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { unstable_cache } from 'next/cache';
import { Suspense } from 'react';

export const revalidate = 60;

type PageProps = { params: Promise<{ locale: string }> };

async function resolveLocale(params: PageProps['params']): Promise<AppLocale> {
  const { locale } = await params;
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'seo.home' });
  const title = t('title');
  const description = t('description');
  const image = ogImage(locale, title);

  return {
    title: { absolute: title },
    description,
    keywords: t.raw('keywords') as string[],
    alternates: {
      canonical: localizedPath(locale, '/'),
      languages: languageAlternates('/'),
    },
    openGraph: {
      type: 'website',
      siteName: 'VBNB',
      url: absoluteUrl(locale, '/'),
      title,
      description,
      locale: openGraphLocale[locale],
      alternateLocale: routing.locales
        .filter((other) => other !== locale)
        .map((other) => openGraphLocale[other]),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

async function buildHomeJsonLd(locale: AppLocale) {
  const tSeo = await getTranslations({ locale, namespace: 'seo.home' });
  const tFaq = await getTranslations({ locale, namespace: 'landing.faq' });
  const faqItems = tFaq.raw('items') as FaqItem[];
  const origin = siteUrl();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'VBNB',
        legalName: 'Công Ty TNHH Cap Saint Jacques Tek',
        url: origin,
        logo: `${origin}/icons/icon-512.png`,
        description: tSeo('description'),
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'VBNB',
        url: absoluteUrl(locale, '/'),
        inLanguage: locale,
        publisher: { '@id': `${origin}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${absoluteUrl(locale, '/marketplace')}?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${absoluteUrl(locale, '/')}#faq`,
        inLanguage: locale,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };
}

const getAllPlansCached = unstable_cache(
  async () => listAllPlans(),
  ['landing-all-plans'],
  { revalidate: 300 }
);

const getFeaturedAssetsCached = unstable_cache(
  async () => {
    const admin = createServiceClient();
    const result = await admin
      .from('assets')
      .select(
        'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order)'
      )
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .order('sort_order', { ascending: true, foreignTable: 'asset_images' })
      .limit(1, { foreignTable: 'asset_images' })
      .limit(6);

    return result.data || [];
  },
  ['landing-featured-assets-v1'],
  { revalidate: 60 }
);

async function PricingSectionStream() {
  const startedAt = Date.now();
  const allPlans = await getAllPlansCached();
  const ownerPlans = allPlans.filter(
    (plan) => plan.role === 'OWNER' && plan.is_active
  );
  const salePlans = allPlans.filter(
    (plan) => plan.role === 'SALE' && plan.is_active
  );

  console.info(
    `[perf] ${JSON.stringify({
      scope: 'home-pricing',
      plansMs: Date.now() - startedAt,
      ownerPlansCount: ownerPlans.length,
      salePlansCount: salePlans.length,
    })}`
  );

  return <PricingSection ownerPlans={ownerPlans} salePlans={salePlans} />;
}

export default async function HomePage({ params }: PageProps) {
  const jsonLdPromise = resolveLocale(params).then(buildHomeJsonLd);
  const startedAt = Date.now();
  const roleStartedAt = Date.now();
  const rolePromise = getSessionRoleHint().then((value) => ({
    value,
    ms: Date.now() - roleStartedAt,
  }));
  const assetsStartedAt = Date.now();
  const assetsPromise = getFeaturedAssetsCached().then((value) => ({
    value,
    ms: Date.now() - assetsStartedAt,
  }));

  const [roleData, assetsData] = await Promise.all([
    rolePromise,
    assetsPromise,
  ]);
  const role = roleData.value;
  const assets = assetsData.value;
  console.info(
    `[perf] ${JSON.stringify({
      scope: 'home',
      roleMs: roleData.ms,
      assetsMs: assetsData.ms,
      assetsCount: assets.length,
      totalMs: Date.now() - startedAt,
    })}`
  );

  const featured: AssetCardData[] = (assets || []).map((a) => {
    const images = (a.asset_images || []) as {
      url: string;
      sort_order: number;
    }[];
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      location: a.location,
      capacity: a.capacity,
      bedrooms: Number(a.bedrooms) || undefined,
      bathrooms: Number(a.bathrooms) || undefined,
      propertyType:
        a.property_type === 'APARTMENT' || a.property_type === 'VILLA'
          ? a.property_type
          : undefined,
      imageUrl: images[0]?.url,
    };
  });

  const jsonLd = await jsonLdPromise;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <LandingHashScroll />
      <LandingHeader
        isLoggedIn={!!role}
        appHref={appHrefForRole(role ?? undefined)}
      />
      <main>
        <HeroSection />
        <CommitmentStrip />
        <HowItWorksSection />
        <SalesFeatureSection />
        <OwnerFeatureSection />
        <Suspense fallback={null}>
          <PricingSectionStream />
        </Suspense>
        <FeaturedStays assets={featured} />
        <FaqSection />
        <FinalCTA showGuestSignup={!role} />
      </main>
      <LandingFooter />
      <FacebookFab />
    </>
  );
}
