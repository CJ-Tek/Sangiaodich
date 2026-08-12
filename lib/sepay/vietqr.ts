import type { PlatformPaymentInfo } from '@/lib/platform/payment-info';
import type { OwnerPayoutInfo } from '@/lib/owner/payout-info';

/**
 * Build VietQR image URL with amount + transfer description prefilled.
 * Bank apps fill content from `des` so users do not type the payment code.
 * @see https://developer.sepay.vn/en/sepay-webhooks/tao-qr-va-form-thanh-toan
 */
export function buildVietQrUrl(input: {
  accountNumber: string;
  bank: string;
  amount: number;
  description: string;
}): string {
  const acc = encodeURIComponent(input.accountNumber.trim());
  const bank = encodeURIComponent(input.bank.trim());
  const des = encodeURIComponent(input.description.trim());
  return `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${input.amount}&des=${des}`;
}

export function resolveVietQrBank(payment: PlatformPaymentInfo): string {
  return (payment.vietqrBank || payment.bankName || '').trim();
}

export function canBuildVietQr(payment: PlatformPaymentInfo): boolean {
  return Boolean(payment.accountNumber?.trim() && resolveVietQrBank(payment));
}

export function resolveOwnerVietQrBank(payout: OwnerPayoutInfo): string {
  return (payout.vietqrBank || payout.bankName || '').trim();
}

export function canBuildOwnerVietQr(payout: OwnerPayoutInfo): boolean {
  return Boolean(
    payout.accountNumber?.trim() && resolveOwnerVietQrBank(payout)
  );
}
