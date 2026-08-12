import { createServiceClient } from '@/lib/supabase/server';

/**
 * Notify all SALE profiles with an ACTIVE (non-expired) subscription.
 *
 * Intentionally avoids `profiles → subscriptions!inner` embeds: `subscriptions`
 * has two FKs to `profiles` (`profile_id`, `marked_paid_by`), so PostgREST
 * rejects the ambiguous relationship and fan-out silently fails.
 */
export async function fanoutLeadNotifications(
  leadId: string
): Promise<{ count: number }> {
  const admin = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: subs, error: subsError } = await admin
    .from('subscriptions')
    .select('profile_id')
    .eq('status', 'ACTIVE')
    .gte('period_end', today);

  if (subsError) throw new Error(subsError.message);

  const profileIds = [
    ...new Set((subs || []).map((s) => s.profile_id).filter(Boolean)),
  ] as string[];

  if (profileIds.length === 0) return { count: 0 };

  const { data: sales, error: salesError } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'SALE')
    .in('id', profileIds);

  if (salesError) throw new Error(salesError.message);

  const saleIds = (sales || []).map((s) => s.id);
  if (saleIds.length === 0) return { count: 0 };

  const rows = saleIds.map((saleId) => ({
    lead_id: leadId,
    sale_id: saleId,
  }));

  const { error } = await admin.from('lead_notifications').upsert(rows, {
    onConflict: 'lead_id,sale_id',
    ignoreDuplicates: true,
  });

  if (error) throw new Error(error.message);
  return { count: rows.length };
}
