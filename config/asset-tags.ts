/** Fixed tags for owner asset listings (vị trí, tiện nghi, đối tượng…). */

import type { useTranslations } from 'next-intl';

export type AssetTagGroupId =
  | 'location'
  | 'space'
  | 'amenities'
  | 'audience'
  | 'style'
  | 'access';

export type AssetTagDef = {
  id: string;
  group: AssetTagGroupId;
};

export const ASSET_TAG_GROUPS: { id: AssetTagGroupId }[] = [
  { id: 'location' },
  { id: 'space' },
  { id: 'amenities' },
  { id: 'audience' },
  { id: 'style' },
  { id: 'access' },
];

export const ASSET_TAGS: AssetTagDef[] = [
  // Vị trí
  { id: 'in_center', group: 'location' },
  { id: 'near_center', group: 'location' },
  { id: 'near_beach', group: 'location' },
  { id: 'beachfront', group: 'location' },
  { id: 'near_mountain', group: 'location' },
  { id: 'mountain_view', group: 'location' },
  { id: 'near_lake', group: 'location' },
  { id: 'near_attraction', group: 'location' },
  { id: 'near_market', group: 'location' },
  { id: 'near_airport', group: 'location' },
  { id: 'near_landmark', group: 'location' },
  { id: 'quiet_suburb', group: 'location' },

  // Không gian & view
  { id: 'private_pool', group: 'space' },
  { id: 'garden', group: 'space' },
  { id: 'bbq', group: 'space' },
  { id: 'balcony', group: 'space' },
  { id: 'sea_view', group: 'space' },
  { id: 'city_view', group: 'space' },

  // Tiện nghi (thay Amenities tự do)
  { id: 'wifi', group: 'amenities' },
  { id: 'tv', group: 'amenities' },
  { id: 'sound_system', group: 'amenities' },
  { id: 'streaming', group: 'amenities' },
  { id: 'air_con', group: 'amenities' },
  { id: 'heater', group: 'amenities' },
  { id: 'washer', group: 'amenities' },
  { id: 'dryer', group: 'amenities' },
  { id: 'kitchen', group: 'amenities' },
  { id: 'oven_microwave', group: 'amenities' },
  { id: 'fridge', group: 'amenities' },
  { id: 'coffee', group: 'amenities' },
  { id: 'indoor_grill', group: 'amenities' },
  { id: 'hot_water', group: 'amenities' },
  { id: 'bathtub', group: 'amenities' },
  { id: 'toiletries', group: 'amenities' },
  { id: 'security_cam', group: 'amenities' },
  { id: 'safe', group: 'amenities' },

  // Phù hợp với
  { id: 'family', group: 'audience' },
  { id: 'friends', group: 'audience' },
  { id: 'couple', group: 'audience' },
  { id: 'team_building', group: 'audience' },
  { id: 'remote_work', group: 'audience' },
  { id: 'pet_friendly', group: 'audience' },

  // Phong cách
  { id: 'luxury', group: 'style' },
  { id: 'rustic', group: 'style' },
  { id: 'minimal', group: 'style' },
  { id: 'local_style', group: 'style' },

  // Tiện lợi
  { id: 'parking', group: 'access' },
  { id: 'compound', group: 'access' },
  { id: 'self_checkin', group: 'access' },
];

export const ASSET_TAG_IDS = new Set(ASSET_TAGS.map((t) => t.id));

/** Nộp duyệt cần ít nhất 1 tag; không giới hạn max — chọn hết được. */
export const MIN_ASSET_TAGS = 1;

export function parseTagSearchParam(
  tags: string | string[] | undefined
): string[] {
  if (!tags) return [];
  const raw = Array.isArray(tags)
    ? tags.flatMap((t) => t.split(','))
    : tags.split(',');
  return filterValidAssetTags(raw);
}

export function filterValidAssetTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || '').trim();
    if (!id || !ASSET_TAG_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

type AssetTagsTranslator = ReturnType<typeof useTranslations<'assetTags'>>;

export function assetTagLabel(id: string, t: AssetTagsTranslator): string {
  if (!ASSET_TAG_IDS.has(id)) return id;
  return t(`tags.${id}` as 'tags.in_center');
}

export function assetTagGroupLabel(
  groupId: AssetTagGroupId,
  t: AssetTagsTranslator
): string {
  return t(`groups.${groupId}` as 'groups.location');
}

export const PROPERTY_TYPES = [
  { value: 'VILLA' as const },
  { value: 'APARTMENT' as const },
];

export type PropertyType = (typeof PROPERTY_TYPES)[number]['value'];

export function isPropertyType(v: unknown): v is PropertyType {
  return v === 'VILLA' || v === 'APARTMENT';
}

type PropertyTypesTranslator = ReturnType<
  typeof useTranslations<'propertyTypes'>
>;

export function propertyTypeLabel(
  type: PropertyType,
  t: PropertyTypesTranslator
): string {
  return t(type);
}

export const MAX_ASSET_IMAGES = 12;
export const MIN_ASSET_IMAGES_FOR_REVIEW = 1;
/** Keep in sync with enforce_owner_draft_asset_limit() in migrations. */
export const MAX_OWNER_DRAFT_ASSETS = 15;
export const DRAFT_LIMIT_MESSAGE = `Tối đa ${MAX_OWNER_DRAFT_ASSETS} asset nháp. Hãy nộp duyệt hoặc xóa nháp cũ.`;
