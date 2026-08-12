import { Box, Group, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { colors } from '@/config/design-tokens';
import { landingContainer, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';
import { VillaSearch } from '@/components/landing/VillaSearch';

export function HeroSection() {
  return (
    <Box
      component="section"
      aria-labelledby="landing-hero-title"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <Box
        className="vbnb-landing-hero"
        style={{
          ...landingContainer,
          position: 'relative',
          paddingTop: 'clamp(24px, 5vw, 56px)',
          paddingBottom: 8,
        }}
      >
        <Stack
          gap="lg"
          maw={620}
          className="vbnb-landing-fade-up vbnb-landing-hero-copy"
          style={{ position: 'relative', zIndex: 1, paddingBottom: 12 }}
        >
          <Text
            component="p"
            fw={600}
            c="vbnbGreen.6"
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: colors.primarySoft,
              borderRadius: 999,
              padding: '6px 12px',
              lineHeight: 1.4,
            }}
          >
            Nền tảng thông minh kết nối chủ villa, sale & khách hàng
          </Text>

          <Title
            id="landing-hero-title"
            order={1}
            fw={700}
            c={colors.textPrimary}
            style={{
              fontSize: 'clamp(1.9rem, 3.4vw, 3.4rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
            }}
          >
            Sàn giao dịch villa
            <br />
            thông minh kết nối
            <br />
            <Text
              span
              inherit
              c="vbnbGreen.6"
              style={{ fontSize: 'inherit', fontWeight: 'inherit' }}
            >
              Chủ villa, Sale & Khách hàng
            </Text>
          </Title>

          <Box
            component="ul"
            maw={520}
            style={{
              margin: 0,
              paddingLeft: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              color: colors.primary,
            }}
          >
            {[
              'Chủ villa kết nối được với nhiều sale, tăng lợi nhuận',
              'Sale không cần tự tìm kiếm khách và chủ nhà',
              'Khách hàng được hưởng dịch vụ tốt hơn từ sale có tâm',
            ].map((line) => (
              <Text
                key={line}
                component="li"
                style={{ fontSize: 16, lineHeight: 1.55 }}
              >
                <Text span c={colors.textSecondary} inherit>
                  {line}
                </Text>
              </Text>
            ))}
          </Box>

          <Group gap="sm" className="vbnb-landing-hero-ctas">
            <LinkButton href="/marketplace" color="vbnbGreen" h={46} px={20} fw={600}>
              Khám phá villas
            </LinkButton>
            <LinkButton
              href="#how"
              variant="default"
              h={46}
              px={20}
              fw={500}
              style={{ borderColor: colors.borderStrong, color: colors.textPrimary }}
            >
              Tìm hiểu thêm
            </LinkButton>
          </Group>
        </Stack>

        <Box className="vbnb-landing-hero-image vbnb-landing-fade-in">
          <Image
            src={landingMedia.hero}
            alt="Villa hiện đại với hồ bơi"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 52vw"
            style={{ objectFit: 'cover' }}
          />
          <Box className="vbnb-landing-hero-fade" />
        </Box>

        <Box className="vbnb-landing-hero-search" style={{ position: 'relative', zIndex: 2 }}>
          <VillaSearch />
        </Box>
      </Box>
    </Box>
  );
}
