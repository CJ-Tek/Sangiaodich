'use client';

import { Button, Group, Text, TextInput } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { dateOnlyAddDays, todayDateOnly } from '@/lib/dates';
import { NIGHT_BOARD_WINDOW } from '@/lib/engines/night-board-range';

function formatShort(dateOnly: string): string {
  return dateOnly.slice(5).replace('-', '/');
}

export function NightBoardFromPicker({
  from,
  href,
  extraParams,
  nightCount = NIGHT_BOARD_WINDOW,
}: {
  from: string;
  href: string;
  extraParams?: Record<string, string | undefined>;
  /** Must match listNightsFrom count on the calendar page. */
  nightCount?: number;
}) {
  const t = useTranslations('inventory.fromPicker');
  const router = useRouter();
  const today = todayDateOnly();
  const windowSize = Math.min(Math.max(nightCount, 1), 62);
  const rangeEnd = dateOnlyAddDays(from, windowSize - 1);
  const atToday = from <= today;

  function navigateTo(nextFrom: string) {
    const params = new URLSearchParams();
    if (nextFrom && nextFrom !== today) params.set('from', nextFrom);
    for (const [key, value] of Object.entries(extraParams || {})) {
      const trimmed = value?.trim();
      if (trimmed) params.set(key, trimmed);
    }
    const qs = params.toString();
    router.push(qs ? `${href}?${qs}` : href);
  }

  function goPrev() {
    const candidate = dateOnlyAddDays(from, -windowSize);
    navigateTo(candidate < today ? today : candidate);
  }

  function goNext() {
    navigateTo(dateOnlyAddDays(from, windowSize));
  }

  return (
    <Group gap="sm" align="center" wrap="wrap">
      <Button
        size="xs"
        variant="light"
        color="vbnbGreen"
        disabled={atToday}
        onClick={goPrev}
      >
        ← {t('prev')}
      </Button>
      <Text size="sm">{t('fromLabel')}</Text>
      <TextInput
        type="date"
        size="sm"
        w={160}
        min={today}
        value={from}
        onChange={(e) => {
          const next = e.currentTarget.value;
          if (!next) return;
          navigateTo(next < today ? today : next);
        }}
      />
      <Button size="xs" variant="light" color="vbnbGreen" onClick={goNext}>
        {t('next')} →
      </Button>
      <Button
        size="xs"
        variant="subtle"
        color="vbnbGreen"
        disabled={atToday}
        onClick={() => navigateTo(today)}
      >
        {t('today')}
      </Button>
      <Text size="sm" c="dimmed">
        {t('rangeHint', {
          start: formatShort(from),
          end: formatShort(rangeEnd),
          count: windowSize,
        })}
      </Text>
    </Group>
  );
}
