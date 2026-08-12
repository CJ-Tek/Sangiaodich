export type PlatformFeeSettingsRow = {
  payment_bank_name?: string | null;
  payment_account_name?: string | null;
  payment_account_number?: string | null;
  payment_qr_image_url?: string | null;
  payment_transfer_note?: string | null;
  payment_contact?: string | null;
  payment_vietqr_bank?: string | null;
};

export type PlatformPaymentInfo = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrImageUrl: string;
  transferNote: string;
  contact: string;
  vietqrBank: string;
};

export function mapPaymentInfo(
  row: PlatformFeeSettingsRow | null | undefined
): PlatformPaymentInfo {
  return {
    bankName: row?.payment_bank_name?.trim() || '',
    accountName: row?.payment_account_name?.trim() || '',
    accountNumber: row?.payment_account_number?.trim() || '',
    qrImageUrl: row?.payment_qr_image_url?.trim() || '',
    transferNote: row?.payment_transfer_note?.trim() || '',
    contact: row?.payment_contact?.trim() || '',
    vietqrBank: row?.payment_vietqr_bank?.trim() || '',
  };
}

export function hasPaymentInfo(info: PlatformPaymentInfo): boolean {
  return Boolean(
    info.bankName ||
      info.accountName ||
      info.accountNumber ||
      info.qrImageUrl ||
      info.transferNote ||
      info.contact ||
      info.vietqrBank
  );
}

/** @deprecated Prefer payment_code from intent + VietQR des. Kept for locked fallback. */
export function buildTransferContent(input: {
  phone?: string | null;
  email?: string | null;
}): string {
  const id = (input.phone || input.email || '').trim();
  return id ? `VBNB ${id}` : 'VBNB';
}
