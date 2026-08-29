'use server';

import { revalidatePath } from 'next/cache';
import { getSessionProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function submitAssetForReview(assetId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'OWNER') {
    return { success: false, message: 'Owner only' };
  }

  const admin = await createClient();
  const { data, error } = await admin
    .from('assets')
    .update({ status: 'PENDING_REVIEW' })
    .eq('id', assetId)
    .eq('owner_id', profile.id)
    .in('status', ['DRAFT', 'REJECTED'])
    .select('id')
    .maybeSingle();

  if (error) {
    return { success: false, message: error.message };
  }
  if (!data) {
    return { success: false, message: 'Asset cannot be submitted for review' };
  }

  revalidatePath('/owner/assets');
  return { success: true };
}
