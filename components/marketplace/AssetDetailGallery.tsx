'use client';

import {
  ActionIcon,
  Box,
  Button,
  Group,
  Image,
  Modal,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { colors, motion, radius, shadows } from '@/config/design-tokens';

const PLACEHOLDER = 'https://placehold.co/1400x900/F3F3EF/536B58?text=VBNB';

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AssetDetailGallery({
  title,
  images,
}: {
  title: string;
  images: { url: string; sort_order: number }[];
}) {
  const sorted = [...images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.url)
    .filter(Boolean);
  const urls = sorted.length > 0 ? sorted : [PLACEHOLDER];
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      {/* CSS breakpoints avoid hydration flash vs useMediaQuery */}
      <Box hiddenFrom="sm">
        <MobileGallery
          title={title}
          urls={urls}
          onOpen={(i) => setLightbox(i)}
        />
      </Box>
      <Box visibleFrom="sm">
        <DesktopGallery
          title={title}
          urls={urls}
          onOpen={(i) => setLightbox(i)}
        />
      </Box>
      <PhotoLightbox
        title={title}
        urls={urls}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onChange={setLightbox}
      />
    </>
  );
}

function MobileGallery({
  title,
  urls,
  onOpen,
}: {
  title: string;
  urls: string[];
  onOpen: (index: number) => void;
}) {
  const t = useTranslations('marketplace.gallery');
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const multi = urls.length > 1;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const w = el.clientWidth;
      if (w <= 0) return;
      setActive(Math.round(el.scrollLeft / w));
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  function goTo(index: number) {
    const el = trackRef.current;
    if (!el) return;
    const next = (index + urls.length) % urls.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  }

  const navBtnStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 3,
    background: 'rgba(22,22,22,0.55)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.12)',
  };

  return (
    <Box
      style={{
        position: 'relative',
        marginInline: 'calc(-1 * var(--mantine-spacing-md))',
        width: 'calc(100% + 2 * var(--mantine-spacing-md))',
        background: colors.surfaceMuted,
      }}
    >
      <Box
        ref={trackRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="vbnb-gallery-track"
      >
        {urls.map((url, i) => (
          <UnstyledButton
            key={`${url}-${i}`}
            onClick={() => onOpen(i)}
            aria-label={t('photoOf', { index: i + 1, title })}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              aspectRatio: '4 / 3',
              display: 'block',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Image
              src={url}
              alt={i === 0 ? title : t('photoAlt', { title, index: i + 1 })}
              fit="cover"
              h="100%"
              w="100%"
              style={{ position: 'absolute', inset: 0 }}
            />
          </UnstyledButton>
        ))}
      </Box>

      {multi ? (
        <>
          <ActionIcon
            size="lg"
            radius="xl"
            variant="filled"
            aria-label={t('prevPhoto')}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goTo(active - 1);
            }}
            style={{ ...navBtnStyle, left: 10 }}
          >
            <ChevronLeftIcon />
          </ActionIcon>
          <ActionIcon
            size="lg"
            radius="xl"
            variant="filled"
            aria-label={t('nextPhoto')}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goTo(active + 1);
            }}
            style={{ ...navBtnStyle, right: 10 }}
          >
            <ChevronRightIcon />
          </ActionIcon>
          <Text
            size="xs"
            fw={600}
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              zIndex: 2,
              background: 'rgba(22,22,22,0.72)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: radius.full,
              letterSpacing: '0.02em',
            }}
          >
            {active + 1} / {urls.length}
          </Text>
        </>
      ) : null}

      <style>{`
        .vbnb-gallery-track::-webkit-scrollbar { display: none; }
      `}</style>
    </Box>
  );
}

