/** Read a required secret; returns null when unset/blank (caller should fail closed). */
export function getRequiredSecret(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}
