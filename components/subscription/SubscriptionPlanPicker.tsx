'use client';

import {
  Alert,
  Badge,
  Button,
  CopyButton,
  Group,
  Image,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { colors, radius } from '@/config/design-tokens';
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
          message: json.error?.message || 'Không tạo được mã thanh toán',
        });
        return;
      }
      setPending(json.data as PendingCheckout);
      startTransition(() => router.refresh());
    } catch {
      notifications.show({ color: 'red', message: 'Lỗi mạng' });
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
          message: 'Đã nhận thanh toán — subscription được kích hoạt',
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
  }, [pendingIntentId, router]);

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
          message: json.error?.message || 'Gateway chưa sẵn sàng',
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
      notifications.show({ color: 'red', message: 'Lỗi mở cổng SePay' });
    } finally {
      setGatewayLoading(false);
    }
  }

  return (
    <Stack gap="md">
      <div>
        <Text fw={600} mb={4}>
          Chọn gói subscription
        </Text>
        <Text size="sm" c="dimmed">
          Chạm gói để tạo QR — số tiền và nội dung CK đã sẵn trong QR, không
          cần nhập tay.
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
                cursor: loadingPlanId ? 'wait' : 'pointer',
                textAlign: 'left',
                width: '100%',
                minHeight: 96,
                borderRadius: radius.lg,
                padding: 16,
                position: 'relative',
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
        <Paper
          p="lg"
          radius={radius.lg}
          style={{ border: `1px solid ${colors.border}` }}
        >
          <Stack gap="sm">
            <Alert color="yellow" title="Đang chờ thanh toán">
              Sau khi chuyển khoản, trang sẽ tự cập nhật trong 1–3 phút, không
              cần refresh. Nếu quá 15 phút chưa ACTIVE, liên hệ Admin.
            </Alert>

            <Text size="sm" c="dimmed">
              Gói đã chọn
            </Text>
            <Text fw={600}>
              {planDurationLabel(pending.months)} — {formatVnd(pending.amount)}
            </Text>

            <Text size="xs" c="dimmed">
              Quét QR bằng app ngân hàng — nội dung CK đã điền sẵn mã{' '}
              <Text span fw={600}>
                {pending.paymentCode}
              </Text>
              .
            </Text>

            {pending.qrUrl ? (
              <Image
                src={pending.qrUrl}
                alt="QR thanh toán subscription"
                maw={240}
                mx="auto"
                radius="md"
              />
            ) : (
              <Text size="sm" c="red">
                Chưa cấu hình STK / mã ngân hàng VietQR trên Admin — chỉ dùng
                được nội dung CK bên dưới hoặc Mark paid.
              </Text>
            )}

            {pending.accountNumber ? (
              <Group justify="space-between" align="flex-end" wrap="nowrap">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" c="dimmed">
                    Số tài khoản
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
                      {copied ? 'Đã copy' : 'Sao chép'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            ) : null}

            <Group justify="space-between" align="flex-end" wrap="nowrap">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" c="dimmed">
                  Số tiền
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
                    {copied ? 'Đã copy' : 'Sao chép'}
                  </Button>
                )}
              </CopyButton>
            </Group>

            <Group justify="space-between" align="flex-end" wrap="nowrap">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" c="dimmed">
                  Nội dung CK (đã có trong QR)
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
                    {copied ? 'Đã copy' : 'Sao chép'}
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
                Thanh toán qua cổng SePay
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}
