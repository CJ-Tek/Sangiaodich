import { createServiceClient } from '@/lib/supabase/server';

/** Paths in `id-docs` look like `{uuid}/cccd-front.jpg` — not http(s). */
export function isIdDocStoragePath(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.startsWith('http://') || value.startsWith('https://')) return false;
  return value.includes('/');
}

export async function signIdDocUrl(
  path: string | null | undefined,
  expiresIn = 60 * 60
): Promise<string | null> {
  if (!path) return null;
  if (!isIdDocStoragePath(path)) return path;

  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from('id-docs')
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
