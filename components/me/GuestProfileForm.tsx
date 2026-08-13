'use client';

import {
  Avatar,
  Button,
  FileButton,
  Group,
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

export type GuestProfileFormValues = {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string;
};

export function GuestProfileForm({
  initial,
}: {
  initial: GuestProfileFormValues;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(initial);

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set('kind', 'avatar');
      body.set('file', file);
      const res = await fetch('/api/profile/upload', { method: 'POST', body });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Upload thất bại',
        });
        return;
      }
      const { previewUrl } = json.data as { previewUrl: string };
      setForm((f) => ({ ...f, avatarUrl: previewUrl }));
      notifications.show({ color: 'vbnbGreen', message: 'Đã tải ảnh lên' });
    } finally {
      setUploading(false);
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
          email: form.email,
          avatarUrl: form.avatarUrl,
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
              Tên và ảnh đại diện hiển thị với sale phụ trách booking của bạn.
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
            Ảnh đại diện
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            Upload từ thiết bị (JPG/PNG/WebP, tối đa 2MB) hoặc dán link URL.
          </Text>
          <Group gap="sm" mb="sm">
            <FileButton
              onChange={uploadAvatar}
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
            >
              {(props) => (
                <Button
                  {...props}
                  variant="light"
                  color="vbnbGreen"
                  loading={uploading}
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
          description="Là danh tính đăng nhập OTP nên không đổi ở đây. Cần đổi thì liên hệ hỗ trợ."
          value={form.phone}
          readOnly
          disabled
        />
        <TextInput
          label="Email"
          type="email"
          description="Tùy chọn — dùng để nhận thông tin booking."
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
        />

        <Button color="vbnbGreen" loading={loading} onClick={save}>
          Lưu hồ sơ
        </Button>
      </Stack>
    </Paper>
  );
}
