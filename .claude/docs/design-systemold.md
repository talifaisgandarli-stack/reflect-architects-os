# Reflect Architects OS — Unified Design System
**Version:** 1.0  
**Date:** 2026-05-03  
**Lead Designer:** Principal Designer II (sector specialist)  
**References:** Attio (login + workflow), Whenevr (editorial), FUTURE (bento), Time Tracker (widgets), Wallet cards (depth), Rubik palette, Folder card, Attio table

---

## 1. Design Philosophy

Reflect Architects OS has one job: make a complex firm feel simple to run.

The visual language is **architectural precision meets organic warmth**. Like a well-designed studio — clean surfaces, meaningful materials, nothing decorative without purpose. The dots canvas is the drawing board. White cards are the sheets of paper on it. The dark sidebar is the wall that holds everything together. Gradient accents appear exactly where the eye needs to land — nowhere else.

**Three rules that cannot break:**
1. The dark sidebar (`#0F0F0F`) never becomes light — it is Reflect's visual signature
2. Gradient elements appear only in 3 contexts: MIRAI page, card hero areas (folders/projects), featured dashboard widget. Everywhere else = white + indigo
3. Rubik at every size. No mixing fonts.

---

## 2. Color System

### 2.1 Full Token Map

```css
:root {
  /* ── CANVAS ── */
  --color-canvas:       #F4F5F7;   /* page background — warm off-white */
  --color-canvas-dots:  #D1D5DB;   /* dot color — 1px on 20px grid */

  /* ── BRAND ── */
  --color-brand:        #5A4EFF;   /* indigo — primary accent */
  --color-brand-hover:  #4A3EEF;   /* indigo darkened 10% for hover */
  --color-brand-light:  #EEE9FF;   /* indigo tint — hover bg, badge bg */
  --color-brand-border: #C4BAFF;   /* indigo border — focus rings */

  /* ── NEUTRALS ── */
  --color-n900: #1A1A1A;   /* primary text, headings */
  --color-n800: #2D2D2D;   /* secondary headings */
  --color-n600: #6B7280;   /* secondary text, labels, placeholders */
  --color-n400: #9CA3AF;   /* disabled text, timestamps */
  --color-n300: #D1D5DB;   /* dividers, input borders */
  --color-n200: #E5E7EB;   /* card borders, table lines */
  --color-n100: #F9FAFB;   /* inner card bg, table row alt */
  --color-n000: #FFFFFF;   /* card surface, modal bg */

  /* ── SIDEBAR ── */
  --color-sidebar-bg:       #0F0F0F;   /* main sidebar background */
  --color-sidebar-text:     #A1A1AA;   /* inactive nav items */
  --color-sidebar-active:   #FFFFFF;   /* active nav item text */
  --color-sidebar-hover:    #1F1F1F;   /* nav item hover bg */
  --color-sidebar-border:   #2A2A2A;   /* sidebar section dividers */
  --color-sidebar-indicator:#5A4EFF;   /* active nav left bar */

  /* ── SEMANTIC — STATUS ── */
  --color-success:      #22C55E;   /* Tamamlandı */
  --color-success-bg:   #F0FDF4;
  --color-success-border:#BBF7D0;

  --color-warning:      #F59E0B;   /* Yoxlamada, deadline <14d */
  --color-warning-bg:   #FFFBEB;
  --color-warning-border:#FDE68A;

  --color-danger:       #EF4444;   /* Cancelled, overdue */
  --color-danger-bg:    #FEF2F2;
  --color-danger-border:#FECACA;

  --color-info:         #3B82F6;   /* İcrada, links */
  --color-info-bg:      #EFF6FF;
  --color-info-border:  #BFDBFE;

  --color-purple:       #8B5CF6;   /* Ekspertizada */
  --color-purple-bg:    #F5F3FF;
  --color-purple-border:#DDD6FE;

  --color-violet:       #A78BFA;   /* İdeyalar */
  --color-violet-bg:    #FAF5FF;
  --color-violet-border:#E9D5FF;

  --color-gray-status:  #94A3B8;   /* başlanmayıb */
  --color-gray-status-bg:#F8FAFC;
  --color-gray-status-border:#E2E8F0;

  /* ── GRADIENTS — contextual only ── */
  --grad-mirai:    linear-gradient(135deg, #FFB5C8 0%, #FFE082 40%, #B5ECFF 100%);
  --grad-folder:   linear-gradient(135deg, #FFE082 0%, #EEA0FF 55%, #B5C8FF 100%);
  --grad-feature:  linear-gradient(135deg, #5A4EFF 0%, #9B7FFF 100%);
  --grad-border:   linear-gradient(135deg, #FFB347 0%, #EEA0FF 50%, #5A4EFF 100%);
  --grad-green:    linear-gradient(135deg, #4ADE80 0%, #22C55E 100%);

  /* ── SHADOWS ── */
  --shadow-xs:    0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm:    0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md:    0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg:    0 8px 32px rgba(0, 0, 0, 0.10);
  --shadow-brand: 0 4px 20px rgba(90, 78, 255, 0.20);
  --shadow-hover: 0 8px 24px rgba(90, 78, 255, 0.12);

  /* ── RADIUS ── */
  --radius-xs:  4px;    /* badges, pills */
  --radius-sm:  8px;    /* inputs, small buttons */
  --radius-md:  12px;   /* dropdowns, tooltips */
  --radius-lg:  16px;   /* cards (standard) */
  --radius-xl:  20px;   /* folder cards, modals */
  --radius-2xl: 28px;   /* MIRAI chat bubbles */
  --radius-full:9999px; /* avatars, status dots, toggle */
}
```

