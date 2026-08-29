import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import {
  filterValidAssetTags,
  isPropertyType,
  MAX_ASSET_IMAGES,
  MAX_OWNER_DRAFT_ASSETS,
  MIN_ASSET_IMAGES_FOR_REVIEW,
  MIN_ASSET_TAGS,
} from '@/config/asset-tags';
import { parseOwnerDiscountRules } from '@/lib/engines/membership';
import { replaceAssetDiscountRules } from '@/lib/engines/sale-pricing';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { translateEngineError } from '@/lib/i18n/engine-error';
import { fail, ok } from '@/lib/types';

async function saveDiscountRules(
  assetId: string,
  raw: unknown
): Promise<string | null> {
  const parsed = parseOwnerDiscountRules(raw ?? []);
  if ('error' in parsed) return parsed.error;
  const saved = await replaceAssetDiscountRules(assetId, parsed.rules);
  return saved.error ?? null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function parseImages(body: unknown): string[] {
  if (!body || typeof body !== 'object') return [];
  const images = (body as { images?: unknown }).images;
  if (!Array.isArray(images)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of images) {
    const url = String(item || '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= MAX_ASSET_IMAGES) break;
  }
  return out;
}

export async function POST(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'OWNER') {
    return NextResponse.json(fail('UNAUTHORIZED', t('UNAUTHORIZED.ownerOnly')), { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || '').trim();
  if (!title) {
    return NextResponse.json(fail('INVALID', t('INVALID.titleRequired')), { status: 400 });
  }

  const propertyType = isPropertyType(body.propertyType)
    ? body.propertyType
    : null;
  if (!propertyType) {
    return NextResponse.json(
      fail('INVALID', t('INVALID.propertyTypeRequired')),
      { status: 400 }
    );
  }

  const tags = filterValidAssetTags(body.tags);
  const images = parseImages(body);
  const submit = Boolean(body.submit);

  if (submit) {
    if (images.length < MIN_ASSET_IMAGES_FOR_REVIEW) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.imagesRequiredForReview')),
        { status: 400 }
      );
    }
    if (tags.length < MIN_ASSET_TAGS) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.tagsRequiredForReview')),
        { status: 400 }
      );
    }
  }

  const admin = createServiceClient();

  if (!submit) {
    const { count, error: countError } = await admin
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', profile.id)
      .eq('status', 'DRAFT');
    if (countError) {
      return NextResponse.json(fail('CREATE_FAILED', countError.message), {
        status: 500,
      });
    }
    if ((count ?? 0) >= MAX_OWNER_DRAFT_ASSETS) {
      return NextResponse.json(fail('DRAFT_LIMIT', t('DRAFT_LIMIT')), {
        status: 400,
      });
    }
  }

  const slugBase = slugify(title) || 'asset';
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const { data: asset, error } = await admin
    .from('assets')
    .insert({
      owner_id: profile.id,
      slug,
      title,
      description: String(body.description || ''),
      location: String(body.location || ''),
      capacity: Math.max(1, Number(body.capacity) || 2),
      bedrooms: Math.max(0, Number(body.bedrooms) || 1),
      bathrooms: Math.max(0, Number(body.bathrooms) || 1),
      property_type: propertyType,
      amenities: [],
      tags,
      status: submit ? 'PENDING_REVIEW' : 'DRAFT',
    })
    .select('*')
    .single();

  if (error || !asset) {
    if (error?.message?.includes('DRAFT_LIMIT')) {
      return NextResponse.json(fail('DRAFT_LIMIT', t('DRAFT_LIMIT')), {
        status: 400,
      });
    }
    return NextResponse.json(fail('CREATE_FAILED', error?.message || t('CREATE_FAILED')), {
      status: 500,
    });
  }

  await admin.from('asset_costs').insert({
    asset_id: asset.id,
    cost_weekday: Number(body.costWeekday || 0),
    cost_weekend: Number(body.costWeekend || 0),
  });

  if (images.length) {
    await admin.from('asset_images').insert(
      images.map((url, i) => ({
        asset_id: asset.id,
        url,
        sort_order: i,
      }))
    );
  }

  const discountError = await saveDiscountRules(asset.id, body.discountRules);
  if (discountError) {
    return NextResponse.json(
      fail('INVALID', translateEngineError(t, discountError)),
      { status: 400 }
    );
  }

  return NextResponse.json(ok({ asset }));
}

