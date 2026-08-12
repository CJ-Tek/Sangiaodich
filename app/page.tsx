import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
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
import { LandingFooter } from '@/components/landing/LandingFooter';
import { listActivePlansForRole } from '@/lib/engines/subscription-payment';
import type { AssetCardData } from '@/components/marketplace/AssetCard';

export const revalidate = 60;

function appHrefForRole(role?: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'OWNER') return '/owner';
  if (role === 'SALE') return '/sale';
  return '/marketplace';
}

export default async function HomePage() {
  const profile = await getSessionProfile();
  const admin = await createClient();
  const { data: assets } = await admin
    .from('assets')
    .select(
      'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order)'
    )
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(6);

  const [ownerPlans, salePlans] = await Promise.all([
    listActivePlansForRole('OWNER'),
    listActivePlansForRole('SALE'),
  ]);

  const featured: AssetCardData[] = (assets || []).map((a) => {
    const images = (a.asset_images || []) as {
      url: string;
      sort_order: number;
    }[];
    images.sort((x, y) => x.sort_order - y.sort_order);
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
        isLoggedIn={!!profile}
        appHref={appHrefForRole(profile?.role)}
      />
      <main>
        <HeroSection />
        <TrustStrip />
        <HowItWorksSection />
        <SalesFeatureSection />
        <OwnerFeatureSection />
        <PricingSection ownerPlans={ownerPlans} salePlans={salePlans} />
        <FeaturedStays assets={featured} />
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}