### 2.2 Task Status Color Map

| Status | Text | Background | Border | Dot |
|--------|------|-----------|--------|-----|
| İdeyalar | `#A78BFA` | `#FAF5FF` | `#E9D5FF` | `#A78BFA` |
| başlanmayıb | `#94A3B8` | `#F8FAFC` | `#E2E8F0` | `#94A3B8` |
| İcrada | `#3B82F6` | `#EFF6FF` | `#BFDBFE` | `#3B82F6` |
| Yoxlamada | `#F59E0B` | `#FFFBEB` | `#FDE68A` | `#F59E0B` |
| Ekspertizada | `#8B5CF6` | `#F5F3FF` | `#DDD6FE` | `#8B5CF6` |
| Tamamlandı | `#22C55E` | `#F0FDF4` | `#BBF7D0` | `#22C55E` |
| Cancelled | `#EF4444` | `#FEF2F2` | `#FECACA` | `#EF4444` |

### 2.3 Pipeline Stage Color Map

| Stage | Color | Confidence |
|-------|-------|-----------|
| Lead | `#6B7280` | 10% |
| Təklif | `#3B82F6` | 30% |
| Müzakirə | `#F59E0B` | 50% |
| İmzalanıb | `#8B5CF6` | 75% |
| İcrada | `#22C55E` | 95% |
| Portfolio | `#10B981` | 100% |
| Udulan | `#EF4444` | 0% |
| Arxiv | `#9CA3AF` | — |

---

## 3. Typography

### 3.1 Font

**Rubik** — Google Fonts. Import in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

```css
body {
  font-family: 'Rubik', system-ui, -apple-system, sans-serif;
  font-feature-settings: 'kern' 1, 'liga' 1;
  -webkit-font-smoothing: antialiased;
}
```

### 3.2 Type Scale

```css
:root {
  /* Size */
  --text-2xs:  10px;  /* timestamps on mobile, overflow badges */
  --text-xs:   11px;  /* timestamps, meta labels */
  --text-sm:   13px;  /* secondary labels, table cells */
  --text-base: 15px;  /* body text, card content, inputs */
  --text-lg:   17px;  /* card titles, section item titles */
  --text-xl:   20px;  /* section headers, modal titles */
  --text-2xl:  24px;  /* page titles */
  --text-3xl:  32px;  /* dashboard hero stats */
  --text-4xl:  48px;  /* MIRAI display, Elanlar hero */
  --text-5xl:  64px;  /* landing/login hero (display only) */

  /* Line height */
  --leading-tight:  1.2;   /* headings */
  --leading-normal: 1.5;   /* body */
  --leading-relaxed:1.65;  /* long-form content (announcements) */

  /* Letter spacing */
  --tracking-tight:  -0.02em;  /* large headings ≥32px */
  --tracking-normal:  0;        /* body */
  --tracking-wide:    0.04em;  /* UPPERCASE labels, widget headers */
  --tracking-widest:  0.08em;  /* metadata tags */
}
```

### 3.3 Usage Rules

| Context | Size | Weight | Tracking |
|---------|------|--------|----------|
| Page title | `--text-2xl` | 700 | `--tracking-tight` |
| Section header | `--text-xl` | 600 | normal |
| Card title | `--text-lg` | 600 | normal |
| Body / card content | `--text-base` | 400 | normal |
| Secondary label | `--text-sm` | 500 | normal |
| Timestamp / meta | `--text-xs` | 400 | normal |
| Widget stat number | `--text-3xl` | 700 | `--tracking-tight` |
| MIRAI / Elanlar hero | `--text-4xl` | 800 | `--tracking-tight` |
| UPPERCASE widget label | `--text-xs` | 600 | `--tracking-widest` |
| Table header | `--text-xs` | 600 | `--tracking-wide` |
| Tabular numerals (finance) | `--text-base` | 600 | normal, `font-variant-numeric: tabular-nums` |

---

## 4. Spacing System

8pt base grid. All spacing values are multiples of 4px.

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}

