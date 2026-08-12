# MASTER PROMPT — Build VBNB (greenfield)

> Prompt dùng để clone / build sản phẩm **VBNB** từ đầu.  
> Spec đã chốt qua thảo luận (2026-08, cập nhật mô hình **sàn giao dịch**). Không sửa money split / ẩn giá guest / floor cost trừ khi product owner đổi.

Bạn là senior full-stack engineer. Hãy **xây dựng từ đầu** sản phẩm **VBNB** — **sàn giao dịch** tài sản lưu trú cho mạng lưới sale tự do (không phải clone nguyên VillaOS, không phải OS vận hành villa đa portal).

VillaOS (repo tham chiếu, nếu có) chỉ dùng để **học ý tưởng** về calendar/availability/booking conflict. **Không** copy Express multi-portal, Prisma schema, Redis worker, hay Tailwind/`@villaos/ui`. Implement đúng stack và business model dưới đây.

---

## 0. Product one-liner

**VBNB** = sàn trung tâm nơi:

1. **Owner** đăng tài sản + set **cost** (giá vốn)
2. **Admin** duyệt → tài sản **xuất hiện trên sàn** (mở 100%)
3. **Sale** (đã trả phí tháng) thấy **mọi** tài sản ACTIVE kèm **cost**, tự tìm khách, bán theo giá mình muốn
4. **Guest** duyệt sàn: xem ảnh/mô tả + **lịch trống/đã book** (không thấy giá) → **copy link asset** gửi sale hỏi giá; hoặc bấm **“Cần liên lạc sale”**
5. **Sale tạo booking hộ** khách → thu tiền **offline** → ghi nhận trên hệ thống
6. **Subscription** tháng cho Owner & Sale (Admin chỉnh mức phí)
7. **Membership** (sale + khách) do **Admin** cấu hình toàn platform, có UI

Tên sản phẩm: **VBNB**. Single platform, một DB, admin trung tâm (không multi-tenant SaaS multi-org).

---

## 1. Canonical tech stack (bắt buộc)

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict) |
| App | **Next.js App Router** (UI + Route Handlers / Server Actions) |
| UI | **Mantine UI** only (không thêm UI kit “cho đẹp”) |
| DB / Auth / Storage | **Supabase** (Postgres + Auth + Storage) |
| Deploy | **Vercel** |
| Background jobs | **QStash** (lead fan-out) + **Vercel Cron**; **không** Redis/BullMQ self-host |
| Rate limit | **Vercel KV** (in-memory fallback khi thiếu env local) |

Quy tắc:

- Không Express + Vite multi-app
- Không Prisma nếu dùng Supabase client/SQL migrations trực tiếp (ưu tiên Supabase migrations + typed client)
- Service-role key chỉ server-side
- Mọi query scoped theo permission/role; không tin client

---

## 1b. Security, integrity & capacity (bắt buộc khi implement)

> Stack Next.js + Supabase + Vercel là **MVP đúng hướng**, **không** mặc định chịu 100k concurrent API/DB.
> Không tự ý thêm Redis/BullMQ trừ khi PO approve; được phép dùng **managed thay thế** (Vercel KV / Upstash / Inngest / QStash / Supabase Queues) khi cần rate-limit, cache, hoặc fan-out.

### Security baseline

1. **Deny by default:** mọi table RLS ON; policy theo `profiles.role`. Service-role **chỉ** trong Route Handler / Server Action đã authz; không expose ra client.
2. **Role immutability:** `profiles.role` không cho user tự UPDATE (RLS deny + không API đổi role). Admin đổi role (nếu có) phải audit.
3. **Data classification:**
   - PUBLIC (guest): asset ACTIVE metadata + free/busy — **strip mọi price/cost/margin**.
   - SALE_ACTIVE: cost, effectiveCost, lead guest name+phone, own bookings.
   - OWNER: own assets/costs/P&L — **không** lead inbox.
   - ADMIN: fees, mark paid, tiers, users.
