'use client';

import { Button, Code, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useEffect } from 'react';
import { colors, radius } from '@/config/design-tokens';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  // Message can carry user data or internals — only surface it while developing.
  const detail =
    process.env.NODE_ENV === 'production' ? null : error.message || null;

  return (
    <Stack align="center" justify="center" mih="70vh" p="lg">
      <Paper
        p="xl"
        radius={radius.lg}
        maw={560}
        w="100%"
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Stack gap="sm">
          <Title order={3} fw={600} style={{ color: colors.textPrimary }}>
            Đã có lỗi xảy ra
          </Title>
          <Text c="dimmed" size="sm">
            Trang không tải được. Thử lại, dữ liệu bạn đang xem không bị mất.
          </Text>

          {detail ? (
            <Code block style={{ whiteSpace: 'pre-wrap' }}>
              {detail}
            </Code>
          ) : null}

          {error.digest ? (
            <Text c="dimmed" size="xs">
              Mã lỗi: {error.digest}
            </Text>
          ) : null}

          <Group gap="sm" mt="xs">
            <Button color="vbnbGreen" onClick={reset}>
              Thử lại
            </Button>
            <Button
              variant="default"
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
