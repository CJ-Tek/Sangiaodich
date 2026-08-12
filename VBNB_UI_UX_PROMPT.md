# VBNB — UI/UX Design System Prompt

Bạn đang build frontend **VBNB** (Next.js App Router + **Mantine UI** + TypeScript).

Nguồn sự thật visual của sản phẩm gốc:

- `villa_booking_ui_ux_system.md` (Villa Booking — Warm Premium Operations)
- Token calendar status: `packages/ui/src/design-tokens.ts` (nếu repo tham chiếu có)

**Bắt buộc:** giữ nguyên hướng cảm quan, color/radius/shadow/spacing/motion tokens và interaction rules từ design system đó.  
**Không** copy cứng Tailwind/shadcn API hay cấu trúc portal VillaOS. Map tokens sang **Mantine theme**.  
**Không** phá business UX đã khóa trong `VBNB_MASTER_PROMPT.md` (ẩn giá guest, sàn, copy link, sale tạo booking hộ, v.v.).

---

## 1. Design direction (giữ nguyên)

**Warm Premium Operations** → với VBNB diễn giải thành:

**Warm Premium Marketplace** — vẫn premium hospitality, calm, trustworthy; thiên sàn giao dịch hơn “ops command center”.

Keywords bắt buộc:

- Warm · Clean · Spacious · Premium · Soft · Calm · Minimal · Operational · Visual-first · Trustworthy

Tránh:

- Dense ERP tables mặc định
- Dark mode làm theme chính
- Neon, heavy gradient, animation thừa
- Sharp corners, hard shadows
- Màu ngoài token
- Overly corporate SaaS chrome
- Purple-on-white / cream+terracotta “AI default” lệch token (dùng đúng palette bên dưới)

Cảm giác: villa/travel/hospitality/trust — soft surfaces, warm background, ảnh chất lượng, spacing rộng.

---

## 2. Product UI principles (adapt cho VBNB)

1. **Calendar-visible marketplace** — lịch trống/đã book là bề mặt tin cậy chính cho guest & sale (không phải dashboard chart).
2. **Reduce cognitive load** — ưu tiên thông tin vận hành/sàn cốt lõi; tránh dashboard nhồi chart.
3. **Booking state instantly visible** — status nhận ra trong ~3 giây qua badge/màu/label thống nhất.
4. **Mobile-first for Sale** (tương đương Agent trong DS gốc) — ít gõ, search nhanh, CTA sticky, bottom nav.
5. **Desktop-first for Owner & Admin**.
6. **Guest trust UI** — rõ ràng, chuyên nghiệp; **zero price** trên mọi surface guest; CTA copy/share rõ.
7. **Role-appropriate density** — Guest tối giản visual; Sale nhanh; Owner/Admin đủ kiểm soát, không ERP.

---

## 3. Design tokens (copy đúng — không invent)

### 3.1 Colors

```ts
export const colors = {
  background: '#FAF8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F6F3EE',
  border: '#ECECEC',

  textPrimary: '#1F2933',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  primary: '#14532D',
  primaryHover: '#0F3F23',
  primarySoft: '#E8F3EC',

  secondary: '#E7D8C9',
  secondarySoft: '#F4ECE3',

  accent: '#E76F51',
  accentHover: '#D85F43',
  accentSoft: '#FDEDE8',

  success: '#15803D',
  successSoft: '#DCFCE7',

  warning: '#D97706',
  warningSoft: '#FEF3C7',

  danger: '#DC2626',
  dangerSoft: '#FEE2E2',

  info: '#2563EB',
  infoSoft: '#DBEAFE',
};
```

### 3.2 Status colors (VBNB mapping)

Giữ token gốc; map sang status VBNB:

| VBNB / calendar | Dùng token |
|-----------------|------------|
| Available / trống | `available` |
| Pending (hold lịch) | `hold` hoặc `depositPending` — chọn 1, dùng nhất quán |
| Confirmed | `confirmed` |
| Blocked / suspended listing | `blocked` |
| Cancelled | `cancelled` |

```ts
export const bookingStatusColors = {
  available: { bg: '#ECFDF3', text: '#166534', border: '#BBF7D0' },
  hold: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  depositPending: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
  blocked: { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' },
  maintenance: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
};
```

Không hardcode màu status ngoài object này. Không dùng `ota` / `ownerStay` trừ khi sau này có feature tương đương.

### 3.3 Typography

- Primary: **Inter** (hoặc Geist) + system sans fallback — đúng DS gốc.
- Hierarchy: pageTitle 32/40 bold −0.02em · sectionTitle xl/7 semibold · cardTitle base semibold · metric 28/36 bold · body sm/6 · label/caption xs.
- Không text quan trọng < 12px. Tránh ALL CAPS dài.

### 3.4 Radius / spacing / shadow / motion

