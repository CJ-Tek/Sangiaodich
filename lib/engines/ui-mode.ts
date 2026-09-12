export type UiMode = 'simple' | 'expert';

export function parseUiMode(raw: unknown): UiMode {
  return raw === 'expert' ? 'expert' : 'simple';
}

export function isSimpleUi(mode: UiMode | null | undefined): boolean {
  return mode !== 'expert';
}
