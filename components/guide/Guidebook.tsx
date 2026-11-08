'use client';

import { Box, Button, Group, Paper, Progress, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import {
  GUIDE_CHAPTERS,
  guideTargetForHref,
  type GuideRole,
  type GuideStep,
} from '@/lib/guide/chapters';
import { usePathname, useRouter } from '@/lib/i18n/navigation';

const CLOSED_KEY = 'vbnb.guidebook.closed';

type GuideHole = { top: number; left: number; width: number; height: number; radius: number };

type GuideSpot = { page: GuideHole | null; nav: GuideHole | null };

function pathOf(href: string) {
  return href.split('?')[0];
}

function cssPx(el: Element, name: string) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  if (!raw) return 0;
  if (raw.endsWith('rem')) {
    const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(raw) * root;
  }
  return parseFloat(raw) || 0;
}

function shellChrome() {
  const root = document.documentElement;
  let headerH = cssPx(root, '--app-shell-header-offset');
  let navW = cssPx(root, '--app-shell-navbar-offset');
  let footerH = cssPx(root, '--app-shell-footer-offset');
  const header = document.querySelector('[data-guide-chrome="header"]');
  const nav = document.querySelector('[data-guide-chrome="nav"]');
  const footer = document.querySelector('[data-guide-chrome="footer"]');
  if (header) headerH = Math.max(headerH, header.getBoundingClientRect().height);
  if (nav) {
    const rect = nav.getBoundingClientRect();
    if (rect.width > 40 && rect.height > 40) navW = Math.max(navW, rect.width);
  }
  if (footer) {
    const rect = footer.getBoundingClientRect();
    if (rect.height > 20 && rect.bottom > window.innerHeight - 8) {
      footerH = Math.max(footerH, rect.height);
    }
  }
  return { headerH, navW, footerH };
}

/** Page content only. Header, sidebar, and the mobile tab bar stay outside. */
function measureAppMain(): GuideHole | null {
  const main = document.querySelector('[data-guide-view]') ?? document.querySelector('main');
  if (!main) return null;
  const shell = main.parentElement ?? main;
  const shellRect = shell.getBoundingClientRect();
  const { headerH, navW, footerH } = shellChrome();
  const pad = 10;
  const top = Math.max(shellRect.top, 0) + headerH + pad;
  const left = Math.max(shellRect.left, 0) + navW + pad;
  const right = Math.min(shellRect.right, window.innerWidth) - pad;
  const bottom = Math.min(shellRect.bottom, window.innerHeight) - footerH - pad;
  const hole = { top, left, width: right - left, height: bottom - top, radius: 16 };
  if (hole.width < 32 || hole.height < 32) return null;
  return hole;
}

