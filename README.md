# VBNB

Sàn giao dịch tài sản lưu trú (Owner → Admin duyệt → Sale bán hộ → Guest xem lịch / copy link).

Stack: **Next.js App Router · Mantine · Supabase · Vercel KV**.

Spec: [VBNB_MASTER_PROMPT.md](./VBNB_MASTER_PROMPT.md) · UI: [VBNB_UI_UX_PROMPT.md](./VBNB_UI_UX_PROMPT.md) · Doc: [MASTER_DOCUMENT.md](./MASTER_DOCUMENT.md).

## Prerequisites

- Node 20+
- Hosted Supabase project (same DB for local dev and production)
- `.env.local` with Supabase URL + keys (see `.env.example`)

## Quick start (Windows)

1. Copy env file and add keys from Supabase dashboard → Project Settings → API:

```powershell
copy .env.example .env.local
# edit .env.local — paste anon key + service role key
```

2. Start dev server:

```powershell
npm run local
# or: npm run dev
```

`npm run local` starts Next.js only. It **does not** start Docker and **does not**
overwrite `.env.local`.

```powershell
.\scripts\run-local.ps1 -Port 3001
```

App: http://localhost:3000  
Database: hosted Supabase (`NEXT_PUBLIC_SUPABASE_URL` in `.env.local`)

**Do not run `npm run db:reset`** — it wipes the shared database.

Link CLI to hosted project (once per machine, for `db:push` / `db:status`):

```bash
npm run db:link -- --project-ref bidhzgcdlxjzsxhbxarl
```

## Dev accounts

There are no Docker seed users on the hosted database. Create accounts via `/login` (register
Owner/Sale) or Supabase Auth dashboard.

Mock OTP code (when `MOCK_OTP_CODE=000000` in `.env.local`): `000000`

Optional Docker seed users (`supabase/seed.sql`) exist only if you run a **local** Supabase
stack for migration authoring — not used in the default dev flow.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Vitest engine unit tests |
| `npm run db:link` / `db:push` / `db:status` | Hosted Supabase migrations |
| `npm run db:start` / `db:reset` / `db:stop` | Optional local Docker stack (migration authoring only — **never** reset shared DB) |

## Env

See `.env.example`. Put hosted Supabase keys in `.env.local` — the file is **never**
auto-overwritten. Vercel needs the same Supabase vars plus production-only secrets.

- **Vercel KV**: set `KV_REST_API_*` for production rate limits (required in production — missing KV fails closed with 429). Local falls back to in-memory.
- **Cron / webhooks**: `CRON_SECRET` is required (no default). Production also requires `SEPAY_WEBHOOK_SECRET` (HMAC) and `SEPAY_IPN_SECRET`.
- Cron: `GET /api/cron/expire-subscriptions` with `Authorization: Bearer $CRON_SECRET` (also in `vercel.json` daily).
- SePay: `POST /api/webhooks/sepay` (bank) and `POST /api/webhooks/sepay/ipn` (gateway). The `VB********` code is read from `code`, falling back to a scan of the raw transfer content. Deliveries that could not be activated stay unprocessed and are listed at `/admin/payments`.
- Auth: register Owner/Sale at `/login`; roles come from `app_metadata`, not `user_metadata`.

## Key product rules

- Guest marketplace: **zero price**; calendar shows **CONFIRMED only**.
- Inventory lock: **CONFIRMED only** (DB exclusion constraint). PENDING does not block.
- Sale needs ACTIVE subscription to see cost / leads / create bookings.
- Confirm booking: `amountCollected >= effectiveCost`, snapshots + Guest membership in one flow. Sale cost % is snapshotted per asset from that Sale’s CHECKED_OUT count against the Owner’s ladder for that villa (empty ladder = 0%).
- Owner may rate Sale after check-out (optional, 7-day edit).
- Lead: guest creates one row; every ACTIVE sale reads it from `lead_requests`, scoped to their own membership period. `sale_lead_reads` holds one watermark row per sale for the unread badge.

## Load-test notes (no 100k API claim)

Suggested k6 scenarios (run when needed — not a DoD claim):

1. **Public read**: `GET /marketplace` and `GET /a/villa-bien-xanh` (ISR/CDN friendly).
2. **Booking write**: authenticated sale confirm under contention on same dates — expect one CONFIRMED winner.

Do **not** advertise “100k concurrent API/DB” without measured results on a sized Supabase + Vercel plan.

## Deploy

**Production is live** on hosted Supabase + Vercel (project `sangiaodich`). Local dev uses
the **same** hosted database via `.env.local`.

`git push` to `main` triggers a Vercel production build; other branches get preview URLs.
Migrations are **not** part of that build — apply them first:

```bash
npm run db:status   # what production already has
npm run db:push     # apply pending migrations
```

Environment table, the `db:link` first-time step, and the full checklist live in
[AGENTS.md](./AGENTS.md).