export async function PATCH(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'OWNER') {
    return NextResponse.json(fail('UNAUTHORIZED', t('UNAUTHORIZED.ownerOnly')), { status: 401 });
  }

  const body = await request.json();
  const assetId = String(body.assetId || '');
  const admin = createServiceClient();

  const { data: existing } = await admin
    .from('assets')
    .select('id, owner_id, status')
    .eq('id', assetId)
    .maybeSingle();

  if (!existing || existing.owner_id !== profile.id) {
    return NextResponse.json(fail('FORBIDDEN', t('FORBIDDEN.notYourAsset')), { status: 403 });
  }

  const submit = Boolean(body.submit);
  const tags =
    body.tags !== undefined ? filterValidAssetTags(body.tags) : undefined;
  const images = body.images !== undefined ? parseImages(body) : undefined;

  if (submit) {
    const imageCount =
      images?.length ??
      (
        await admin
          .from('asset_images')
          .select('id', { count: 'exact', head: true })
          .eq('asset_id', assetId)
      ).count ??
      0;

    if (imageCount < MIN_ASSET_IMAGES_FOR_REVIEW) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.imagesRequiredForReview')),
        { status: 400 }
      );
    }

    const tagCount =
      tags?.length ??
      (
        (
          await admin
            .from('assets')
            .select('tags')
            .eq('id', assetId)
            .maybeSingle()
        ).data?.tags as string[] | undefined
      )?.length ??
      0;

    if (tagCount < MIN_ASSET_TAGS) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.tagsRequiredForReview')),
        { status: 400 }
      );
    }
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    amenities: [],
  };
  for (const key of ['title', 'description', 'location', 'capacity'] as const) {
    if (body[key] !== undefined) {
      if (key === 'capacity')
        patch.capacity = Math.max(1, Number(body.capacity) || 1);
      else patch[key] = body[key];
    }
  }
  if (body.bedrooms !== undefined) {
    patch.bedrooms = Math.max(0, Number(body.bedrooms) || 0);
  }
  if (body.bathrooms !== undefined) {
    patch.bathrooms = Math.max(0, Number(body.bathrooms) || 0);
  }
  if (body.propertyType !== undefined) {
    if (!isPropertyType(body.propertyType)) {
      return NextResponse.json(
        fail('INVALID', t('INVALID.invalidPropertyType')),
        { status: 400 }
      );
    }
    patch.property_type = body.propertyType;
  }
  if (tags !== undefined) patch.tags = tags;
  if (submit) {
    patch.status = 'PENDING_REVIEW';
  }

  const { data, error } = await admin
    .from('assets')
    .update(patch)
    .eq('id', assetId)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(fail('UPDATE_FAILED', error.message), { status: 500 });
  }

  if (body.costWeekday !== undefined || body.costWeekend !== undefined) {
    const { data: costs } = await admin
      .from('asset_costs')
      .select('cost_weekday, cost_weekend')
      .eq('asset_id', assetId)
      .maybeSingle();

    await admin.from('asset_costs').upsert({
      asset_id: assetId,
      cost_weekday: Number(
        body.costWeekday !== undefined ? body.costWeekday : costs?.cost_weekday || 0
      ),
      cost_weekend: Number(
        body.costWeekend !== undefined ? body.costWeekend : costs?.cost_weekend || 0
      ),
      updated_at: new Date().toISOString(),
    });
  }

  if (images !== undefined) {
    await admin.from('asset_images').delete().eq('asset_id', assetId);
    if (images.length) {
      await admin.from('asset_images').insert(
        images.map((url, i) => ({
          asset_id: assetId,
          url,
          sort_order: i,
        }))
      );
    }
  }

  if (body.discountRules !== undefined) {
    const discountError = await saveDiscountRules(assetId, body.discountRules);
    if (discountError) {
      return NextResponse.json(
      fail('INVALID', translateEngineError(t, discountError)),
      { status: 400 }
    );
    }
  }

  return NextResponse.json(ok({ asset: data }));
}
