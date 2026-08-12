import { minDepositToConfirm } from '@/lib/engines/pricing';

export const GUEST_INVOICE_TTL_MS = 15 * 60 * 1000;

export type GuestInvoicePreset = 'deposit' | 'full';

export function guestInvoiceAmounts(input: {
  listPrice: number;
  amountCollected: number;
}): {
  depositTarget: number;
  depositChunk: number;
  remainingFull: number;
  canDeposit: boolean;
  canFull: boolean;
} {
  const list = Math.max(0, Number(input.listPrice) || 0);
  const collected = Math.max(0, Number(input.amountCollected) || 0);
  const remainingFull = Math.max(0, list - collected);
  const depositTarget = minDepositToConfirm(list);
  const depositChunk = Math.min(
    Math.max(0, depositTarget - collected),
    remainingFull
  );
  return {
    depositTarget,
    depositChunk,
    remainingFull,
    canDeposit: depositChunk > 0,
    canFull: remainingFull > 0,
  };
}

export function guestInvoiceQrAmount(
  preset: GuestInvoicePreset,
  amounts: ReturnType<typeof guestInvoiceAmounts>
): number {
  if (preset === 'deposit') return amounts.depositChunk;
  return amounts.remainingFull;
}

export function isGuestInvoiceExpired(expiresAt: string, now = Date.now()): boolean {
  return new Date(expiresAt).getTime() <= now;
}

export function calendarUnlockedForInvoice(status: string): boolean {
  return status === 'PENDING' || status === 'AWAITING_OWNER';
}
