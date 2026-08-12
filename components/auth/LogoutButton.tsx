'use client';

import { Button } from '@mantine/core';

export function LogoutButton({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <Button
      color="red"
      variant="light"
      fullWidth={fullWidth}
      size="sm"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
      }}
    >
      Đăng xuất
    </Button>
  );
}
