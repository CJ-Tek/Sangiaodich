'use client';

import { Group } from '@mantine/core';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { AssetCard, type AssetCardData } from '@/components/marketplace/AssetCard';
import { LinkButton } from '@/components/ui/LinkButton';
import { Reveal } from '@/components/landing/Reveal';
import { SectionShell } from '@/components/ui/SectionShell';

export function FeaturedStays({ assets }: { assets: AssetCardData[] }) {
  const t = useTranslations('landing.featured');

  if (!assets.length) return null;

  return (
    <SectionShell id="featured" title={t('title')} align="center">
      <div className="vbnb-grid vbnb-grid-3" style={{ '--vbnb-grid-gap': '24px' } as CSSProperties}>
        {assets.map((asset, index) => (
          <Reveal key={asset.id} delay={(index % 3) * 70}>
            <AssetCard asset={asset} />
          </Reveal>
        ))}
      </div>
      <Group justify="center" mt={40}>
        <LinkButton href="/marketplace" variant="default" size="md" h={46} px={24}>
          {t('viewAll')}
        </LinkButton>
      </Group>
    </SectionShell>
  );
}
