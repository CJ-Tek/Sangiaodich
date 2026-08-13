'use client';

import { Alert, Button, Code, Group, Box, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import { assetPublicCode } from '@/lib/engines/asset-search';

export function AssetCtas({
  slug,
  assetId,
  isLoggedInGuest,
  leadIntent,
  sticky,
}: {
  slug: string;
  assetId: string;
  isLoggedInGuest: boolean;
  /** Guest arrived back here after logging in from the contact CTA. */
  leadIntent?: boolean;
  sticky?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [showIntent, setShowIntent] = useState(
    Boolean(leadIntent) && isLoggedInGuest
  );
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/a/${slug}`
      : `/a/${slug}`;

  const publicCode = assetPublicCode(assetId);

  async function copyId() {
    await navigator.clipboard.writeText(publicCode);
    notifications.show({
      color: 'vbnbGreen',
      message: 'Đã copy mã villa',
      autoClose: 2000,
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    notifications.show({
      color: 'vbnbGreen',
      message: 'Đã copy',
      autoClose: 2000,
    });
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: 'VBNB asset', url });
      return;
    }
    await copyLink();
  }

  async function contactSale() {
    if (!isLoggedInGuest) {
      // Carry the intent through login so the guest lands back on a page that
      // remembers why they left. The lead is never sent automatically.
      const next = encodeURIComponent(`/a/${slug}?lead=1`);
      router.push(`/login?next=${next}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Lỗi',
        });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message:
            'Đã gửi yêu cầu — sale đang trả phí sẽ thấy thông tin của bạn',
        });
        setShowIntent(false);
        // Drop ?lead=1 so a refresh does not re-prompt. Stay on the current
        // route so the guest dashboard does not bounce through /a/[slug].
        router.replace(pathname);
      }
    } finally {
      setLoading(false);
    }
  }

  const intentBanner = showIntent ? (
    <Alert
      color="vbnbGreen"
      variant="light"
      radius={radius.sm}
      withCloseButton
      onClose={() => setShowIntent(false)}
      title="Đã đăng nhập"
    >
      <Text size="sm">
        Bấm “Cần liên lạc sale” để gửi yêu cầu cho villa này. Chúng tôi chỉ chia
        sẻ số điện thoại của bạn khi bạn tự bấm.
      </Text>
    </Alert>
  ) : null;

  const loginHint = !isLoggedInGuest ? (
    <Text size="xs" c="dimmed">
      Cần đăng nhập để liên lạc sale — sale chỉ tạo được booking cho tài khoản
      đã có trên hệ thống.
    </Text>
  ) : null;

  const actions = (
    <Group grow preventGrowOverflow={false} gap="sm" wrap="wrap">
      <Group gap="xs" wrap="nowrap">
        <Code>{publicCode}</Code>
        <Button variant="default" onClick={copyId}>
          Copy ID
        </Button>
      </Group>
      <Button color="vbnbGreen" onClick={copyLink}>
        Copy link
      </Button>
      <Button variant="default" onClick={share}>
        Share
      </Button>
      <Button
        variant="outline"
        color="vbnbGreen"
        loading={loading}
        onClick={contactSale}
      >
        Cần liên lạc sale
      </Button>
    </Group>
  );

  if (!sticky) {
    return (
      <Stack gap="xs">
        {intentBanner}
        {actions}
        {loginHint}
      </Stack>
    );
  }

  return (
    <>
      {intentBanner || loginHint ? (
        <Stack gap="xs">
          {intentBanner}
          {loginHint}
        </Stack>
      ) : null}
      <Box visibleFrom="sm">{actions}</Box>
      <Box
        hiddenFrom="sm"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 64,
          zIndex: 100,
          padding: 12,
          background: colors.surface,
          borderTop: `1px solid ${colors.border}`,
          borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
        }}
      >
        {actions}
      </Box>
    </>
  );
}