/* Standard component padding */
--padding-card:    20px 24px;    /* standard card */
--padding-card-sm: 16px 20px;   /* compact card */
--padding-modal:   32px;        /* modal/drawer */
--padding-input:   10px 14px;   /* input fields */
--padding-btn-sm:  8px 14px;    /* small button */
--padding-btn-md:  10px 18px;   /* default button */
--padding-btn-lg:  12px 24px;   /* large button */
```

---

## 5. Layout System

### 5.1 App Shell

```
┌─────────────────────────────────────────────────────┐
│ SIDEBAR 240px fixed                │ CONTENT AREA   │
│ bg: #0F0F0F                        │ bg: #F4F5F7    │
│                                    │ + dots pattern  │
│ [Logo 32px]                        │                 │
│                                    │ [Page Header]   │
│ [Nav items]                        │ [Page Content]  │
│                                    │                 │
│ [User profile bottom]              │                 │
└─────────────────────────────────────────────────────┘
```

**Sidebar specs:**
- Width: 240px fixed (not collapsible in v1)
- Padding: 16px horizontal, 20px top
- Logo area: 56px height, logo + "Reflect" wordmark
- Nav section label: `--text-xs`, `--tracking-widest`, `--color-sidebar-text`, uppercase, padding-top 24px
- Nav item height: 40px, border-radius 8px, padding 0 12px
- Active indicator: 3px × 20px `--color-brand` bar on left edge (absolutely positioned)
- User section at bottom: 64px height, avatar + name + role

**Content area:**
- Left margin: 240px
- Background: `--color-canvas` + dots
- Top header bar: 64px, white, `border-bottom: 1px solid var(--color-n200)`, sticky
- Page padding: 32px (desktop) / 20px (tablet)

### 5.2 Dots Background Implementation

```css
.app-content {
  background-color: var(--color-canvas);
  background-image: radial-gradient(
    circle,
    var(--color-canvas-dots) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
  min-height: 100vh;
}
```

### 5.3 Bento Grid (Dashboard)

12-column fluid grid, 16px gap.

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
  padding: 24px 32px;
}

/* Column spans */
.col-4  { grid-column: span 4; }
.col-6  { grid-column: span 6; }
.col-8  { grid-column: span 8; }
.col-12 { grid-column: span 12; }

/* Responsive breakpoints */
@media (max-width: 1280px) {
  .col-4  { grid-column: span 6; }
  .col-8  { grid-column: span 12; }
}
@media (max-width: 768px) {
  .bento-grid { grid-template-columns: 1fr; }
  [class*="col-"] { grid-column: span 1; }
}
```

---

## 6. Component Library

### 6.1 Cards

**Base Card**
```css
.card {
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-lg);   /* 16px */
  padding: var(--padding-card);       /* 20px 24px */
  box-shadow: var(--shadow-sm);
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
/* No hover transform for data-dense table cards */
.card--static:hover { transform: none; box-shadow: var(--shadow-sm); }
```

**Gradient Header Card** (Layihələr / Folder style — Pin 7)
```css
.card--folder {
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-xl);   /* 20px */
  overflow: hidden;
  padding: 0;
}
.card--folder__header {
  height: 120px;
  background: var(--grad-folder);
  /* Each project gets a phase-specific gradient override via inline style */
}
.card--folder__body {
  padding: 16px 20px;
}
```

Phase-specific gradient overrides:
```js
const PHASE_GRADIENTS = {
  'Konsepsiya':     'linear-gradient(135deg, #FFE082 0%, #FFA07A 100%)',
  'SD':             'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)',
  'DD':             'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
  'CD':             'linear-gradient(135deg, #5A4EFF 0%, #9B7FFF 100%)',
  'Tender':         'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  'İcra nəzarəti':  'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
};
```

**Featured Card — Gradient Border** (Kanban featured / Finance balance — Pin 5)
```css
.card--featured {
  position: relative;
  border-radius: var(--radius-xl);
  padding: 2px;                        /* creates gradient border space */
  background: var(--grad-border);
  box-shadow: var(--shadow-md);
}
.card--featured__inner {
  background: var(--color-n000);
  border-radius: calc(var(--radius-xl) - 2px);
  padding: var(--padding-card);
  height: 100%;
}
```

**Accent Widget Card** (Dashboard hero stat — Pin 4 timer style)
```css
.card--accent {
  background: var(--grad-feature);
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--padding-card);
  color: white;
  box-shadow: var(--shadow-brand);
}
.card--accent .card__label { color: rgba(255,255,255,0.7); }
.card--accent .card__number { color: white; }
```

**Depth Stack Card** (Finance wallet — Pin 5 stacking)
```css
.card--stack {
  position: relative;
}
.card--stack::before,
.card--stack::after {
  content: '';
  position: absolute;
  border-radius: var(--radius-xl);
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
}
.card--stack::before {
  inset: -6px 12px;
  z-index: -1;
  opacity: 0.6;
}
.card--stack::after {
  inset: -12px 20px;
  z-index: -2;
  opacity: 0.3;
}
```

---

### 6.2 Kanban Task Card

```
┌──────────────────────────────────┐  ← border-radius: 12px
│ [Project pill]              [⋯]  │  ← 11px font, project color
│                                  │
│ Task title in Rubik 600 15px     │
│ (max 2 lines, ellipsis after)    │
│                                  │
│ [Deadline badge]  [Avatar stack] │
└──────────────────────────────────┘
```

```css
.task-card {
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: grab;
  box-shadow: var(--shadow-xs);
  transition: box-shadow 100ms ease, transform 100ms ease;
  user-select: none;
}
.task-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-n300);
}
.task-card--dragging {
  box-shadow: var(--shadow-lg);
  transform: rotate(2deg) scale(1.02);
  cursor: grabbing;
  z-index: 999;
}

/* Overdue state */
.task-card--overdue {
  border-left: 3px solid var(--color-danger);
}
/* Expertise task */
.task-card--expertise {
  border-left: 3px solid var(--color-purple);
}
```

**Deadline badge inside card:**
```css
.deadline-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: 500;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}
/* States */
.deadline-badge--ok      { color: var(--color-n600); background: var(--color-n100); }
.deadline-badge--soon    { color: var(--color-warning); background: var(--color-warning-bg); }
.deadline-badge--overdue { color: var(--color-danger); background: var(--color-danger-bg); }
```

---

### 6.3 Status Badge

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  border-width: 1px;
  border-style: solid;
  white-space: nowrap;
}
.status-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
```

Usage: `<span class="status-badge" style="color: #3B82F6; background: #EFF6FF; border-color: #BFDBFE">İcrada</span>`

---

### 6.4 Avatar System (Notion-style)

```css
.avatar {
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-family: var(--font-base);
  letter-spacing: -0.01em;
}
/* Sizes */
.avatar--sm  { width: 24px; height: 24px; font-size: 9px; }
.avatar--md  { width: 32px; height: 32px; font-size: 12px; }
.avatar--lg  { width: 40px; height: 40px; font-size: 15px; }
.avatar--xl  { width: 48px; height: 48px; font-size: 18px; }

