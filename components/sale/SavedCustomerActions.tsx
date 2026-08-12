'use client';

import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { SavedCustomerRow } from '@/lib/engines/sale-customers';

const CHANNEL_OPTIONS = [
  { value: 'ZALO', label: 'Zalo' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'PHONE', label: 'Điện thoại' },
  { value: 'OTHER', label: 'Khác' },
];

const INTENT_OPTIONS = [
  { value: 'HOT', label: 'HOT' },
  { value: 'WARM', label: 'WARM' },
  { value: 'COLD', label: 'COLD' },
];

export function SaveCustomerButton({
  label = 'Lưu khách',
  initial,
  size = 'sm',
  variant = 'filled',
}: {
  label?: string;
  initial?: {
    fullName?: string;
    phone?: string;
    note?: string;
  };
  size?: 'xs' | 'sm' | 'md';
  variant?: 'filled' | 'light' | 'default';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(initial?.fullName || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [channel, setChannel] = useState<string | null>('OTHER');
  const [intentLevel, setIntentLevel] = useState<string | null>('WARM');
  const [note, setNote] = useState(initial?.note || '');
  const [nextFollowUpAt, setNextFollowUpAt] = useState<Date | null>(null);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch('/api/sale/customers/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          channel,
          intentLevel,
          note: note || null,
          nextFollowUpAt: nextFollowUpAt
            ? nextFollowUpAt.toISOString()
            : null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message: 'Đã lưu khách vào follow-up',
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        color="vbnbGreen"
        onClick={() => {
          setFullName(initial?.fullName || '');
          setPhone(initial?.phone || '');
          setNote(initial?.note || '');
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <Modal
        opened={open}
        onClose={() => !loading && setOpen(false)}
        title="Lưu khách follow-up"
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Họ tên"
            required
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
          />
          <TextInput
            label="Số điện thoại"
            required
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />
          <Select
            label="Kênh liên hệ"
            data={CHANNEL_OPTIONS}
            value={channel}
            onChange={setChannel}
          />
          <Select
            label="Mức quan tâm"
            data={INTENT_OPTIONS}
            value={intentLevel}
            onChange={setIntentLevel}
          />
          <DateTimePicker
            label="Follow-up tiếp theo"
            value={nextFollowUpAt}
            onChange={(v) =>
              setNextFollowUpAt(v ? new Date(String(v)) : null)
            }
            clearable
          />
          <Textarea
            label="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            minRows={2}
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Đóng
            </Button>
            <Button
              color="vbnbGreen"
              loading={loading}
              disabled={!fullName.trim() || !phone.trim()}
              onClick={submit}
            >
              Lưu
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export function SavedCustomerActions({
  customer,
}: {
  customer: SavedCustomerRow;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState(customer.full_name);
  const [phone, setPhone] = useState(customer.phone);
  const [channel, setChannel] = useState<string | null>(customer.channel);
  const [intentLevel, setIntentLevel] = useState<string | null>(
    customer.intent_level
  );
  const [note, setNote] = useState(customer.note || '');
  const [nextFollowUpAt, setNextFollowUpAt] = useState<Date | null>(
    customer.next_follow_up_at
      ? new Date(customer.next_follow_up_at)
      : null
  );

  async function patch(body: Record<string, unknown>, okMessage: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/sale/customers/saved', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customer.id, ...body }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
        return;
      }
      notifications.show({ color: 'vbnbGreen', message: okMessage });
      setEditOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function convert() {
    setLoading(true);
    try {
      const res = await fetch('/api/sale/customers/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert', id: customer.id }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message: 'Đã đánh dấu chuyển đổi',
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (customer.status !== 'ACTIVE') {
    return (
      <Text size="sm" c="dimmed">
        {customer.status === 'CONVERTED' ? 'Đã chuyển đổi' : 'Đã lưu trữ'}
      </Text>
    );
  }

  return (
    <>
      <Group gap="xs">
        <Button
          size="xs"
          variant="light"
          color="vbnbGreen"
          loading={loading}
          onClick={() => patch({ markContacted: true }, 'Đã ghi nhận liên hệ')}
        >
          Đã liên hệ
        </Button>
        <Button
          size="xs"
          variant="default"
          loading={loading}
          onClick={() => setEditOpen(true)}
        >
          Sửa
        </Button>
        <Button
          size="xs"
          color="vbnbGreen"
          loading={loading}
          onClick={convert}
        >
          Đánh dấu chuyển đổi
        </Button>
        <Button
          size="xs"
          color="gray"
          variant="light"
          loading={loading}
          onClick={() =>
            patch({ status: 'ARCHIVED' }, 'Đã lưu trữ khách')
          }
        >
          Lưu trữ
        </Button>
      </Group>

      <Modal
        opened={editOpen}
        onClose={() => !loading && setEditOpen(false)}
        title="Cập nhật khách"
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Họ tên"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
          />
          <TextInput
            label="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />
          <Select
            label="Kênh"
            data={CHANNEL_OPTIONS}
            value={channel}
            onChange={setChannel}
          />
          <Select
            label="Mức quan tâm"
            data={INTENT_OPTIONS}
            value={intentLevel}
            onChange={setIntentLevel}
          />
          <DateTimePicker
            label="Follow-up tiếp theo"
            value={nextFollowUpAt}
            onChange={(v) =>
              setNextFollowUpAt(v ? new Date(String(v)) : null)
            }
            clearable
          />
          <Textarea
            label="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            minRows={2}
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={loading}
              onClick={() => setEditOpen(false)}
            >
              Đóng
            </Button>
            <Button
              color="vbnbGreen"
              loading={loading}
              onClick={() =>
                patch(
                  {
                    fullName,
                    phone,
                    channel,
                    intentLevel,
                    note,
                    nextFollowUpAt: nextFollowUpAt
                      ? nextFollowUpAt.toISOString()
                      : null,
                  },
                  'Đã cập nhật'
                )
              }
            >
              Lưu
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
