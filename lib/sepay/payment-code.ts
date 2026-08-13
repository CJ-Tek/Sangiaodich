/** Subscription payment code shape shared by the QR generator and webhook matching. */

export const PAYMENT_CODE_PREFIX = 'VB';

/** Ambiguous glyphs (I, O, 0, 1) are excluded so codes survive manual re-typing. */
export const PAYMENT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const PAYMENT_CODE_LENGTH = 8;

const PAYMENT_CODE_PATTERN = new RegExp(
  `${PAYMENT_CODE_PREFIX}[${PAYMENT_CODE_ALPHABET}]{${PAYMENT_CODE_LENGTH}}`
);

export function isPaymentCode(value: string): boolean {
  return new RegExp(`^${PAYMENT_CODE_PATTERN.source}$`).test(value);
}

/**
 * Resolve the payment code from a SePay payload.
 * `code` is only present when SePay's extraction rule is configured, so the raw
 * transfer content is scanned as a fallback before giving up on the money-in.
 */
export function extractPaymentCode(input: {
  code?: unknown;
  content?: unknown;
}): string {
  const code = normalize(input.code);
  if (isPaymentCode(code)) return code;

  const content = normalize(input.content);
  const found = PAYMENT_CODE_PATTERN.exec(content);
  if (found) return found[0];

  return code || '';
}

function normalize(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).trim().toUpperCase();
}
