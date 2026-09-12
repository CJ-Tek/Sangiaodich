/** Fold Vietnamese text for accent-insensitive search (đ → d). */
export function foldVn(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}
