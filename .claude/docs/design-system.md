# Reflect Architects OS — Design System
**Version:** 2.0 (aligned to PRD v3.0)
**Date:** 2026-05-03
**Lead Designer:** Principal Designer II
**Companion to:** `.claude/docs/PRD.md` (v3.0)
**References:** Attio (login + workflow + table), Whenevr (editorial), FUTURE (bento), Time Tracker (widgets), Wallet cards (depth), Rubik palette, Folder card

---

## 0. How to read this document

This document owns the **how it looks and feels**. The PRD owns the **what and why**. Every visual rule here maps to a PRD requirement (`REQ-*`) or user story (`US-*`); cross-references are inline.

- §1–5 (Part 1, this file): Philosophy, color, typography, spacing, layout — the foundations every component depends on
- §6–8 (Part 2): Component library, motion, accessibility, i18n, state patterns
- §9–12 (Part 3): Page-by-page specs (one per PRD module), Tailwind config, global CSS, design DoD

Three rules that cannot break (carried from v1.0):
1. The dark sidebar `#0F0F0F` never becomes light — it is Reflect's visual signature
2. Gradient surfaces appear only in 3 contexts: MIRAI page (§9.11), card hero areas (folders, projects), featured dashboard widget. Everywhere else = white + indigo
3. Rubik at every size. No mixing fonts.

A fourth rule new in v2.0:
4. **Hidden ≠ secure.** Visual concealment of admin-only data (financials, salaries, outsource amounts) must be paired with RLS at the database layer (PRD §9.1). When a non-admin renders a finance widget, the API must return masked zero values, not absent rows — keeps layout stable, and hidden ≠ leaked.

---

## 1. Design Philosophy

Reflect Architects OS has one job: make a complex firm feel simple to run.

The visual language is **architectural precision meets organic warmth**. Like a well-designed studio — clean surfaces, meaningful materials, nothing decorative without purpose. The dots canvas is the drawing board. White cards are the sheets of paper on it. The dark sidebar is the wall that holds everything together. Gradient accents appear exactly where the eye needs to land — nowhere else.

