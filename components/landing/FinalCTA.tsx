import { Box, Group, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { colors, radius } from '@/config/design-tokens';
import { landingContainer, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';

export function FinalCTA() {
  return (
    <Box
      component="section"
      aria-labelledby="final-cta-heading"
      style={{
        ...landingContainer,
        paddingTop: 'clamp(32px, 6vw, 64px)',
        paddingBottom: 'clamp(64px, 10vw, 120px)',
      }}
    >
      <Box
        style={{
          position: 'relative',
          borderRadius: radius.xl,
          overflow: 'hidden',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Image
          src={landingMedia.cta}
          alt=""
          fill
          sizes="(max-width: 1240px) 100vw, 1200px"
          style={{ objectFit: 'cover' }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(22,22,22,0.58) 0%, rgba(22,22,22,0.28) 55%, rgba(22,22,22,0.18) 100%)',
          }}
        />
        <Stack
          gap="md"
          maw={560}
          px={{ base: 24, sm: 48 }}
          py={48}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <Title
            id="final-cta-heading"
            order={2}
            c="white"
            fw={700}
            style={{
              fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            Sẵn sàng bắt đầu cùng VBNB?
          </Title>
          <Text c="rgba(255,255,255,0.86)" style={{ lineHeight: 1.65 }}>
            Tham gia cùng hàng ngàn chủ villa và sale chuyên nghiệp trên toàn quốc.
          </Text>
          <Group gap="sm" mt={4}>
            <LinkButton
              href="/login?mode=register&role=OWNER"
              color="vbnbGreen"
              h={46}
              px={18}
              fw={600}
            >
              Tôi là Chủ villa
            </LinkButton>
            <LinkButton
              href="/login?mode=register&role=SALE"
              variant="white"
              h={46}
              px={18}
              fw={600}
              style={{ color: colors.textPrimary }}
            >
              Tôi là Sale
            </LinkButton>
          </Group>
        </Stack>
      </Box>
    </Box>
  );
}
