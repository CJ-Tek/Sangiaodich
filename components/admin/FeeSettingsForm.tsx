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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PlatformPaymentInfo } from '@/lib/platform/payment-info';

export function FeeSettingsForm({ payment }: { payment: PlatformPaymentInfo }) {
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
          message: 'Đã lưu thông tin thanh toán',
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
        Owner/Sale thấy thông tin này trên trang Subscription khi chờ kích
        hoạt hoặc gia hạn. Giá gói chỉnh ở tab Gói subscription.
      </Text>
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
        placeholder="CONG TY VBNB"
      />
      <TextInput
        label="Số tài khoản"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.currentTarget.value)}
        placeholder="0123456789"
      />
      <TextInput
        label="Mã ngân hàng VietQR"
        description="Dùng tạo QR động (VD: Vietcombank, BIDV, MBBank). Nếu trống sẽ lấy tên Ngân hàng ở trên."
        value={vietqrBank}
        onChange={(e) => setVietqrBank(e.currentTarget.value)}
        placeholder="Vietcombank"
      />

      <div>
        <Text size="sm" fw={500} mb={4}>
          Ảnh QR thanh toán
        </Text>
        <Text size="xs" c="dimmed" mb={8}>
          Upload từ thiết bị (JPG/PNG/WebP, tối đa 3MB) hoặc dán link URL.
        </Text>
        {qrImageUrl ? (
          <Image
            src={qrImageUrl}
            alt="QR thanh toán"
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
        <TextInput
          label="QR image URL"
          description="Tùy chọn — dán link nếu không upload file."
          value={qrImageUrl}
          onChange={(e) => setQrImageUrl(e.currentTarget.value)}
          placeholder="https://..."
        />
      </div>

      <Textarea
        label="Ghi chú hướng dẫn"
        description="VD: Sau khi CK, nhắn Admin kèm ảnh biên lai."
        value={transferNote}
        onChange={(e) => setTransferNote(e.currentTarget.value)}
        minRows={2}
      />
      <TextInput
        label="Liên hệ hỗ trợ"
        description="Zalo / SĐT Admin"
        value={contact}
        onChange={(e) => setContact(e.currentTarget.value)}
        placeholder="Zalo 09xx..."
      />
      <Button color="vbnbGreen" loading={loading} onClick={save}>
        Lưu
      </Button>
    </Stack>
  );
}
