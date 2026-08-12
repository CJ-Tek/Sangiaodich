'use client';

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Chip,
  FileButton,
  Group,
  Image,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  ASSET_TAG_GROUPS,
  ASSET_TAGS,
  MAX_ASSET_IMAGES,
  MIN_ASSET_IMAGES_FOR_REVIEW,
  MIN_ASSET_TAGS,
  PROPERTY_TYPES,
  type PropertyType,
} from '@/config/asset-tags';
import { colors, radius } from '@/config/design-tokens';

export type AssetFormValues = {
  title: string;
  description: string;
  location: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  tags: string[];
  costWeekday: number;
  costWeekend: number;
  images: string[];
};

const CREATE_DEFAULTS: AssetFormValues = {
  title: '',
  description: '',
  location: '',
  capacity: 4,
  bedrooms: 2,
  bathrooms: 1,
  propertyType: 'VILLA',
  tags: [],
  costWeekday: 2000000,
  costWeekend: 2800000,
  images: [],
};

function mergeValues(initial?: Partial<AssetFormValues>): AssetFormValues {
  return {
    ...CREATE_DEFAULTS,
    ...initial,
    tags: initial?.tags ?? CREATE_DEFAULTS.tags,
    images: initial?.images ?? CREATE_DEFAULTS.images,
    propertyType: initial?.propertyType ?? CREATE_DEFAULTS.propertyType,
  };
}

