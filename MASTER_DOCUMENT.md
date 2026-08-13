# VBNB — Master Document

## Product

**VBNB** is a single-platform marketplace for stay assets:

1. Owner lists asset + weekday/weekend **cost**
2. Admin approves → **ACTIVE** on the floor (open 100% to subscribed sales)
3. Sale (monthly subscription ACTIVE) sees all ACTIVE assets + cost, sets own selling price, creates bookings for guests
4. Guest browses catalog + **confirmed-only** calendar (no prices), copies link or requests sale contact
5. Payment is **offline**; sale records `amountCollected` on confirm
6. Admin configures subscription fees and platform membership tiers (sale + guest)

## Locked technical decisions (MVP)

| Topic | Decision |
|-------|----------|
| Stack | Next.js App Router, TypeScript, Mantine, Supabase, Vercel |
| Auth | Mock/dev OTP (`000000`) + seed email/password; SMS later via same adapter |
| Inventory | Only **CONFIRMED** blocks dates (Postgres exclusion constraint) |
| Guest calendar | Only **CONFIRMED** shown as booked |
| Rate limit | Vercel KV (memory fallback locally) |
| Lead notify | QStash fan-out → `lead_notifications` (local signed fallback if no QStash token) |
| Money | `effectiveCost`, guestPay floor, snapshots on confirm — unchanged |

## Roles

- **ADMIN** — review assets, fees, mark paid, membership tiers, users, audit
- **OWNER** — assets/costs/P&L/subscription status
- **SALE** — marketplace+cost, leads, bookings
- **GUEST** — marketplace, copy/share, contact sale, my bookings, membership

One account = one role. One Next.js app with role shells.

## Money formulas

```
effectiveCost = baseCost × (1 − saleCostDiscountPercent)
guestPay      = max(listSelling, effectiveCost)
ownerEarns    = effectiveCost   // snapshot at confirm
saleMargin    = amountCollected − effectiveCost
```

## Main routes

| Path | Audience |
|------|----------|
| `/`, `/marketplace`, `/a/[slug]` | Public / guest |
| `/login` | All |
| `/me/bookings`, `/me/membership` | Guest |
| `/sale/*` | Sale (mobile shell) |
| `/owner/*` | Owner |
| `/admin/*` | Admin |

## Data stores

- Supabase Postgres + Auth + Storage (`asset-images`)
- Tables: profiles, subscriptions, assets, costs, bookings, leads, membership, audit_logs, …
- RPC `asset_confirmed_ranges(asset_id)` for public free/busy without price leakage

## Ops

- Local Supabase ports: **58321+** (see `supabase/config.toml`)
- Seed users documented in README
- Cron expires ACTIVE subscriptions past `period_end` and suspends owner ACTIVE assets

## Out of MVP

Online payments, guest self-book, owner–sale attach, lead claim/TTL, Redis/BullMQ self-host, multi-portal, 100k concurrent API claims without measurement.
