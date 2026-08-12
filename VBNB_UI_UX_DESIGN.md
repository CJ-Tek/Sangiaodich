# VBNB — UI/UX DESIGN SYSTEM & REDESIGN SPEC

> **Purpose:** This document defines the visual direction, UX principles, component language, layouts, and interaction patterns for redesigning the VBNB application.
>
> **Important:** This is a **UI/UX specification only**. Do not change the existing business rules, data model, API contracts, permissions, pricing logic, booking logic, or technical architecture unless explicitly required to implement the visual redesign.

---

# 1. Design North Star

## Product design direction

VBNB should feel like:

> **Modern Marketplace × Boutique Travel × Sales Workspace**

The core visual language is:

> **Quiet Marketplace**

The product must be:

- Clean
- Modern
- Premium but approachable
- Calm
- Image-led
- Highly usable
- Commercially efficient for sales users
- Distinct from generic SaaS dashboards
- Distinct from traditional PMS/property-management software
- Distinct from an Airbnb clone

### Core principle

> **Guest should want to explore.  
> Sale should want to sell.  
> Owner should feel that their properties are presented in a professional marketplace.**

---

# 2. Design Philosophy

Use four visual influences:

| Influence | What to borrow |
|---|---|
| Travel / Hospitality | Large photography, calm layouts, discovery |
| Modern SaaS | Information hierarchy, predictable navigation, clean components |
| Editorial | Typography, whitespace, large imagery, composition |
| Sales workspace | Fast scanning, clear numbers, efficient actions |

Approximate visual balance:

- 40% Travel / Hospitality
- 30% Modern SaaS
- 20% Editorial
- 10% Commercial / Sales

Do NOT make the product look like a traditional ERP or PMS.

---

# 3. Visual Personality

## Desired adjectives

- Quiet
- Refined
- Natural
- Contemporary
- Spacious
- Confident
- Warm
- Professional
- Human
- Efficient

## Avoid

- Generic SaaS
- Corporate blue dashboards
- Purple/blue gradients
- Heavy glassmorphism
- Excessive shadows
- Neon colors
- Crypto/Web3 aesthetics
- Luxury hotel clichés
- Black + gold luxury styling
- Dense enterprise tables everywhere
- Excessive rounded cards
- Excessive animation
- Excessive decorative UI

---

# 4. Color System

The UI should be overwhelmingly neutral.

## Base palette

```text
Background       #F8F8F6
Surface          #FFFFFF
Surface Muted    #F3F3EF

Text Primary     #181818
Text Secondary   #6F6F6A
Text Muted       #969690

Border           #E8E7E2
Border Strong    #DCDCD5
```

## Brand accent

Use a restrained warm/natural green.

```text
Primary          #536B58
Primary Dark     #3D5142
Primary Soft     #EAF0EA
```

Green is an accent, NOT the dominant UI color.

Use it for:

- Primary CTA
- Active navigation
- Selected states
- Positive metrics
- Confirmed status
- Important interactive elements
- Margin highlights where appropriate

Do not turn the entire application green.

## Status colors

Keep status colors muted.

```text
Success          muted green
Warning          muted amber
Error            muted red
Info             muted blue/grey
```

Status colors should never become visually dominant.

---

# 5. Typography

Preferred font:

> **Plus Jakarta Sans**

If the existing project already has a compatible modern sans-serif font, do not introduce unnecessary font dependencies. Maintain the same typographic personality.

## Font hierarchy

```text
Display       40–48px
H1            32–36px
H2            24px
H3            18–20px
Body          14–16px
Small         13px
Caption       12px
```

Recommended weights:

```text
Regular       400
Medium        500
Semibold      600
```

Avoid excessive bold text.

Typography should create hierarchy through:

- Size
- Weight
- Spacing
- Color
- Position

rather than heavy decoration.

---

# 6. Spacing System

Use a consistent 4px-based spacing scale.