/* Avatar stack */
.avatar-stack {
  display: flex;
  align-items: center;
}
.avatar-stack .avatar {
  border: 2px solid var(--color-n000);
  margin-left: -8px;
}
.avatar-stack .avatar:first-child { margin-left: 0; }
.avatar-stack .overflow-badge {
  height: 24px;
  padding: 0 7px;
  background: var(--color-n100);
  border: 2px solid var(--color-n000);
  border-radius: var(--radius-full);
  font-size: var(--text-2xs);
  font-weight: 600;
  color: var(--color-n600);
  margin-left: -8px;
  display: flex;
  align-items: center;
}
```

**Deterministic gradient backgrounds for initials avatars:**
```js
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667EEA, #764BA2)',
  'linear-gradient(135deg, #F093FB, #F5576C)',
  'linear-gradient(135deg, #4FACFE, #00F2FE)',
  'linear-gradient(135deg, #43E97B, #38F9D7)',
  'linear-gradient(135deg, #FA709A, #FEE140)',
  'linear-gradient(135deg, #A18CD1, #FBC2EB)',
  'linear-gradient(135deg, #FCC5E4, #F9AABB)',
  'linear-gradient(135deg, #FDB99B, #CF392B)',
];

function getAvatarGradient(userId) {
  // Deterministic: same user always gets same gradient
  const sum = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
```

---

### 6.5 Buttons

```css
/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-base);
  font-weight: 500;
  font-size: var(--text-base);
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  transition: background 120ms ease, box-shadow 120ms ease, transform 80ms ease;
  white-space: nowrap;
  text-decoration: none;
}
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

/* Primary */
.btn--primary {
  background: var(--color-brand);
  color: white;
  padding: var(--padding-btn-md);
  box-shadow: var(--shadow-brand);
}
.btn--primary:hover {
  background: var(--color-brand-hover);
  box-shadow: 0 6px 24px rgba(90, 78, 255, 0.30);
}

/* Secondary */
.btn--secondary {
  background: var(--color-n000);
  color: var(--color-n900);
  border: 1px solid var(--color-n200);
  padding: var(--padding-btn-md);
}
.btn--secondary:hover {
  background: var(--color-n100);
  border-color: var(--color-n300);
}

/* Ghost */
.btn--ghost {
  background: transparent;
  color: var(--color-n600);
  padding: var(--padding-btn-md);
}
.btn--ghost:hover {
  background: var(--color-n100);
  color: var(--color-n900);
}

/* Danger */
.btn--danger {
  background: var(--color-danger);
  color: white;
  padding: var(--padding-btn-md);
}

/* Sizes */
.btn--sm { padding: var(--padding-btn-sm); font-size: var(--text-sm); border-radius: var(--radius-xs); }
.btn--lg { padding: var(--padding-btn-lg); font-size: var(--text-lg); }

/* FAB (Floating Action Button) */
.btn--fab {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-brand);
  color: white;
  box-shadow: var(--shadow-brand);
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 100;
  font-size: 22px;
}
.btn--fab:hover {
  box-shadow: 0 8px 32px rgba(90, 78, 255, 0.35);
  transform: scale(1.05);
}
```

---

### 6.6 Pill Tags / Category Badges

```css
.pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
}
/* Variants */
.pill--default  { background: var(--color-n100); color: var(--color-n600); }
.pill--brand    { background: var(--color-brand-light); color: var(--color-brand); }
.pill--success  { background: var(--color-success-bg); color: var(--color-success); }
.pill--warning  { background: var(--color-warning-bg); color: var(--color-warning); }
.pill--danger   { background: var(--color-danger-bg); color: var(--color-danger); }
.pill--ai       { background: #EFF6FF; color: #3B82F6; border: 1px solid #BFDBFE; }
```

---

### 6.7 Inputs & Forms

```css
.input {
  width: 100%;
  padding: var(--padding-input);      /* 10px 14px */
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-sm);
  font-family: var(--font-base);
  font-size: var(--text-base);
  color: var(--color-n900);
  background: var(--color-n000);
  transition: border-color 120ms ease, box-shadow 120ms ease;
  outline: none;
}
.input::placeholder { color: var(--color-n400); }
.input:hover { border-color: var(--color-n300); }
.input:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px var(--color-brand-light);
}
.input--error {
  border-color: var(--color-danger);
}
.input--error:focus {
  box-shadow: 0 0 0 3px var(--color-danger-bg);
}

