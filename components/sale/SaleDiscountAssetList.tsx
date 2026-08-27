'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { LinkButton } from '@/components/ui/LinkButton';
import { colors, radius } from '@/config/design-tokens';
import type { SaleAssetDiscountProgress } from '@/lib/engines/sale-pricing';

const PAGE_SIZE = 8;

type Filter = 'all' | 'discounted' | 'zero';

export function SaleDiscountAssetList({
  assets,
}: {
  assets: SaleAssetDiscountProgress[];
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (filter === 'discounted' && a.discountPercent <= 0) return false;
      if (filter === 'zero' && a.discountPercent > 0) return false;
      if (!q) return true;
      const loc = (a.assetLocation || '').toLowerCase();
      return a.assetTitle.toLowerCase().includes(q) || loc.includes(q);
    });
  }, [assets, filter, query]);

  const visible = filtered.slice(0, shown);
  const selected = assets.find((a) => a.assetId === openId) ?? null;
  const discounted = assets.filter((a) => a.discountPercent > 0).length;

  return (
    <Stack gap="sm">
      <Group gap="xs" wrap="wrap">
        <TextInput
          placeholder="Tìm căn…"
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setShown(PAGE_SIZE);
          }}
          style={{ flex: 1, minWidth: 160 }}
        />
        <SegmentedControl
          size="xs"
          value={filter}
          onChange={(v) => {
            setFilter(v as Filter);
            setShown(PAGE_SIZE);
          }}
          data={[
            { label: `Tất cả (${assets.length})`, value: 'all' },
            { label: `Được giảm (${discounted})`, value: 'discounted' },
            { label: `Chưa giảm (${assets.length - discounted})`, value: 'zero' },
          ]}
        />
      </Group>
      {!filtered.length ? (
        <Text size="sm" c="dimmed">
          Không khớp căn nào.
        </Text>
      ) : (
        <Stack gap={6}>
          {visible.map((a) => (
            <UnstyledButton
              key={a.assetId}
              onClick={() => setOpenId(a.assetId)}
              p="sm"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                width: '100%',
              }}
            >
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <div style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {a.assetTitle}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {a.checkoutCount} lần
                    {a.assetLocation ? ` · ${a.assetLocation}` : ''}
                  </Text>
                </div>
                <Badge
                  color={a.discountPercent > 0 ? 'vbnbGreen' : 'gray'}
                  variant="light"
                >
                  {a.tierLabel || '0%'}
                </Badge>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      )}
      {filtered.length > shown ? (
        <Button
          variant="subtle"
          color="vbnbGreen"
          size="xs"
          w="fit-content"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
        >
          Xem thêm {filtered.length - shown} căn
        </Button>
      ) : null}

      <Modal
        opened={Boolean(selected)}
        onClose={() => setOpenId(null)}
        title={selected?.assetTitle || 'Căn'}
        centered
      >
        {selected ? (
          <Stack gap="sm">
            {selected.assetLocation ? (
              <Text size="sm" c="dimmed">
                {selected.assetLocation}
              </Text>
            ) : null}
            <Text size="sm">
              {selected.checkoutCount} check-out · {selected.tierLabel}
            </Text>
            <Text size="sm" c="dimmed">
              {selected.nextThreshold != null
                ? `Còn trên ${selected.nextThreshold} lần → ${selected.nextPercent}%`
                : 'Đã ở mức chiết khấu cao nhất hiện có.'}
            </Text>
            {selected.assetSlug ? (
              <LinkButton
                href={`/sale/marketplace/${selected.assetSlug}`}
                color="vbnbGreen"
                size="sm"
              >
                Xem căn trên sàn
              </LinkButton>
            ) : null}
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
