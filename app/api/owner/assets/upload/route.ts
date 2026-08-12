import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { MAX_ASSET_IMAGES } from '@/config/asset-tags';
import { fail, ok } from '@/lib/types';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

/** Owner: upload asset gallery images to public `asset-images` bucket. */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'OWNER') {
    return NextResponse.json(fail('UNAUTHORIZED', 'Owner only'), {
      status: 401,
    });
  }

  const form = await request.formData();
  const file = form.get('file');
  const assetIdRaw = String(form.get('assetId') || '').trim();

  if (!(file instanceof File)) {
    return NextResponse.json(fail('INVALID', 'Thiếu file'), { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      fail('INVALID', 'Chỉ chấp nhận JPG, PNG hoặc WebP'),
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      fail('INVALID', 'File quá lớn (tối đa 5MB)'),
      { status: 400 }
    );
  }

  const admin = createServiceClient();

  if (assetIdRaw) {
    const { data: owned } = await admin
      .from('assets')
      .select('id')
      .eq('id', assetIdRaw)
      .eq('owner_id', profile.id)
      .maybeSingle();

    if (!owned) {
      return NextResponse.json(fail('FORBIDDEN', 'Not your asset'), {
        status: 403,
      });
    }

    const { count } = await admin
      .from('asset_images')
      .select('id', { count: 'exact', head: true })
      .eq('asset_id', assetIdRaw);

    if ((count ?? 0) >= MAX_ASSET_IMAGES) {
      return NextResponse.json(
        fail('LIMIT', `Tối đa ${MAX_ASSET_IMAGES} ảnh / asset`),
        { status: 400 }
      );
    }
  }

  const ext = extForMime(file.type);
  const folder = assetIdRaw || 'draft';
  const path = `${profile.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from('asset-images')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json(fail('UPLOAD_FAILED', error.message), {
      status: 500,
    });
  }

  const { data } = admin.storage.from('asset-images').getPublicUrl(path);

  return NextResponse.json(
    ok({
      url: data.publicUrl,
      path,
    })
  );
}
