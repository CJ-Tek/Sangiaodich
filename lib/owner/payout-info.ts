export type OwnerPayoutRow = {
  payout_bank_name?: string | null;
  payout_account_name?: string | null;
  payout_account_number?: string | null;
  payout_vietqr_bank?: string | null;
  payout_qr_image_url?: string | null;
  payout_note?: string | null;
};

export type OwnerPayoutInfo = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  vietqrBank: string;
  qrImageUrl: string;
  note: string;
};

export function mapOwnerPayoutInfo(
  row: OwnerPayoutRow | null | undefined
): OwnerPayoutInfo {
  return {
    bankName: row?.payout_bank_name?.trim() || '',
    accountName: row?.payout_account_name?.trim() || '',
    accountNumber: row?.payout_account_number?.trim() || '',
    vietqrBank: row?.payout_vietqr_bank?.trim() || '',
    qrImageUrl: row?.payout_qr_image_url?.trim() || '',
    note: row?.payout_note?.trim() || '',
  };
}

/** True when Sale has enough to transfer (STK + account name at minimum). */
export function hasOwnerPayoutInfo(info: OwnerPayoutInfo): boolean {
  return Boolean(info.accountNumber && (info.accountName || info.bankName));
}

export function ownerPayoutStatus(input: {
  ownerEarn: number;
  ownerPaid: number;
}): 'none' | 'partial' | 'full' {
  const earn = Math.max(0, Number(input.ownerEarn) || 0);
  const paid = Math.max(0, Number(input.ownerPaid) || 0);
  if (earn <= 0) return paid > 0 ? 'full' : 'none';
  if (paid <= 0) return 'none';
  if (paid >= earn) return 'full';
  return 'partial';
}
