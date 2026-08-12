# VBNB Landing Page — Design System & UX Specification

> **Purpose:** This document is the visual and UX source of truth for redesigning the existing VBNB landing page.
>
> **Important:** The goal is to reproduce the **style, composition, visual hierarchy, spacing, imagery, and interaction language** of the approved VBNB landing-page reference while preserving the existing application's technical structure, routing, components, content architecture, and business logic.
>
> **Do not rebuild the product architecture.** This document is about the landing page presentation layer.

---

# 1. Design North Star

## Design language

### **Quiet Premium Marketplace**

The VBNB landing page should feel like a combination of:

- Boutique travel platform
- Modern marketplace
- Premium SaaS product
- Editorial lifestyle brand
- Professional sales platform

The design should communicate:

> **VBNB is a modern platform connecting Villa Owners, Sales Partners, and Guests.**

The visual experience should feel:

- Clean
- Premium
- Calm
- Modern
- Trustworthy
- Natural
- Spacious
- Commercial without feeling corporate
- Hospitality-focused without feeling like a hotel website

---

# 2. Reference Image

The attached/approved visual reference is the source of truth for the desired visual direction.

The reference demonstrates:

1. Large villa photography
2. White/cream interface
3. Dark typography
4. Muted natural green as brand accent
5. Montserrat typography
6. Large editorial hero
7. Floating search module
8. Minimal navigation
9. Trust/logo strip
10. Three-step ecosystem explanation
11. Sales product showcase
12. Villa owner product showcase
13. Large image-led CTA
14. Minimal multi-column footer

When implementing the landing page, prioritize matching the **visual rhythm and composition** rather than copying the exact text or generated imagery.

---

# 3. Core Visual Personality

## Desired

```text
Quiet
Premium
Natural
Modern
Editorial
Trustworthy
Spacious
Human
Professional
Warm
```

## Avoid

```text
Generic SaaS
Corporate enterprise
Crypto/Web3 aesthetics
Luxury hotel clichés
Black + gold luxury
Purple/blue startup gradients
Glassmorphism everywhere
Neon colors
Heavy shadows
Excessive rounded cards
Dense information
Excessive animations
Airbnb visual cloning
```

The landing page should feel expensive because of:

- composition
- typography
- photography
- spacing
- restraint

Not because of:

- gold
- gradients
- visual effects
- excessive decoration

---

# 4. Brand Color System

The page is primarily neutral.

## Base

```text
Background        #FAFAF8
Surface           #FFFFFF
Surface Muted     #F4F4F0

Text Primary      #161616
Text Secondary    #5F625D
Text Muted        #8B8D87

Border            #E8E8E2
Border Strong     #DCDDD6
```

## Brand Green

Use a natural, slightly muted green.

```text
Primary           #536B58
Primary Dark      #3D5142
Primary Soft      #EAF0E8
```

Green should be an accent.

It should appear in:

- Logo
- Primary CTA
- Highlighted headline phrase
- Active states
- Small eyebrow labels
- Positive metrics
- Selected states
- Small decorative details

Do NOT make the entire page green.

---

# 5. Typography

## Primary font

### **Montserrat**

The landing page should use Montserrat as the primary typeface.

Recommended weights:

```text
400 — Regular
500 — Medium
600 — Semibold
700 — Bold
```

Avoid excessive font weights.

---

# 6. Typography Scale

Recommended desktop scale:

```text
Hero headline:
56–68px

Section headline:
34–44px

Large subsection:
28–34px

Card / feature title:
18–22px

Body:
15–17px

Small body:
13–14px

Eyebrow:
11–12px
```

Hero headline should have:

- tight line-height
- strong weight
- high contrast
- maximum width around 620–700px

Example visual hierarchy:

```text
Sàn giao dịch villa
thông minh kết nối
Chủ villa, Sale & Khách hàng
```

The final line can use the brand green to create visual emphasis.

---

# 7. Layout System

Use a centered desktop container.

Recommended:

```text
Max width:
1180–1240px

Desktop side padding:
40–48px

Section vertical spacing:
96–140px

Small section spacing:
48–72px
```