```text
4
8
12
16
20
24
32
40
48
64
80
```

Preferred page padding:

```text
Desktop:
24–40px

Large desktop:
40–56px

Mobile:
16–20px
```

Give content room to breathe.

Whitespace is a core part of the brand.

---

# 7. Border Radius

Use moderate rounding.

```text
Buttons       8–10px
Inputs        10px
Cards         12–14px
Large Images  16px
Modals        16px
```

Avoid making every UI element extremely rounded.

Do NOT use a “everything is a pill” design.

---

# 8. Shadows

Use shadows sparingly.

Preferred:

```text
Very subtle elevation
Low opacity
Large blur
Small vertical offset
```

Cards should often work with:

- White surface
- Thin border
- Minimal shadow

Do not create floating cards everywhere.

---

# 9. Layout Philosophy

The application should feel spacious without wasting space.

Use:

- Strong alignment
- Clear content columns
- Large image blocks
- Generous vertical spacing
- Minimal visual noise
- Consistent grid

Avoid:

- Overcrowding
- Too many cards
- Too many dividers
- Excessive decorative sections

---

# 10. Navigation

## Guest navigation

Prefer a lightweight top navigation.

```text
VBNB

Explore
Bookings

                         Profile
```

Mobile:

```text
Bottom navigation

Explore
Bookings
Leads / Contact
Profile
```

## Sale navigation

Use a compact left sidebar.

Suggested structure:

```text
VBNB

Marketplace
Bookings
Leads
Templates

────────────

Performance

────────────

Membership
Subscription

────────────

Settings
```

Sidebar width:

```text
220–240px
```

Do not make the sidebar visually heavy.

### Sidebar behavior

- Active item gets subtle soft-green background
- Icon is understated
- Text is primary
- Avoid giant icons
- Avoid gradient backgrounds
- Avoid decorative illustrations

---

# 11. Role-Based UX Language

The visual system should be shared across roles, but the UX emphasis should differ.

## Guest

### Personality

> Editorial / Travel / Discovery

Prioritize:

- Photography
- Property information
- Availability
- Sharing
- Contacting a sale

Avoid showing business-oriented information.

---

## Sale

### Personality

> Fast / Operational / Commercial

Prioritize:

- Inventory discovery
- Cost
- Selling price
- Margin
- Availability
- Leads
- Booking creation

The Sale interface should allow fast scanning and fast actions.

---

## Owner

### Personality

> Calm / Portfolio / Business

Prioritize:

- Properties
- Listing status
- Cost
- Performance
- P&L
- Subscription

---

## Admin

### Personality

> Structured / Professional / Minimal

Prioritize:

- Approval
- Users
- Fees
- Membership
- Platform monitoring

Admin can be more information-dense than Guest UI, but must still follow the same design language.

---

# 12. Dashboard Design

## Do NOT use dashboard card overload

Avoid:

```text
[Revenue] [Bookings] [Guests] [Margin]
[Chart] [Chart] [Chart]
[Activity] [Activity]
```

Instead establish hierarchy.

Example:

```text
Good morning, Minh

18
Confirmed bookings
↑ 12% this month

────────────────────────────

Upcoming

[Booking item]
[Booking item]
[Booking item]

────────────────────────────

Marketplace opportunities

[Property]
[Property]
[Property]
```

The dashboard should answer:

1. What matters right now?
2. What needs action?
3. What opportunity is available?
4. What is happening next?

Do not show a metric just because there is data available.

---

# 13. Marketplace Design

Marketplace is the visual centerpiece of VBNB.

## Search

Use a clean horizontal search/filter area.

Example:

```text
┌───────────────────────────────────────────────┐
│ Search villas, locations, or keywords...     │
│                                               │
│ Da Lat     Aug 10 – Aug 12     2 guests      │
└───────────────────────────────────────────────┘
```

Search should feel like a travel product rather than an enterprise filter panel.

---

# 14. Property Cards