### 1.1 Voice in pixels
- **Speed over completeness.** A 60-second task creation beats a 6-field "perfect" form (PRD §1.4 #3). Every screen is auditable for friction by counting the number of clicks, fields, and modal layers between intent and saved state.
- **Architect-native vocabulary.** Phases, expertise badges, Bakı timezone, AZN currency. The UI never reads as a translated SaaS shell.
- **AI is an assistant, not an authority.** MIRAI surfaces with a distinct chrome (gradient blobs, persona pill above bubble) so its outputs are never visually mistaken for user-authored data. It cites sources or says it doesn't know (PRD §7.4).

### 1.2 Visual axioms
| Axiom | Manifestation |
|---|---|
| Calm canvas, loud action | Dots `#D1D5DB` on `#F4F5F7` is intentionally low-contrast so cards and gradients pop |
| One accent color | `#5A4EFF` indigo for every primary action across the entire product |
| Type carries the hierarchy | Weight + size + tracking, not borders or boxes |
| Density is earned, not default | Tables are dense; dashboards are spacious. Match density to task |
| Motion communicates state | Drag tilts, status flips animate the dot and color, MIRAI blobs drift slowly while idle |

---

## 2. Color System

### 2.1 Full Token Map

All tokens are CSS custom properties on `:root`. Tailwind names (§10) map 1:1 to these.

```css
:root {
  /* ── CANVAS ── */
  --color-canvas:        #F4F5F7;   /* page background — warm off-white */
  --color-canvas-dots:   #D1D5DB;   /* dot color — 1px on 20px grid */
  --color-canvas-mirai:  #EBEBEB;   /* MIRAI page only — slightly darker for focus */

  /* ── BRAND ── */
  --color-brand:         #5A4EFF;   /* indigo — primary accent */
  --color-brand-hover:   #4A3EEF;   /* indigo darkened 10% for hover */
  --color-brand-light:   #EEE9FF;   /* indigo tint — hover bg, badge bg */
  --color-brand-border:  #C4BAFF;   /* indigo border — focus rings, connector lines */

  /* ── NEUTRALS ── */
  --color-n900: #1A1A1A;            /* primary text, headings */
  --color-n800: #2D2D2D;            /* secondary headings */
  --color-n700: #4B5563;            /* body in dense tables, table cells */
  --color-n600: #6B7280;            /* secondary text, labels, placeholders */
  --color-n400: #9CA3AF;            /* disabled text, timestamps, dot canvas */
  --color-n300: #D1D5DB;            /* dividers, input borders */
  --color-n200: #E5E7EB;            /* card borders, table lines */
  --color-n100: #F9FAFB;            /* inner card bg, table row alt */
  --color-n000: #FFFFFF;            /* card surface, modal bg */

  /* ── SIDEBAR (always dark) ── */
  --color-sidebar-bg:        #0F0F0F;
  --color-sidebar-text:      #A1A1AA;
  --color-sidebar-active:    #FFFFFF;
  --color-sidebar-hover:     #1F1F1F;
  --color-sidebar-border:    #2A2A2A;
  --color-sidebar-indicator: #5A4EFF;
  --color-sidebar-section:   #6B7280;   /* uppercase section labels */

  /* ── SEMANTIC — TASK STATUS (PRD §5 MOD 4, 7-status model) ── */
  --color-status-ideas:        #A78BFA;  /* İdeyalar */
  --color-status-ideas-bg:     #FAF5FF;
  --color-status-ideas-border: #E9D5FF;

  --color-status-queued:        #94A3B8; /* başlanmayıb */
  --color-status-queued-bg:     #F8FAFC;
  --color-status-queued-border: #E2E8F0;

  --color-status-active:        #3B82F6; /* İcrada */
  --color-status-active-bg:     #EFF6FF;
  --color-status-active-border: #BFDBFE;

  --color-status-review:        #F59E0B; /* Yoxlamada */
  --color-status-review-bg:     #FFFBEB;
  --color-status-review-border: #FDE68A;

  --color-status-expert:        #8B5CF6; /* Ekspertizada */
  --color-status-expert-bg:     #F5F3FF;
  --color-status-expert-border: #DDD6FE;

  --color-status-done:        #22C55E;   /* Tamamlandı */
  --color-status-done-bg:     #F0FDF4;
  --color-status-done-border: #BBF7D0;

  --color-status-cancel:        #EF4444; /* Cancelled */
  --color-status-cancel-bg:     #FEF2F2;
  --color-status-cancel-border: #FECACA;

  /* ── SEMANTIC — UTILITY ── */
  --color-success:        #22C55E;
  --color-success-bg:     #F0FDF4;
  --color-success-border: #BBF7D0;

  --color-warning:        #D97706;       /* WCAG-safe warning text (replaces #F59E0B for text) */
  --color-warning-bg:     #FFFBEB;
  --color-warning-border: #FDE68A;
  --color-warning-icon:   #F59E0B;       /* warning icon/dot color where text contrast not required */

  --color-danger:         #EF4444;
  --color-danger-bg:      #FEF2F2;
  --color-danger-border:  #FECACA;

  --color-info:           #3B82F6;
  --color-info-bg:        #EFF6FF;
  --color-info-border:    #BFDBFE;

  /* ── SEMANTIC — TASK HEALTH (PRD REQ-DASH-04) ── */
  --color-health-ok:    #22C55E;   /* deadline ≥ 14d */
  --color-health-warn:  #D97706;   /* deadline < 14d */
  --color-health-crit:  #EF4444;   /* deadline < 3d or overdue */

  /* ── GRADIENTS — contextual only (Rule #2) ── */
  --grad-mirai-1:  radial-gradient(circle at 40% 40%, #FFB5C8, #EEA0FF);
  --grad-mirai-2:  radial-gradient(circle at 60% 50%, #FFE082, #FFA07A);
  --grad-mirai-3:  radial-gradient(circle at 50% 40%, #FFD700, #FFFFFF);
  --grad-folder:   linear-gradient(135deg, #FFE082 0%, #EEA0FF 55%, #B5C8FF 100%);
  --grad-feature:  linear-gradient(135deg, #5A4EFF 0%, #9B7FFF 100%);
  --grad-border:   linear-gradient(135deg, #FFB347 0%, #EEA0FF 50%, #5A4EFF 100%);
  --grad-green:    linear-gradient(135deg, #4ADE80 0%, #22C55E 100%);

  /* ── SHADOWS ── */
  --shadow-xs:    0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm:    0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md:    0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg:    0 8px 32px rgba(0, 0, 0, 0.10);
  --shadow-xl:    0 16px 48px rgba(0, 0, 0, 0.14);
  --shadow-brand: 0 4px 20px rgba(90, 78, 255, 0.20);
  --shadow-hover: 0 8px 24px rgba(90, 78, 255, 0.12);
  --shadow-drawer:-8px 0 32px rgba(0, 0, 0, 0.12);

  /* ── RADIUS ── */
  --radius-xs:   4px;     /* badges, pills, focus offset */
  --radius-sm:   8px;     /* inputs, small buttons, sidebar nav items */
  --radius-md:   12px;    /* dropdowns, tooltips, kanban task cards */
  --radius-lg:   16px;    /* cards (standard) */
  --radius-xl:   20px;    /* folder cards, modals, login card */
  --radius-2xl:  28px;    /* MIRAI chat bubbles */
  --radius-full: 9999px;  /* avatars, status dots, toggles */
}
```

### 2.2 Task Status — single source of truth

The PRD's 7-status model (PRD §5 MODULE 4) renders identically everywhere it appears: kanban column header, task card pill, archive list, dashboard "my tasks" rows.

| Status (AZ) | Semantic key | Text | BG | Border | Dot |
|---|---|---|---|---|---|
| İdeyalar | `ideas` | `#A78BFA` | `#FAF5FF` | `#E9D5FF` | `#A78BFA` |
| başlanmayıb | `queued` | `#94A3B8` | `#F8FAFC` | `#E2E8F0` | `#94A3B8` |
| İcrada | `active` | `#3B82F6` | `#EFF6FF` | `#BFDBFE` | `#3B82F6` |
| Yoxlamada | `review` | `#D97706` | `#FFFBEB` | `#FDE68A` | `#F59E0B` |
| Ekspertizada | `expert` | `#8B5CF6` | `#F5F3FF` | `#DDD6FE` | `#8B5CF6` |
| Tamamlandı | `done` | `#22C55E` | `#F0FDF4` | `#BBF7D0` | `#22C55E` |
| Cancelled | `cancel` | `#EF4444` | `#FEF2F2` | `#FECACA` | `#EF4444` |

> Yoxlamada uses `#D97706` for text (WCAG AA) and `#F59E0B` for the dot only.

### 2.3 Pipeline Stage Color Map (PRD §5 MODULE 6, 8 stages)

| Stage (AZ) | Color | Confidence |
|---|---|---|
| Lead | `#6B7280` | 10% |
| Təklif | `#3B82F6` | 30% |
| Müzakirə | `#D97706` | 50% |
| İmzalanıb | `#8B5CF6` | 75% |
| İcrada | `#22C55E` | 95% |
| Portfolio | `#10B981` | 100% |
| Udulan | `#EF4444` | 0% |
| Arxiv | `#9CA3AF` | — |

Used in: pipeline kanban headers, client card stage badge, table stage cell, drawer header chip.

### 2.4 Project Phase Gradients (PRD §5 MODULE 3)

Folder cards (§9.4) use phase-specific gradients in their 120px hero. Phases come from `projects.phases[]` (PRD §3.2). When a project carries multiple phases, the *latest active* phase drives the gradient.

```js
export const PHASE_GRADIENTS = {
  'Konsepsiya':    'linear-gradient(135deg, #FFE082 0%, #FFA07A 100%)',
  'SD':            'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)',
  'DD':            'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
  'CD':            'linear-gradient(135deg, #5A4EFF 0%, #9B7FFF 100%)',
  'Tender':        'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  'İcra nəzarəti': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
};
```

### 2.5 Health Color Rule (PRD REQ-DASH-04)

Deadline coloring is global — applies to dashboard widgets, kanban deadline badges, project cards, archive rows.

```
green  (#22C55E)  →  ≥ 14 days remaining
amber  (#D97706)  →  < 14 days
red    (#EF4444)  →  < 3 days OR overdue
```

All date math runs in `Asia/Baku` per PRD REQ-FIN-09.

---

## 3. Typography

### 3.1 Font

**Rubik** is the only typeface across the product. Loaded once in `index.html`, swap=swap so first paint is never blocked.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
```

```css
body {
  font-family: 'Rubik', system-ui, -apple-system, sans-serif;
  font-feature-settings: 'kern' 1, 'liga' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 3.2 Type Scale

```css
:root {
  --text-2xs:  10px;   /* timestamps on mobile, overflow badges */
  --text-xs:   11px;   /* timestamps, meta labels, UPPERCASE labels */
  --text-sm:   13px;   /* secondary labels, table cells */
  --text-base: 15px;   /* body text, card content, inputs */
  --text-lg:   17px;   /* card titles, section item titles */
  --text-xl:   20px;   /* section headers, modal titles */
  --text-2xl:  24px;   /* page titles */
  --text-3xl:  32px;   /* dashboard hero stats */
  --text-4xl:  48px;   /* MIRAI display, Elanlar hero */
  --text-5xl:  64px;   /* login hero (display only) */

  --leading-tight:   1.2;
  --leading-normal:  1.5;
  --leading-relaxed: 1.65;

  --tracking-tight:   -0.02em;   /* large headings ≥ 32px */
  --tracking-normal:   0;
  --tracking-wide:     0.04em;   /* table headers, widget labels */
  --tracking-widest:   0.08em;   /* metadata tags, nav section labels */
}
```

### 3.3 Usage Rules

| Context | Size | Weight | Tracking | Notes |
|---|---|---|---|---|
| Page title | `--text-2xl` | 700 | tight | One per page |
| Section header | `--text-xl` | 600 | normal | |
| Card title | `--text-lg` | 600 | normal | |
| Body / card content | `--text-base` | 400 | normal | |
| Secondary label | `--text-sm` | 500 | normal | |
| Timestamp / meta | `--text-xs` | 400 | normal | Relative ("3 dəq əvvəl") in Asia/Baku |
| Widget stat number | `--text-3xl` | 700 | tight | Tabular numerals for finance |
| Hero number (MIRAI / Elanlar) | `--text-4xl` | 800 | tight | |
| UPPERCASE widget label | `--text-xs` | 600 | widest | Only above stat numbers |
| Sidebar section label | `--text-xs` | 600 | widest | uppercase, `--color-sidebar-section` |
| Table header | `--text-xs` | 600 | wide | uppercase, `--color-n400` |
| Tabular finance | `--text-base` | 600 | normal | `font-variant-numeric: tabular-nums` |
| Code / token (dev) | `--text-sm` | 500 | normal | `font-family: 'JetBrains Mono'` if dev surface |

Use *tabular numerals* on every column where numbers are compared vertically (incomes, expenses, balances, NPS, OKR progress %).

---

## 4. Spacing System

8pt base grid. All spacing values are multiples of 4px. Never invent in-between values.

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

  /* Standard component padding */
  --padding-card:    20px 24px;     /* standard card */
  --padding-card-sm: 16px 20px;     /* compact card (kanban, list rows) */
  --padding-modal:   32px;          /* modal/drawer */
  --padding-input:   10px 14px;     /* input fields */
  --padding-btn-sm:  8px 14px;
  --padding-btn-md:  10px 18px;
  --padding-btn-lg:  12px 24px;
  --padding-page:    32px;          /* desktop page padding */
  --padding-page-md: 24px;          /* tablet */
  --padding-page-sm: 16px;          /* mobile (PRD §9.5) */
}
```

### 4.1 Density Rules

- **Dashboards:** spacious — gap 16px between bento cards, 24–32px page padding
- **Tables (Maliyyə, Müştərilər, Sənədlər):** compact — 12px row, 16px column padding, 1px row dividers
- **Kanban:** medium — 12px gap between cards, 280px column min-width, 14px card padding
- **Modals:** spacious — 32px padding, 24px gap between fields
- **Drawers:** medium — 32px padding, 16px gap between sections

---

## 5. Layout System

### 5.1 App Shell

```
┌─────────────────────────────────────────────────────┐
│ SIDEBAR 240px   │ HEADER BAR 64px sticky            │
│ #0F0F0F fixed   ├───────────────────────────────────┤
│                 │ CONTENT AREA                       │
│ [Logo 32px]     │ bg: #F4F5F7 + dots                 │
│                 │                                    │
│ [Nav groups]    │ [Page header — title + actions]    │
│                 │                                    │
│                 │ [Page content — bento / kanban /   │
│                 │  table / detail]                   │
│ [User profile]  │                                    │
└─────────────────────────────────────────────────────┘
```

#### 5.1.1 Sidebar specs

- Width: 240px fixed (not collapsible in v1)
- Padding: 16px horizontal, 20px top
- Logo block: 56px height — logo mark (32px) + "Reflect" wordmark (Rubik 600 18px, white)
- Nav section label: `--text-xs` `--tracking-widest` `--color-sidebar-section` uppercase, padding-top 24px
- Nav item: 40px height, `radius-sm`, padding `0 12px`, gap 10px between icon (18px) and label
- Nav item hover: `--color-sidebar-hover` bg
- Active item: white text + 3px × 20px `--color-sidebar-indicator` bar absolutely positioned at left edge (animation §7.7)
- User block at bottom: 64px height, avatar `--md` (32px) + name + role badge

#### 5.1.2 Sidebar — admin / user nav variants (PRD §4)

The same sidebar component renders different groups based on `useRoleLevel()`. **Visibility never substitutes for RLS** (Rule #4); nav is one of two layers.

**Admin / Creator (level ≤ 2):**
```
İŞ
  · Dashboard
  · Layihələr
  · Tapşırıqlar
  · Arxiv
  · Podrat İşləri

MÜŞTƏRİLƏR
  · Müştərilər

MALİYYƏ MƏRKƏZİ
  · Maliyyə Mərkəzi

KOMANDA
  · İşçi Heyəti
  · Əmək Haqqı
  · Performans
  · Məzuniyyət
  · Təqvim
  · Elanlar
  · Avadanlıq

ŞİRKƏT
  · OKR
  · Karyera Strukturu
  · Məzmun Planlaması

SİSTEM
  · Parametrlər
```

**Member / External (level ≥ 4):**
```
İŞ
  · Dashboard
  · Layihələr           (no financials inside)
  · Tapşırıqlar
  · Arxiv               (own scope only)

KOMANDA
  · Əmək Haqqı          (self only)
  · Performans          (self only)
  · Məzuniyyət
  · Təqvim
  · Elanlar

ŞİRKƏT
  · OKR                 (self only)
  · Karyera Strukturu   (read + promotion path)
```

Removed nav items (PRD §4): **Sənəd Arxivi** (data → `project_documents`), **Qaynaqlar** (PDFs → Parametrlər → Bilik Bazası). The pages are no longer routable, but the underlying data is preserved per PRD §10.

#### 5.1.3 Content area

- Left margin: 240px (matches sidebar width)
- Background: `--color-canvas` + dots (§5.2)
- Top header bar: 64px white sticky, `border-bottom: 1px solid var(--color-n200)`
  - Left: Page title (or breadcrumb on detail pages) + Cmd+K trigger
  - Right: notification bell, MIRAI launch button, avatar dropdown
- Page padding: `--padding-page` (32px desktop) / `--padding-page-md` (24px tablet) / `--padding-page-sm` (16px mobile)

### 5.2 Dots Background

```css
.app-canvas {
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

The dot canvas appears on every authenticated page **except**:
- Login (§9.1) — replaced by 40px grid lines for editorial feel
- MIRAI page (§9.11) — replaced by `--color-canvas-mirai` + blob layer
- Modals/drawers — solid white surface

### 5.3 Bento Grid (Dashboard)

12-column fluid grid, 16px gap.

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
  padding: 24px 32px;
}

.col-3  { grid-column: span 3;  }
.col-4  { grid-column: span 4;  }
.col-6  { grid-column: span 6;  }
.col-8  { grid-column: span 8;  }
.col-12 { grid-column: span 12; }

@media (max-width: 1280px) {
  .col-3, .col-4 { grid-column: span 6; }
  .col-8         { grid-column: span 12; }
}
@media (max-width: 768px) {
  .bento-grid { grid-template-columns: 1fr; }
  [class*="col-"] { grid-column: span 1; }
}
```

### 5.4 Breakpoints

```css
/* Mobile-first; matches Tailwind defaults except 'tablet' alias */
--bp-sm:  640px;
--bp-md:  768px;     /* tablet */
--bp-lg:  1024px;
--bp-xl:  1280px;    /* desktop default */
--bp-2xl: 1536px;
```

PRD §9.5 browser support: latest 2 of Chrome / Edge / Safari / Firefox; iOS Safari 16+. No IE.

### 5.5 Z-index scale

```css
--z-base:        0;
--z-sticky:      10;     /* table sticky headers, header bar */
--z-sidebar:     50;
--z-fab:         100;    /* MIRAI launch FAB */
--z-dropdown:    150;
--z-backdrop:    200;
--z-modal:       201;    /* sits above backdrop */
--z-drawer:      201;
--z-toast:       500;    /* always wins */
--z-tooltip:     600;
```

---

*Part 1 ends here.* Part 2 (components, motion, accessibility, i18n, state patterns) follows in the same file when generated. Implementation can begin from Part 1 alone — tokens, layout, sidebar, and color contracts are complete.
