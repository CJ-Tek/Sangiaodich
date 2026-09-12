import { foldVn } from '@/lib/search/vn-fold';

export type VnCity = {
  id: string;
  nameVi: string;
  nameEn: string;
};

/** 63 provinces + centrally governed cities (product catalog). */
export const VN_CITIES: readonly VnCity[] = [
  { id: 'an-giang', nameVi: 'An Giang', nameEn: 'An Giang' },
  { id: 'ba-ria-vung-tau', nameVi: 'Bà Rịa - Vũng Tàu', nameEn: 'Ba Ria - Vung Tau' },
  { id: 'bac-giang', nameVi: 'Bắc Giang', nameEn: 'Bac Giang' },
  { id: 'bac-kan', nameVi: 'Bắc Kạn', nameEn: 'Bac Kan' },
  { id: 'bac-lieu', nameVi: 'Bạc Liêu', nameEn: 'Bac Lieu' },
  { id: 'bac-ninh', nameVi: 'Bắc Ninh', nameEn: 'Bac Ninh' },
  { id: 'ben-tre', nameVi: 'Bến Tre', nameEn: 'Ben Tre' },
  { id: 'binh-dinh', nameVi: 'Bình Định', nameEn: 'Binh Dinh' },
  { id: 'binh-duong', nameVi: 'Bình Dương', nameEn: 'Binh Duong' },
  { id: 'binh-phuoc', nameVi: 'Bình Phước', nameEn: 'Binh Phuoc' },
  { id: 'binh-thuan', nameVi: 'Bình Thuận', nameEn: 'Binh Thuan' },
  { id: 'ca-mau', nameVi: 'Cà Mau', nameEn: 'Ca Mau' },
  { id: 'can-tho', nameVi: 'Cần Thơ', nameEn: 'Can Tho' },
  { id: 'cao-bang', nameVi: 'Cao Bằng', nameEn: 'Cao Bang' },
  { id: 'da-nang', nameVi: 'Đà Nẵng', nameEn: 'Da Nang' },
  { id: 'dak-lak', nameVi: 'Đắk Lắk', nameEn: 'Dak Lak' },
  { id: 'dak-nong', nameVi: 'Đắk Nông', nameEn: 'Dak Nong' },
  { id: 'dien-bien', nameVi: 'Điện Biên', nameEn: 'Dien Bien' },
  { id: 'dong-nai', nameVi: 'Đồng Nai', nameEn: 'Dong Nai' },
  { id: 'dong-thap', nameVi: 'Đồng Tháp', nameEn: 'Dong Thap' },
  { id: 'gia-lai', nameVi: 'Gia Lai', nameEn: 'Gia Lai' },
  { id: 'ha-giang', nameVi: 'Hà Giang', nameEn: 'Ha Giang' },
  { id: 'ha-nam', nameVi: 'Hà Nam', nameEn: 'Ha Nam' },
  { id: 'ha-noi', nameVi: 'Hà Nội', nameEn: 'Ha Noi' },
  { id: 'ha-tinh', nameVi: 'Hà Tĩnh', nameEn: 'Ha Tinh' },
  { id: 'hai-duong', nameVi: 'Hải Dương', nameEn: 'Hai Duong' },
  { id: 'hai-phong', nameVi: 'Hải Phòng', nameEn: 'Hai Phong' },
  { id: 'hau-giang', nameVi: 'Hậu Giang', nameEn: 'Hau Giang' },
  { id: 'hoa-binh', nameVi: 'Hòa Bình', nameEn: 'Hoa Binh' },
  { id: 'hung-yen', nameVi: 'Hưng Yên', nameEn: 'Hung Yen' },
  { id: 'khanh-hoa', nameVi: 'Khánh Hòa', nameEn: 'Khanh Hoa' },
  { id: 'kien-giang', nameVi: 'Kiên Giang', nameEn: 'Kien Giang' },
  { id: 'kon-tum', nameVi: 'Kon Tum', nameEn: 'Kon Tum' },
  { id: 'lai-chau', nameVi: 'Lai Châu', nameEn: 'Lai Chau' },
  { id: 'lam-dong', nameVi: 'Lâm Đồng', nameEn: 'Lam Dong' },
  { id: 'lang-son', nameVi: 'Lạng Sơn', nameEn: 'Lang Son' },
  { id: 'lao-cai', nameVi: 'Lào Cai', nameEn: 'Lao Cai' },
  { id: 'long-an', nameVi: 'Long An', nameEn: 'Long An' },
  { id: 'nam-dinh', nameVi: 'Nam Định', nameEn: 'Nam Dinh' },
  { id: 'nghe-an', nameVi: 'Nghệ An', nameEn: 'Nghe An' },
  { id: 'ninh-binh', nameVi: 'Ninh Bình', nameEn: 'Ninh Binh' },
  { id: 'ninh-thuan', nameVi: 'Ninh Thuận', nameEn: 'Ninh Thuan' },
  { id: 'phu-tho', nameVi: 'Phú Thọ', nameEn: 'Phu Tho' },
  { id: 'phu-yen', nameVi: 'Phú Yên', nameEn: 'Phu Yen' },
  { id: 'quang-binh', nameVi: 'Quảng Bình', nameEn: 'Quang Binh' },
  { id: 'quang-nam', nameVi: 'Quảng Nam', nameEn: 'Quang Nam' },
  { id: 'quang-ngai', nameVi: 'Quảng Ngãi', nameEn: 'Quang Ngai' },
  { id: 'quang-ninh', nameVi: 'Quảng Ninh', nameEn: 'Quang Ninh' },
  { id: 'quang-tri', nameVi: 'Quảng Trị', nameEn: 'Quang Tri' },
  { id: 'soc-trang', nameVi: 'Sóc Trăng', nameEn: 'Soc Trang' },
  { id: 'son-la', nameVi: 'Sơn La', nameEn: 'Son La' },
  { id: 'tay-ninh', nameVi: 'Tây Ninh', nameEn: 'Tay Ninh' },
  { id: 'thai-binh', nameVi: 'Thái Bình', nameEn: 'Thai Binh' },
  { id: 'thai-nguyen', nameVi: 'Thái Nguyên', nameEn: 'Thai Nguyen' },
  { id: 'thanh-hoa', nameVi: 'Thanh Hóa', nameEn: 'Thanh Hoa' },
  { id: 'thua-thien-hue', nameVi: 'Thừa Thiên Huế', nameEn: 'Thua Thien Hue' },
  { id: 'tien-giang', nameVi: 'Tiền Giang', nameEn: 'Tien Giang' },
  { id: 'ho-chi-minh', nameVi: 'TP. Hồ Chí Minh', nameEn: 'Ho Chi Minh City' },
  { id: 'tra-vinh', nameVi: 'Trà Vinh', nameEn: 'Tra Vinh' },
  { id: 'tuyen-quang', nameVi: 'Tuyên Quang', nameEn: 'Tuyen Quang' },
  { id: 'vinh-long', nameVi: 'Vĩnh Long', nameEn: 'Vinh Long' },
  { id: 'vinh-phuc', nameVi: 'Vĩnh Phúc', nameEn: 'Vinh Phuc' },
  { id: 'yen-bai', nameVi: 'Yên Bái', nameEn: 'Yen Bai' },
] as const;

