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
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
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
  const t = useTranslations('guest.profile');
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
          message: json.error?.message || t('uploadFailed'),
        });
        return;
      }
      const { previewUrl } = json.data as { previewUrl: string };
      setForm((f) => ({ ...f, avatarUrl: previewUrl }));
      notifications.show({ color: 'vbnbGreen', message: t('uploadSuccess') });
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
          message: json.error?.message || t('saveFailed'),
        });
        return;
      }
      notifications.show({ color: 'vbnbGreen', message: t('saveSuccess') });
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
              {t('personalInfo')}
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              {t('personalInfoDesc')}
            </Text>
          </div>
        </Group>

        <TextInput
          label={t('fullName')}
          required
          value={form.fullName}
          onChange={(e) =>
            setForm({ ...form, fullName: e.currentTarget.value })
          }
        />

        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('avatar')}
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            {t('avatarHint')}
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
                  {t('choosePhoto')}
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
                {t('removePhoto')}
              </Button>
            ) : null}
          </Group>
          <TextInput
            label={t('avatarUrl')}
            description={t('avatarUrlDesc')}
            value={form.avatarUrl}
            onChange={(e) =>
              setForm({ ...form, avatarUrl: e.currentTarget.value })
            }
            placeholder="https://..."
          />
        </div>

        <TextInput
          label={t('phone')}
          description={t('phoneDesc')}
          value={form.phone}
          readOnly
          disabled
        />
        <TextInput
          label={t('email')}
          type="email"
          description={t('emailDesc')}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
        />

        <Button color="vbnbGreen" loading={loading} onClick={save}>
          {t('save')}
        </Button>
      </Stack>
    </Paper>
  );
}