export function AssetForm({
  mode,
  assetId,
  initial,
  status,
}: {
  mode: 'create' | 'edit';
  assetId?: string;
  initial?: Partial<AssetFormValues>;
  status?: string;
}) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<AssetFormValues>(() => mergeValues(initial));
  const resetRef = useRef<() => void>(null);

  if (isEdit && !assetId) {
    return (
      <Text c="red" size="sm">
        Thiếu assetId — không thể sửa.
      </Text>
    );
  }

  const canSubmitReview =
    !isEdit || status === 'DRAFT' || status === 'REJECTED';

  function toggleTag(id: string) {
    setForm((prev) => {
      if (prev.tags.includes(id)) {
        return { ...prev, tags: prev.tags.filter((t) => t !== id) };
      }
      return { ...prev, tags: [...prev.tags, id] };
    });
  }

  async function uploadFiles(files: File[] | null) {
    if (!files?.length) return;
    const room = MAX_ASSET_IMAGES - form.images.length;
    if (room <= 0) {
      notifications.show({
        color: 'orange',
        message: `Tối đa ${MAX_ASSET_IMAGES} ảnh`,
      });
      return;
    }

    const batch = files.slice(0, room);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of batch) {
        const body = new FormData();
        body.set('file', file);
        if (assetId) body.set('assetId', assetId);
        const res = await fetch('/api/owner/assets/upload', {
          method: 'POST',
          body,
        });
        const json = await res.json();
        if (!json.success) {
          notifications.show({
            color: 'red',
            message: json.error?.message || 'Upload thất bại',
          });
          continue;
        }
        uploaded.push(json.data.url as string);
      }
      if (uploaded.length) {
        setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
        notifications.show({
          color: 'vbnbGreen',
          message: `Đã tải ${uploaded.length} ảnh`,
        });
      }
    } finally {
      setUploading(false);
      resetRef.current?.();
    }
  }

  function removeImage(url: string) {
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
  }

  function moveImage(index: number, dir: -1 | 1) {
    setForm((f) => {
      const next = [...f.images];
      const target = index + dir;
      if (target < 0 || target >= next.length) return f;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return { ...f, images: next };
    });
  }

  async function submit(submitForReview: boolean) {
    if (submitForReview) {
      if (form.images.length < MIN_ASSET_IMAGES_FOR_REVIEW) {
        notifications.show({
          color: 'red',
          message: 'Cần ít nhất 1 ảnh khi nộp duyệt',
        });
        return;
      }
      if (form.tags.length < MIN_ASSET_TAGS) {
        notifications.show({
          color: 'red',
          message: 'Chọn ít nhất 1 tag khi nộp duyệt',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        capacity: form.capacity,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        propertyType: form.propertyType,
        tags: form.tags,
        costWeekday: form.costWeekday,
        costWeekend: form.costWeekend,
        images: form.images,
        submit: submitForReview,
        ...(isEdit ? { assetId } : {}),
      };

      const res = await fetch('/api/owner/assets', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message: isEdit ? 'Đã cập nhật asset' : 'Đã tạo asset',
      });
      router.push('/owner/assets');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="lg">
      {isEdit ? (
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            Đang sửa asset
          </Text>
          {status ? (
            <Badge variant="light" color="gray" size="sm">
              {status}
            </Badge>
          ) : null}
        </Group>
      ) : null}

      <div>
        <Text size="sm" fw={500} mb={6}>
          Loại hình
        </Text>
        <SegmentedControl
          fullWidth
          color="vbnbGreen"
          value={form.propertyType}
          onChange={(v) =>
            setForm({ ...form, propertyType: v as PropertyType })
          }
          data={PROPERTY_TYPES.map((t) => ({
            value: t.value,
            label: t.label,
          }))}
        />
      </div>

      <TextInput
        label="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
        required
      />
      <Textarea
        label="Description"
        minRows={3}
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.currentTarget.value })
        }
      />
      <TextInput
        label="Location"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.currentTarget.value })}
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <NumberInput
          label="Capacity"
          min={1}
          value={form.capacity}
          onChange={(v) => setForm({ ...form, capacity: Number(v) || 1 })}
        />
        <NumberInput
          label="Bedrooms"
          min={0}
          value={form.bedrooms}
          onChange={(v) => setForm({ ...form, bedrooms: Number(v) || 0 })}
        />
        <NumberInput
          label="Bathrooms"
          min={0}
          value={form.bathrooms}
          onChange={(v) => setForm({ ...form, bathrooms: Number(v) || 0 })}
        />
      </SimpleGrid>

      <Stack gap="sm">
        <Group justify="space-between" align="flex-end">
          <div>
            <Text size="sm" fw={500}>
              Ảnh gallery
            </Text>
            <Text size="xs" c="dimmed">
              Tối đa {MAX_ASSET_IMAGES} ảnh · ảnh đầu là cover · JPG/PNG/WebP
            </Text>
          </div>
          <FileButton
            resetRef={resetRef}
            onChange={(files) => void uploadFiles(files)}
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading || form.images.length >= MAX_ASSET_IMAGES}
          >
            {(props) => (
              <Button
                {...props}
                variant="light"
                color="vbnbGreen"
                loading={uploading}
                size="compact-sm"
              >
                Thêm ảnh
              </Button>
            )}
          </FileButton>
        </Group>

        {form.images.length === 0 ? (
          <Box
            p="xl"
            style={{
              border: `1px dashed ${colors.borderStrong}`,
              borderRadius: radius.lg,
              background: colors.surfaceMuted,
              textAlign: 'center',
            }}
          >
            <Text size="sm" c="dimmed">
              Chưa có ảnh — bấm &quot;Thêm ảnh&quot; để upload
            </Text>
          </Box>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
            {form.images.map((url, index) => (
              <Box
                key={url}
                style={{
                  position: 'relative',
                  borderRadius: radius.md,
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                  aspectRatio: '4 / 3',
                  background: colors.surfaceMuted,
                }}
              >
                <Image src={url} alt="" h="100%" fit="cover" />
                {index === 0 ? (
                  <Badge
                    size="xs"
                    color="vbnbGreen"
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                    }}
                  >
                    Cover
                  </Badge>
                ) : null}
                <Group
                  gap={4}
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    right: 6,
                  }}
                >
                  <ActionIcon
                    size="sm"
                    variant="filled"
                    color="dark"
                    aria-label="Đưa sang trái"
                    disabled={index === 0}
                    onClick={() => moveImage(index, -1)}
                  >
                    ←
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="filled"
                    color="dark"
                    aria-label="Đưa sang phải"
                    disabled={index === form.images.length - 1}
                    onClick={() => moveImage(index, 1)}
                  >
                    →
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="filled"
                    color="red"
                    aria-label="Xóa ảnh"
                    onClick={() => removeImage(url)}
                  >
                    ×
                  </ActionIcon>
                </Group>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500}>
            Tag đặc tính
          </Text>
          <Text size="xs" c="dimmed">
            Chọn tự do (tối thiểu {MIN_ASSET_TAGS} khi nộp duyệt) · đã chọn{' '}
            {form.tags.length}
          </Text>
        </div>
        {ASSET_TAG_GROUPS.map((group) => {
          const tagsInGroup = ASSET_TAGS.filter((t) => t.group === group.id);
          return (
            <Box key={group.id}>
              <Title order={6} fw={600} mb={8} c="dimmed">
                {group.label}
              </Title>
              <Group gap={8}>
                {tagsInGroup.map((tag) => (
                  <Chip
                    key={tag.id}
                    checked={form.tags.includes(tag.id)}
                    color="vbnbGreen"
                    variant="light"
                    size="sm"
                    onChange={() => toggleTag(tag.id)}
                  >
                    {tag.label}
                  </Chip>
                ))}
              </Group>
            </Box>
          );
        })}
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <NumberInput
          label="Cost weekday"
          min={0}
          value={form.costWeekday}
          onChange={(v) => setForm({ ...form, costWeekday: Number(v) || 0 })}
        />
        <NumberInput
          label="Cost weekend"
          min={0}
          value={form.costWeekend}
          onChange={(v) => setForm({ ...form, costWeekend: Number(v) || 0 })}
        />
      </SimpleGrid>

      {canSubmitReview ? (
        <>
          <Button
            color="vbnbGreen"
            loading={loading}
            onClick={() => submit(true)}
          >
            {isEdit ? 'Lưu & nộp duyệt' : 'Tạo & nộp duyệt'}
          </Button>
          <Button
            variant="light"
            loading={loading}
            onClick={() => submit(false)}
          >
            {isEdit ? 'Lưu (giữ nháp)' : 'Lưu nháp'}
          </Button>
        </>
      ) : (
        <Button
          color="vbnbGreen"
          loading={loading}
          onClick={() => submit(false)}
        >
          Lưu thay đổi
        </Button>
      )}
    </Stack>
  );
}

/** @deprecated Prefer AssetForm with explicit mode */
export function NewAssetForm({
  mode,
  assetId,
  initial,
  status,
}: {
  mode?: 'create' | 'edit';
  assetId?: string;
  initial?: Partial<AssetFormValues>;
  status?: string;
}) {
  return (
    <AssetForm
      mode={mode ?? (assetId ? 'edit' : 'create')}
      assetId={assetId}
      initial={initial}
      status={status}
    />
  );
}