const CITY_BY_ID = new Map(VN_CITIES.map((c) => [c.id, c]));

const LOCATION_SEP = ' · ';

export function getVnCity(id: string | null | undefined): VnCity | undefined {
  if (!id) return undefined;
  return CITY_BY_ID.get(id);
}

export function isVnCityId(id: string | null | undefined): boolean {
  return Boolean(id && CITY_BY_ID.has(id));
}

export function vnCityLabel(
  city: VnCity,
  locale: string | undefined
): string {
  return locale?.startsWith('en') ? city.nameEn : city.nameVi;
}

export function vnCityOptions(locale: string | undefined): {
  value: string;
  label: string;
}[] {
  return VN_CITIES.map((c) => ({
    value: c.id,
    label: vnCityLabel(c, locale),
  }));
}

/** Canonical city display used in stored location (Vietnamese). */
export function vnCityStoredName(cityId: string): string | null {
  return getVnCity(cityId)?.nameVi ?? null;
}

export function formatAssetLocation(
  cityId: string,
  detail?: string | null
): string {
  const city = vnCityStoredName(cityId);
  if (!city) return (detail || '').trim();
  const d = (detail || '').trim();
  return d ? `${city}${LOCATION_SEP}${d}` : city;
}

type ParsedLocation = {
  cityId: string | null;
  detail: string;
};

function cityAliases(city: VnCity): string[] {
  const names = [city.nameVi, city.nameEn];
  if (city.id === 'ho-chi-minh') {
    names.push('TP.HCM', 'TPHCM', 'Ho Chi Minh', 'Sài Gòn', 'Saigon');
  }
  if (city.id === 'da-nang') names.push('Danang');
  if (city.id === 'ha-noi') names.push('Hanoi');
  return names;
}

/** Longest folded city name first so "Bà Rịa - Vũng Tàu" wins over shorter hits. */
const CITIES_BY_NAME_LEN = [...VN_CITIES].sort((a, b) => {
  const la = Math.max(...cityAliases(a).map((n) => foldVn(n).length));
  const lb = Math.max(...cityAliases(b).map((n) => foldVn(n).length));
  return lb - la;
});

export function parseAssetLocation(
  location: string | null | undefined
): ParsedLocation {
  const raw = (location || '').trim();
  if (!raw) return { cityId: null, detail: '' };

  const folded = foldVn(raw);
  for (const city of CITIES_BY_NAME_LEN) {
    for (const alias of cityAliases(city)) {
      const needle = foldVn(alias);
      if (!needle) continue;
      if (folded === needle) {
        return { cityId: city.id, detail: '' };
      }
      if (
        folded.startsWith(`${needle} `) ||
        folded.startsWith(`${needle}·`) ||
        folded.startsWith(`${needle}-`) ||
        folded.startsWith(`${needle},`)
      ) {
        // Recover detail from original after first separator-ish chunk
        const sepIdx = raw.search(/\s*[·|,–-]\s*/);
        if (sepIdx > 0) {
          return {
            cityId: city.id,
            detail: raw.slice(sepIdx).replace(/^\s*[·|,–-]\s*/, '').trim(),
          };
        }
        return { cityId: city.id, detail: '' };
      }
      if (folded.includes(needle)) {
        return { cityId: city.id, detail: raw };
      }
    }
  }

  return { cityId: null, detail: raw };
}

export function locationMatchesCity(
  location: string | null | undefined,
  cityId: string
): boolean {
  const city = getVnCity(cityId);
  if (!city) return false;
  const folded = foldVn(location || '');
  if (!folded) return false;
  return cityAliases(city).some((alias) => {
    const needle = foldVn(alias);
    return (
      folded === needle ||
      folded.startsWith(`${needle} `) ||
      folded.startsWith(`${needle}·`) ||
      folded.startsWith(`${needle}-`) ||
      folded.startsWith(`${needle},`) ||
      folded.includes(needle)
    );
  });
}
