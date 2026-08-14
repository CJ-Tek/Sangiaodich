/** Fixed tags for owner asset listings (vị trí, tiện nghi, đối tượng…). */

export type AssetTagGroupId =
  | 'location'
  | 'space'
  | 'amenities'
  | 'audience'
  | 'style'
  | 'access';

export type AssetTagDef = {
  id: string;
  label: string;
  group: AssetTagGroupId;
};

export const ASSET_TAG_GROUPS: {
  id: AssetTagGroupId;
  label: string;
}[] = [
  { id: 'location', label: 'Vị trí' },
  { id: 'space', label: 'Không gian & view' },
  { id: 'amenities', label: 'Tiện nghi' },
  { id: 'audience', label: 'Phù hợp với' },
  { id: 'style', label: 'Phong cách' },
  { id: 'access', label: 'Tiện lợi' },
];

export const ASSET_TAGS: AssetTagDef[] = [
  // Vị trí
  { id: 'in_center', label: 'Ở trung tâm', group: 'location' },
  { id: 'near_center', label: 'Gần trung tâm', group: 'location' },
  { id: 'near_beach', label: 'Gần biển', group: 'location' },
  { id: 'beachfront', label: 'Sát biển / View biển', group: 'location' },
  { id: 'near_mountain', label: 'Gần núi / đồi', group: 'location' },
  { id: 'mountain_view', label: 'View núi / đồi', group: 'location' },
  { id: 'near_lake', label: 'Gần hồ / sông', group: 'location' },
  { id: 'near_attraction', label: 'Gần khu vui chơi', group: 'location' },
  { id: 'near_market', label: 'Gần chợ / siêu thị', group: 'location' },
  { id: 'near_airport', label: 'Gần sân bay', group: 'location' },
  { id: 'near_landmark', label: 'Gần điểm du lịch nổi bật', group: 'location' },
  { id: 'quiet_suburb', label: 'Yên tĩnh / ngoại ô', group: 'location' },

  // Không gian & view
  { id: 'private_pool', label: 'Hồ bơi riêng', group: 'space' },
  { id: 'garden', label: 'Sân vườn rộng', group: 'space' },
  { id: 'bbq', label: 'Sân BBQ', group: 'space' },
  { id: 'balcony', label: 'Ban công / terrace', group: 'space' },
  { id: 'sea_view', label: 'View biển', group: 'space' },
  { id: 'city_view', label: 'View thành phố', group: 'space' },

  // Tiện nghi (thay Amenities tự do)
  { id: 'wifi', label: 'Wifi', group: 'amenities' },
  { id: 'tv', label: 'TV', group: 'amenities' },
  { id: 'sound_system', label: 'Loa / Sound system', group: 'amenities' },
  { id: 'streaming', label: 'Netflix / máy chiếu', group: 'amenities' },
  { id: 'air_con', label: 'Máy lạnh', group: 'amenities' },
  { id: 'heater', label: 'Máy sưởi / lò sưởi', group: 'amenities' },
  { id: 'washer', label: 'Máy giặt', group: 'amenities' },
  { id: 'dryer', label: 'Máy sấy', group: 'amenities' },
  { id: 'kitchen', label: 'Bếp đầy đủ', group: 'amenities' },
  { id: 'oven_microwave', label: 'Lò nướng / lò vi sóng', group: 'amenities' },
  { id: 'fridge', label: 'Tủ lạnh', group: 'amenities' },
  { id: 'coffee', label: 'Ấm đun / máy pha cà phê', group: 'amenities' },
  { id: 'indoor_grill', label: 'Đồ nướng trong nhà', group: 'amenities' },
  { id: 'hot_water', label: 'Máy nước nóng', group: 'amenities' },
  { id: 'bathtub', label: 'Bồn tắm', group: 'amenities' },
  { id: 'toiletries', label: 'Toiletries / khăn', group: 'amenities' },
  { id: 'security_cam', label: 'Camera an ninh', group: 'amenities' },
  { id: 'safe', label: 'Két sắt', group: 'amenities' },

  // Phù hợp với
  { id: 'family', label: 'Gia đình có trẻ', group: 'audience' },
  { id: 'friends', label: 'Nhóm bạn / party', group: 'audience' },
  { id: 'couple', label: 'Cặp đôi / honeymoon', group: 'audience' },
  { id: 'team_building', label: 'Team building', group: 'audience' },
  { id: 'remote_work', label: 'Remote work', group: 'audience' },
  { id: 'pet_friendly', label: 'Pet friendly', group: 'audience' },

  // Phong cách
  { id: 'luxury', label: 'Sang trọng / luxury', group: 'style' },
  { id: 'rustic', label: 'Rustic / thiên nhiên', group: 'style' },
  { id: 'minimal', label: 'Minimal / hiện đại', group: 'style' },
  { id: 'local_style', label: 'Phong cách địa phương', group: 'style' },

  // Tiện lợi
  { id: 'parking', label: 'Bãi đậu xe / garage', group: 'access' },
  { id: 'compound', label: 'Compound / có bảo vệ', group: 'access' },
  { id: 'self_checkin', label: 'Self check-in', group: 'access' },
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

export function assetTagLabel(id: string): string {
  return ASSET_TAGS.find((t) => t.id === id)?.label ?? id;
}

export function assetTagGroupLabel(groupId: AssetTagGroupId): string {
  return ASSET_TAG_GROUPS.find((g) => g.id === groupId)?.label ?? groupId;
}

export const PROPERTY_TYPES = [
  { value: 'VILLA' as const, label: 'Villa' },
  { value: 'APARTMENT' as const, label: 'Căn hộ' },
];

export type PropertyType = (typeof PROPERTY_TYPES)[number]['value'];

export function isPropertyType(v: unknown): v is PropertyType {
  return v === 'VILLA' || v === 'APARTMENT';
}

export function propertyTypeLabel(type: PropertyType): string {
  return PROPERTY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export const MAX_ASSET_IMAGES = 12;
export const MIN_ASSET_IMAGES_FOR_REVIEW = 1;
/** Keep in sync with enforce_owner_draft_asset_limit() in migrations. */
export const MAX_OWNER_DRAFT_ASSETS = 15;
export const DRAFT_LIMIT_MESSAGE = `Tối đa ${MAX_OWNER_DRAFT_ASSETS} asset nháp. Hãy nộp duyệt hoặc xóa nháp cũ.`;
