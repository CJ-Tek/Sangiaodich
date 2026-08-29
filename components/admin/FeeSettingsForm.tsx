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
import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { VietQrBankSelect } from '@/components/ui/VietQrBankSelect';
import type { PlatformPaymentInfo } from '@/lib/platform/payment-info';

export function FeeSettingsForm({ payment }: { payment: PlatformPaymentInfo }) {
  const t = useTranslations('admin.fees');
  const router = useRouter();
  const [bankName, setBankName] = useState(payment.bankName);
  const [accountName, setAccountName] = useState(payment.accountName);
  const [accountNumber, setAccountNumber] = useState(payment.accountNumber);
  const [qrImageUrl, setQrImageUrl] = useState(payment.qrImageUrl);
  const [transferNote, setTransferNote] = useState(payment.transferNote);
  const [contact, setContact] = useState(payment.contact);
  const [vietqrBank, setVietqrBank] = useState(payment.vietqrBank);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadQr(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set('kind', 'payment_qr');
      body.set('file', file);
      const res = await fetch('/api/admin/upload', {
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
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_fees',
          paymentBankName: bankName,
          paymentAccountName: accountName,
          paymentAccountNumber: accountNumber,
          paymentQrImageUrl: qrImageUrl.split('?')[0],
          paymentTransferNote: transferNote,
          paymentContact: contact,
          paymentVietqrBank: vietqrBank,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: t('paymentSaved'),
        });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        {t('paymentHint')}
      </Text>
      <TextInput
        label={t('bankName')}
        value={bankName}
        onChange={(e) => setBankName(e.currentTarget.value)}
        placeholder="Vietcombank"
      />
      <VietQrBankSelect
        label={t('vietqrBank')}
        description={t('vietqrBankHint')}
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
        placeholder="CONG TY VBNB"
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
          {t('qrImageHint')}
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
        <TextInput
          label={t('qrUrl')}
          description={t('qrUrlHint')}
          value={qrImageUrl}
          onChange={(e) => setQrImageUrl(e.currentTarget.value)}
          placeholder="https://..."
        />
      </div>

      <Textarea
        label={t('transferNote')}
        description={t('transferNoteHint')}
        value={transferNote}
        onChange={(e) => setTransferNote(e.currentTarget.value)}
        minRows={2}
      />
      <TextInput
        label={t('contact')}
        description={t('contactHint')}
        value={contact}
        onChange={(e) => setContact(e.currentTarget.value)}
        placeholder="Zalo 09xx..."
      />
      <Button color="vbnbGreen" loading={loading} onClick={save}>
        {t('save')}
      </Button>
    </Stack>
  );
}