Property cards are image-first.

Preferred structure:

```text
┌─────────────────────────────┐
│                             │
│                             │
│        PROPERTY IMAGE       │
│                             │
│                         ♡   │
└─────────────────────────────┘

Villa Maison
Da Lat

8 guests · 4 bedrooms
```

For Sale users:

```text
Villa Maison
Da Lat · 8 guests

Cost                 4,500,000
Suggested price      6,200,000
Margin               1,700,000

                 [Create booking]
```

### Card rules

- Image is the main visual
- Minimal text
- Clear metadata
- One obvious CTA
- No excessive badges
- No unnecessary borders inside cards
- Use natural photography
- Maintain consistent image ratio

---

# 15. Property Detail Page

The property detail page should feel closer to a boutique travel experience than a business application.

## Hero

Use large imagery.

Preferred structure:

```text
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│              LARGE HERO IMAGE               │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

Then:

```text
Villa Maison
Da Lat, Vietnam

4 bedrooms · 8 guests · 4 bathrooms

Description...

Availability

Calendar

[Copy link] [Share] [Cần liên lạc sale]
```

## Gallery

Use a strong visual composition rather than a repetitive gallery grid.

Possible layout:

```text
┌─────────────────────────────┬───────────────┐
│                             │               │
│        MAIN IMAGE           │    IMAGE 2    │
│                             │               │
│                             ├───────────────┤
│                             │    IMAGE 3    │
└─────────────────────────────┴───────────────┘
```

---

# 16. Guest Experience

Guest UI should be visually calm.

## Guest homepage

Prioritize:

```text
Hero / Search
↓
Featured stays
↓
Popular destinations
↓
Recommended stays
```

Do not overpopulate the homepage.

## Property page

Primary actions:

```text
Copy link
Share
Cần liên lạc sale
```

Do not introduce a traditional “Book now” CTA because Guest booking is not self-service.

---

# 17. Calendar Design

Calendar is important but should not look like an enterprise scheduling tool.

Use:

- Clear month navigation
- Generous cell spacing
- Soft status colors
- Strong selected state
- Very readable typography

Example:

```text
        AUGUST 2026

 Mon  Tue  Wed  Thu  Fri  Sat  Sun

  3    4    5    6    7    8    9
  ○    ○    ○    ●    ●    ○    ○
```

Visual language:

```text
Available → neutral / clean
Booked    → soft muted accent
Selected  → brand green
```

Avoid bright red/green calendar blocks.

---

# 18. Sale Workspace

The Sale experience should feel like a high-quality sales workspace.

Example:

```text
Marketplace

Search villas...

────────────────────────────────────────────

Villa Maison                         ACTIVE

Da Lat · 8 guests

Cost             4,500,000
Effective cost   4,050,000

Your price       6,500,000
Margin           2,450,000

                         [Create booking]
```

The numbers must be extremely easy to scan.

### Financial hierarchy

Primary:

```text
Your price
Margin
```

Secondary:

```text
Cost
Effective cost
```

Do not make every number equally prominent.

---

# 19. Booking Creation UX

Booking creation should feel like a focused workflow.

Do not create a giant form.

Use a structured step-by-step or grouped layout:

```text
1. Property
2. Guest
3. Dates
4. Price
5. Review
6. Confirm
```

Use progressive disclosure.

Only show advanced information when needed.

---

# 20. Leads UX

Lead inbox should feel like a modern sales inbox.

Example:

```text
Leads