/* Label */
.label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-n800);
  margin-bottom: 6px;
}
.label--required::after {
  content: ' *';
  color: var(--color-danger);
}

/* Error message */
.field-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin-top: 4px;
}
```

---

### 6.8 Data Table (Attio style — Pin 8)

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-n400);
  border-bottom: 1px solid var(--color-n200);
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: var(--color-n000);
  z-index: 1;
}
.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-n100);
  color: var(--color-n900);
  vertical-align: middle;
}
.data-table tr:hover td {
  background: var(--color-n100);
}
/* Numeric columns — right align */
.data-table td.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
/* "AI is thinking" cell state */
.cell--ai-loading {
  color: var(--color-n400);
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cell--ai-loading::before {
  content: '';
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--color-brand);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
```

---

### 6.9 Circular Progress (Dashboard widget — Pin 4)

```css
.ring-progress {
  position: relative;
  width: 120px;
  height: 120px;
}
.ring-progress svg {
  transform: rotate(-90deg);
}
.ring-progress__track {
  fill: none;
  stroke: rgba(255,255,255,0.2);   /* inside accent card = white track */
  stroke-width: 8;
}
.ring-progress__bar {
  fill: none;
  stroke: white;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ring-progress__label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
}

/* Usage: stroke-dasharray="circumference" stroke-dashoffset="circumference * (1 - progress)" */
/* r=52 → circumference = 2π×52 ≈ 326.7 */
```

---

### 6.10 Toggle Switch

```css
.toggle {
  position: relative;
  width: 40px;
  height: 22px;
}
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle__slider {
  position: absolute;
  inset: 0;
  background: var(--color-n300);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background 200ms ease;
}
.toggle__slider::after {
  content: '';
  position: absolute;
  left: 3px; top: 3px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: white;
  box-shadow: var(--shadow-xs);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.toggle input:checked + .toggle__slider { background: var(--color-brand); }
.toggle input:checked + .toggle__slider::after { transform: translateX(18px); }
```

---

### 6.11 Modal / Drawer

```css
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 200;
  animation: fade-in 200ms ease;
}

/* Center Modal */
.modal {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-n000);
  border-radius: var(--radius-xl);
  padding: var(--padding-modal);
  min-width: 480px;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  z-index: 201;
  animation: modal-enter 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes modal-enter {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}

/* Right Drawer */
.drawer {
  position: fixed;
  top: 0; right: 0;
  width: 480px;
  height: 100vh;
  background: var(--color-n000);
  box-shadow: -8px 0 32px rgba(0,0,0,0.12);
  z-index: 201;
  overflow-y: auto;
  padding: 32px;
  animation: drawer-enter 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes drawer-enter {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
```

---

### 6.12 Toast Notifications