```ts
radius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 }
// Cards 20 · Buttons/Inputs 14 · Modals 24 · Calendar cells 10–12 · Badges pill

spacing: 4, 8, 12, 16, 24, 32, 48
// Page pad desktop 24–32 · mobile 16
// Card pad 16 / 24 / 32

shadows: {
  card: '0 8px 24px rgba(15, 23, 42, 0.04)',
  cardHover: '0 12px 32px rgba(15, 23, 42, 0.08)',
  dropdown: '0 16px 40px rgba(15, 23, 42, 0.12)',
  modal: '0 24px 64px rgba(15, 23, 42, 0.18)',
}

motion: { fast: 150, normal: 200, slow: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
```

Chỉ motion: hover, dropdown, modal fade/scale, calendar hover, skeleton shimmer. Không bounce / parallax / animated background.

---

## 4. Mantine mapping (bắt buộc)

VBNB dùng **Mantine** làm backbone — **không** thêm shadcn/Tailwind như hệ UI thứ hai.

1. Tạo `theme` Mantine (`createTheme`) map:
   - `colors` custom (primary green scale từ `#14532D`, accent coral từ `#E76F51`)
   - `primaryColor` trỏ scale primary VBNB
   - `defaultRadius` ~ `md` nhưng card dùng ~20px (`xl`)
   - `fontFamily: Inter, …`
   - `shadows` custom khớp token
   - `other` hoặc CSS variables cho `background`, `surfaceMuted`, status colors
2. `MantineProvider` bọc app; color scheme mặc định **light** (warm `#FAF8F4` app shell bg).
3. Primitives: dùng Mantine `Button`, `Card`, `TextInput`, `Badge`, `Modal`, `AppShell`, `Drawer`, `Notification` — **skin** đúng radius/shadow/color token (theme overrides / `classNames` / CSS modules), không để default Mantine “blue SaaS”.
4. Không import `@villaos/ui` / shadcn vào VBNB. Có thể **port ý tưởng** component (`PageHeader`, `EmptyState`, `StatusBadge`) viết lại bằng Mantine.
5. Một file `config/design-tokens.ts` + `config/booking-status.ts` — single source; không lặp hex trong JSX.

---

## 5. Layout system (adapt role)

### Guest (marketplace) — public + logged-in

- Không sidebar ops.
- Top bar tối giản: logo VBNB, tìm kiếm (optional), membership/account.
- Content max-width thoải mái cho catalog (ví dụ ~1200–1440).
- Asset detail: gallery lớn, mô tả, **calendar legend + grid**, cụm CTA sticky trên mobile:
  - Primary: **Copy link**
  - Secondary: Share
  - Tertiary: **Cần liên lạc sale** (sau login)
- Visual-first: ảnh villa chất lượng; spacing rộng; không nhồi metric.

### Sale — mobile-first (như Agent DS)

- Mobile: top compact header + **bottom nav** + sticky CTA khi cần.
- Bottom nav gợi ý: Home · Sàn · Leads · Bookings · Profile
- Desktop: sidebar hoặc rail hẹp OK.
- Card list ưu tiên hơn table.
- Cost / margin chỉ hiện trong sale shell (không lộ sang guest).

### Owner — desktop-first

- Fixed left sidebar ~240px + top bar + main padding `24–32px`, max ~1440.
- Dashboard tối giản: P&L tháng, số booking, trạng thái subscription, asset list — **không** chart quá tải.
- Primary CTA: New asset / Submit for review.

### Admin — desktop-efficient

- Cùng AppShell pattern owner nhưng nav: Duyệt asset · Users · Subscription fees · Membership tiers · Monitoring.
- Form chỉnh số (fees, tiers) dùng card + input rõ label; không dense settings dump.

Responsive chung (giữ DS):

- Desktop: sidebar + multi-column
- Tablet: sidebar collapse
- Mobile: bottom nav (sale/guest), cards stack, tables → cards

---

## 6. Core components cần build (VBNB)

Port tinh thần DS; đổi tên domain:

**Layout:** `AppShell`, `RoleSidebar`, `SaleMobileShell`, `TopBar`, `PageHeader`, `SectionHeader`, `ContentGrid`

**Marketplace / Guest:** `AssetCard`, `AssetGallery`, `AmenityList`, `MarketplaceCalendar`, `CalendarLegend`, `AvailabilityCell`, `CopyAssetLinkButton`, `ShareAssetButton`, `ContactSaleButton`, `LeadNoticeBanner` (sale)

**Bookings:** `BookingCard`, `BookingStatusBadge`, `BookingTimeline`, `GuestProfileCard`, `BookingDetailPanel`, `AmountCollectedField` (sale only)

**Money (sale/owner/admin only):** `CostSummary`, `MarginSummary`, `MembershipTierBadge` — **never** trên guest routes

**Subscription:** `SubscriptionStatusCard`, `FeeSettingsForm` (admin)

**Membership admin:** `TierEditor` (sale tiers + guest tiers)

**States:** `EmptyState`, `ErrorState`, `PageSkeleton`, `CardSkeleton`, `CalendarSkeleton`

