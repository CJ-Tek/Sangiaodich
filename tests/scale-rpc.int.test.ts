import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { todayDateOnly } from '@/lib/dates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Covers the RPCs that took over aggregation from Node. They run against real
 * rows, so — like the SePay suite — only a local Supabase is ever touched.
 */
const isLocalSupabase = /(localhost|127\.0\.0\.1)/.test(supabaseUrl);
const canRun = Boolean(
  supabaseUrl && serviceRoleKey && anonKey && isLocalSupabase
);

const runStamp = Date.now();
let sequence = 0;

let admin: SupabaseClient;
const createdUserIds: string[] = [];
const createdEventIds: string[] = [];
const credentials = new Map<string, { email: string; password: string }>();

describe.skipIf(!canRun)('scale RPCs (integration)', () => {
  beforeAll(() => {
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  afterAll(async () => {
    if (createdEventIds.length) {
      await admin
        .from('sepay_webhook_events')
        .delete()
        .in('sepay_id', createdEventIds);
    }
    // Profiles, assets, subscriptions and bookings cascade from the auth user.
    for (const id of createdUserIds) await admin.auth.admin.deleteUser(id);
  });

  it('app_today follows the app timezone, not the server clock', async () => {
    const { data, error } = await admin.rpc('app_today');

    expect(error).toBeNull();
    expect(data).toBe(todayDateOnly());
  });

  describe('expire_due_subscriptions', () => {
    it('expires overdue owners and suspends their listings in one pass', async () => {
      const overdue = await makeUser('OWNER');
      const current = await makeUser('OWNER');

      const [overdueSub, currentSub] = await Promise.all([
        makeSubscription(overdue, shiftDays(-1)),
        makeSubscription(current, shiftDays(30)),
      ]);
      const [overdueAsset, currentAsset] = await Promise.all([
        makeAsset(overdue, 'ACTIVE'),
        makeAsset(current, 'ACTIVE'),
      ]);

      const { error } = await admin.rpc('expire_due_subscriptions');
      expect(error).toBeNull();

      expect(await subscriptionStatus(overdueSub)).toBe('EXPIRED');
      expect(await assetStatus(overdueAsset)).toBe('SUSPENDED');

      expect(await subscriptionStatus(currentSub)).toBe('ACTIVE');
      expect(await assetStatus(currentAsset)).toBe('ACTIVE');
    });

    it('leaves nothing to do on a second run', async () => {
      const owner = await makeUser('OWNER');
      await makeSubscription(owner, shiftDays(-5));
      await makeAsset(owner, 'ACTIVE');

      await admin.rpc('expire_due_subscriptions');
      const { data } = await admin.rpc('expire_due_subscriptions').maybeSingle<{
        expired_subscriptions: number;
        suspended_assets: number;
      }>();

      expect(Number(data?.expired_subscriptions)).toBe(0);
      expect(Number(data?.suspended_assets)).toBe(0);
    });
  });

  describe('lead watermark', () => {
    it('shows only leads raised inside the membership being paid for', async () => {
      const subscribed = await makeUser('SALE');
      const unsubscribed = await makeUser('SALE');
      await makeSubscription(subscribed, shiftDays(15), todayDateOnly());

      const before = await makeLead({ createdAt: shiftDays(-2) });
      const during = await makeLead();

      const feed = await leadFeedFor(subscribed);
      expect(feed.map((row) => row.lead_id)).toContain(during);
      expect(feed.map((row) => row.lead_id)).not.toContain(before);

      expect(await leadFeedFor(unsubscribed)).toHaveLength(0);
    });

    it('counts unread until the page is opened, then again for what follows', async () => {
      const sale = await makeUser('SALE');
      await makeSubscription(sale, shiftDays(15), todayDateOnly());
      const client = await signInAs(sale);

      // Every sale sees every lead in their window, so the baseline is whatever
      // earlier cases left behind rather than zero.
      const baseline = await unreadCount(client);
      await makeLead();
      expect(await unreadCount(client)).toBe(baseline + 1);

      await client.rpc('mark_leads_seen');
      expect(await unreadCount(client)).toBe(0);

      await makeLead();
      expect(await unreadCount(client)).toBe(1);
    });

    it('reports a large backlog as the cap rather than scanning it', async () => {
      const sale = await makeUser('SALE');
      await makeSubscription(sale, shiftDays(15), todayDateOnly());
      const client = await signInAs(sale);

      await client.rpc('mark_leads_seen');
      for (let i = 0; i < 4; i += 1) await makeLead();

      const { data } = await client.rpc('sale_unread_lead_count', { p_cap: 2 });
      expect(Number(data)).toBe(3);
    });
  });

  describe('admin_overview_counts', () => {
    it('counts new profiles and both revenue sources', async () => {
      const month = monthWindow();
      const before = await overviewCounts(month);

      const owner = await makeUser('OWNER');
      await makeUser('SALE');
      await makeUser('GUEST');
      await makeSubscription(owner, shiftDays(20));
      await admin.from('audit_logs').insert([
        { actor_id: owner, action: 'mark_paid', payload: { amount: '150000' } },
        // A non-numeric payload must score zero rather than abort the report.
        { actor_id: owner, action: 'mark_paid', payload: { amount: 'n/a' } },
      ]);

      const after = await overviewCounts(month);

      expect(after.owners - before.owners).toBe(1);
      expect(after.sales - before.sales).toBe(1);
      expect(after.guests - before.guests).toBe(1);
      expect(after.active_paid_users - before.active_paid_users).toBe(1);
      expect(after.revenue_month - before.revenue_month).toBe(150_000);
      expect(after.revenue_all - before.revenue_all).toBe(150_000);
    });
  });

  describe('membership and earnings sums', () => {
    it('sums the whole history for a sale and for an owner', async () => {
      const owner = await makeUser('OWNER');
      const sale = await makeUser('SALE');
      const guest = await makeUser('GUEST');
      const asset = await makeAsset(owner, 'ACTIVE');

      await admin.from('bookings').insert([
        booking({ asset, sale, guest, day: 1, status: 'CONFIRMED' }),
        booking({ asset, sale, guest, day: 5, status: 'CHECKED_OUT' }),
        // Cancelled stays earn no credit on either side.
        booking({ asset, sale, guest, day: 9, status: 'CANCELLED' }),
      ]);

      const { data: volume } = await admin.rpc('sale_membership_volume', {
        p_sale_id: sale,
      });
      expect(Number(volume)).toBe(2_000_000);

      const { data: earnings } = await admin
        .rpc('owner_earnings_summary', { p_owner_id: owner })
        .maybeSingle<{ confirmed_bookings: number; owner_earn_total: number }>();
      expect(Number(earnings?.confirmed_bookings)).toBe(2);
      expect(Number(earnings?.owner_earn_total)).toBe(1_600_000);
    });
  });

  describe('purge_sepay_webhook_events', () => {
    it('drops processed events past the window and keeps the rest', async () => {
      const stale = await makeWebhookEvent({ processed: true, ageDays: 120 });
      const staleUnprocessed = await makeWebhookEvent({
        processed: false,
        ageDays: 120,
      });
      const recent = await makeWebhookEvent({ processed: true, ageDays: 5 });

      const { data, error } = await admin.rpc('purge_sepay_webhook_events');
      expect(error).toBeNull();
      expect(Number(data)).toBeGreaterThanOrEqual(1);

      expect(await webhookEventExists(stale)).toBe(false);
      expect(await webhookEventExists(staleUnprocessed)).toBe(true);
      expect(await webhookEventExists(recent)).toBe(true);
    });
  });
});

function nextTag(): string {
  sequence += 1;
  return `${runStamp}-${sequence}`;
}

function shiftDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthWindow() {
  const today = todayDateOnly();
  return {
    start: `${today.slice(0, 7)}-01T00:00:00+07:00`,
    end: `${shiftDays(60).slice(0, 7)}-01T00:00:00+07:00`,
  };
}

async function makeUser(role: 'OWNER' | 'SALE' | 'GUEST'): Promise<string> {
  const email = `scale-int-${nextTag()}@vbnb.local`;
  const password = randomUUID();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: `Scale ${role}` },
  });
  if (error || !data.user) {
    throw new Error(error?.message || 'Cannot create test user');
  }

  await admin.rpc('sync_profile_role_from_auth', { p_user_id: data.user.id });
  createdUserIds.push(data.user.id);
  credentials.set(data.user.id, { email, password });
  return data.user.id;
}