4. **PII / lead:** phone guest chỉ trả cho SALE + subscription ACTIVE. Log access tối thiểu; không đưa phone vào URL/analytics. Rate-limit tạo lead (per guest + per asset).
5. **Auth:** rate-limit OTP / login / lead / booking confirm (edge middleware hoặc KV). Lockout sau N lần OTP sai.
6. **Admin sensitive actions** (mark paid, đổi fee, đổi membership tiers): require authenticated ADMIN + audit row (`actor_id`, `action`, `payload`, `created_at`).
7. **Storage:** bucket ảnh asset public read chỉ object đã duyệt; upload path scoped owner; không list bucket rộng.
8. **Headers / cookies:** Secure session cookies; không nhúng secret trong RSC payload client.

### Money & inventory integrity (không chỉ “check app”)

1. Booking overlap: **DB-level** chống race (exclusion constraint / GiST trên range ngày + status chiếm chỗ, hoặc lock asset trong transaction). App check là thêm, không thay DB.
2. Confirm booking: **một transaction** — validate overlap + `amountCollected ≥ effectiveCost` + write snapshots + cập nhật sale/guest membership counters. Idempotent confirm (idempotency key hoặc status guard).
3. Subscription gate: check `status=ACTIVE` và `period_end > now()` **server-side** mỗi request nhạy (cost, lead list, create booking) — không tin cache client.

### Capacity model (SLO — không claim 100k concurrent API)

| Tier | Mục tiêu | Cách đạt |
|------|----------|----------|
| **MVP** | Vài trăm–vài nghìn user; catalog/calendar ổn định | Index đúng; connection pooler; ISR/CDN cho catalog + asset public; không SSR nặng mỗi hit |
| **Growth** | Spike đọc public (marketing / share link) | Edge cache / `revalidate`; calendar free/busy cache ngắn TTL hoặc materialize; rate-limit OTP & lead |
| **Scale** | Nhiều sale ACTIVE + lead burst | **Async fan-out** lead notify (queue); không sync loop N sales trong request; cân nhắc read replica / nâng compute Supabase khi load test chứng minh cần |
| **Out of scope claim** | “100k request đồng loạt vào API động + Postgres” | **Không** là DoD MVP. Chỉ chấp nhận 100k-class nếu là hit CDN/static. Load test (k6) trước khi tuyên bố RPS |

### Background / realtime policy

- Lead create: request chỉ INSERT `lead_requests` (+ optional “notify job”); **không** block chờ gửi hết N sale.
- Cron: hết hạn subscription → SUSPEND asset / revoke sale gates (nếu chưa có job realtime).
- Không Redis/BullMQ trừ approve; thay bằng managed queue/KV khi fan-out hoặc rate-limit cần state.

### Definition of done — bổ sung (security / capacity)

- [ ] RLS policies có migration + test matrix theo role (guest không đọc cost; sale inactive không đọc cost/lead phone)
- [ ] Booking overlap an toàn dưới concurrent (test 2 confirm cùng đêm → đúng 1 thắng)
- [ ] Rate limit OTP + create lead
- [ ] Audit log cho admin mark-paid / đổi fee / đổi tier
- [ ] Catalog/asset public cacheable (ISR hoặc equivalent)
- [ ] Lead notify không sync fan-out trong HTTP request khi N sale lớn (queue hoặc batch job)
- [ ] Có kịch bản load test ghi trong README (đọc public vs tạo booking) — **không** ghi DoD “100k concurrent” trừ khi đo được

---

## 2. Roles & auth

### Roles (1 account = đúng 1 role, không đổi, không dual-role)

| Role | Mô tả |
|------|--------|
| `ADMIN` | Duyệt asset lên sàn; cấu hình phí subscription; cấu hình membership sale + guest (UI); mark đã thu phí; quản trị user |
| `OWNER` | Tạo/sửa asset + cost; nộp duyệt; trả phí tháng để giữ listing; xem P&L (= effectiveCost thu được). **Không** gắn/chặn sale; **không** set selling price; **không** set membership tiers |
| `SALE` | Trả phí tháng → xem toàn bộ sàn + cost; set giá bán của mình; nhận lead; tạo booking hộ guest; confirm/cancel + `amountCollected` |
| `GUEST` | Duyệt sàn (lịch free/busy, ẩn giá); copy link; “Cần liên lạc sale”; xem booking của mình + hạng membership |

