import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { fanoutLeadNotifications } from '@/lib/engines/lead-fanout';
import { getRequiredSecret, isProductionRuntime } from '@/lib/security/secrets';
import { fail, ok } from '@/lib/types';

export async function POST(request: Request) {
  const bodyText = await request.text();
  let leadId = '';

  try {
    leadId = JSON.parse(bodyText).leadId;
  } catch {
    return NextResponse.json(fail('INVALID', 'Invalid JSON'), { status: 400 });
  }

  if (!leadId) {
    return NextResponse.json(fail('INVALID', 'leadId required'), { status: 400 });
  }

  const cronSecret = getRequiredSecret('CRON_SECRET');
  const localSecret = request.headers.get('x-local-fanout-secret');
  const hasQStashKeys =
    process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

  if (localSecret) {
    if (!cronSecret || localSecret !== cronSecret) {
      return NextResponse.json(fail('UNAUTHORIZED', 'Invalid local fanout secret'), {
        status: 401,
      });
    }
  } else if (hasQStashKeys) {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });
    const signature = request.headers.get('upstash-signature') || '';
    const valid = await receiver.verify({ signature, body: bodyText });
    if (!valid) {
      return NextResponse.json(fail('UNAUTHORIZED', 'Invalid QStash signature'), {
        status: 401,
      });
    }
  } else if (isProductionRuntime()) {
    return NextResponse.json(
      fail(
        'MISCONFIGURED',
        'Configure QStash signing keys or CRON_SECRET for fanout auth'
      ),
      { status: 503 }
    );
  } else {
    return NextResponse.json(fail('UNAUTHORIZED', 'Not authorized'), {
      status: 401,
    });
  }

  try {
    const result = await fanoutLeadNotifications(leadId);
    return NextResponse.json(ok(result));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Fanout failed';
    return NextResponse.json(fail('FANOUT_FAILED', message), { status: 500 });
  }
}
