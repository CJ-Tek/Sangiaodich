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
  Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors, radius } from '@/config/design-tokens';
import type { OwnerPayoutInfo } from '@/lib/owner/payout-info';

export function OwnerPayoutForm({
  initial,
  audience = 'owner',
}: {
  initial: OwnerPayoutInfo;
  audience?: 'owner' | 'sale';
}) {
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
          message: json.error?.message || 'Upload thất bại',
        });
        return;
      }
      setQrImageUrl(json.data.previewUrl as string);
      notifications.show({ color: 'vbnbGreen', message: 'Đã tải QR lên' });
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
          message: json.error?.message || 'Không lưu được',
        });
        return;
      }
      notifications.show({
        color: 'vbnbGreen',
        message: 'Đã lưu tài khoản nhận tiền',
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Stack gap="md">
        <div>
          <Text fw={600}>Tài khoản nhận tiền</Text>
          <Text size="sm" c="dimmed" mt={4}>
            {audience === 'sale'
              ? 'Khách quét VietQR trên invoice (STK + mã NH) sẽ tự điền số tiền và mã CK. Ảnh QR tĩnh là dự phòng. Không hiện STK trên card booking.'
              : 'Áp dụng cho mọi asset. Sale quét VietQR động (STK + mã NH) sẽ tự điền số tiền và nội dung CK; ảnh QR tĩnh là dự phòng.'}
          </Text>
        </div>
        <TextInput
          label="Ngân hàng"
          value={bankName}
          onChange={(e) => setBankName(e.currentTarget.value)}
          placeholder="Vietcombank"
        />
        <TextInput
          label="Chủ tài khoản"
          value={accountName}
          onChange={(e) => setAccountName(e.currentTarget.value)}
          placeholder="NGUYEN VAN A"
        />
        <TextInput
          label="Số tài khoản"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.currentTarget.value)}
          placeholder="0123456789"
        />
        <TextInput
          label="Mã NH VietQR"
          description="Nên điền (VD: Vietcombank, BIDV, MBBank) để tạo QR động kèm số tiền + nội dung."
          value={vietqrBank}
          onChange={(e) => setVietqrBank(e.currentTarget.value)}
          placeholder="Vietcombank"
        />

        <div>
          <Text size="sm" fw={500} mb={4}>
            Ảnh QR tĩnh (tuỳ chọn)
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            Upload từ app ngân hàng nếu chưa dùng VietQR động. JPG/PNG/WebP, tối
            đa 3MB.
          </Text>
          {qrImageUrl ? (
            <Image
              src={qrImageUrl}
              alt="QR nhận tiền"
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
                  Chọn ảnh QR
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
                Xóa QR
              </Button>
            ) : null}
          </Group>
        </div>

        <Textarea
          label={audience === 'sale' ? 'Ghi chú cho khách' : 'Ghi chú cho Sale'}
          description="VD: CK trong giờ hành chính."
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          minRows={2}
        />
        <Button color="vbnbGreen" loading={loading} onClick={save}>
          Lưu tài khoản nhận tiền
        </Button>
      </Stack>
    </Paper>
  );
}
