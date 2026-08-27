'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { OwnerAssetReviewControls } from '@/components/owner/OwnerAssetReviewControls';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { colors, radius } from '@/config/design-tokens';

const PAGE_SIZE = 10;

export type OwnerAssetListRow = {
  id: string;
  title: string;
  status: string;
  location: string | null;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  costWeekday: number;
  costWeekend: number;
  discountRules: {
    minCheckedOutCount: number;
    costDiscountPercent: number;
  }[];
};

type Filter = 'all' | 'with' | 'without';

export function OwnerAssetsList({
  rows,
  truncated,
}: {
  rows: OwnerAssetListRow[];
  truncated?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);

  const withDiscount = rows.filter((r) => r.discountRules.length > 0).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const has = r.discountRules.length > 0;
      if (filter === 'with' && !has) return false;
      if (filter === 'without' && has) return false;
      if (!q) return true;
      const loc = (r.location || '').toLowerCase();
      return r.title.toLowerCase().includes(q) || loc.includes(q);
    });
  }, [rows, filter, query]);

  const visible = filtered.slice(0, shown);
  const selected = rows.find((r) => r.id === openId) ?? null;
  const q = query.trim();

  return (
    <Stack gap="md">
      <Group gap="xs" wrap="wrap">
        <TextInput
          placeholder="Tìm theo tên hoặc địa chỉ…"
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setShown(PAGE_SIZE);
          }}
          style={{ flex: 1, minWidth: 200 }}
        />
        <SegmentedControl
          size="xs"
          value={filter}
          onChange={(v) => {
            setFilter(v as Filter);
            setShown(PAGE_SIZE);
          }}
          data={[
            { label: `Tất cả (${rows.length})`, value: 'all' },
            { label: `Có chiết khấu (${withDiscount})`, value: 'with' },
            {
              label: `Không chiết khấu (${rows.length - withDiscount})`,
              value: 'without',
            },
          ]}
        />
      </Group>

      {!filtered.length ? (
        <EmptyState
          title="Không khớp asset"
          description={
            q || filter !== 'all'
              ? 'Thử tên, địa chỉ, hoặc đổi bộ lọc chiết khấu.'
              : 'Tạo listing đầu tiên để gửi duyệt.'
          }
        />
      ) : (
        <Stack gap="sm">
          {truncated ? (
            <Text size="sm" c="dimmed">
              Đang hiện {rows.length} căn gần nhất. Thu hẹp tìm kiếm nếu không thấy căn cũ.
            </Text>
          ) : null}
          {visible.map((a) => {
            const has = a.discountRules.length > 0;
            return (
              <Paper
                key={a.id}
                p="lg"
                radius={radius.lg}
                style={{ border: `1px solid ${colors.border}` }}
              >
                <OwnerAssetReviewControls
                  assetId={a.id}
                  status={a.status}
                  extraActions={
                    <Button
                      variant="light"
                      color="vbnbGreen"
                      size="compact-sm"
                      onClick={() => setOpenId(a.id)}
                    >
                      {has
                        ? `Chiết khấu (${a.discountRules.length})`
                        : 'Chiết khấu'}
                    </Button>
                  }
                >
                  <div>
                    <Text fw={600}>{a.title}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {a.propertyType === 'APARTMENT' ? 'Căn hộ' : 'Villa'}
                      {a.location ? ` · ${a.location}` : ''}
                      {` · ${a.bedrooms} PN · ${a.bathrooms} WC`}
                    </Text>
                    <Text size="sm" c="dimmed" mt={6}>
                      Cost WD {a.costWeekday.toLocaleString('vi-VN')} · WE{' '}
                      {a.costWeekend.toLocaleString('vi-VN')}
                    </Text>
                  </div>
                </OwnerAssetReviewControls>
              </Paper>
            );
          })}
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
        </Stack>
      )}

      <Modal
        opened={Boolean(selected)}
        onClose={() => setOpenId(null)}
        title={selected?.title || 'Chiết khấu'}
        centered
      >
        {selected ? (
          <Stack gap="sm">
            {selected.location ? (
              <Text size="sm" c="dimmed">
                {selected.location}
              </Text>
            ) : null}
            {selected.discountRules.length ? (
              selected.discountRules.map((r) => (
                <Text key={r.minCheckedOutCount} size="sm">
                  Trên {r.minCheckedOutCount} lần → {r.costDiscountPercent}%
                </Text>
              ))
            ) : (
              <Text size="sm" c="dimmed">
                Chưa set — mặc định 0%.
              </Text>
            )}
            <LinkButton
              href={`/owner/assets/${selected.id}/edit`}
              color="vbnbGreen"
              size="sm"
            >
              Sửa trên Setup Asset
            </LinkButton>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