/** The sidebar or tab button for the page this step is about. */
function measureNavButton(target: string | undefined): GuideHole | null {
  if (!target) return null;
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-guide="${CSS.escape(target)}"]`)
  );
  const item = nodes.find((node) => {
    if (!node.closest('[data-guide-chrome="nav"], [data-guide-chrome="footer"]')) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 8 && rect.height > 8 && rect.bottom > 0 && rect.top < window.innerHeight;
  });
  if (!item) return null;
  const rect = item.getBoundingClientRect();
  const pad = 4;
  return {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    radius: 12,
  };
}

function sameHole(a: GuideHole | null, b: GuideHole | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  );
}

export function Guidebook({
  role,
  completed: initialCompleted,
}: {
  role: GuideRole;
  completed: string[];
}) {
  const t = useTranslations('guidebook');
  const router = useRouter();
  const pathname = usePathname();
  const chapters = GUIDE_CHAPTERS[role];
  const steps = useMemo(() => chapters.flatMap((chapter) => chapter.steps), [chapters]);
  const [completed, setCompleted] = useState(initialCompleted);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '');
  const [coach, setCoach] = useState<GuideStep | null>(null);

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  useEffect(() => {
    const closed = window.localStorage.getItem(`${CLOSED_KEY}.${role}`);
    setOpen(!closed);
    setHydrated(true);
  }, [role]);

  const done = useMemo(
    () => new Set(completed.filter((id) => steps.some((step) => step.id === id))),
    [completed, steps]
  );
  const percent = steps.length ? Math.round((done.size / steps.length) * 100) : 0;
  const chapter = chapters.find((item) => item.id === chapterId) ?? chapters[0];
  const coachIndex = coach ? steps.findIndex((step) => step.id === coach.id) : -1;
  const chapterSteps = chapter?.steps ?? [];
  const coachInChapter = coach
    ? chapterSteps.findIndex((step) => step.id === coach.id)
    : -1;

  const spotlight = hydrated && (open || Boolean(coach));
  const navTarget = coach?.target ?? guideTargetForHref(pathname);
  const [spot, setSpot] = useState<GuideSpot>({ page: null, nav: null });

  useEffect(() => {
    if (!spotlight) {
      setSpot({ page: null, nav: null });
      return;
    }
    let frame = 0;
    const update = () => {
      const next = { page: measureAppMain(), nav: measureNavButton(navTarget) };
      setSpot((prev) =>
        sameHole(prev.page, next.page) && sameHole(prev.nav, next.nav) ? prev : next
      );
    };
    update();
    const onMove = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    const retry = window.setInterval(update, 250);
    if (coach) {
      document
        .querySelector<HTMLElement>(`main [data-guide="${CSS.escape(coach.target)}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
      window.clearInterval(retry);
    };
  }, [spotlight, coach, navTarget]);

  function closeBook() {
    window.localStorage.setItem(`${CLOSED_KEY}.${role}`, '1');
    setOpen(false);
    setCoach(null);
  }

  function showStep(step: GuideStep) {
    const chapterForStep = chapters.find((item) =>
      item.steps.some((candidate) => candidate.id === step.id)
    );
    if (chapterForStep) setChapterId(chapterForStep.id);
    setCoach(step);
    setOpen(false);
    if (pathname !== pathOf(step.href)) router.push(step.href);
  }

  async function gotIt() {
    if (!coach) return;
    const stepId = coach.id;
    if (!done.has(stepId)) {
      const next = [...completed, stepId];
      setCompleted(next);
      const res = await fetch('/api/profile/guidebook', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
      });
      if (!res.ok) {
        setCompleted(completed);
        return;
      }
    }
    const nextStep = steps[coachIndex + 1];
    if (nextStep && chapterSteps.some((step) => step.id === nextStep.id)) {
      showStep(nextStep);
      return;
    }
    setCoach(null);
    setOpen(true);
  }

  function previous() {
    const prev = steps[coachIndex - 1];
    if (!prev || !chapterSteps.some((step) => step.id === prev.id)) return;
    showStep(prev);
  }

  return (
    <>
      {spotlight ? (
        <GuideScrim
          holes={[spot.page, spot.nav].filter((item): item is GuideHole => item !== null)}
          onDimClick={coach ? undefined : closeBook}
        />
      ) : null}
      {!coach ? (
        <UnstyledButton
          onClick={() =>
            setOpen((value) => {
              if (value) window.localStorage.setItem(`${CLOSED_KEY}.${role}`, '1');
              return !value;
            })
          }
          aria-label={t('open')}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            zIndex: 1110,
            background: colors.primary,
            color: '#fff',
            borderRadius: 999,
            padding: '10px 16px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(44, 62, 48, 0.24)',
          }}
        >
          {t('open')}
        </UnstyledButton>
      ) : null}

      {hydrated && open && !coach && chapter ? (
        <Paper
          p={0}
          className="vbnb-guide-panel"
          style={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(124px + env(safe-area-inset-bottom))',
            zIndex: 1100,
            width: 'min(380px, calc(100vw - 32px))',
            maxHeight: 'min(70vh, 640px)',
            borderRadius: radius.lg,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="vbnb-guide-panel-bar" />
          <Box p="md" style={{ overflow: 'auto' }}>
          <Group justify="space-between" mb="xs">
            <Title order={4}>{t('title')}</Title>
            <UnstyledButton onClick={closeBook} aria-label={t('close')}>
              <Text size="sm" c="dimmed">
                {t('close')}
              </Text>
            </UnstyledButton>
          </Group>
          <Text size="sm" c="dimmed" mb="sm">
            {t('subtitle')}
          </Text>
          <Text size="xs" fw={700} mb={4}>
            {t('progress', { percent })}
          </Text>
          <Progress value={percent} color="vbnbGreen" size="sm" mb="md" />
          <Stack gap={6} mb="md">
            {chapters.map((item, index) => {
              const chapterDone = item.steps.every((step) => done.has(step.id));
              const active = item.id === chapter.id;
              return (
                <UnstyledButton
                  key={item.id}
                  onClick={() => setChapterId(item.id)}
                  style={{
                    textAlign: 'left',
                    borderRadius: radius.md,
                    padding: '8px 10px',
                    background: active ? colors.primarySoft : 'transparent',
                  }}
                >
                  <Text size="sm" fw={active ? 700 : 500}>
                    {String(index + 1).padStart(2, '0')} {t(`chapters.${item.id}.title`)}
                    {chapterDone ? ' ✓' : ''}
                  </Text>
                </UnstyledButton>
              );
            })}
          </Stack>
          <Title order={5} mb={4}>
            {t(`chapters.${chapter.id}.title`)}
          </Title>
          <Text size="sm" c="dimmed" mb="sm">
            {t(`chapters.${chapter.id}.summary`)}
          </Text>
          <Stack gap="sm">
            {chapter.steps.map((step, index) => (
              <Box key={step.id}>
                <Text size="sm" fw={600}>
                  {index + 1}. {t(`steps.${step.id}.title`)}
                  {done.has(step.id) ? ' ✓' : ''}
                </Text>
                <Text size="sm" c="dimmed" mb={6}>
                  {t(`steps.${step.id}.body`)}
                </Text>
                <Button size="xs" color="vbnbGreen" onClick={() => showStep(step)}>
                  {t('showMe')}
                </Button>
              </Box>
            ))}
          </Stack>
          </Box>
        </Paper>
      ) : null}

      {coach ? (
        <Paper
          p={0}
          className="vbnb-guide-panel"
          style={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(72px + env(safe-area-inset-bottom))',
            zIndex: 1100,
            width: 'min(380px, calc(100vw - 32px))',
            borderRadius: radius.lg,
          }}
        >
          <div className="vbnb-guide-panel-bar" />
          <Box p="md">
          <Text size="xs" fw={700} c="vbnbGreen.7" mb={4}>
            {t('step', {
              n: Math.max(coachInChapter, 0) + 1,
              total: chapterSteps.length,
            })}
          </Text>
          <Title order={5} mb={4}>
            {t(`steps.${coach.id}.title`)}
          </Title>
          <Text size="sm" mb="md">
            {t(`steps.${coach.id}.body`)}
          </Text>
          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              disabled={coachInChapter <= 0}
              onClick={previous}
            >
              {t('previous')}
            </Button>
            <Group gap="xs">
              <Button
                variant="default"
                size="xs"
                onClick={() => {
                  setCoach(null);
                  setOpen(true);
                }}
              >
                {t('exit')}
              </Button>
              <Button color="vbnbGreen" size="xs" onClick={() => void gotIt()}>
                {t('gotIt')}
              </Button>
            </Group>
          </Group>
          </Box>
        </Paper>
      ) : null}
    </>
  );
}

function GuideScrim({
  holes,
  onDimClick,
}: {
  holes: GuideHole[];
  onDimClick?: () => void;
}) {
  if (!holes.length) {
    return <div className="vbnb-guide-scrim vbnb-guide-scrim-full" onClick={onDimClick} />;
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const cutouts = holes
    .map((hole) => {
      const right = hole.left + hole.width;
      const bottom = hole.top + hole.height;
      return `M${hole.left},${hole.top} H${right} V${bottom} H${hole.left} Z`;
    })
    .join(' ');
  return (
    <>
      <svg className="vbnb-guide-mask" width={width} height={height}>
        <path
          fill="rgba(22, 22, 22, 0.55)"
          fillRule="evenodd"
          pointerEvents="fill"
          d={`M0,0 H${width} V${height} H0 Z ${cutouts}`}
          onClick={onDimClick}
        />
      </svg>
      {holes.map((hole) => (
        <div
          key={`${hole.left}-${hole.top}-${hole.width}`}
          className="vbnb-guide-hole"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            borderRadius: hole.radius,
          }}
        />
      ))}
    </>
  );
}
