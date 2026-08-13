# VBNB

Sàn giao dịch tài sản lưu trú (Owner → Admin duyệt → Sale bán hộ → Guest xem lịch / copy link).

Stack: **Next.js App Router · Mantine · Supabase · Vercel KV**.

Spec: [VBNB_MASTER_PROMPT.md](./VBNB_MASTER_PROMPT.md) · UI: [VBNB_UI_UX_PROMPT.md](./VBNB_UI_UX_PROMPT.md) · Doc: [MASTER_DOCUMENT.md](./MASTER_DOCUMENT.md).

## Prerequisites

- Node 20+
- Docker Desktop (for Supabase local)
- Ports **58321–58329** free (configured in `supabase/config.toml` to avoid Windows excluded ranges / other Supabase projects)

## Quick start (Windows)

1. Bật **Docker Desktop**
2. Chạy một lệnh:

```powershell
npm run local
```

Script `scripts/run-local.ps1` sẽ: kiểm tra Docker → `supabase start` (nếu chưa) → ghi `.env.local` từ keys local → `next dev`.

```powershell
npm run local:reset   # kèm db reset + seed
.\scripts\run-local.ps1 -Port 3001
.\scripts\run-local.ps1 -SkipSupabase   # chỉ Next (đã có DB)
```

App: http://localhost:3000  
Studio / API: xem output script (ports **58321+** trong `supabase/config.toml`)

Reset DB + seed thủ công:

```bash
npm run db:reset
```

## Seed accounts

Password for all email logins: `password123`  
Mock OTP code: `000000`

| Role | Email | Phone |
|------|-------|-------|
| ADMIN | admin@vbnb.local | +840000000001 |
| OWNER | owner@vbnb.local | +840000000002 |
| SALE (ACTIVE) | sale@vbnb.local | +840000000003 |
| SALE (EXPIRED) | sale-expired@vbnb.local | +840000000013 |
| GUEST | guest@vbnb.local | +840000000004 |

Login: `/login` — tab **Email (seed)** hoặc **Phone OTP**.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Vitest engine unit tests |
| `npm run db:start` / `db:reset` / `db:stop` | Supabase local |

## Env

See `.env.example`. Note that `npm run local` **overwrites** `.env.local` with local Supabase
keys, so it is not a place to keep production values — those belong in the Vercel dashboard.

- **Vercel KV**: set `KV_REST_API_*` for production rate limits (required in production — missing KV fails closed with 429). Local falls back to in-memory.
- **Cron / webhooks**: `CRON_SECRET` is required (no default). Production also requires `SEPAY_WEBHOOK_SECRET` (HMAC) and `SEPAY_IPN_SECRET`.
- Cron: `GET /api/cron/expire-subscriptions` with `Authorization: Bearer $CRON_SECRET` (also in `vercel.json` daily).
- SePay: `POST /api/webhooks/sepay` (bank) and `POST /api/webhooks/sepay/ipn` (gateway). The `VB********` code is read from `code`, falling back to a scan of the raw transfer content. Deliveries that could not be activated stay unprocessed and are listed at `/admin/payments`.
- Auth: public email signup is disabled locally (`enable_signup = false`); users are created via service-role APIs. Roles come from `app_metadata`, not `user_metadata`.

## Key product rules

- Guest marketplace: **zero price**; calendar shows **CONFIRMED only**.
- Inventory lock: **CONFIRMED only** (DB exclusion constraint). PENDING does not block.
- Sale needs ACTIVE subscription to see cost / leads / create bookings.
- Confirm booking: `amountCollected >= effectiveCost`, snapshots + membership in one flow.
- Lead: guest creates one row; every ACTIVE sale reads it from `lead_requests`, scoped to their own membership period. `sale_lead_reads` holds one watermark row per sale for the unread badge.

## Load-test notes (no 100k API claim)

Suggested k6 scenarios (run when needed — not a DoD claim):

1. **Public read**: `GET /marketplace` and `GET /a/villa-bien-xanh` (ISR/CDN friendly).
2. **Booking write**: authenticated sale confirm under contention on same dates — expect one CONFIRMED winner.

Do **not** advertise “100k concurrent API/DB” without measured results on a sized Supabase + Vercel plan.

## Deploy

**Production is live** on hosted Supabase + Vercel (project `sangiaodich`). Everything under
[Quick start](#quick-start-windows) above describes the **local** stack only.

`git push` to `main` triggers a Vercel production build; other branches get preview URLs.
Migrations are **not** part of that build — apply them first:

```bash
npm run db:status   # what production already has
npm run db:push     # apply pending migrations
```

Environment table, the `db:link` first-time step, and the full checklist live in
[AGENTS.md](./AGENTS.md).