```css
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 500;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: var(--color-n900);
  color: white;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  pointer-events: all;
  min-width: 280px;
  animation: toast-enter 200ms ease;
}
.toast--success { background: var(--color-success); }
.toast--error   { background: var(--color-danger); }
.toast--warning { background: var(--color-warning); color: var(--color-n900); }
@keyframes toast-enter {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

---

### 6.13 Connector Lines (Attio workflow — Pin 10 / Müştərilər)

```css
.workflow-canvas {
  position: relative;
  background: var(--color-canvas);
  background-image: radial-gradient(circle, var(--color-canvas-dots) 1px, transparent 1px);
  background-size: 20px 20px;
}
.workflow-node {
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  box-shadow: var(--shadow-sm);
  position: relative;
}
.workflow-node__title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-n900);
}
.workflow-node__body {
  font-size: var(--text-sm);
  color: var(--color-n600);
  margin-top: 6px;
}
.workflow-node__ai-badge {
  position: absolute;
  top: 14px; right: 14px;
}
/* Connector lines: SVG drawn between nodes */
/* stroke: #C4BAFF (brand-border), stroke-width: 2, stroke-dasharray: none */
/* Curves: SVG path with cubic bezier control points */
```

---

## 7. Motion System

### 7.1 Principles
- **Purpose over decoration:** every animation communicates something (state change, relationship, direction)
- **Duration budget:** page transitions ≤ 200ms, micro-interactions ≤ 150ms, MIRAI blobs = ambient (infinite, slow)
- **One easing:** `cubic-bezier(0.4, 0, 0.2, 1)` — Material's standard easing — for all transitions except spring animations
- **No bounces** in data-dense views (tables, kanban). Bounces only in MIRAI and celebration states

### 7.2 Global Transitions

```css
/* Apply to interactive elements only, not layout */
button, a, .card, input, select, .nav-item, .status-badge, .pill {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

### 7.3 Page Transitions

```css
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-content {
  animation: page-enter 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 7.4 Staggered Card Entrance

```css
@keyframes card-enter {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Apply via JS: each card gets animation-delay based on index */
/* delay = index * 40ms, max 200ms (cap at 5 cards) */
.card {
  animation: card-enter 200ms cubic-bezier(0.4, 0, 0.2, 1) both;
}
```

```js
// React implementation
cards.map((card, i) => (
  <Card
    key={card.id}
    style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
  />
))
```

### 7.5 Kanban Drag & Drop

- Dragging card: `rotate(2deg) scale(1.02)`, `box-shadow: var(--shadow-lg)`, cursor = grabbing
- Drop target column: `background: var(--color-brand-light)`, `border: 2px dashed var(--color-brand)` — highlights the whole column
- Drop animation: card enters column with `scale(0.95) → 1.0` over 150ms
- Column height: animates smoothly when card added/removed (CSS grid height transition)

### 7.6 MIRAI Blob Animation

```css
@keyframes blob-drift-1 {
  0%, 100% { transform: scale(1) rotate(0deg) translate(0, 0); }
  25%  { transform: scale(1.04) rotate(2deg) translate(4px, -6px); }
  50%  { transform: scale(0.97) rotate(-1deg) translate(-3px, 4px); }
  75%  { transform: scale(1.02) rotate(1.5deg) translate(2px, -3px); }
}
@keyframes blob-drift-2 {
  0%, 100% { transform: scale(1) rotate(0deg) translate(0, 0); }
  33%  { transform: scale(1.06) rotate(-2deg) translate(-5px, 3px); }
  66%  { transform: scale(0.96) rotate(1deg) translate(4px, -5px); }
}
@keyframes blob-drift-3 {
  0%, 100% { transform: scale(1) rotate(0deg) translate(0, 0); }
  40%  { transform: scale(1.03) rotate(3deg) translate(3px, 5px); }
  80%  { transform: scale(0.98) rotate(-2deg) translate(-4px, -3px); }
}

.mirai-blob-1 { animation: blob-drift-1 8s ease-in-out infinite; }
.mirai-blob-2 { animation: blob-drift-2 10s ease-in-out infinite; }
.mirai-blob-3 { animation: blob-drift-3 12s ease-in-out infinite; }
```

### 7.7 Sidebar Nav Active Indicator

```css
.nav-item {
  position: relative;
}
.nav-item__indicator {
  position: absolute;
  left: -16px;   /* flush with sidebar left edge */
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--color-brand);
  border-radius: 2px;
  transition: height 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-item--active .nav-item__indicator {
  height: 20px;
}
```

### 7.8 Skeleton Loading States

```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-n200) 25%,
    var(--color-n100) 50%,
    var(--color-n200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-xs);
}
/* Usage: <div class="skeleton" style="height: 20px; width: 60%;"></div> */
```

---

## 8. Page-by-Page Design Specifications

### 8.1 Giriş (Login) — Pin 9 style

**Canvas:** `#F4F5F7` + very fine grid lines (1px `rgba(0,0,0,0.06)`, 40px spacing — NOT dots, grid lines for login only)

**Layout:**
```
- Left half: decorative area
  - Reflect logo top-left
  - Isometric outline hexagons (SVG, no fill, 1px stroke #9CA3AF) scattered top-right
  - Tagline below hexagons: "Reflecting Excellence" (Rubik 400 italic, #9CA3AF)
  
- Right half: centered login card
  - Card: white, radius 20px, shadow-md, width 400px, padding 40px
  - "Xoş gəldiniz" — Rubik 700 32px, #1A1A1A
  - "Hesabınıza daxil olun" — Rubik 400 15px, #6B7280
  - [Email input]
  - [Şifrə input + show/hide]
  - [Şifrəni unutdum? — right-aligned link]
  - [Daxil ol — full width primary button]
  - Invite-only note: "Platforma yalnız dəvətlə əlçatandır" — centered, #9CA3AF, 13px
```

---

### 8.2 Dashboard — Pin 3 + Pin 4 hybrid

**Header bar (64px, sticky):**
- Left: "Salam, Talifa 👋" (Rubik 600 20px) + today's date (400 14px #6B7280)
- Right: Notification bell + Avatar

**Bento Grid layout (default):**
```
Row 1: [Active Projects — 8col accent card] [Quick Actions — 4col white card]
Row 2: [My Tasks Today — 6col] [Finance Snapshot — 6col featured card]
Row 3: [Team Workload — 8col] [Upcoming Deadlines — 4col]
Row 4: [Activity Feed — 12col]
```

**Active Projects accent card (--grad-feature background):**
- UPPERCASE label "AKTİV LAYİHƏLƏR" (xs, white 70%)
- Large number (3xl, white, bold)
- Mini list of project names below (sm, white 80%)
- "Hamısına bax →" bottom link (white, underline)

**Finance Snapshot (featured gradient border card):**
- "Bu ay" label
- 3 numbers: Gəlir / Xərc / Balans (tabular numerals, color-coded)
- Month progress bar (thin, indigo)

**Activity Feed:**
- Attio-style compact rows
- Avatar (24px) + "[Name] [action] [entity link]" + timestamp right
- Filter pills above: Hamısı / Tapşırıqlar / Layihələr / Maliyyə

---

### 8.3 Layihələr (Projects) — Pin 7 folder style

**View toggle top-right:** Grid / Cədvəl (table)

**Grid view:**
- 3 column grid (desktop), 2 column (tablet)
- Folder cards (gradient header, white body)
- Each card: phase gradient header (120px) + project name + client + deadline + completion ring + avatar stack + expertise badge
- Filter bar: status (Aktiv/Tamamlandı/Arxiv) + phase multi-select + sort