The page should have generous whitespace.

Do not allow sections to visually collide.

---

# 8. Page Background

The primary page background should be:

```text
#FAFAF8
```

Use pure white surfaces for:

- search bar
- cards
- product mockups
- floating UI
- CTA buttons where appropriate

This creates a subtle warm contrast without requiring heavy borders.

---

# 9. Border Radius

Use restrained rounding.

```text
Buttons:
8px

Search:
14–16px

Cards:
14–18px

Large image blocks:
16–20px

Floating CTA:
16px
```

Do not make every element a pill.

Pills should only be used for:

- eyebrow labels
- compact status
- small tags

---

# 10. Shadows

Use very subtle shadows.

Preferred:

```text
0 8px 30px rgba(...)
```

with very low opacity.

The reference page uses shadows mainly to create:

- floating search bar
- floating UI mockups
- product cards
- CTA separation

Avoid dark or dramatic shadows.

---

# 11. Photography Direction

Photography is one of the most important parts of the visual identity.

## Preferred imagery

Use:

- Modern villas
- Vietnamese villas
- Da Lat architecture
- Tropical villas
- Contemporary interiors
- Natural landscapes
- Pools
- Warm evening lighting
- Architectural photography

## Visual treatment

Images should feel:

```text
Natural
Warm
Cinematic
Architectural
Slightly muted
Premium
Realistic
```

Avoid:

```text
Over-saturated
HDR
Cheap stock photography
Artificial luxury
Overly dark imagery
Black-and-gold styling
```

---

# 12. Hero Section

The hero is the most important section.

## Composition

Use a two-layer composition:

```text
LEFT:
Headline
Description
CTA

RIGHT:
Large villa photography
```

The image should visually extend behind the hero area.

The left side should remain readable with a soft white gradient/fade.

---

## Hero structure

```text
[Eyebrow]

Sàn giao dịch villa
thông minh kết nối
Chủ villa, Sale & Khách hàng

Short description

[Khám phá villas] [Tìm hiểu thêm]
```

### Eyebrow

Small pill:

```text
NỀN TẢNG THÔNG MINH KẾT NỐI CHỦ VILLA, SALE & KHÁCH HÀNG
```

Style:

- 11–12px
- uppercase
- semibold
- green text
- very soft green background
- pill radius

---

# 13. Hero Image

The hero image should occupy approximately:

```text
45–55% of visual width
```

Use a high-quality modern villa.

Image should visually communicate:

> desirable accommodation

rather than:

> software company

The villa should be the emotional anchor.

---

# 14. Hero CTA

Primary:

```text
Khám phá villas
```

Secondary:

```text
Tìm hiểu thêm
```

Primary button:

```text
Green background
White text
8px radius
Medium/semibold
```

Secondary:

```text
White / transparent
Thin border
Dark text
```

Avoid oversized buttons.

---

# 15. Search Module

The search module is a major visual element.

It should overlap or sit directly beneath the hero.

Structure:

```text
┌────────────────────────────────────────────────────┐
│ Địa điểm │ Ngày nhận – trả │ Số lượng khách │ CTA │
└────────────────────────────────────────────────────┘
```

Use:

- White surface
- Rounded corners
- Soft shadow
- Large horizontal layout
- Vertical dividers between fields
- Lucide icons

Example:

```text
📍
Địa điểm
Bạn muốn đi đâu?

📅
Ngày nhận – trả
Chọn ngày

♙
Số lượng khách
Thêm khách

[ Tìm kiếm villas ]
```

The CTA should be visually dominant.

---

# 16. Trust / Social Proof Strip

Immediately after the hero/search section.

Purpose:

> Reduce uncertainty and communicate ecosystem credibility.

Composition:

```text
Được tin tưởng bởi chủ villa và sales chuyên nghiệp

DALAT WONDER
LUXSTAY
TROPICASA
THE NEST
ZEN VILLAS
MISTY HILLS
```

Visual style:

- Small
- Muted
- Mostly monochrome
- Generous horizontal spacing
- No colorful logo wall

