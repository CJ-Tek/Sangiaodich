'use client';

import { Button, Code, Group, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import { assetPublicCode } from '@/lib/engines/asset-search';

export function AssetCtas({
  slug,
  assetId,
  isLoggedInGuest,
  sticky,
}: {
  slug: string;
  assetId: string;
  isLoggedInGuest: boolean;
  sticky?: boolean;
}) {
  const [loading, setLoading] = useState(false);
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
      window.location.href = `/login?next=/a/${slug}`;
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
      }
    } finally {
      setLoading(false);
    }
  }

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

  if (!sticky) return actions;

  return (
    <>
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