**Empty state:**
- Centered gradient blob illustration (small, MIRAI-inspired)
- "Hələ heç bir layihə yoxdur"
- "+ Yeni layihə yarat" primary button

---

### 8.4 Tapşırıqlar (Tasks) — 7-column Kanban

**Header:**
- View toggle: Kanban / Cədvəl / Mənim Tapşırıqlarım (3 tabs with sliding underline)
- Filters right: Layihə select + Məsul select
- "Arxivlə" ghost button + "Yeni tapşırıq" primary button

**Kanban:**
- 7 columns, `min-width: 280px` each, horizontal scroll
- Column header: status dot + label (Rubik 500 13px) + task count badge
- Column body: task cards + dashed "+ Əlavə et" button at bottom
- Column drag-over highlight: indigo dashed border + light tint background

**Cancel Dialog (Cancelled status):**
```
Modal, centered, width 400px
"Bu tapşırığı ləğv etmək istəyirsiniz?" (600 18px)
Reason select: radio list or pill buttons
  ○ Müştəri imtina etdi
  ○ Layihə dəyişdi
  ○ Texniki problem
  ○ Yenidən planlaşdırılır
  ○ Digər (text input appears)
[Ləğv et — danger button] [Geri — ghost button]
```

---

### 8.5 Müştərilər (CRM) — Pin 10 + Attio table

**View toggle:** Pipeline / Cədvəl / [selected client detail]

**Pipeline (Attio workflow style):**
- Dots canvas background (standard)
- Stage columns: 6 active stages, each with header showing stage name + total expected value
- Client cards: Attio workflow card style (white, border, connector lines between related cards)
- AI badge on cards with ICP Fit score
- "AI is thinking..." animated state

**Table view (Pin 8):**
- Columns: Şirkət (logo + name), Əlaqə, Mərhələ, Gözlənilən dəyər, Ehtimal %, Son aktivlik, ICP Fit (AI), Əlaqə gücü
- Sticky header, hover row highlight
- Sortable: click column header
- Numeric columns right-aligned, tabular numerals

**Client Detail (right drawer, 480px):**
- Header: logo + name + stage badge + "Mərhələni dəyiş" dropdown
- Tabs: Ümumi / Qeydlər / Sənədlər / Sorğular
- Ümumi: contact info, expected value, confidence slider, close date
- Qeydlər: activity feed + quick log input
- Sənədlər: attached documents list
- Sorğular: sent surveys + NPS score

---

### 8.6 Maliyyə Mərkəzi (Finance)

**Top tabs:** Cash Cockpit / P&L / Outsource / Xərclər / Debitor / Forecast

**Cash Cockpit:**
- Featured card (gradient border): Balance number, large, center
- 3 metric cards below: Gəlir / Xərc / Gözlənilən (pending)
- Recent transactions: compact table, date / description / project / amount (color coded)

**Outsource tab:**
- Standard table view
- Columns visible to all: Layihə / İş növü / Məsul / Deadline / Status
- Columns visible to admin only: Məbləğ / Ödəniş tarixi / Metod
- Non-admin sees "--" in those cells

---

### 8.7 MIRAI — Pin 1 style

**Canvas:** `#EBEBEB` (slightly darker than app canvas — creates isolation/focus)

**Blob arrangement (3 blobs, large, blurred, animating):**
```
Left blob:   pink/rose gradient  → "Operational Intelligence" label below
Center blob: yellow/amber        → "Spatial Intelligence" label below  
Right blob:  orange/white        → "Artistic Intelligence" label below
```

```css
.mirai-blob {
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.75;
  position: absolute;
}
.mirai-blob--1 {
  width: 300px; height: 300px;
  background: radial-gradient(circle at 40% 40%, #FFB5C8, #EEA0FF);
  top: 10%; left: 8%;
}
.mirai-blob--2 {
  width: 260px; height: 260px;
  background: radial-gradient(circle at 60% 50%, #FFE082, #FFA07A);
  top: 15%; left: 38%;
}
.mirai-blob--3 {
  width: 280px; height: 280px;
  background: radial-gradient(circle at 50% 40%, #FFD700, #FFFFFF);
  top: 8%; right: 8%;
}
```

**Geometric node overlay:** SVG lines connecting dots at blob centers and edges (1px stroke `#1A1A1A`, dots r=3)

**Chat interface:**
- Positioned bottom half of screen
- Persona selector: 6 pill buttons (admin) or 1 (user), scrollable horizontal
- Chat history: above input, scrollable, max-height calc(100vh - 340px)
- Input: 48px height, radius-2xl, white background, indigo focus
- Streaming: cursor blinks at end of generating text
- User bubble: right-aligned, `--color-brand-light` bg
- MIRAI bubble: left-aligned, white card, persona label above

---

### 8.8 Elanlar (Announcements) — Pin 2 Whenevr style

**Layout:**
```
[Featured card — full width, 480px height]
[3-column card grid below]
```

**Featured card:**
- Left half: full-bleed image or gradient fill (category-dependent)
- Right half: white background
  - Category pill top
  - Title: Rubik 700 28px, tight line height
  - Description: 400 15px, #6B7280, max 3 lines
  - Bottom: "5 dəq oxu" + dot + date
