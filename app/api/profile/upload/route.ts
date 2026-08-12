import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { fail, ok } from '@/lib/types';

const KINDS = [
  'avatar',
  'national_id_front',
  'national_id_back',
  'payout_qr',
] as const;
type UploadKind = (typeof KINDS)[number];

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_BYTES: Record<UploadKind, number> = {
  avatar: 2 * 1024 * 1024,
  national_id_front: 5 * 1024 * 1024,
  national_id_back: 5 * 1024 * 1024,
  payout_qr: 3 * 1024 * 1024,
};

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function isUploadKind(v: string): v is UploadKind {
  return (KINDS as readonly string[]).includes(v);
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json(fail('UNAUTHORIZED', 'Login required'), {
      status: 401,
    });
  }

  const form = await request.formData();
  const kindRaw = String(form.get('kind') || '');
  const file = form.get('file');

  if (!isUploadKind(kindRaw)) {
    return NextResponse.json(
      fail(
        'INVALID',
        'kind phải là avatar | national_id_front | national_id_back | payout_qr'
      ),
      { status: 400 }
    );
  }

  if (
    kindRaw === 'payout_qr' &&
    profile.role !== 'OWNER' &&
    profile.role !== 'SALE'
  ) {
    return NextResponse.json(
      fail('FORBIDDEN', 'Chỉ Owner hoặc Sale upload QR nhận tiền'),
      { status: 403 }
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

  if (file.size > MAX_BYTES[kindRaw]) {
    const mb = MAX_BYTES[kindRaw] / (1024 * 1024);
    return NextResponse.json(
      fail('INVALID', `File quá lớn (tối đa ${mb}MB)`),
      { status: 400 }
    );
  }

  const ext = extForMime(file.type);
  const admin = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (kindRaw === 'avatar' || kindRaw === 'payout_qr') {
    const fileName =
      kindRaw === 'avatar' ? `avatar.${ext}` : `payout-qr.${ext}`;
    const path = `${profile.id}/${fileName}`;

    if (kindRaw === 'payout_qr') {
      for (const oldExt of ['jpg', 'jpeg', 'png', 'webp']) {
        if (oldExt === ext) continue;
        await admin.storage
          .from('avatars')
          .remove([`${profile.id}/payout-qr.${oldExt}`]);
      }
    }

    const { error } = await admin.storage
      .from('avatars')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      return NextResponse.json(fail('UPLOAD_FAILED', error.message), {
        status: 500,
      });
    }

    const { data } = admin.storage.from('avatars').getPublicUrl(path);
    // cache-bust so preview refreshes after replace
    const url = `${data.publicUrl}?v=${Date.now()}`;

    return NextResponse.json(
      ok({
        kind: kindRaw,
        storedUrl: url.split('?')[0],
        previewUrl: url,
      })
    );
  }

  const side = kindRaw === 'national_id_front' ? 'front' : 'back';
  const path = `${profile.id}/cccd-${side}.${ext}`;
  const { error } = await admin.storage.from('id-docs').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    return NextResponse.json(fail('UPLOAD_FAILED', error.message), {
      status: 500,
    });
  }

  const { data: signed, error: signError } = await admin.storage
    .from('id-docs')
    .createSignedUrl(path, 60 * 60);

  if (signError) {
    return NextResponse.json(fail('SIGN_FAILED', signError.message), {
      status: 500,
    });
  }

  // Store object path in profiles.*_url; preview is short-lived signed URL
  return NextResponse.json(
    ok({
      kind: kindRaw,
      storedUrl: path,
      previewUrl: signed.signedUrl,
    })
  );
}
