export const FEE_SETTING_TABS = ['subscription', 'payout'] as const;

export type FeeSettingTab = (typeof FEE_SETTING_TABS)[number];

export function parseFeeSettingTab(raw?: string | null): FeeSettingTab {
  if (raw && (FEE_SETTING_TABS as readonly string[]).includes(raw)) {
    return raw as FeeSettingTab;
  }
  return 'subscription';
}
