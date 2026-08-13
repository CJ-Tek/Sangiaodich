import { Box } from '@mantine/core';
import { landingContainer } from '@/components/landing/landing-media';
import { GuestSignupStrip } from '@/components/marketplace/GuestSignupStrip';

/** Landing-spaced wrapper: FinalCTA only speaks to owners and sales. */
export function GuestSignupSection() {
  return (
    <Box
      component="section"
      aria-label="Tạo tài khoản khách"
      style={{
        ...landingContainer,
        paddingTop: 'clamp(16px, 2vw, 24px)',
        paddingBottom: 'clamp(16px, 2vw, 24px)',
      }}
    >
      <GuestSignupStrip />
    </Box>
  );
}
