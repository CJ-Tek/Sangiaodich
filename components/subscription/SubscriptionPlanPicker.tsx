'use client';

import {
  Alert,
  Badge,
  Button,
  CopyButton,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useEffect, useState, useTransition } from 'react';
import { colors, motion, radius, shadows } from '@/config/design-tokens';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import {
  formatVnd,
  planDiscount,
  planDurationLabel,
  type SubscriptionPlan,
} from '@/lib/engines/subscription-plans';

const POLL_INTERVAL_MS = 5_000;
/** Bank transfers land within minutes; stop nagging the API after that. */
const POLL_TIMEOUT_MS = 10 * 60 * 1_000;

export type PendingCheckout = {
  intentId: string;
  planId: string;
  paymentCode: string;
  amount: number;
  months: number;
  expiresAt: string;
  qrUrl: string | null;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export function SubscriptionPlanPicker({
  plans,
  initialPending,
  gatewayEnabled,
}: {
  plans: SubscriptionPlan[];
  initialPending?: PendingCheckout | null;
  gatewayEnabled?: boolean;
}) {
  const t = useTranslations('subscription.planPicker');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [pending, setPending] = useState<PendingCheckout | null>(
    initialPending ?? null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    initialPending?.planId ?? null
  );
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function selectPlan(plan: SubscriptionPlan) {
    if (loadingPlanId) return;
    setLoadingPlanId(plan.id);
    setSelectedPlanId(plan.id);
    try {
      const res = await fetch('/api/subscription/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || t('createIntentFailed'),
        });
        return;
      }
      setPending(json.data as PendingCheckout);
      startTransition(() => router.refresh());
    } catch {
      notifications.show({ color: 'red', message: t('networkError') });
    } finally {
      setLoadingPlanId(null);
    }
  }

  const pendingIntentId = pending?.intentId ?? null;

  useEffect(() => {
    if (!pendingIntentId) return;

    const startedAt = Date.now();
    let stopped = false;

    const timer = setInterval(async () => {
      if (stopped) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        return;
      }
      try {
        const res = await fetch(
          `/api/subscription/intents?intentId=${pendingIntentId}`
        );
        const json = await res.json();
        if (stopped || !json.success || !json.data?.intent?.paid) return;
        clearInterval(timer);
        setPending(null);
        notifications.show({
          color: 'vbnbGreen',
          message: t('paymentReceived'),
        });
        router.refresh();
      } catch {
        // Transient network error: keep polling until the timeout.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [pendingIntentId, router, t]);

  async function payViaGateway() {
    if (!pending) return;
    setGatewayLoading(true);
    try {
      const res = await fetch('/api/subscription/gateway-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentCode: pending.paymentCode,
          amount: pending.amount,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || t('gatewayNotReady'),
        });
        return;
      }
      const { checkoutUrl, fields } = json.data as {
        checkoutUrl: string;
        fields: Record<string, string>;
      };
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkoutUrl;
      form.style.display = 'none';
      for (const [k, v] of Object.entries(fields || {})) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      notifications.show({ color: 'red', message: t('gatewayOpenFailed') });
    } finally {
      setGatewayLoading(false);
    }
  }

  return (
    <Stack gap="md">
      <div>
        <Text fw={600} mb={4}>
          {t('choosePlanTitle')}
        </Text>
        <Text size="sm" c="dimmed">
          {t('choosePlanDesc')}
        </Text>
      </div>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        {plans.map((plan) => {
          const selected = selectedPlanId === plan.id;
          const loading = loadingPlanId === plan.id;
          const discount = planDiscount(plan);
          return (
            <UnstyledButton
              key={plan.id}
              onClick={() => selectPlan(plan)}
              disabled={Boolean(loadingPlanId)}
              style={{
                border: `2px solid ${
                  selected ? colors.primary : colors.border
                }`,
                background: selected ? colors.primarySoft : colors.surface,
                boxShadow: selected ? shadows.cardHover : shadows.card,
                cursor: loadingPlanId ? 'wait' : 'pointer',
                textAlign: 'left',
                width: '100%',
                minHeight: 96,
                borderRadius: radius.lg,
                padding: 16,
                position: 'relative',
                transition: `box-shadow ${motion.normal}ms ${motion.easing}, border-color ${motion.normal}ms ${motion.easing}, background ${motion.normal}ms ${motion.easing}`,
              }}
            >
              <Stack gap={4}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {plan.label || planDurationLabel(plan.months)}
                  </Text>
                  {loading ? <Loader size={14} color="vbnbGreen" /> : null}
                </Group>
                {discount ? (
                  <Badge size="sm" color="red" variant="light" w="fit-content">
                    −{discount.percent}%
                  </Badge>
                ) : null}
                <Text fw={700} c="vbnbGreen.6" style={{ fontSize: 18 }}>
                  {formatVnd(plan.amount)}
                </Text>
                {discount ? (
                  <Text size="xs" c="dimmed" td="line-through">
                    {formatVnd(discount.compareAt)}
                  </Text>
                ) : null}
              </Stack>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>

      {pending ? (
        <SurfaceCard>
          <Stack gap="sm">
            <Alert color="yellow" title={t('pendingTitle')}>
              {t('pendingDesc')}
            </Alert>

            <Text size="sm" c="dimmed">
              {t('selectedPlan')}
            </Text>
            <Text fw={600}>
              {planDurationLabel(pending.months)} — {formatVnd(pending.amount)}
            </Text>

            <Text size="xs" c="dimmed">
              {t('qrScanHint', { paymentCode: pending.paymentCode })}
            </Text>

            {pending.qrUrl ? (
              <Image
                src={pending.qrUrl}
                alt={t('qrAlt')}
                maw={240}
                mx="auto"
                radius="md"
              />
            ) : (
              <Text size="sm" c="red">
                {t('noVietQrConfig')}
              </Text>
            )}

            {pending.accountNumber ? (
              <Group justify="space-between" align="flex-end" wrap="nowrap">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" c="dimmed">
                    {t('accountNumber')}
                  </Text>
                  <Text fw={600} size="sm" style={{ wordBreak: 'break-all' }}>
                    {pending.accountNumber}
                  </Text>
                  {pending.bankName ? (
                    <Text size="xs" c="dimmed">
                      {pending.bankName}
                      {pending.accountName ? ` · ${pending.accountName}` : ''}
                    </Text>
                  ) : null}
                </div>
                <CopyButton value={pending.accountNumber}>
                  {({ copied, copy }) => (
                    <Button
                      size="xs"
                      variant="light"
                      color="vbnbGreen"
                      onClick={copy}
                    >
                      {copied ? tCommon('copied') : tCommon('copy')}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            ) : null}

            <Group justify="space-between" align="flex-end" wrap="nowrap">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" c="dimmed">
                  {t('amount')}
                </Text>
                <Text fw={600} size="sm" c="vbnbGreen.6">
                  {formatVnd(pending.amount)}
                </Text>
              </div>
              <CopyButton value={String(pending.amount)}>
                {({ copied, copy }) => (
                  <Button
                    size="xs"
                    variant="light"
                    color="vbnbGreen"
                    onClick={copy}
                  >
                    {copied ? tCommon('copied') : tCommon('copy')}
                  </Button>
                )}
              </CopyButton>
            </Group>

            <Group justify="space-between" align="flex-end" wrap="nowrap">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" c="dimmed">
                  {t('transferMemo')}
                </Text>
                <Text fw={600} size="sm" style={{ wordBreak: 'break-all' }}>
                  {pending.paymentCode}
                </Text>
              </div>
              <CopyButton value={pending.paymentCode}>
                {({ copied, copy }) => (
                  <Button
                    size="xs"
                    variant="light"
                    color="vbnbGreen"
                    onClick={copy}
                  >
                    {copied ? tCommon('copied') : tCommon('copy')}
                  </Button>
                )}
              </CopyButton>
            </Group>

            {gatewayEnabled ? (
              <Button
                color="vbnbGreen"
                variant="light"
                loading={gatewayLoading}
                onClick={payViaGateway}
              >
                {t('payViaGateway')}
              </Button>
            ) : null}
          </Stack>
        </SurfaceCard>
      ) : null}
    </Stack>
  );
}