- Overall radius: 16px, overflow hidden

**Grid cards:**
- Image/gradient top (fixed height 160px)
- Category pill overlaid top-right of image area
- Title: Rubik 600 17px below
- Description: 2 lines max, #6B7280

**Category pills filter bar:**
- Horizontal scrollable
- Active: `--color-brand` bg, white text
- Inactive: `--color-n100` bg, `--color-n600` text

---

### 8.9 Sənədlər (Documents) — Attio table + folder

**Top:** Category tabs (Hamısı / Müqavilə / Faktura / Akt / Məktub / Ekspertiza aktı)

**Table columns:** İkon + Başlıq / Layihə / Müştəri / Tarix / Mənbə / Paylaş

- Mənbə badge: "Drive linki" (gray pill) / "Avtomatik" (indigo pill) / "Email" (green pill)
- Paylaş: copy icon → toast "Link kopyalandı"
- Row click → preview drawer right

**Document preview drawer:**
- For Drive links: iframe embed attempt, fallback to "Drive-da aç" button
- For auto-generated: rendered HTML template, "PDF yüklə" button
- Share token QR code (bottom of drawer)

---

## 9. Accessibility Requirements

```
WCAG AA minimum — non-negotiable:

Contrast ratios:
  Normal text: ≥ 4.5:1
  Large text (≥18px bold): ≥ 3:1
  UI components: ≥ 3:1

Spot checks:
  #5A4EFF on #FFFFFF  = 5.8:1 ✅
  #6B7280 on #FFFFFF  = 4.6:1 ✅
  #1A1A1A on #F4F5F7  = 16:1  ✅
  white on #5A4EFF    = 5.8:1 ✅
  #F59E0B on #FFFFFF  = 2.9:1 ⚠️ — use #D97706 instead for warning text

Focus rings:
  All interactive elements: 3px solid var(--color-brand) offset 2px
  No outline:none without visible alternative

Keyboard navigation:
  Tab order follows visual order
  Modal traps focus (tabindex=-1 on backdrop)
  Escape closes modals/drawers
  Arrow keys navigate kanban columns (when card focused)

Screen reader:
  Status badges: aria-label="Status: İcrada"
  Avatar stacks: aria-label="Assigned to: Anar, Leyla and 2 others"
  Drag cards: aria-grabbed, aria-dropeffect
  Progress rings: aria-valuenow, aria-valuemin, aria-valuemax
```

---

## 10. Tailwind Config

```js
// tailwind.config.cjs
const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', ...fontFamily.sans],
      },
      colors: {
        brand: {
          DEFAULT: '#5A4EFF',
          hover:   '#4A3EEF',
          light:   '#EEE9FF',
          border:  '#C4BAFF',
        },
        canvas: '#F4F5F7',
        sidebar: {
          DEFAULT: '#0F0F0F',
          hover:   '#1F1F1F',
          border:  '#2A2A2A',
          text:    '#A1A1AA',
        },
      },
      borderRadius: {
        card:  '16px',
        'card-lg': '20px',
        chat:  '28px',
      },
      boxShadow: {
        card:  '0 2px 8px rgba(0,0,0,0.06)',
        hover: '0 8px 24px rgba(90,78,255,0.12)',
        brand: '0 4px 20px rgba(90,78,255,0.20)',
      },
      backgroundImage: {
        dots: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)',
        'grad-folder':  'linear-gradient(135deg, #FFE082 0%, #EEA0FF 55%, #B5C8FF 100%)',
        'grad-feature': 'linear-gradient(135deg, #5A4EFF 0%, #9B7FFF 100%)',
        'grad-border':  'linear-gradient(135deg, #FFB347 0%, #EEA0FF 50%, #5A4EFF 100%)',
        'grad-mirai':   'linear-gradient(135deg, #FFB5C8 0%, #FFE082 40%, #B5ECFF 100%)',
      },
      backgroundSize: {
        dots: '20px 20px',
      },
      animation: {
        'page-enter':  'page-enter 200ms cubic-bezier(0.4,0,0.2,1)',
        'card-enter':  'card-enter 200ms cubic-bezier(0.4,0,0.2,1) both',
        'blob-drift':  'blob-drift 8s ease-in-out infinite',
        shimmer:       'shimmer 1.5s ease-in-out infinite',
        pulse:         'pulse 1.2s ease-in-out infinite',
      },
      keyframes: {
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## 11. Global CSS — `src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: 'Rubik', system-ui, -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: #1A1A1A;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* App canvas with dots */
.app-canvas {
  background-color: #F4F5F7;
  background-image: radial-gradient(circle, #D1D5DB 1px, transparent 1px);
  background-size: 20px 20px;
  min-height: 100vh;
}

/* Tabular numerals for all financial data */
.tabular { font-variant-numeric: tabular-nums; }

/* Text truncation utilities */
.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Focus ring system */
:focus-visible {
  outline: 3px solid #5A4EFF;
  outline-offset: 2px;
  border-radius: 4px;
}
:focus:not(:focus-visible) { outline: none; }

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

/* Selection */
::selection { background: #EEE9FF; color: #5A4EFF; }
```

---

*Last updated: 2026-05-03*  
*Next review: After first component implementation review*
