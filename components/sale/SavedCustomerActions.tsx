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
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useMemo, useState } from 'react';
import type { SavedCustomerRow } from '@/lib/engines/sale-customers';

const CHANNEL_VALUES = ['ZALO', 'FACEBOOK', 'PHONE', 'OTHER'] as const;
const INTENT_VALUES = ['HOT', 'WARM', 'COLD'] as const;

export function SaveCustomerButton({
  label,
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
  const t = useTranslations('sale.savedCustomer');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(initial?.fullName || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [channel, setChannel] = useState<string | null>('OTHER');
  const [intentLevel, setIntentLevel] = useState<string | null>('WARM');
  const [note, setNote] = useState(initial?.note || '');
  const [nextFollowUpAt, setNextFollowUpAt] = useState<Date | null>(null);

  const channelOptions = useMemo(
    () =>
      CHANNEL_VALUES.map((value) => ({
        value,
        label: t(`channels.${value}`),
      })),
    [t]
  );
  const intentOptions = useMemo(
    () =>
      INTENT_VALUES.map((value) => ({
        value,
        label: t(`intents.${value}`),
      })),
    [t]
  );

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
        message: t('saved'),
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
        {label ?? t('saveGuest')}
      </Button>
      <Modal
        opened={open}
        onClose={() => !loading && setOpen(false)}
        title={t('saveFollowUp')}
        centered
      >
        <Stack gap="sm">
          <TextInput
            label={t('fullName')}
            required
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
          />
          <TextInput
            label={t('phone')}
            required
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />
          <Select
            label={t('channel')}
            data={channelOptions}
            value={channel}
            onChange={setChannel}
          />
          <Select
            label={t('intent')}
            data={intentOptions}
            value={intentLevel}
            onChange={setIntentLevel}
          />
          <DateTimePicker
            label={t('nextFollowUp')}
            value={nextFollowUpAt}
            onChange={(v) =>
              setNextFollowUpAt(v ? new Date(String(v)) : null)
            }
            clearable
          />
          <Textarea
            label={t('notes')}
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
              {t('close')}
            </Button>
            <Button
              color="vbnbGreen"
              loading={loading}
              disabled={!fullName.trim() || !phone.trim()}
              onClick={submit}
            >
              {t('save')}
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
  const t = useTranslations('sale.savedCustomer');
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

  const channelOptions = useMemo(
    () =>
      CHANNEL_VALUES.map((value) => ({
        value,
        label: t(`channels.${value}`),
      })),
    [t]
  );
  const intentOptions = useMemo(
    () =>
      INTENT_VALUES.map((value) => ({
        value,
        label: t(`intents.${value}`),
      })),
    [t]
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
        message: t('notedConverted'),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (customer.status !== 'ACTIVE') {
    return (
      <Text size="sm" c="dimmed">
        {customer.status === 'CONVERTED' ? t('converted') : t('archived')}
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
          onClick={() => patch({ markContacted: true }, t('notedContact'))}
        >
          {t('contacted')}
        </Button>
        <Button
          size="xs"
          variant="default"
          loading={loading}
          onClick={() => setEditOpen(true)}
        >
          {t('edit')}
        </Button>
        <Button
          size="xs"
          color="vbnbGreen"
          loading={loading}
          onClick={convert}
        >
          {t('markConverted')}
        </Button>
        <Button
          size="xs"
          color="gray"
          variant="light"
          loading={loading}
          onClick={() =>
            patch({ status: 'ARCHIVED' }, t('notedArchived'))
          }
        >
          {t('archive')}
        </Button>
      </Group>

      <Modal
        opened={editOpen}
        onClose={() => !loading && setEditOpen(false)}
        title={t('updateGuest')}
        centered
      >
        <Stack gap="sm">
          <TextInput
            label={t('fullName')}
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
          />
          <TextInput
            label={t('phone')}
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />
          <Select
            label={t('channelShort')}
            data={channelOptions}
            value={channel}
            onChange={setChannel}
          />
          <Select
            label={t('intent')}
            data={intentOptions}
            value={intentLevel}
            onChange={setIntentLevel}
          />
          <DateTimePicker
            label={t('nextFollowUp')}
            value={nextFollowUpAt}
            onChange={(v) =>
              setNextFollowUpAt(v ? new Date(String(v)) : null)
            }
            clearable
          />
          <Textarea
            label={t('notes')}
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
              {t('close')}
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
                  t('updated')
                )
              }
            >
              {t('save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
