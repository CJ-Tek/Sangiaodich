import { Client } from '@upstash/qstash';
import { fanoutLeadNotifications } from '@/lib/engines/lead-fanout';

export function getQStash() {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;
  return new Client({ token });
}

export async function publishLeadFanout(leadId: string): Promise<void> {
  const client = getQStash();
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${base}/api/qstash/lead-fanout`;

  if (!client) {
    // Local / no-QStash: run fan-out in-process (await). Self-fetch is unreliable
    // because the request context may end before the HTTP call completes.
    console.warn('[qstash] QSTASH_TOKEN missing — running lead fan-out inline');
    await fanoutLeadNotifications(leadId);
    return;
  }

  await client.publishJSON({
    url,
    body: { leadId },
  });
}
