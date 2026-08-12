# VBNB

Sàn giao dịch tài sản lưu trú (Owner → Admin duyệt → Sale bán hộ → Guest xem lịch / copy link).

Stack: **Next.js App Router · Mantine · Supabase · Vercel KV · QStash**.

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

See `.env.example`.

- **Vercel KV**: set `KV_REST_API_*` for production rate limits (required in production — missing KV fails closed with 429). Local falls back to in-memory.
- **QStash**: set `QSTASH_*` for lead fan-out; without token, create-lead uses local signed fetch fallback (`x-local-fanout-secret` = `CRON_SECRET`).
- **Cron / webhooks**: `CRON_SECRET` is required (no default). Production also requires `SEPAY_WEBHOOK_SECRET` (HMAC) and `SEPAY_IPN_SECRET`.
- Cron: `GET /api/cron/expire-subscriptions` with `Authorization: Bearer $CRON_SECRET` (also in `vercel.json` daily).
- Auth: public email signup is disabled locally (`enable_signup = false`); users are created via service-role APIs. Roles come from `app_metadata`, not `user_metadata`.

## Key product rules

- Guest marketplace: **zero price**; calendar shows **CONFIRMED only**.
- Inventory lock: **CONFIRMED only** (DB exclusion constraint). PENDING does not block.
- Sale needs ACTIVE subscription to see cost / leads / create bookings.
- Confirm booking: `amountCollected >= effectiveCost`, snapshots + membership in one flow.
- Lead: guest creates → QStash (or local fallback) fans out to all ACTIVE sales.

## Load-test notes (no 100k API claim)

Suggested k6 scenarios (run when needed — not a DoD claim):

1. **Public read**: `GET /marketplace` and `GET /a/villa-bien-xanh` (ISR/CDN friendly).
2. **Booking write**: authenticated sale confirm under contention on same dates — expect one CONFIRMED winner.

Do **not** advertise “100k concurrent API/DB” without measured results on a sized Supabase + Vercel plan.

## Deploy (later)

1. Create Supabase project + push migrations.
2. Deploy to Vercel; set env (Supabase, KV, QStash, CRON_SECRET).
3. Point `NEXT_PUBLIC_APP_URL` to production for QStash callbacks.