/**
 * The lead RPCs read `auth.uid()`, so they can only be exercised through a
 * signed-in client — the service role would look like nobody to them.
 */
async function signInAs(profileId: string): Promise<SupabaseClient> {
  const login = credentials.get(profileId);
  if (!login) throw new Error(`No credentials recorded for ${profileId}`);

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword(login);
  if (error) throw new Error(error.message);
  return client;
}

async function makeSubscription(
  profileId: string,
  periodEnd: string,
  periodStart: string = shiftDays(-30)
): Promise<string> {
  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      profile_id: profileId,
      period_start: periodStart,
      period_end: periodEnd,
      amount: 500_000,
      status: 'ACTIVE',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function makeAsset(ownerId: string, status: string): Promise<string> {
  const tag = nextTag();
  const { data, error } = await admin
    .from('assets')
    .insert({
      owner_id: ownerId,
      slug: `scale-int-${tag}`,
      title: `Scale Villa ${tag}`,
      status,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function makeLead(input?: { createdAt?: string }): Promise<string> {
  const owner = await makeUser('OWNER');
  const guest = await makeUser('GUEST');
  const asset = await makeAsset(owner, 'ACTIVE');

  const { data, error } = await admin
    .from('lead_requests')
    .insert({
      asset_id: asset,
      guest_id: guest,
      ...(input?.createdAt ? { created_at: input.createdAt } : {}),
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

function booking(input: {
  asset: string;
  sale: string;
  guest: string;
  day: number;
  status: string;
}) {
  return {
    asset_id: input.asset,
    sale_id: input.sale,
    guest_id: input.guest,
    status: input.status,
    check_in: shiftDays(input.day),
    check_out: shiftDays(input.day + 2),
    list_price: 1_200_000,
    base_cost_snapshot: 1_000_000,
    owner_earn_snapshot: 800_000,
    confirmed_at: new Date().toISOString(),
  };
}

async function makeWebhookEvent(input: {
  processed: boolean;
  ageDays: number;
}): Promise<string> {
  const sepayId = `scale-int-${nextTag()}`;
  const createdAt = new Date();
  createdAt.setUTCDate(createdAt.getUTCDate() - input.ageDays);

  const { error } = await admin.from('sepay_webhook_events').insert({
    sepay_id: sepayId,
    raw_body: {},
    processed: input.processed,
    created_at: createdAt.toISOString(),
  });
  if (error) throw new Error(error.message);

  createdEventIds.push(sepayId);
  return sepayId;
}

async function overviewCounts(window: { start: string; end: string }) {
  const { data, error } = await admin
    .rpc('admin_overview_counts', { p_start: window.start, p_end: window.end })
    .maybeSingle<{
      guests: number;
      owners: number;
      sales: number;
      active_paid_users: number;
      revenue_all: number;
      revenue_month: number;
    }>();
  if (error) throw new Error(error.message);

  return {
    guests: Number(data?.guests || 0),
    owners: Number(data?.owners || 0),
    sales: Number(data?.sales || 0),
    active_paid_users: Number(data?.active_paid_users || 0),
    revenue_all: Number(data?.revenue_all || 0),
    revenue_month: Number(data?.revenue_month || 0),
  };
}

async function subscriptionStatus(id: string) {
  const { data } = await admin
    .from('subscriptions')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  return data?.status;
}

async function assetStatus(id: string) {
  const { data } = await admin
    .from('assets')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  return data?.status;
}

async function leadFeedFor(
  profileId: string
): Promise<{ lead_id: string; unread: boolean }[]> {
  const client = await signInAs(profileId);
  const { data, error } = await client.rpc('sale_lead_feed', { p_limit: 100 });
  if (error) throw new Error(error.message);
  return data || [];
}

async function unreadCount(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.rpc('sale_unread_lead_count');
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

async function webhookEventExists(sepayId: string): Promise<boolean> {
  const { data } = await admin
    .from('sepay_webhook_events')
    .select('id')
    .eq('sepay_id', sepayId)
    .maybeSingle();
  return Boolean(data);
}
