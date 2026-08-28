export const SALE_SETTING_TABS = [
  'profile',
  'payout',
  'membership',
  'subscription',
] as const;

export type SaleSettingTab = (typeof SALE_SETTING_TABS)[number];

export function parseSaleSettingTab(
  raw?: string | null,
  opts?: { hidePayout?: boolean }
): SaleSettingTab {
  if (opts?.hidePayout && raw === 'payout') return 'membership';
  if (raw && (SALE_SETTING_TABS as readonly string[]).includes(raw)) {
    return raw as SaleSettingTab;
  }
  return opts?.hidePayout ? 'membership' : 'profile';
}
