import { createClient, createServiceClient } from '@/lib/supabase/server';
import { escapeIlikePattern, vnPhoneSearchVariants } from '@/lib/phone/vn-search';

export type GuestOption = { value: string; label: string };

export const GUEST_SEARCH_LIMIT = 20;

function toOption(guest: {
  id: string;
  full_name: string | null;
  phone: string | null;
}): GuestOption {
  return {
    value: guest.id,
    label: guest.phone
      ? `${guest.full_name || 'Guest'} (${guest.phone})`
      : guest.full_name || 'Guest',
  };
}

/**
 * Deliberately on the cookie client rather than the service role: the
 * `profiles_select_own_or_admin` policy is what limits a sale to GUEST rows and
 * only while their subscription is active. Bypassing it here would expose the
 * whole guest directory through a public endpoint.
 */
export async function searchGuestProfiles(q: string): Promise<GuestOption[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const escaped = escapeIlikePattern(trimmed);
  const parts = [`full_name.ilike.%${escaped}%`];
  for (const variant of vnPhoneSearchVariants(trimmed)) {
    parts.push(`phone.ilike.%${escapeIlikePattern(variant)}%`);
  }

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('role', 'GUEST')
    .is('deleted_at', null)
    .or(parts.join(','))
    .order('full_name')
    .limit(GUEST_SEARCH_LIMIT);

  return (data || []).map(toOption);
}

/**
 * Opening the form with an empty list is unusable, so it starts from the guests
 * this sale has already saved rather than from every guest on the platform.
 */
export async function loadSaleGuestSuggestions(
  saleId: string
): Promise<GuestOption[]> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('sale_saved_customers')
    .select('guest_id, full_name, phone')
    .eq('sale_id', saleId)
    .not('guest_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(GUEST_SEARCH_LIMIT);

  const seen = new Set<string>();
  const options: GuestOption[] = [];
  for (const row of data || []) {
    if (!row.guest_id || seen.has(row.guest_id)) continue;
    seen.add(row.guest_id);
    options.push(
      toOption({ id: row.guest_id, full_name: row.full_name, phone: row.phone })
    );
  }
  return options;
}
