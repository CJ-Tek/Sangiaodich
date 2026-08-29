'use client';

import {
  Button,
  FileButton,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useState } from 'react';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { VietQrBankSelect } from '@/components/ui/VietQrBankSelect';
import type { OwnerPayoutInfo } from '@/lib/owner/payout-info';

export function OwnerPayoutForm({
  initial,
  audience = 'owner',
}: {
  initial: OwnerPayoutInfo;
  audience?: 'owner' | 'sale';
}) {
  const t = useTranslations('sale.payout');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bankName, setBankName] = useState(initial.bankName);
  const [accountName, setAccountName] = useState(initial.accountName);
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
  const [vietqrBank, setVietqrBank] = useState(initial.vietqrBank);
  const [qrImageUrl, setQrImageUrl] = useState(initial.qrImageUrl);
  const [note, setNote] = useState(initial.note);

  async function uploadQr(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set('kind', 'payout_qr');
      body.set('file', file);
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || t('uploadFailed'),
        });
        return;
      }
      setQrImageUrl(json.data.previewUrl as string);
      notifications.show({ color: 'vbnbGreen', message: t('qrUploaded') });
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
          payoutBankName: bankName,
          payoutAccountName: accountName,
          payoutAccountNumber: accountNumber,
          payoutVietqrBank: vietqrBank,
          payoutQrImageUrl: qrImageUrl,
          payoutNote: note,
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
      notifications.show({
        color: 'vbnbGreen',
        message: t('saved'),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SurfaceCard>
      <Stack gap="md">
        <div>
          <Text fw={600}>{t('title')}</Text>
          <Text size="sm" c="dimmed" mt={4}>
            {audience === 'sale' ? t('descSale') : t('descOwner')}
          </Text>
        </div>
        <TextInput
          label={t('bank')}
          value={bankName}
          onChange={(e) => setBankName(e.currentTarget.value)}
          placeholder="Vietcombank"
        />
        <VietQrBankSelect
          value={vietqrBank}
          onChange={(bank) => {
            setVietqrBank(bank?.bankShortName ?? '');
            if (bank) setBankName(bank.bankShortName);
          }}
        />
        <TextInput
          label={t('accountName')}
          value={accountName}
          onChange={(e) => setAccountName(e.currentTarget.value)}
          placeholder="NGUYEN VAN A"
        />
        <TextInput
          label={t('accountNumber')}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.currentTarget.value)}
          placeholder="0123456789"
        />

        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('qrImage')}
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            {t('qrHint')}
          </Text>
          {qrImageUrl ? (
            <Image
              src={qrImageUrl}
              alt={t('qrAlt')}
              maw={180}
              radius="md"
              mb="sm"
            />
          ) : null}
          <Group gap="sm" mb="sm">
            <FileButton
              onChange={uploadQr}
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
            >
              {(props) => (
                <Button
                  {...props}
                  variant="light"
                  color="vbnbGreen"
                  size="sm"
                  loading={uploading}
                >
                  {t('chooseQr')}
                </Button>
              )}
            </FileButton>
            {qrImageUrl ? (
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => setQrImageUrl('')}
              >
                {t('removeQr')}
              </Button>
            ) : null}
          </Group>
        </div>

        <Textarea
          label={audience === 'sale' ? t('noteSale') : t('noteOwner')}
          description={t('notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          minRows={2}
        />
        <Button color="vbnbGreen" loading={loading} onClick={save}>
          {t('save')}
        </Button>
      </Stack>
    </SurfaceCard>
  );
}
