export type UiMode = 'simple' | 'expert';

export function parseUiMode(raw: unknown): UiMode {
  return raw === 'simple' ? 'simple' : 'expert';
}

export function isSimpleUi(mode: UiMode | null | undefined): boolean {
  return mode === 'simple';
}