┌─────────────────────────────────────────────┐
│ Nguyen Van A                                │
│ Villa Maison · Da Lat                      │
│ Wants to stay Aug 10–12                    │
│                                             │
│ +84 xxx xxx xxx                  2 min ago  │
└─────────────────────────────────────────────┘
```

Use:

- Strong name
- Property context
- Date/context
- Phone
- Time
- Clear action

Avoid making leads look like CRM spreadsheets.

---

# 21. Tables

Tables are allowed for information-dense areas such as:

- Bookings
- Admin users
- Transactions
- Subscription history

But use modern table styling.

Rules:

- No heavy borders
- Generous row height
- Clear column hierarchy
- Small muted metadata
- Status pills should be subtle
- Row hover should be subtle
- Avoid tiny 11px text

Whenever a table can be replaced by a list/card without losing efficiency, prefer the list/card.

---

# 22. Buttons

Primary button:

```text
Background: Primary green
Text: White
Radius: 8–10px
```

Secondary:

```text
White / transparent
Thin border
Dark text
```

Tertiary:

```text
No border
No background
Text only
```

Buttons should be compact and confident.

Avoid giant CTA buttons unless the context genuinely requires one.

---

# 23. Inputs

Inputs should feel lightweight.

Preferred:

```text
White background
Subtle border
10px radius
14–16px text
Generous vertical padding
```

Focus state:

- Brand green border or subtle ring
- No aggressive glow

Do not use huge floating-label inputs unless required.

---

# 24. Status Pills

Use small, quiet status pills.

Example:

```text
● CONFIRMED
● PENDING
● ACTIVE
● SUSPENDED
```

Use:

- Small font
- Medium weight
- Soft background
- Minimal padding

Avoid neon badges.

---

# 25. Images & Photography

Photography is one of the strongest parts of the VBNB visual identity.

Use imagery that feels:

- Architectural
- Natural
- Warm
- Contemporary
- Cinematic
- Realistic
- Human-scale

Preferred subjects:

- Modern Vietnamese villas
- Tropical villas
- Da Lat architecture
- Natural light interiors
- Pools
- Landscapes
- Living spaces

Avoid:

- Generic stock photography
- Overly saturated images
- Fake HDR
- Excessive luxury styling
- Black-and-gold resort aesthetics

Image treatment:

- Natural contrast
- Slightly muted
- Warm
- Clean

---

# 26. Icons

Use a consistent outline icon set.

Preferred:

> Lucide Icons

Rules:

- Stroke approximately 1.75–2px
- Small to medium size
- Icons support the text
- Icons should never overpower content
- No 3D icons
- No emoji as primary UI icons

---

# 27. Motion

Motion should be subtle and purposeful.

Use:

- Fade
- Short slide
- Small scale
- Gentle hover
- Smooth state transition

Examples:

```text
Card hover:
image scale 1.01–1.02

Button:
subtle press feedback

Modal:
fade + slight upward movement

