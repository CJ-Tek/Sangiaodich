'use client';

import {
  ActionIcon,
  Alert,
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
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useRef, useState } from 'react';
import {
  ASSET_TAG_GROUPS,
  ASSET_TAGS,
  assetTagGroupLabel,
  assetTagLabel,
  DRAFT_LIMIT_MESSAGE,
  MAX_ASSET_IMAGES,
  MAX_OWNER_DRAFT_ASSETS,
  MIN_ASSET_IMAGES_FOR_REVIEW,
  MIN_ASSET_TAGS,
  propertyTypeLabel,
  PROPERTY_TYPES,
  type PropertyType,
} from '@/config/asset-tags';
import { colors, radius } from '@/config/design-tokens';
import { OwnerAssetDiscountRulesEditor } from '@/components/owner/OwnerAssetDiscountRulesEditor';
import type { AssetDiscountRuleForm } from '@/components/owner/OwnerAssetDiscountRulesEditor';

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
  discountRules: AssetDiscountRuleForm[];
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
  discountRules: [],
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
  draftCount = 0,
}: {
  mode: 'create' | 'edit';
  assetId?: string;
  initial?: Partial<AssetFormValues>;
  status?: string;
  draftCount?: number;
}) {
  const router = useRouter();
  const t = useTranslations('owner.assetForm');
  const tTags = useTranslations('assetTags');
  const tPropertyTypes = useTranslations('propertyTypes');
  const isEdit = mode === 'edit';
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<AssetFormValues>(() => mergeValues(initial));
  const resetRef = useRef<() => void>(null);

  if (isEdit && !assetId) {
    return (
      <Text c="red" size="sm">
        {t('missingId')}
      </Text>
    );
  }

  const canSubmitReview =
    !isEdit || status === 'DRAFT' || status === 'REJECTED';
  const draftLimitReached = !isEdit && draftCount >= MAX_OWNER_DRAFT_ASSETS;

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
        message: t('maxPhotos', { count: MAX_ASSET_IMAGES }),
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
            message: json.error?.message || t('uploadFailed'),
          });
          continue;
        }
        uploaded.push(json.data.url as string);
      }
      if (uploaded.length) {
        setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
        notifications.show({
          color: 'vbnbGreen',
          message: t('photosUploaded', { count: uploaded.length }),
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
    if (!isEdit && !submitForReview && draftCount >= MAX_OWNER_DRAFT_ASSETS) {
      notifications.show({
        color: 'orange',
        message: DRAFT_LIMIT_MESSAGE,
      });
      return;
    }
    if (submitForReview) {
      if (form.images.length < MIN_ASSET_IMAGES_FOR_REVIEW) {
        notifications.show({
          color: 'red',
          message: t('needPhotoSubmit'),
        });
        return;
      }
      if (form.tags.length < MIN_ASSET_TAGS) {
        notifications.show({
          color: 'red',
          message: t('needTagSubmit'),
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
        discountRules: form.discountRules,
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
        message: isEdit ? t('updated') : t('created'),
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
            {t('editing')}
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
          {t('propertyType')}
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
            label: propertyTypeLabel(t.value, tPropertyTypes),
          }))}
        />
      </div>

      <TextInput
        label={t('title')}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
        required
      />
      <Textarea
        label={t('description')}
        minRows={3}
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.currentTarget.value })
        }
      />
      <TextInput
        label={t('location')}
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.currentTarget.value })}
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <NumberInput
          label={t('capacity')}
          min={1}
          value={form.capacity}
          onChange={(v) => setForm({ ...form, capacity: Number(v) || 1 })}
        />
        <NumberInput
          label={t('bedrooms')}
          min={0}
          value={form.bedrooms}
          onChange={(v) => setForm({ ...form, bedrooms: Number(v) || 0 })}
        />
        <NumberInput
          label={t('bathrooms')}
          min={0}
          value={form.bathrooms}
          onChange={(v) => setForm({ ...form, bathrooms: Number(v) || 0 })}
        />
      </SimpleGrid>

      <Stack gap="sm">
        <Group justify="space-between" align="flex-end">
          <div>
            <Text size="sm" fw={500}>
              {t('gallery')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('galleryHint', { count: MAX_ASSET_IMAGES })}
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
                {t('addPhotos')}
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
              {t('noPhotos')}
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
                    {t('cover')}
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
                    aria-label={t('moveLeft')}
                    disabled={index === 0}
                    onClick={() => moveImage(index, -1)}
                  >
                    ←
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="filled"
                    color="dark"
                    aria-label={t('moveRight')}
                    disabled={index === form.images.length - 1}
                    onClick={() => moveImage(index, 1)}
                  >
                    →
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="filled"
                    color="red"
                    aria-label={t('removePhoto')}
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
            {t('tags')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('tagsHint', { min: MIN_ASSET_TAGS, count: form.tags.length })}
          </Text>
        </div>
        {ASSET_TAG_GROUPS.map((group) => {
          const tagsInGroup = ASSET_TAGS.filter((t) => t.group === group.id);
          return (
            <Box key={group.id}>
              <Title order={6} fw={600} mb={8} c="dimmed">
                {assetTagGroupLabel(group.id, tTags)}
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
                    {assetTagLabel(tag.id, tTags)}
                  </Chip>
                ))}
              </Group>
            </Box>
          );
        })}
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <NumberInput
          label={t('costWeekday')}
          min={0}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={0}
          value={form.costWeekday}
          onChange={(v) => setForm({ ...form, costWeekday: Number(v) || 0 })}
        />
        <NumberInput
          label={t('costWeekend')}
          min={0}
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={0}
          value={form.costWeekend}
          onChange={(v) => setForm({ ...form, costWeekend: Number(v) || 0 })}
        />
      </SimpleGrid>

      <OwnerAssetDiscountRulesEditor
        rules={form.discountRules}
        onChange={(discountRules) => setForm({ ...form, discountRules })}
      />

      {draftLimitReached ? (
        <Alert color="yellow" title={t('draftLimit')}>
          {DRAFT_LIMIT_MESSAGE}
        </Alert>
      ) : null}

      {canSubmitReview ? (
        <>
          <Button
            color="vbnbGreen"
            loading={loading}
            onClick={() => submit(true)}
          >
            {isEdit ? t('saveSubmit') : t('createSubmit')}
          </Button>
          <Button
            variant="light"
            loading={loading}
            disabled={draftLimitReached}
            onClick={() => submit(false)}
          >
            {isEdit ? t('saveDraft') : t('createDraft')}
          </Button>
        </>
      ) : (
        <Button
          color="vbnbGreen"
          loading={loading}
          onClick={() => submit(false)}
        >
          {t('saveChanges')}
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
  draftCount,
}: {
  mode?: 'create' | 'edit';
  assetId?: string;
  initial?: Partial<AssetFormValues>;
  status?: string;
  draftCount?: number;
}) {
  return (
    <AssetForm
      mode={mode ?? (assetId ? 'edit' : 'create')}
      assetId={assetId}
      initial={initial}
      status={status}
      draftCount={draftCount}
    />
  );
}