Không bắt buộc build (OUT — không thuộc VBNB MVP): Operations/Cleaning, Quote/Hold countdown, OTA badges, Agent commission payout UI kiểu VillaOS, Owner pricing seasonal page.

---

## 7. Page UX specs (VBNB)

### 7.1 Guest — Catalog

- Grid `AssetCard`: ảnh, tên, location, capacity, **availability indicator** (không giá).
- Search / location filter.
- Empty/loading/error đầy đủ.

### 7.2 Guest — Asset detail `/a/:assetSlug`

- Gallery + mô tả
- Calendar free/busy + legend (available / pending / confirmed)
- CTA copy/share/contact sale — dễ thao tác một tay trên mobile (nút lớn, toast “Đã copy”)
- **Cấm** hiển thị cost, selling, discount %, margin

### 7.3 Sale — Marketplace

- Cùng catalog nhưng hiện **cost / effectiveCost**, filter nhanh, CTA “Tạo booking”
- Lead inbox: card guest **tên + SĐT** + asset; không claim UI

### 7.4 Sale — Create / Confirm booking

- Form rõ: guest, dates, list price, preview guestPay (sau discount + floor)
- Confirm dialog + `amountCollected`
- Status badge tokenized

### 7.5 Owner — Assets & P&L

- Asset cards (status PENDING_REVIEW / ACTIVE / SUSPENDED)
- Cost WD/WE dạng **cards**, không bảng dày
- Metric cards: revenue (= Σ effectiveCost), bookings count

### 7.6 Admin

- Review queue cards
- Fee settings cards (default 200k)
- Membership tier editors (sale + guest)

---

## 8. Interaction rules (giữ nguyên DS)

1. Mọi trang lớn: **empty + loading (skeleton) + error** action-oriented.
2. Tránh full-screen spinner trừ initial load.
3. Confirm dialog cho: cancel booking, suspend asset, destructive admin actions, xóa dữ liệu.
4. Toast nhẹ cho copy link / mark paid / saved.
5. Calendar ưu tiên **clarity** hơn decoration.

---

## 9. Cursor / agent implementation rules

1. Mantine only — không song song Tailwind+shadcn trừ CSS variables hỗ trợ theme.
2. Không hardcode màu ngoài tokens.
3. Button/Card/Input/Badge style thống nhất qua theme.
4. Status màu chỉ từ `bookingStatusColors` (+ membership badge dùng primary/accent soft).
5. Dashboard tối giản.
6. Calendar rõ ràng hơn trang trí.
7. Sale = mobile-first; Owner/Admin = desktop-efficient; Guest = visual trust + easy copy.
8. Table chỉ khi hơn card; mặc định cards cho workflow.
9. Radius/shadow/spacing nhất quán.
10. Không gradient/animation thừa.
11. Reusable components trước page-specific.
12. Semantic names; centralize status labels.
13. Mọi destructive action có confirm.
14. Không trang nào lệch **Warm Premium** palette/feel.
15. Tuân `VBNB_MASTER_PROMPT.md` cho business; document này chỉ UI/UX.
16. Guest routes: strip price ở **UI và copy** (kể cả empty state text).

---

## 10. UI build order

1. Mantine theme + design-tokens + CSS variables (bg `#FAF8F4`)
2. AppShell theo role
3. PageHeader / SectionHeader / MetricCard
4. Status badges
5. AssetCard + Gallery
6. MarketplaceCalendar + Legend
7. Copy/Share/ContactSale CTAs
8. Guest catalog + asset detail
9. Sale shell + leads + booking forms
10. Owner dashboard + assets
11. Admin review + fees + membership editors
12. Empty/loading/error pass trên mọi route chính

---

## 11. Definition of done (UI)

- [ ] Một glance: nền ấm `#FAF8F4`, primary xanh `#14532D`, accent coral `#E76F51`, card radius 20, shadow mềm
- [ ] Guest không thấy giá; copy link có feedback rõ
- [ ] Calendar free/busy dùng đúng status tokens
- [ ] Sale mobile có bottom nav / sticky CTA hợp lý
- [ ] Owner/Admin sidebar 240px, desktop padding đúng
- [ ] Không drift sang dark/neon/ERP; không mixed UI kit
- [ ] Empty/loading/error trên các page chính

**Chuẩn cuối:** mọi màn hình thuộc một product thống nhất — *premium, calm marketplace for villa stays* — owner kiểm soát listing/P&L, sale bán nhanh trên mobile, guest tin tưởng và dễ gửi link cho sale.

---

## 12. Cross-links

| File | Vai trò |
|------|---------|
| `VBNB_MASTER_PROMPT.md` | Product / domain / stack / acceptance business |
| `VBNB_UI_UX_PROMPT.md` (file này) | Visual system + Mantine mapping + page UX |
| `villa_booking_ui_ux_system.md` | DS gốc VillaOS (tham chiếu token & nguyên tắc) |