This section should be subtle rather than attention-grabbing.

---

# 17. How VBNB Works Section

Section label:

```text
VBNB HOẠT ĐỘNG NHƯ THẾ NÀO
```

Headline:

```text
Cùng nhau phát triển đơn giản hơn
```

Use a three-step horizontal layout.

```text
Chủ villa
      →
Sale
      →
Khách hàng
```

### Step 1

```text
Chủ villa đăng tài sản

Thiết lập giá vốn, lịch trống và
dễ dàng quản lý.
```

### Step 2

```text
Sale chốt nhiều đơn hơn

Truy cập toàn bộ villa, tạo booking
và tối ưu lợi nhuận.
```

### Step 3

```text
Khách hàng tận hưởng kỳ nghỉ

Khám phá villa tuyệt đẹp và kết nối
với sale phù hợp.
```

---

# 18. Step Visual Language

Each step should use:

- Simple outline icon
- Soft green circular background
- Dark icon
- Minimal text

Do not use:

- complex illustrations
- colorful icons
- 3D graphics
- large decorative cards

Use arrows between the three steps.

The arrows should be subtle.

---

# 19. Sales Section

The first major product showcase.

## Eyebrow

```text
DÀNH CHO SALE
```

## Headline

```text
Thông tin real-time.
Cơ hội nhiều hơn.
```

## Supporting feature list

Three features:

```text
Truy cập giá vốn & lịch trống tức thì

Tạo booking chỉ trong vài phút

Tăng hạng thành viên & thu nhập
```

Each feature should have:

- small soft icon container
- title
- short description

---

# 20. Sales Product Showcase

Place a large product UI mockup on the right.

Show:

- Desktop dashboard
- Villa marketplace
- Metrics
- Villa cards
- Mobile app preview

The product mockup should feel like a real product.

Important:

> The mockup is not decoration. It should communicate what users actually get.

Use the same VBNB product design language:

- white surfaces
- natural green
- Montserrat
- subtle borders
- villa photography
- minimal cards

---

# 21. Product Mockup Rules

Do not use random UI.

The mockup must be visually consistent with the actual application.

Use:

```text
VBNB dashboard
Marketplace
Bookings
Leads
Performance
Membership
```

The UI can be simplified for the landing page, but it should feel authentic.

---

# 22. Owner Section

Second major product showcase.

Use a split layout opposite the Sale section.

```text
LEFT:
Large villa/interior image
+
Floating performance card

RIGHT:
Headline
Features
CTA
```

## Eyebrow

```text
DÀNH CHO CHỦ VILLA
```

## Headline

```text
Hiển thị nhiều hơn.
Booking nhiều hơn. Ít nỗ lực hơn.
```

Feature list:

```text
Tiếp cận mạng lưới sale chất lượng

Minh bạch & an toàn

Tăng booking, tăng doanh thu
```

CTA:

```text
Đăng villa ngay
```

---

# 23. Owner Image + Floating Analytics

The large owner image should contain a floating white analytics card.

Example:

```text
Hiệu suất villa của bạn

Booking       Doanh thu
24            96.5M

↑ 10%         ↑ 14%

[small line chart]
```

This reinforces the idea that VBNB is not just a listing platform.

It gives Owners measurable business value.

---

# 24. Alternating Sections

The Sales and Owner sections should alternate image/text alignment.

Example:

```text
Sales:
Text | Product UI

Owner:
Image | Text
```

This creates visual rhythm.

Do not place every section in the same layout.

---

# 25. CTA Banner

Near the end of the page.

Use a wide image background.

Recommended image:

- mountain / forest / villa landscape
- slightly muted
- soft overlay

Content:

```text
Sẵn sàng bắt đầu cùng VBNB?

Tham gia cùng hàng ngàn chủ villa và sale
chuyên nghiệp trên toàn quốc.

[ Tôi là Chủ villa ] [ Tôi là Sale ]
```

The CTA should feel like an invitation rather than a hard sales pitch.

---

# 26. Footer