function DesktopGallery({
  title,
  urls,
  onOpen,
}: {
  title: string;
  urls: string[];
  onOpen: (index: number) => void;
}) {
  const t = useTranslations('marketplace.gallery');
  const count = urls.length;

  let grid: CSSProperties;
  let slotCount: number;

  if (count === 1) {
    grid = {
      display: 'grid',
      gridTemplateColumns: '1fr',
      height: 'min(420px, 52vw)',
      minHeight: 320,
    };
    slotCount = 1;
  } else if (count === 2) {
    grid = {
      display: 'grid',
      gridTemplateColumns: '1.7fr 1fr',
      gap: 8,
      height: 'min(420px, 52vw)',
      minHeight: 320,
    };
    slotCount = 2;
  } else if (count === 3) {
    grid = {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: 8,
      height: 'min(420px, 52vw)',
      minHeight: 320,
    };
    slotCount = 3;
  } else {
    grid = {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: 8,
      height: 'min(420px, 52vw)',
      minHeight: 320,
    };
    slotCount = Math.min(5, count);
  }

  return (
    <Box
      style={{
        position: 'relative',
        borderRadius: radius.xl,
        overflow: 'hidden',
        background: colors.surfaceMuted,
        boxShadow: shadows.card,
      }}
    >
      <Box style={grid}>
        {Array.from({ length: slotCount }).map((_, i) => {
          const isHero = i === 0 && count >= 3;
          const cellStyle: CSSProperties = {
            position: 'relative',
            overflow: 'hidden',
            display: 'block',
            height: '100%',
            transition: `opacity ${motion.fast}ms ${motion.easing}`,
          };
          if (isHero) {
            cellStyle.gridColumn = '1 / 2';
            cellStyle.gridRow = '1 / 3';
          }
          return (
            <UnstyledButton
              key={`${urls[i]}-${i}`}
              onClick={() => onOpen(i)}
              aria-label={t('viewPhoto', { index: i + 1 })}
              style={cellStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.92';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <Image
                src={urls[i]}
                alt={i === 0 ? title : t('photoAlt', { title, index: i + 1 })}
                fit="cover"
                h="100%"
                w="100%"
                style={{ position: 'absolute', inset: 0 }}
              />
            </UnstyledButton>
          );
        })}
      </Box>

      {count > 1 ? (
        <Button
          size="compact-sm"
          variant="white"
          color="dark"
          leftSection={<GridIcon />}
          onClick={() => onOpen(0)}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            zIndex: 2,
            boxShadow: shadows.dropdown,
            fontWeight: 600,
          }}
        >
          {t('viewAllPhotos')}
          {count > slotCount ? ` (${count})` : ''}
        </Button>
      ) : null}
    </Box>
  );
}

function PhotoLightbox({
  title,
  urls,
  index,
  onClose,
  onChange,
}: {
  title: string;
  urls: string[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const t = useTranslations('marketplace.gallery');
  const open = index != null;
  const current = index ?? 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        onChange((index! - 1 + urls.length) % urls.length);
      }
      if (e.key === 'ArrowRight') {
        onChange((index! + 1) % urls.length);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, urls.length, onClose, onChange]);

  return (
    <Modal
      opened={open}
      onClose={onClose}
      fullScreen
      padding={0}
      withCloseButton={false}
      transitionProps={{ transition: 'fade', duration: motion.normal }}
      styles={{
        content: { background: '#0a0a0a' },
        body: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        },
      }}
    >
      <Group
        justify="space-between"
        px="md"
        py="sm"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Text c="white" fw={600} size="sm">
          {title}
        </Text>
        <Group gap="sm">
          <Text c="dimmed" size="sm">
            {current + 1} / {urls.length}
          </Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={onClose}
            aria-label={t('close')}
          >
            <CloseIcon />
          </ActionIcon>
        </Group>
      </Group>

      <Box
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          padding: '16px 56px',
        }}
      >
        {urls.length > 1 ? (
          <>
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              aria-label={t('prevPhoto')}
              onClick={() =>
                onChange((current - 1 + urls.length) % urls.length)
              }
              style={{
                position: 'absolute',
                left: 12,
                zIndex: 2,
                background: 'rgba(255,255,255,0.12)',
              }}
            >
              <ChevronLeftIcon />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              aria-label={t('nextPhoto')}
              onClick={() => onChange((current + 1) % urls.length)}
              style={{
                position: 'absolute',
                right: 12,
                zIndex: 2,
                background: 'rgba(255,255,255,0.12)',
              }}
            >
              <ChevronRightIcon />
            </ActionIcon>
          </>
        ) : null}

        <Image
          src={urls[current]}
          alt={t('photoAlt', { title, index: current + 1 })}
          fit="contain"
          mah="calc(100vh - 120px)"
          maw="100%"
          radius="md"
        />
      </Box>
    </Modal>
  );
}
