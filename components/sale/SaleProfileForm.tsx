'use client';

import {
  Avatar,
  Button,
  FileButton,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors, radius } from '@/config/design-tokens';

export type SaleProfileFormValues = {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string;
  nationalId: string;
  nationalIdFrontUrl: string;
  nationalIdBackUrl: string;
  /** Signed preview URLs for private CCCD images (not saved). */
  nationalIdFrontPreview?: string;
  nationalIdBackPreview?: string;
};

type UploadKind = 'avatar' | 'national_id_front' | 'national_id_back';

export function SaleProfileForm({
  initial,
}: {
  initial: SaleProfileFormValues;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const [form, setForm] = useState(initial);
  const [frontPreview, setFrontPreview] = useState(
    initial.nationalIdFrontPreview || ''
  );
  const [backPreview, setBackPreview] = useState(
    initial.nationalIdBackPreview || ''
  );

  async function uploadFile(kind: UploadKind, file: File | null) {
    if (!file) return;
    setUploading(kind);
    try {
      const body = new FormData();
      body.set('kind', kind);
      body.set('file', file);
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Upload thất bại',
        });
        return;
      }
      const { storedUrl, previewUrl } = json.data as {
        storedUrl: string;
        previewUrl: string;
      };

      if (kind === 'avatar') {
        // previewUrl includes cache-bust; strip query when saving via PATCH
        setForm((f) => ({ ...f, avatarUrl: previewUrl }));
      } else if (kind === 'national_id_front') {
        setForm((f) => ({ ...f, nationalIdFrontUrl: storedUrl }));
        setFrontPreview(previewUrl);
      } else {
        setForm((f) => ({ ...f, nationalIdBackUrl: storedUrl }));
        setBackPreview(previewUrl);
      }
      notifications.show({ color: 'vbnbGreen', message: 'Đã tải ảnh lên' });
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          avatarUrl: form.avatarUrl,
          nationalId: form.nationalId,
          nationalIdFrontUrl: form.nationalIdFrontUrl,
          nationalIdBackUrl: form.nationalIdBackUrl,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Không lưu được',
        });
        return;
      }
      notifications.show({ color: 'vbnbGreen', message: 'Đã cập nhật hồ sơ' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Stack gap="md">
        <Group align="flex-start" gap="lg">
          <Avatar
            src={form.avatarUrl || undefined}
            alt={form.fullName}
            size={88}
            radius="md"
            color="vbnbGreen"
          >
            {(form.fullName || '?').slice(0, 1).toUpperCase()}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title order={4} fw={600}>
              Thông tin cá nhân
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              Họ tên, ảnh đại diện, liên hệ và CCCD dùng khi làm việc với
              owner/guest.
            </Text>
          </div>
        </Group>

        <TextInput
          label="Họ và tên"
          required
          value={form.fullName}
          onChange={(e) =>
            setForm({ ...form, fullName: e.currentTarget.value })
          }
        />

        <div>
          <Text size="sm" fw={500} mb={4}>
            Avatar
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            Upload từ thiết bị (JPG/PNG/WebP, tối đa 2MB) hoặc dán link URL.
          </Text>
          <Group gap="sm" mb="sm">
            <FileButton
              onChange={(f) => uploadFile('avatar', f)}
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading === 'avatar'}
            >
              {(props) => (
                <Button
                  {...props}
                  variant="light"
                  color="vbnbGreen"
                  loading={uploading === 'avatar'}
                  size="sm"
                >
                  Chọn ảnh
                </Button>
              )}
            </FileButton>
            {form.avatarUrl ? (
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => setForm({ ...form, avatarUrl: '' })}
              >
                Xóa ảnh
              </Button>
            ) : null}
          </Group>
          <TextInput
            label="Avatar URL"
            description="Tùy chọn — dán link nếu không upload file."
            value={form.avatarUrl}
            onChange={(e) =>
              setForm({ ...form, avatarUrl: e.currentTarget.value })
            }
            placeholder="https://..."
          />
        </div>

        <TextInput
          label="Số điện thoại"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })}
          placeholder="+84..."
        />
        <TextInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
        />

        <TextInput
          label="Số căn cước công dân (CCCD/CMND)"
          description="9 hoặc 12 chữ số"
          value={form.nationalId}
          onChange={(e) =>
            setForm({ ...form, nationalId: e.currentTarget.value })
          }
          placeholder="0790xxxxxxxx"
        />

        <div>
          <Text size="sm" fw={500} mb={4}>
            Ảnh CCCD
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            Upload 2 mặt (JPG/PNG/WebP, tối đa 5MB). Chỉ bạn và admin xem được.
          </Text>
          <Group align="flex-start" grow preventGrowOverflow={false}>
            <Stack gap="xs" style={{ flex: 1, minWidth: 140 }}>
              <Text size="xs" c="dimmed">
                Mặt trước
              </Text>
              {frontPreview ? (
                <Image
                  src={frontPreview}
                  alt="CCCD mặt trước"
                  radius="md"
                  h={120}
                  fit="cover"
                />
              ) : (
                <Paper
                  h={120}
                  radius="md"
                  style={{
                    border: `1px dashed ${colors.border}`,
                    background: colors.surfaceMuted,
                  }}
                />
              )}
              <FileButton
                onChange={(f) => uploadFile('national_id_front', f)}
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading === 'national_id_front'}
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="light"
                    color="vbnbGreen"
                    size="xs"
                    loading={uploading === 'national_id_front'}
                  >
                    Chọn mặt trước
                  </Button>
                )}
              </FileButton>
            </Stack>
            <Stack gap="xs" style={{ flex: 1, minWidth: 140 }}>
              <Text size="xs" c="dimmed">
                Mặt sau
              </Text>
              {backPreview ? (
                <Image
                  src={backPreview}
                  alt="CCCD mặt sau"
                  radius="md"
                  h={120}
                  fit="cover"
                />
              ) : (
                <Paper
                  h={120}
                  radius="md"
                  style={{
                    border: `1px dashed ${colors.border}`,
                    background: colors.surfaceMuted,
                  }}
                />
              )}
              <FileButton
                onChange={(f) => uploadFile('national_id_back', f)}
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading === 'national_id_back'}
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="light"
                    color="vbnbGreen"
                    size="xs"
                    loading={uploading === 'national_id_back'}
                  >
                    Chọn mặt sau
                  </Button>
                )}
              </FileButton>
            </Stack>
          </Group>
        </div>

        <Button color="vbnbGreen" loading={loading} onClick={save}>
          Lưu hồ sơ
        </Button>
      </Stack>
    </Paper>
  );
}
