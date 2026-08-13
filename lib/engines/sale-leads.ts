import { createClient } from '@/lib/supabase/server';

export const LEAD_FEED_PAGE_SIZE = 50;
export const UNREAD_LEAD_CAP = 99;

export type SaleLead = {
  id: string;
  createdAt: string;
  unread: boolean;
  assetTitle: string;
  assetSlug: string;
  assetLocation: string | null;
  guestName: string | null;
  guestPhone: string | null;
};

type LeadFeedRow = {
  lead_id: string;
  lead_created_at: string;
  unread: boolean;
  asset_title: string;
  asset_slug: string;
  asset_location: string | null;
  guest_name: string | null;
  guest_phone: string | null;
};

/**
 * Leads are no longer materialised per sale — `sale_lead_feed` derives the list
 * from `lead_requests` and the caller's own membership window. The cookie
 * client is required: the RPC identifies the sale through `auth.uid()`.
 */
export async function loadSaleLeads(
  limit: number = LEAD_FEED_PAGE_SIZE
): Promise<SaleLead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('sale_lead_feed', {
    p_limit: limit,
  });
  if (error) throw new Error(error.message);

  return ((data || []) as LeadFeedRow[]).map((row) => ({
    id: row.lead_id,
    createdAt: row.lead_created_at,
    unread: row.unread,
    assetTitle: row.asset_title,
    assetSlug: row.asset_slug,
    assetLocation: row.asset_location,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
  }));
}

/** Capped at {@link UNREAD_LEAD_CAP}; a larger backlog reports cap + 1. */
export async function countUnreadLeads(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('sale_unread_lead_count', {
    p_cap: UNREAD_LEAD_CAP,
  });
  return Number(data ?? 0);
}

/** Advances the read watermark to now. No-op for anyone without a live sale membership. */
export async function markLeadsSeen(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('mark_leads_seen');
  if (error) throw new Error(error.message);
}
