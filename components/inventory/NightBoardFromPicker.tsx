'use client';

import { Group, Text, TextInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { todayDateOnly } from '@/lib/dates';

export function NightBoardFromPicker({
  from,
  href,
  extraParams,
}: {
  from: string;
  href: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const today = todayDateOnly();

  return (
    <Group gap="sm">
      <Text size="sm">Từ ngày</Text>
      <TextInput
        type="date"
        size="sm"
        w={160}
        min={today}
        value={from}
        onChange={(e) => {
          const next = e.currentTarget.value;
          const params = new URLSearchParams();
          if (next && next !== today) params.set('from', next);
          for (const [key, value] of Object.entries(extraParams || {})) {
            const trimmed = value?.trim();
            if (trimmed) params.set(key, trimmed);
          }
          const qs = params.toString();
          router.push(qs ? `${href}?${qs}` : href);
        }}
      />
    </Group>
  );
}
