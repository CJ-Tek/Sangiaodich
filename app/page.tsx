import { createServiceClient } from '@/lib/supabase/server';
import { getSessionRoleHint } from '@/lib/auth/session-role';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHashScroll } from '@/components/landing/LandingHashScroll';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SalesFeatureSection } from '@/components/landing/SalesFeatureSection';
import { OwnerFeatureSection } from '@/components/landing/OwnerFeatureSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FeaturedStays } from '@/components/landing/FeaturedStays';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { GuestSignupSection } from '@/components/landing/GuestSignupSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { listAllPlans } from '@/lib/engines/subscription-payment';
import type { AssetCardData } from '@/components/marketplace/AssetCard';
import { unstable_cache } from 'next/cache';
import { Suspense } from 'react';

export const revalidate = 60;

function appHrefForRole(role?: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'OWNER') return '/owner';
  if (role === 'SALE') return '/sale';
  if (role === 'GUEST') return '/me';
  return '/marketplace';
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

export default async function HomePage() {
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

  return (
    <>
      <LandingHashScroll />
      <LandingHeader
        isLoggedIn={!!role}
        appHref={appHrefForRole(role ?? undefined)}
      />
      <main>
        <HeroSection />
        <TrustStrip />
        <HowItWorksSection />
        <SalesFeatureSection />
        <OwnerFeatureSection />
        <Suspense fallback={null}>
          <PricingSectionStream />
        </Suspense>
        <FeaturedStays assets={featured} />
        {!role ? <GuestSignupSection /> : null}
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}
