'use client';

import { Box, Button, Image, Stack, Text, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { colors, radius } from '@/config/design-tokens';
import type { NightBoardColumn } from '@/lib/engines/night-board-display';

const PLACEHOLDER = 'https://placehold.co/400x280/F3F3EF/536B58?text=VBNB';

export function columnGalleryImages(column: NightBoardColumn): {
  url: string;
  sort_order: number;
}[] {
  if (column.images?.length) return column.images;
  if (column.imageUrl) return [{ url: column.imageUrl, sort_order: 0 }];
  return [];
}

export function guestShareUrl(slug: string): string {
  if (typeof window === 'undefined') return `/a/${slug}`;
  return `${window.location.origin}/a/${slug}`;
}

export function NightBoardColumnHeader({
  column,
  showOwner,
  compact,
  onOpenGallery,
}: {
  column: NightBoardColumn;
  showOwner: boolean;
  compact?: boolean;
  onOpenGallery: () => void;
}) {
  const cover = columnGalleryImages(column)[0]?.url || PLACEHOLDER;

  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  async function copyGuestLink() {
    if (!column.slug) return;
    await navigator.clipboard.writeText(guestShareUrl(column.slug));
    notifications.show({
      color: 'vbnbGreen',
      message: 'Đã copy',
      autoClose: 2000,
    });
  }

  const title = column.detailHref ? (
    <Link href={column.detailHref} style={{ textDecoration: 'none' }}>
      <Text
        size={compact ? 'sm' : 'xs'}
        fw={compact ? 700 : 600}
        lh={compact ? 1.25 : undefined}
        lineClamp={2}
        c="vbnbGreen.6"
        title={column.title}
      >
        {column.title}
      </Text>
    </Link>
  ) : (
    <Text
      size={compact ? 'sm' : 'xs'}
      fw={compact ? 700 : 600}
      lh={compact ? 1.25 : undefined}
      lineClamp={2}
      title={column.title}
    >
      {column.title}
    </Text>
  );

  if (compact) {
    return (
      <Stack gap={4} onPointerDown={stop} onClick={stop}>
        {title}
        <Text
          size="xs"
          c="dimmed"
          lh={1.3}
          lineClamp={2}
          title={column.location || undefined}
        >
          {column.location?.trim() || '—'}
        </Text>
        {showOwner ? (
          <>
            <Text size="xs" lineClamp={1} title={column.ownerName}>
              {column.ownerName || 'Owner'}
            </Text>
            {column.ownerPhone ? (
              <Text
                component="a"
                href={`tel:${column.ownerPhone}`}
                size="xs"
                c="vbnbGreen.6"
              >
                {column.ownerPhone}
              </Text>
            ) : (
              <Text size="xs" c="dimmed">
                Chưa có SĐT
              </Text>
            )}
            {column.slug ? (
              <Button
                size="compact-xs"
                variant="light"
                color="vbnbGreen"
                fullWidth
                onClick={copyGuestLink}
              >
                Copy link khách
              </Button>
            ) : null}
          </>
        ) : null}
      </Stack>
    );
  }

  const guestPath = column.slug ? `/a/${column.slug}` : null;

  return (
    <Stack gap={4} onPointerDown={stop} onClick={stop}>
      <UnstyledButton
        onClick={onOpenGallery}
        aria-label={`Ảnh ${column.title}`}
        style={{ display: 'block', width: '100%' }}
      >
        <Box
          style={{
            width: '100%',
            height: 64,
            borderRadius: radius.sm,
            overflow: 'hidden',
            border: `1px solid ${colors.border}`,
          }}
        >
          <Image
            src={cover}
            alt={column.title}
            h={64}
            fit="cover"
            fallbackSrc={PLACEHOLDER}
          />
        </Box>
      </UnstyledButton>
      {title}
      <Text size="xs" c="dimmed">
        {column.bedrooms || '—'}pn · {column.capacity || '—'} khách
      </Text>
      {showOwner ? (
        <>
          <Text size="xs" lineClamp={1} title={column.ownerName}>
            {column.ownerName || 'Owner'}
          </Text>
          {column.ownerPhone ? (
            <Text
              component="a"
              href={`tel:${column.ownerPhone}`}
              size="xs"
              c="vbnbGreen.6"
            >
              {column.ownerPhone}
            </Text>
          ) : (
            <Text size="xs" c="dimmed">
              Chưa có SĐT
            </Text>
          )}
          {guestPath ? (
            <>
              <Text
                size="xs"
                c="dimmed"
                lineClamp={1}
                title={guestPath}
                style={{ userSelect: 'all' }}
              >
                {guestPath}
              </Text>
              <Button
                size="compact-xs"
                variant="light"
                color="vbnbGreen"
                fullWidth
                onClick={copyGuestLink}
              >
                Copy link khách
              </Button>
            </>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
