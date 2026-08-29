/** Zalo ZBS expects national format without "+" (e.g. 84987654321). */
export function formatPhoneForZalo(normalizedE164: string): string {
  return normalizedE164.replace(/^\+/, '');
}
