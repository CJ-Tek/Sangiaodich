/** Digits-only for phone substring match. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Strip VN trunk `0` or country `84` → national subscriber digits.
 * e.g. 0365210936 / 84365210936 / +84365210936 → 365210936
 */
export function vnNationalDigits(digits: string): string {
  if (digits.startsWith('84') && digits.length >= 11) return digits.slice(2);
  if (digits.startsWith('0') && digits.length >= 10) return digits.slice(1);
  return digits;
}

/** True if query digits match stored phone, treating VN 0 and 84 as equivalent. */
export function phoneDigitsMatch(
  queryDigits: string,
  phoneDigits: string
): boolean {
  if (!queryDigits || !phoneDigits) return false;
  if (phoneDigits.includes(queryDigits)) return true;
  const q = vnNationalDigits(queryDigits);
  const p = vnNationalDigits(phoneDigits);
  return q.length > 0 && p.includes(q);
}

export function phoneFieldMatch(
  query: string,
  phone: string | null | undefined
): boolean {
  const qDigits = digitsOnly(query);
  if (!qDigits || !phone) return false;
  return phoneDigitsMatch(qDigits, digitsOnly(phone));
}

/** Variants useful for SQL `ilike` OR (0 / 84 / national / +84). */
export function vnPhoneSearchVariants(raw: string): string[] {
  const digits = digitsOnly(raw);
  if (!digits) return [];
  const national = vnNationalDigits(digits);
  return [
    ...new Set([
      digits,
      national,
      `0${national}`,
      `84${national}`,
      `+84${national}`,
    ]),
  ].filter(Boolean);
}

export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