- **Không** portal tách app. **Một** Next.js app; menu/nav theo permission của role.
- Admin nằm **cùng app** (route `/admin/...` + guard).
- Auth: Supabase Auth — guest **đăng ký/đăng nhập bằng số điện thoại** (OTP). Owner/Sale/Admin: phone hoặc email+phone; identity chính guest là phone.
- Không “switch role”. UI chỉ hiện module đúng role.

---

## 3. Marketplace domain model

### 3.1 Asset (lên sàn)

- **Owner** tạo asset (ảnh, mô tả, amenities, …) + **cost**:
  - `costWeekday` / `costWeekend` (theo đêm)
- Status: `PENDING_REVIEW` → Admin duyệt → `ACTIVE` (có thể `REJECTED` / `INACTIVE` / `SUSPENDED` khi nợ phí)
- **1 asset = đúng 1 owner**
- Lên sàn = **mở 100%**: mọi Sale có subscription ACTIVE đều thấy asset + **cost**. Owner **không** gắn/chặn từng sale.

### 3.2 Sale access (không còn gắn tay)

- Không bảng “owner mời sale vào asset”.
- Điều kiện xem cost + thao tác bán: `role === SALE` **và** subscription tháng **ACTIVE**.
- Sale có thể lưu **selling price mặc định** theo asset (`SalePriceTemplate` weekday/weekend) — tùy chọn để tính nhanh khi tạo booking; giá cuối cùng sale quyết định lúc tạo/confirm booking.

### 3.3 Inventory — lịch chung theo asset

- **Một nguồn sự thật theo asset**: cùng một đêm chỉ có **tối đa một** booking **CONFIRMED** chiếm chỗ.
- **Policy đã chốt:** chỉ `CONFIRMED` khóa lịch (DB exclusion constraint). `PENDING` **không** block — nhiều PENDING có thể chồng ngày; confirm sau sẽ fail nếu trùng CONFIRMED.
- Guest calendar: **chỉ hiện CONFIRMED** là đã book (PENDING không tô trên UI guest).
- Server reject confirm trùng overlap CONFIRMED (DB-level + app check).

### 3.4 Money split (cốt lõi — giữ nguyên)

```
effectiveCost = baseCost × (1 − saleCostDiscountPercent)   // sale membership PLATFORM (Admin)
listSelling   = giá sale đặt (template hoặc nhập khi tạo booking)
guestPay      = max( listSelling × (1 − guestDiscountPercent), effectiveCost )  // FLOOR = effectiveCost
ownerEarns    = effectiveCost   // snapshot lúc confirm
saleMargin    = guestPay − effectiveCost
```

- Guest **không bao giờ** thấy số tiền trên UI sàn / trang asset.
- Sale thấy cost, effectiveCost, guest discount, suggested guestPay, margin.
- Payment **offline**; sale ghi `amountCollected` khi confirm.

### 3.5 Booking flow (Sale tạo hộ)

Guest **không** self-serve tạo booking trên sàn.

1. Guest duyệt `/a/:assetSlug` (hoặc catalog) → copy link gửi sale **hoặc** bấm “Cần liên lạc sale”.
2. Sale thỏa thuận giá ngoài app (Zalo/điện thoại).
3. **Sale tạo booking hộ**: chọn asset + guest (theo phone/profile) + CI/CO + list price → status `PENDING`.
4. Chỉ **sale tạo booking đó** được `CONFIRM` / `CANCEL`.
5. Confirm: bắt buộc `amountCollected`; validate `amountCollected ≥ effectiveCost`.
6. Snapshot lúc confirm (bắt buộc):
   - `baseCostSnapshot`, `effectiveCostSnapshot`, `listPriceSnapshot`
   - `saleDiscountPercentSnapshot`, `guestDiscountPercentSnapshot`
   - `amountCollected`, `ownerEarnSnapshot`, `saleMarginSnapshot`

### 3.6 Lead: “Cần liên lạc sale”

Dành cho khách chưa biết liên hệ sale nào.

