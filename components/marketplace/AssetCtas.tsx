'use client';

import { Alert, Button, Code, Group, Box, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import { assetPublicCode } from '@/lib/engines/asset-search';
import { usePathname, useRouter } from '@/lib/i18n/navigation';

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
  const t = useTranslations('marketplace.ctas');
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
      message: t('copyIdSuccess'),
      autoClose: 2000,
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    notifications.show({
      color: 'vbnbGreen',
      message: t('copyLinkSuccess'),
      autoClose: 2000,
    });
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: t('shareTitle'), url });
      return;
    }
    await copyLink();
  }

  async function contactSale() {
    if (!isLoggedInGuest) {
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
          message: json.error?.message || t('error'),
        });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: t('leadSuccess'),
        });
        setShowIntent(false);
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
      title={t('loggedInTitle')}
    >
      <Text size="sm">{t('loggedInBody')}</Text>
    </Alert>
  ) : null;

  const loginHint = !isLoggedInGuest ? (
    <Text size="xs" c="dimmed">
      {t('loginHint')}
    </Text>
  ) : null;

  const actions = (
    <Group grow preventGrowOverflow={false} gap="sm" wrap="wrap">
      <Group gap="xs" wrap="nowrap">
        <Code>{publicCode}</Code>
        <Button variant="default" onClick={copyId}>
          {t('copyId')}
        </Button>
      </Group>
      <Button color="vbnbGreen" onClick={copyLink}>
        {t('copyLink')}
      </Button>
      <Button variant="default" onClick={share}>
        {t('share')}
      </Button>
      <Button
        variant="outline"
        color="vbnbGreen"
        loading={loading}
        onClick={contactSale}
      >
        {t('contactSale')}
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