Footer should be minimal and structured.

Columns:

```text
VBNB
Nền tảng
Dành cho Chủ villa
Dành cho Sale
Về chúng tôi
Pháp lý
```

Example:

### VBNB

```text
Nền tảng giao dịch villa hiện đại
kết nối Chủ villa, Sale và Khách hàng.
```

### Nền tảng

```text
Khám phá villas
Cách hoạt động
Bảng giá
Thành viên
```

### Dành cho Chủ villa

```text
Đăng villa
Hướng dẫn
Chính sách
Câu hỏi thường gặp
```

### Dành cho Sale

```text
Dành cho Sales
Quyền lợi
Membership sales
Tài nguyên
```

### Về chúng tôi

```text
Giới thiệu
Sự nghiệp
Tin tức
Liên hệ
```

### Pháp lý

```text
Điều khoản sử dụng
Chính sách bảo mật
Chính sách cookie
```

---

# 27. Header

The header should be minimal and transparent/light.

Structure:

```text
VBNB

Khám phá villas
Dành cho Chủ villa
Dành cho Sale
Bảng giá
Về chúng tôi

Đăng nhập
[Bắt đầu ngay]
```

Logo:

```text
VBNB
```

Use brand green or dark text.

Header should not have a heavy background.

---

# 28. Header Behavior

Desktop:

- Fixed or sticky is acceptable
- Keep height compact
- White/transparent background depending on hero state
- Very subtle bottom border only after scrolling

Mobile:

```text
VBNB
Menu
```

Keep navigation simple.

Do not cram desktop navigation into mobile.

---

# 29. Navigation Interaction

Hover:

- Slight text color change
- Optional subtle underline/indicator

Avoid:

- animated giant dropdowns
- gradients
- excessive hover motion

Dropdowns should feel editorial and clean.

---

# 30. Buttons

Primary:

```text
Background: #536B58
Text: white
Radius: 8px
Height: 42–48px
Padding: 16–22px
```

Secondary:

```text
Background: transparent / white
Border: #DCDDD6
Text: #161616
```

Button text should use:

```text
14–15px
500–600 weight
```

Avoid giant pill-shaped CTAs.

---

# 31. Icons

Use Lucide or another consistent outline icon system.

Recommended:

```text
Stroke:
1.75–2px

Size:
18–22px
```

Icons should feel:

- thin
- elegant
- functional

Avoid:

- filled cartoon icons
- emoji
- 3D icons
- mixed icon styles

---

# 32. Feature Icon Containers

Use subtle circular/square backgrounds.

Example:

```text
┌──────┐
│  ↗   │
└──────┘
```

Background:

```text
#F0F3EC
```

Radius:

```text
10–12px
```

Icons remain dark/green.

---

# 33. Section Labels

Eyebrow labels should be:

```text
10–12px
uppercase
semibold
letter-spacing: 0.08–0.12em
green
```

Example:

```text
DÀNH CHO SALE
```

They should provide orientation without becoming visual decoration.

---

# 34. Section Headings

Use short, confident headlines.

Avoid paragraphs as headings.

Preferred:

```text
Thông tin real-time.
Cơ hội nhiều hơn.
```

Instead of:

```text
Với VBNB, các Sales Partner có thể
tiếp cận toàn bộ hệ thống villa...
```

The explanation belongs below the heading.

---

# 35. Content Tone

The landing page copy should be:

- Vietnamese
- Direct
- Confident
- Friendly
- Professional
- Human
- Easy to scan

Avoid:

- excessive corporate language
- exaggerated claims
- complicated terminology
- English-heavy SaaS jargon

English terms can remain where they are natural to the product:

```text
Sale
Booking
Real-time
Membership
```

But the overall content should remain Vietnamese.

---

# 36. Content Hierarchy

Every section should follow:

```text
Eyebrow
↓
Headline
↓
Short explanation
↓
Features / visual
↓
CTA
```

Do not give equal visual weight to every piece of text.

---

# 37. Responsive Design

## Desktop

The reference is primarily a desktop editorial layout.

Use:

- large hero
- wide villa imagery
- horizontal search
- 3-step process
- split content/product sections
- large CTA banner

## Tablet

- reduce hero type
- reduce image height
- search can wrap
- product mockups can become smaller

## Mobile

The page should become a clean vertical story:

```text
Header
↓
Hero
↓
CTA
↓
Search
↓
Trust
↓
How it works
↓
Sales
↓
Owner
↓
CTA
↓
Footer
```

---

# 38. Mobile Hero

On mobile:

- Villa image should remain visible
- Headline should remain strong
- Search becomes a stacked card
- CTA buttons can become full-width
- Avoid placing too much text over the image

Suggested:

```text
Sàn giao dịch villa
thông minh kết nối
Chủ villa, Sale &
Khách hàng

[Khám phá villas]

[ Tìm kiếm villas ]
```

---

# 39. Motion Design

Motion should be subtle.

Recommended:

### Hero

- image fade-in
- text fade-up
- search card fade-up

### Cards

- image scale 1.01–1.02 on hover

### Sections

- subtle scroll reveal

### Buttons

- slight press/hover transition

Avoid:

```text
Parallax everywhere
Large spring animations
Bouncing
Floating UI animations
Excessive scroll effects
```

The page should feel:

> **quietly polished**

---

# 40. Product Mockup Animation

Optional.

If animated:

- dashboard cards can subtly appear
- metrics can count up once
- carousel can auto-rotate slowly

But animation must never distract from the message.

---

# 41. Grid System

Use a 12-column desktop grid.

Typical sections:

```text
Text:
5 columns

Gap:
1–2 columns

Visual:
5–6 columns
```

Hero:

```text
Text:
5–6 columns

Image:
6–7 columns
```

Sales section:

```text
Text:
4–5 columns

Product:
7–8 columns
```

Owner section:

```text
Image:
6–7 columns

Text:
5–6 columns
```

---

# 42. Visual Rhythm

The landing page should alternate between:

```text
Large image
↓
Whitespace
↓
Text
↓
Product UI
↓
Whitespace
↓
Image
↓
CTA
```

Do not stack too many text-heavy sections.

The page should be visually driven.

---

# 43. Density

The overall page should feel:

```text
Low visual density
High information clarity
High visual quality
```

Whitespace is intentional.

Do not try to fill empty space with:

- cards
- icons
- charts
- decorative gradients
- extra copy

---

# 44. Important Product Positioning

The landing page should communicate three actors:

```text
CHỦ VILLA
    ↓
VBNB
    ↓
SALE
    ↓
KHÁCH HÀNG
```

But do not explain the business model with a complicated diagram.

The relationship should be communicated through the three-step section and the Sales/Owner sections.

---

# 45. Recommended Page Structure

Implement the landing page in this order:

```text
01. Header
02. Hero
03. Search
04. Trust / Social proof
05. How VBNB works
06. Sales section
07. Owner section
08. CTA banner
09. Footer
```

This order is the visual structure of the approved concept.

---

# 46. Component Architecture Guidance

Use reusable components.

Suggested:

```text
LandingPage
├── LandingHeader
├── HeroSection
│   ├── HeroContent
│   ├── HeroImage
│   └── VillaSearch
├── TrustStrip
├── HowItWorksSection
│   └── ProcessStep
├── SalesFeatureSection
│   ├── FeatureList
│   └── ProductShowcase
├── OwnerFeatureSection
│   ├── PerformanceImage
│   └── FeatureList
├── FinalCTA
└── LandingFooter
```

If equivalent components already exist in the project, reuse them instead of duplicating them.

---

# 47. Existing System Preservation

The redesign must work **on top of the current system**.

Do NOT:

- rewrite routing
- rewrite backend
- rewrite authentication
- rewrite database
- change API contracts
- change business logic
- remove existing functionality
- change role permissions
- introduce a new frontend framework

Unless explicitly required by the existing project.

The landing page should be a presentation-layer redesign.

---

# 48. Mantine / Frontend Implementation

If the existing project uses Mantine:

