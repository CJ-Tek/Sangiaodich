export const SALE_SETTING_TABS = [
  'profile',
  'payout',
  'membership',
  'subscription',
] as const;

export type SaleSettingTab = (typeof SALE_SETTING_TABS)[number];

export function parseSaleSettingTab(raw?: string | null): SaleSettingTab {
  if (raw && (SALE_SETTING_TABS as readonly string[]).includes(raw)) {
    return raw as SaleSettingTab;
  }
  return 'profile';
}
