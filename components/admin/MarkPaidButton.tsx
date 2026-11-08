'use client';

import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useFormat } from '@/lib/i18n/use-format';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';

export function MarkPaidButton({
  profileId,
  plans,
}: {
  profileId: string;
  plans: SubscriptionPlan[];
}) {
  const t = useTranslations('admin.markPaid');
  const router = useRouter();
  const { formatVnd, planDurationLabel } = useFormat();
  const [loading, setLoading] = useState(false);

  async function mark(plan: SubscriptionPlan) {
    const planName = plan.label || planDurationLabel(plan.months);
    if (
      !window.confirm(
        t('confirm', { plan: planName, amount: formatVnd(plan.amount) })
      )
    ) {
      return;
    }
    const planId = plan.id;
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_paid',
          profileId,
          planId,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: t('success'),
        });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!plans.length) {
    return (
      <Button size="xs" variant="default" disabled>
        {t('noPlans')}
      </Button>
    );
  }

  return (
    <Menu shadow="md" width={240}>
      <Menu.Target>
        <Button size="xs" variant="default" loading={loading}>
          {t('button')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t('menuLabel')}</Menu.Label>
        {plans.map((p) => (
          <Menu.Item key={p.id} onClick={() => mark(p)}>
            {p.label || planDurationLabel(p.months)} — {formatVnd(p.amount)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