Use Mantine as the component foundation.

Prefer:

```text
Container
Box
Stack
Group
Grid
SimpleGrid
Paper
Card
Button
Badge
Text
Title
Image
Divider
ActionIcon
```

Create a centralized theme for:

- colors
- typography
- spacing
- radius
- shadows
- component defaults

Do not create arbitrary one-off styles for every section.

---

# 49. Image Handling

Use responsive image loading.

Important images:

- Hero villa
- Sales product mockup
- Owner villa/interior
- CTA background

All images should:

- maintain consistent aspect ratios
- use object-fit appropriately
- have responsive sizing
- avoid layout shift

---

# 50. Accessibility

Maintain:

- semantic HTML
- correct heading hierarchy
- keyboard navigation
- visible focus states
- accessible button labels
- sufficient color contrast
- alt text for meaningful images
- decorative images marked appropriately

Minimalism must not reduce accessibility.

---

# 51. Performance

The landing page is image-heavy, so optimize:

- image dimensions
- WebP/AVIF where supported
- lazy loading below the fold
- priority loading for hero image
- responsive image sizes
- avoid loading unnecessary dashboard assets above the fold

Do not sacrifice performance for visual effects.

---

# 52. Final Visual Checklist

Before considering the redesign complete:

### Brand

- [ ] Does it feel like VBNB?
- [ ] Is the natural green used consistently?
- [ ] Is Montserrat used consistently?
- [ ] Does the page feel premium without looking luxurious?

### Layout

- [ ] Is the hero visually dominant?
- [ ] Is the search module prominent?
- [ ] Is there enough whitespace?
- [ ] Do Sales and Owner sections alternate visually?
- [ ] Is the CTA banner strong but restrained?

### Photography

- [ ] Are villa images high quality?
- [ ] Do images feel natural and architectural?
- [ ] Are images warm and slightly muted?
- [ ] Do they avoid generic stock aesthetics?

### UX

- [ ] Is the primary CTA obvious?
- [ ] Can visitors understand VBNB within the first viewport?
- [ ] Are the three actors clear?
- [ ] Can visitors understand the value for Sales?
- [ ] Can visitors understand the value for Owners?

### Technical

- [ ] Existing application architecture is preserved
- [ ] Existing routing is preserved
- [ ] Existing APIs are preserved
- [ ] Existing business logic is preserved
- [ ] Responsive behavior works
- [ ] Images are optimized
- [ ] Accessibility is maintained

---

# 53. Cursor Execution Instructions

When implementing this design:

1. First inspect the existing landing page and identify reusable components.
2. Do NOT immediately rewrite the entire page.
3. Map existing sections to the target structure in this document.
4. Preserve all existing functionality and routes.
5. Create or update the global visual theme first.
6. Implement the header and hero before moving further down the page.
7. Match the reference composition and visual hierarchy.
8. Use Montserrat consistently.
9. Use the VBNB natural green only as an accent.
10. Use large, high-quality villa imagery.
11. Keep surfaces mostly white/cream.
12. Keep shadows subtle.
13. Keep borders subtle.
14. Keep cards moderately rounded.
15. Avoid excessive UI decoration.
16. Build reusable section components.
17. Make desktop and mobile layouts intentionally, not by simply shrinking desktop.
18. Test the page at desktop, tablet, and mobile widths.
19. Do a final visual consistency pass across all sections.
20. If a design decision is not explicitly specified, choose the option that best preserves the **Quiet Premium Marketplace** aesthetic.

---

# 54. Definition of Done

The landing page is considered complete when it gives the following impression within the first few seconds:

> **“Đây là một nền tảng villa hiện đại, đáng tin cậy và chuyên nghiệp — nơi Chủ villa có thể tăng booking, Sale có thể kiếm tiền, và Khách hàng có thể tìm được kỳ nghỉ phù hợp.”**

The final visual feeling should be:

> **Quiet. Premium. Natural. Modern. Human.**
>
> **Beautiful enough for travel.**
>
> **Professional enough for business.**
>
> **Simple enough to understand immediately.**