Page:
short fade transition
```

Avoid:

- Bouncy animation
- Excessive spring physics
- Parallax everywhere
- Large animated dashboards
- Decorative animation

The feeling should be:

> **quietly polished**

---

# 28. Responsive Design

The design must not simply shrink desktop layouts.

## Desktop

Use:

- Sidebar
- Large content canvas
- Multi-column property cards
- Spacious dashboard

## Tablet

Use:

- Collapsible sidebar
- 2-column cards
- Reduced spacing

## Mobile

Use:

- Bottom navigation
- Single-column cards
- Full-width CTA
- Compact header
- Large touch targets
- Simplified filters

Guest mobile experience should feel especially polished because property discovery and sharing are important mobile behaviors.

---

# 29. Mobile Visual Direction

Mobile should feel like a premium travel app.

Example:

```text
┌──────────────────────────┐
│ ☰          VBNB       ♡ │
│                          │
│ Find your perfect stay   │
│                          │
│ ┌──────────────────────┐ │
│ │ 📍 Da Lat            │ │
│ │ Aug 10 – Aug 12      │ │
│ │ 2 guests             │ │
│ │                      │ │
│ │     Search villas    │ │
│ └──────────────────────┘ │
│                          │
│ Featured stays           │
│                          │
│ ┌──────────────────────┐ │
│ │      VILLA IMAGE     │ │
│ └──────────────────────┘ │
│ Villa Maison             │
│ Da Lat                   │
│                          │
│ Explore Bookings Profile│
└──────────────────────────┘
```

---

# 30. Design Tokens

Create a centralized design token system.

Example:

```ts
colors = {
  background: "#F8F8F6",
  surface: "#FFFFFF",
  surfaceMuted: "#F3F3EF",

  textPrimary: "#181818",
  textSecondary: "#6F6F6A",
  textMuted: "#969690",

  border: "#E8E7E2",

  primary: "#536B58",
  primaryDark: "#3D5142",
  primarySoft: "#EAF0EA",
}
```

Spacing:

```ts
spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
}
```

Radius:

```ts
radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16,
}
```

Do not scatter arbitrary values throughout the UI.

---

# 31. Mantine Implementation Rules

The project uses Mantine UI.

Use Mantine as the component backbone.

Prefer:

- Container
- Stack
- Group
- Grid
- SimpleGrid
- Paper
- Card
- Button
- Badge
- TextInput
- Select
- Modal
- Drawer
- Tabs
- Table
- Avatar
- Tooltip
- Menu
- ActionIcon

Customize Mantine through the central theme rather than styling every component independently.

Do not introduce another UI framework.

Do not replace Mantine with custom UI primitives unless there is a clear reason.

---

# 32. Component Design Rules

Every component must follow the same visual language.

## Cards

Cards should not all have the same visual weight.

Use three levels:

### Level 1 — Flat content

No visible card boundary.

### Level 2 — Subtle surface

White surface + border.

### Level 3 — Elevated

White surface + very subtle shadow.

Do not use Level 3 everywhere.

---

# 33. Information Hierarchy

For every screen, establish:

```text
1. Primary purpose
2. Primary action
3. Important information
4. Secondary information
5. Metadata
```

Never make every element visually important.

---

# 34. Empty States

Empty states should be calm and useful.

Example:

```text
No upcoming bookings

Your confirmed bookings will appear here.

[Explore marketplace]
```

Avoid giant illustrations unless the state genuinely benefits from one.

---

# 35. Loading States

Use skeletons that match the final content structure.

Avoid full-screen spinners wherever possible.

Property cards:

```text
[ image skeleton ]

[ title skeleton ]
[ metadata skeleton ]
```

Dashboard:

```text
[ metric skeleton ][ metric skeleton ][ metric skeleton ]
```

---

# 36. Error States

Keep errors clear and human.

Example:

```text
Something went wrong

We couldn't load this property right now.

[Try again]
```

Do not expose technical errors to users.

---

# 37. Accessibility

Maintain:

- Good text contrast
- Keyboard navigation
- Visible focus states
- Minimum touch target sizes
- Semantic headings
- Accessible labels
- Icon button tooltips
- Screen-reader-friendly form controls

Do not sacrifice usability for visual minimalism.

---

# 38. Critical UX Rule

Do not redesign the application by simply making existing screens prettier.

The redesign should improve:

- Hierarchy
- Scannability
- Navigation
- Information density
- User confidence
- Speed of common tasks

The interface should feel fundamentally more intentional.

---

# 39. Design Priority by Role

## Guest

Priority order:

```text
Photography
↓
Property discovery
↓
Availability
↓
Share
↓
Contact sale
↓
Bookings
```

## Sale

Priority order:

```text
Inventory
↓
Cost
↓
Selling price
↓
Margin
↓
Availability
↓
Booking
↓
Leads
```

## Owner

Priority order:

```text
Properties
↓
Listing status
↓
Cost
↓
Bookings / P&L
↓
Subscription
```

## Admin

Priority order:

```text
Pending actions
↓
Asset approval
↓
Users
↓
Fees
↓
Membership
↓
Monitoring
```

---

# 40. Reference Composition

The target desktop experience should roughly follow this composition:

```text
┌──────────────┬─────────────────────────────────────────────┐
│              │                                             │
│    VBNB      │ Search / Filters                            │
│              │                                             │
│ Marketplace  │ Good morning, Minh                         │
│ Bookings     │                                             │
│ Leads        │ ┌────────┐ ┌────────┐ ┌────────┐            │
│ Performance  │ │Bookings│ │ Sales  │ │ Margin │            │
│              │ └────────┘ └────────┘ └────────┘            │
│ Membership   │                                             │
│ Subscription │ Recommended for you                         │
│              │                                             │
│              │ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│              │ │ IMAGE   │ │ IMAGE   │ │ IMAGE   │         │
│              │ │         │ │         │ │         │         │
│              │ └─────────┘ └─────────┘ └─────────┘         │
│              │                                             │
│              │ Upcoming bookings                            │
│              │ ─────────────────────────────────────────   │
│              │ Booking rows                                 │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