| Rule | Quyết định |
|------|------------|
| Ai bấm được | Guest **đã login** (bắt buộc) |
| Khi bấm | Tạo `LeadRequest` (assetId, guestId, createdAt, status OPEN…) |
| Ai nhận notice | **Mọi Sale** đang có subscription **ACTIVE** |
| Sale thấy | **Tên + SĐT** guest + asset liên quan |
| Claim | **Không** — mọi sale đều thấy; tự chủ động liên hệ (có thể nhiều sale cùng liên hệ) |
| Hết hạn | **Không** TTL |
| Owner thấy lead | **Không** |

Inbox/notification cho sale; UI rõ ràng, tránh spam UI (có thể group/filter theo asset).

### 3.7 Guest marketplace UX (bắt buộc làm tốt)

Trang sàn / asset phải **rõ ràng, chuyên nghiệp**:

- Catalog asset ACTIVE (ảnh, mô tả ngắn; **zero price**)
- Trang asset `/a/:assetSlug`: gallery, mô tả, **calendar free/busy** dễ đọc
- CTA chính:
  - **Copy link** (toast “Đã copy”) — link ngắn, dễ paste Zalo
  - **Share** (Web Share API khi có) 
  - **Cần liên lạc sale** (sau login)
- Không form “Book now” tự phục vụ cho guest
- Guest có trang “Booking của tôi” (do sale tạo) + membership progress

---

## 4. Platform subscription (phí tháng)

Đây là **subscription nền tảng**, tách biệt cost/selling.

| Role | Mặc định | Mục đích |
|------|----------|----------|
| Owner | **200_000 VND / tháng** | Giữ asset được **list trên sàn** |
| Sale | **200_000 VND / tháng** | Tham gia mạng lưới: xem toàn bộ asset + cost, nhận lead, tạo booking |

- **Admin có UI** chỉnh mức phí (và có thể chỉnh riêng owner vs sale).
- Thu tiền **offline**; Admin (hoặc flow nội bộ) **đánh dấu đã thanh toán** kỳ hiện tại (`PAID` / `ACTIVE` đến `periodEnd`).
- Quá hạn / chưa trả:
  - Owner → asset bị **SUSPENDED** / ẩn khỏi sàn (không xóa dữ liệu)
  - Sale → mất quyền xem cost, nhận lead mới, tạo booking mới (giữ lịch sử cũ read-only tùy policy)
- Không Stripe/checkout online trong MVP.

---

## 5. Membership (Admin — toàn platform + UI chỉnh số)

**Owner không cấu hình membership.** Mọi tier do **Admin** set, có màn hình admin rõ ràng.

### 5.1 Sale membership (platform-wide)

**Metric:** Σ **`baseCost` gốc** của booking **CONFIRMED** mà sale mang về (**mọi asset**), **lifetime**.

**Ưu đãi:** % giảm trên base cost → `effectiveCost` (áp dụng mọi asset).

**Không rớt hạng.**

Admin UI ví dụ:

```
Tier 0: 0+ → 0% off cost
Tier 1: ≥ X → 5% off cost
Tier 2: ≥ Y → 10% off cost
```

State: `(saleId) → currentTier, lifetimeCostVolume`.

Owner vẫn có thể xem P&L và (optional) thống kê sale trên asset mình, nhưng **không** edit tier.

### 5.2 Guest membership (platform-wide)

**Chỉ CONFIRMED.**

**GMV:** Σ **`amountCollected`**, lifetime.

**Book count:** số booking CONFIRMED, lifetime.

**Cửa sổ:** lifetime.

**Rank chỉ lên.** Sau khi lên rank → **reset progress** (progress_books / progress_gmv = 0) cho mốc sau; giữ `currentTier` + `discountPercent`.

Admin UI chỉnh `min_books`, `min_gmv`, `discount_percent` từng tier (ví dụ 3 book + 50tr → 3%; rồi 7 book + 150tr → 5%).

**Floor = effectiveCost:** không cho guestPay / amountCollected < effectiveCost.

---

## 6. UX surfaces (1 app) — tóm tắt theo role

### Guest

- Login OTP phone
- Sàn + `/a/:assetSlug`: calendar free/busy, copy/share link, “Cần liên lạc sale”
- Zero price toàn bộ UI public
- My bookings + membership

