import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { fail, ok } from '@/lib/types';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 3 * 1024 * 1024;

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

/** Admin-only: upload public platform assets (e.g. payment QR). */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'ADMIN') {
    return NextResponse.json(fail('UNAUTHORIZED', 'Admin only'), {
      status: 401,
    });
  }

  const form = await request.formData();
  const kind = String(form.get('kind') || '');
  const file = form.get('file');

  if (kind !== 'payment_qr') {
    return NextResponse.json(
      fail('INVALID', 'kind phải là payment_qr'),
      { status: 400 }
    );
  }

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
      fail('INVALID', 'File quá lớn (tối đa 3MB)'),
      { status: 400 }
    );
  }

  const ext = extForMime(file.type);
  const path = `platform/payment-qr.${ext}`;
  const admin = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  // Remove other extensions so only one QR object remains
  for (const oldExt of ['jpg', 'jpeg', 'png', 'webp']) {
    if (oldExt === ext) continue;
    await admin.storage.from('avatars').remove([`platform/payment-qr.${oldExt}`]);
  }

  const { error } = await admin.storage.from('avatars').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    return NextResponse.json(fail('UPLOAD_FAILED', error.message), {
      status: 500,
    });
  }

  const { data } = admin.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl.split('?')[0]}?v=${Date.now()}`;

  return NextResponse.json(
    ok({
      kind,
      storedUrl: url.split('?')[0],
      previewUrl: url,
    })
  );
}
