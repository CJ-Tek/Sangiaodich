export function isSubscriptionActive(input: {
  status: string;
  periodEnd: string;
  today?: string;
}): boolean {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  return input.status === 'ACTIVE' && input.periodEnd >= today;
}