### Sale

- Thanh toán / trạng thái subscription
- Catalog sàn đầy đủ + **cost / effectiveCost**
- SalePriceTemplate (optional)
- Inbox lead (tên + SĐT + asset) — không claim
- Tạo booking hộ → confirm (`amountCollected`) / cancel
- Thống kê margin / volume (MVP+)

### Owner

- CRUD asset + cost WD/WE → submit duyệt
- Trạng thái subscription; biết asset bị ẩn nếu nợ phí
- Dashboard P&L (= Σ ownerEarn / effectiveCost snapshot)
- **Không:** gắn sale, set giá bán, membership tiers, ops/HR/OTA

### Admin

- Duyệt/từ chối/suspend asset
- UI **subscription fees** (mức phí owner/sale) + đánh dấu đã thu / kỳ hạn
- UI **sale membership tiers** + **guest membership tiers**
- Quản lý users
- Monitoring nhẹ

---

## 7. Data model (Supabase Postgres — phác thảo)

RLS theo role. Bảng tối thiểu:

- `profiles` (id, role, phone, name, …)
- `subscriptions` (profile_id, period_start, period_end, amount, status, marked_paid_by, …)
- `platform_fee_settings` (owner_monthly_fee, sale_monthly_fee) — Admin edit
- `assets` (owner_id, slug, status, description, …)
- `asset_images`
- `asset_costs` (weekday, weekend)
- `sale_price_templates` (sale_id, asset_id, weekday, weekend) — optional
- `bookings` (asset_id, sale_id, guest_id, status, dates, snapshots, amount_collected, …)
- `lead_requests` (asset_id, guest_id, status, created_at, …) — no expiry, no claim
- `sale_membership_tiers` (min_lifetime_cost_volume, cost_discount_percent, sort) — **platform**, Admin
- `sale_membership_states` (sale_id, current_tier, lifetime_cost_volume)
- `guest_membership_tiers` (min_books, min_gmv, discount_percent, sort) — Admin
- `guest_membership_states` (guest_id, current_tier, progress_books, progress_gmv, lifetime_books, lifetime_gmv)

Khi booking → CONFIRMED:

1. Validate amountCollected ≥ effectiveCost + overlap inventory
2. Write snapshots
3. Cộng sale `lifetime_cost_volume` += baseCostSnapshot; upgrade tier nếu đủ
4. Cộng guest progress; nếu đạt tier kế → upgrade + **reset progress**

**Không** cần `asset_sales` gắn tay / quota per sale.

---

## 8. API / server rules

- Response: `{ success, data }` / `{ success:false, error:{ code, message } }`
- Guest/public asset payload: **strip all price/cost fields**; chỉ free/busy (+ metadata an toàn)
- Sale endpoints: trả cost chỉ khi subscription ACTIVE
- Tạo/confirm/cancel booking: chỉ sale sở hữu record; inventory overlap check server-side
- Lead create: chỉ GUEST login; notify all ACTIVE-subscription sales
- Lead list: sale không claim; đọc tên + phone guest
- Unit tests: weekend, stay totals, guestPay+floor, membership upgrade+reset, subscription gate, overlap

---

## 9. Explicitly OUT of MVP

- Thanh toán online (Stripe, etc.) — kể cả phí tháng (chỉ mark paid offline)
- Guest self-serve tạo booking
- Owner gắn/chặn sale; quota per sale
- Sale membership per-asset do owner
- Claim lead / TTL lead
- Ops/cleaning/staff, OTA/iCal
- Multi-org SaaS, multi-portal Vite
- Role switching / multi-role
- Guest thấy giá trên sàn
- Demotion membership
- Claim chịu **100k concurrent API/DB** mà không load test / cache / queue (xem §1b)

---

## 10. Deliverables (thứ tự build)