The exact content can change per role, but the composition should remain calm and spacious.

---

# 41. Anti-Patterns

Do not implement:

```text
❌ Purple/blue SaaS gradient
❌ Glassmorphism everywhere
❌ Huge shadows
❌ Excessive rounded corners
❌ Giant dashboard cards
❌ Dense PMS tables
❌ Neon status badges
❌ Black/gold luxury hotel theme
❌ Excessive animations
❌ Emoji-based interface
❌ Too many charts
❌ Too many borders
❌ Too many CTA buttons
❌ Generic Bootstrap-looking UI
❌ Airbnb visual cloning
```

---

# 42. Implementation Strategy

Redesign in this order:

## Phase 1 — Foundation

1. Mantine theme
2. Color tokens
3. Typography
4. Spacing
5. Radius
6. Shadows
7. Buttons
8. Inputs
9. Badges
10. Cards
11. Navigation

## Phase 2 — Core surfaces

1. Sale dashboard
2. Marketplace
3. Property card
4. Property detail
5. Calendar
6. Booking flow

## Phase 3 — Supporting surfaces

1. Leads
2. Owner dashboard
3. Owner property management
4. Guest bookings
5. Membership
6. Subscription
7. Admin

## Phase 4 — Polish

1. Responsive behavior
2. Loading states
3. Empty states
4. Error states
5. Motion
6. Accessibility
7. Visual consistency pass

---

# 43. Cursor Instructions

When implementing this redesign:

1. **Do not change business logic.**
2. **Do not change existing API contracts unless necessary for UI rendering.**
3. **Do not change database schema for visual reasons.**
4. **Do not introduce another UI framework.**
5. **Use Mantine as the primary UI system.**
6. **Create centralized design tokens/theme configuration.**
7. **Refactor duplicated UI patterns into reusable components.**
8. **Preserve existing role permissions.**
9. **Preserve existing pricing and booking behavior.**
10. **Do not expose information that the current role is not allowed to see.**
11. **Do not solve visual problems with excessive CSS hacks.**
12. **Prefer reusable components and theme-level styling.**
13. **Prioritize responsive design from the beginning.**
14. **Keep animations subtle.**
15. **Use the design direction in this document as the source of truth for visual decisions.**

---

# 44. Final Design Test

Before considering a screen complete, ask:

### Visual

- Does this feel calm?
- Does this feel premium without looking luxurious?
- Is the page mostly neutral?
- Is imagery doing enough of the visual work?
- Is green being used as an accent rather than a theme?

### UX

- Can the user immediately understand what this screen is for?
- Is there one obvious primary action?
- Can important information be scanned quickly?
- Is there unnecessary UI?
- Does the screen feel lighter than a traditional SaaS/PMS?

### Brand

- Does it feel like a marketplace?
- Does it feel connected to travel/hospitality?
- Does it feel professional enough for business?
- Does it avoid looking like Airbnb?
- Does it avoid looking like a generic SaaS dashboard?

### Overall

The final feeling should be:

> **Quietly polished.**
>
> **Clean enough for business.**
>
> **Beautiful enough for travel.**
>
> **Fast enough for sales.**
