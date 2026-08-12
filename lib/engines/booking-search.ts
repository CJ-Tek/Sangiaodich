import { phoneFieldMatch } from '@/lib/phone/vn-search';

function textIncludes(haystack: string | null | undefined, q: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(q);
}

/** Một mã CK cho Guest→Sale và Sale→Owner. */
export function ownerTransferMemo(bookingId: string): string {
  return `VBNB ${bookingId.slice(0, 8)}`;
}

export const bookingTransferMemo = ownerTransferMemo;

function matchesTransferMemo(
  query: string,
  bookingId: string | null | undefined
): boolean {
  if (!bookingId) return false;
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const id = bookingId.toLowerCase();
  const short = id.slice(0, 8);
  const memo = ownerTransferMemo(bookingId).toLowerCase();
  if (memo.includes(q)) return true;
  if (id.includes(q)) return true;
  // Short code / partial UUID (avoid 1–2 char noise)
  if (q.length >= 4 && (short.includes(q) || q.includes(short))) return true;
  const stripped = q.replace(/\s+/g, '');
  if (stripped === `vbnb${short}` || stripped === short) return true;
  return false;
}

/** Owner Settlements: villa, sale, phone, or mã CK `VBNB …` / booking id. */
export function matchesOwnerSettlementSearch(
  query: string,
  input: {
    villaTitle: string | null | undefined;
    saleName: string | null | undefined;
    salePhone: string | null | undefined;
    bookingId?: string | null | undefined;
  }
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (textIncludes(input.villaTitle, q)) return true;
  if (textIncludes(input.saleName, q)) return true;
  if (phoneFieldMatch(q, input.salePhone)) return true;
  if (matchesTransferMemo(q, input.bookingId)) return true;
  return false;
}

/** Sale Bookings: villa, guest, phone, or mã CK `VBNB …`. */
export function matchesSaleBookingSearch(
  query: string,
  input: {
    villaTitle: string | null | undefined;
    guestName: string | null | undefined;
    guestPhone: string | null | undefined;
    bookingId?: string | null | undefined;
  }
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (textIncludes(input.villaTitle, q)) return true;
  if (textIncludes(input.guestName, q)) return true;
  if (phoneFieldMatch(q, input.guestPhone)) return true;
  if (matchesTransferMemo(q, input.bookingId)) return true;
  return false;
}