1. Next.js + Mantine + Supabase scaffold, auth phone, role on profile
2. Migrations + RLS (+ role immutability, audit log table); `platform_fee_settings` + subscriptions
3. Admin: duyệt asset, fee settings, mark paid, membership tiers (sale + guest) UI — kèm audit
4. Owner: asset + cost + P&L + subscription status
5. Sale: sàn + cost (gated), templates, tạo booking hộ, confirm/cancel, lead inbox
6. Guest: catalog + `/a/:assetSlug` calendar + copy/share + “Cần liên lạc sale” + my bookings + membership (ISR/CDN public)
7. Engines: inventory overlap **DB-level**, pricing+floor, membership lifetime (cùng txn confirm), subscription gates
8. Rate limit OTP/lead; lead notify async (queue/KV nếu cần); seed + README (local + Vercel env + load-test notes)
9. MASTER_DOCUMENT.md cho VBNB

---

## 11. Definition of done (acceptance)

- [ ] Owner tạo asset → Admin duyệt → hiện trên sàn
- [ ] Sale chưa trả phí: không xem cost / không nhận lead / không tạo booking
- [ ] Sale đã trả phí: thấy mọi asset ACTIVE + cost
- [ ] Guest xem calendar free/busy, không thấy giá; Copy link hoạt động tốt
- [ ] Guest login → “Cần liên lạc sale” → mọi sale đang trả phí thấy tên + SĐT (không claim, không hết hạn); owner không thấy
- [ ] Sale tạo booking hộ; overlap CONFIRMED bị reject **kể cả concurrent** (PENDING không khóa); guest calendar chỉ hiện CONFIRMED
- [ ] Confirm + amountCollected; < effectiveCost → reject; snapshots đúng; membership update cùng transaction
- [ ] Admin sửa được phí tháng 200k mặc định và membership tiers (sale + guest); hành động nhạy có audit
- [ ] Sale membership platform theo Σ base cost lifetime; guest rank + reset progress
- [ ] RLS + rate limit OTP/lead; catalog/asset public cacheable; lead notify không sync fan-out khi N sale lớn
- [ ] README có kịch bản load test (đọc public vs booking) — **không** claim 100k concurrent API trừ khi đo được
- [ ] Deploy Vercel + Supabase

Bắt đầu bằng scaffold + schema migrations; hỏi lại chỉ khi spec mâu thuẫn — không tự ý đổi money split, cho guest thấy giá, hoặc cho guest self-book. Tuân thủ §1b (security / integrity / capacity).

---

## 12. Spec lock summary (quick reference)

| Mục | Quyết định |
|-----|------------|
| Mô hình | **Sàn giao dịch**; lên sàn = mở 100% |
| Asset | Owner tạo + cost; Admin duyệt; 1 owner / asset |
| Sale access | Subscription ACTIVE → mọi asset + cost; không gắn tay |
| Inventory | **Chỉ CONFIRMED khóa** (PENDING không block); guest calendar chỉ CONFIRMED |
| Rate limit / queue | **Vercel KV** + **QStash** lead fan-out |
| Cost | WD/WE do owner |
| Selling | Sale tự quyết (template optional) |
| P&L | Owner = effectiveCost; margin = sale |
| Guest UI | Lịch free/busy + copy/share link; **ẩn giá**; không self-book |
| Lead | “Cần liên lạc sale”: login; broadcast mọi sale đã trả phí; tên+SĐT; không claim; không TTL; owner không thấy |
| Booking | **Sale tạo hộ** → confirm + `amountCollected` |
| Link chính | `/a/:assetSlug` (sàn) |
| Subscription | Owner 200k/tháng + Sale 200k/tháng; Admin UI sửa; mark paid offline |
| Membership | **Admin**, platform-wide, có UI (sale + guest) |
| Sale membership | Σ base cost, lifetime, % off cost, không rớt hạng |
| Guest membership | CONFIRMED + amountCollected, lifetime, chỉ lên, reset progress sau rank-up |
| Floor | amountCollected / guestPay ≥ effectiveCost |
| Auth | 1 account = 1 role; 1 app; admin cùng app; guest phone OTP |
| Tenant | Single platform VBNB |
| Stack | TypeScript · Next.js · Mantine · Supabase · Vercel |
| Security / capacity | RLS deny-by-default; DB overlap; rate limit; audit admin; ISR public; async lead fan-out; **không** claim 100k concurrent API (xem §1b) |
