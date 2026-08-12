'use client';

import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ExportGuestInvoiceButton({
  bookingId,
  salePayoutReady,
  remaining,
}: {
  bookingId: string;
  salePayoutReady: boolean;
  remaining: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (remaining <= 0) return null;

  async function exportInvoice() {
    if (!salePayoutReady) {
      notifications.show({
        color: 'yellow',
        message: 'Cần cấu hình STK nhận tiền trước khi xuất invoice',
      });
      router.push('/sale/settings?tab=payout');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/guest-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Không xuất được invoice',
        });
        return;
      }
      const url = json.data.url as string;
      await navigator.clipboard.writeText(url);
      notifications.show({
        color: 'vbnbGreen',
        message: 'Đã copy link invoice (15 phút)',
        autoClose: 2500,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="xs"
      variant="light"
      color="vbnbGreen"
      loading={loading}
      onClick={exportInvoice}
    >
      Xuất invoice
    </Button>
  );
}
