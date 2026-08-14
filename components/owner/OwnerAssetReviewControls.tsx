'use client';

import { Badge, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { submitAssetForReview } from '@/app/owner/assets/submit-asset-for-review';
import { LinkButton } from '@/components/ui/LinkButton';
import { bookingStatusColors } from '@/config/booking-status';

function statusTone(status: string) {
  if (status === 'ACTIVE') return bookingStatusColors.confirmed;
  if (status === 'PENDING_REVIEW') return bookingStatusColors.hold;
  if (status === 'SUSPENDED' || status === 'REJECTED') {
    return bookingStatusColors.cancelled;
  }
  return bookingStatusColors.blocked;
}

export function OwnerAssetReviewControls({
  assetId,
  status: initialStatus,
  children,
}: {
  assetId: string;
  status: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const tone = statusTone(status);
  const canSubmit = status === 'DRAFT' || status === 'REJECTED';

  async function submit() {
    setLoading(true);
    try {
      const result = await submitAssetForReview(assetId);
      if (!result.success) {
        notifications.show({
          color: 'red',
          message: result.message || 'Không gửi duyệt được',
        });
        return;
      }
      setStatus('PENDING_REVIEW');
      notifications.show({ color: 'vbnbGreen', message: 'Đã gửi duyệt' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Group justify="space-between" align="flex-start" wrap="wrap">
        {children}
        <Group gap="sm" align="center">
          <Badge
            variant="outline"
            styles={{
              root: {
                background: tone.bg,
                color: tone.text,
                borderColor: tone.border,
              },
            }}
          >
            {status}
          </Badge>
          <LinkButton
            href={`/owner/assets/${assetId}/edit`}
            variant="default"
            size="compact-sm"
          >
            Edit
          </LinkButton>
        </Group>
      </Group>
      {canSubmit ? (
        <Button
          mt="md"
          variant="light"
          color="vbnbGreen"
          loading={loading}
          onClick={submit}
        >
          Submit for review
        </Button>
      ) : null}
    </>
  );
}
