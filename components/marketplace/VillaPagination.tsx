'use client';

import { Group, Pagination, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useSearchParams } from 'next/navigation';

/**
 * URL-backed page controls for villa grids. Keeps q/tags (and any other
 * query params) when changing page; drops page when returning to 1.
 */
export function VillaPagination({
  page,
  totalPages,
  total,
  itemLabel,
}: {
  page: number;
  totalPages: number;
  total?: number;
  /** Override translated item label (e.g. admin asset list). */
  itemLabel?: string;
}) {
  const t = useTranslations('marketplace.pagination');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedItemLabel = itemLabel ?? t('itemLabel');

  if (totalPages <= 1) return null;

  function goTo(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete('page');
    else params.set('page', String(next));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Group justify="center" mt="xl" gap="md" wrap="wrap">
      {typeof total === 'number' ? (
        <Text size="sm" c="dimmed">
          {total} {resolvedItemLabel}
        </Text>
      ) : null}
      <Pagination
        value={page}
        onChange={goTo}
        total={totalPages}
        color="vbnbGreen"
        siblings={1}
        boundaries={1}
      />
    </Group>
  );
}
