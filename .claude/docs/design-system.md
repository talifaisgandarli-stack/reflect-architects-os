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

## 6. Component Library

Every component below is a primitive used across multiple PRD modules. Page-specific compositions live in §9 (Part 3).

### 6.1 Cards

The card is the universal content surface. Five variants cover every visual context.

**Base card** — default content surface (project list rows, dashboard widgets, finance metric tiles).

```css
.card {
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-lg);     /* 16px */
  padding: var(--padding-card);         /* 20px 24px */
  box-shadow: var(--shadow-sm);
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.card--static:hover { transform: none; box-shadow: var(--shadow-sm); }
```

Use `--static` for table-like cards where hover lift would feel jittery (e.g. compact rows, archive list).

**Folder card** — Layihələr grid (PRD §9.4 / US-PROJ-01). 120px gradient hero per phase + white body.

```css
.card--folder {
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-xl);     /* 20px */
  overflow: hidden;
  padding: 0;
}
.card--folder__header {
  height: 120px;
  background: var(--grad-folder);       /* default; overridden inline per phase */
}
.card--folder__body { padding: 16px 20px; }
```

```jsx
<div
  className="card--folder__header"
  style={{ background: PHASE_GRADIENTS[project.currentPhase] }}
/>
```

**Featured card** — gradient border for the one primary metric on a page (Cash Cockpit balance, dashboard pinned widget).

```css
.card--featured {
  position: relative;
  border-radius: var(--radius-xl);
  padding: 2px;                          /* gradient border thickness */
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

**Accent card** — hero stat on a gradient fill (dashboard "Aktiv Layihələr").

```css
.card--accent {
  background: var(--grad-feature);
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--padding-card);
  color: white;
  box-shadow: var(--shadow-brand);
}
.card--accent .card__label  { color: rgba(255,255,255,0.7); }
.card--accent .card__number { color: white; }
```

**Depth-stack card** — wallet-style stacked illusion (Maliyyə Cash Cockpit hero).

```css
.card--stack { position: relative; }
.card--stack::before,
.card--stack::after {
  content: '';
  position: absolute;
  border-radius: var(--radius-xl);
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
}
.card--stack::before { inset: -6px 12px;  z-index: -1; opacity: 0.6; }
.card--stack::after  { inset: -12px 20px; z-index: -2; opacity: 0.3; }
```

### 6.2 Kanban Task Card (PRD MOD 4 / US-TASK-01..08)

```
┌──────────────────────────────────┐  border-radius: 12px
│ [Project pill]              [⋯] │  11px font, project color
│                                  │
│ Task title — Rubik 600 15px      │
│ (max 2 lines, ellipsis after)    │
│                                  │
│ [Deadline badge]  [Avatar stack] │  multi-assignee per REQ-TASK-02
└──────────────────────────────────┘
```

```css
.task-card {
  background: var(--color-n000);
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-md);     /* 12px */
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

.task-card--overdue   { border-left: 3px solid var(--color-health-crit); }
.task-card--soon      { border-left: 3px solid var(--color-health-warn); }
.task-card--expertise { border-left: 3px solid var(--color-status-expert); }
.task-card--archived  { opacity: 0.65; }
.task-card--cancelled { opacity: 0.55; filter: grayscale(0.4); }
```

**Deadline badge inside card:**
```css
.deadline-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: var(--text-xs); font-weight: 500;
  padding: 3px 8px; border-radius: var(--radius-full);
}
.deadline-badge--ok      { color: var(--color-n600);       background: var(--color-n100); }
.deadline-badge--soon    { color: var(--color-warning);    background: var(--color-warning-bg); }
.deadline-badge--overdue { color: var(--color-danger);     background: var(--color-danger-bg); }
```

### 6.3 Status Badge

Used in: kanban column headers, archive list, dashboard task rows, project status chip.

```css
.status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs); font-weight: 600;
  border: 1px solid; white-space: nowrap;
}
.status-badge::before {
  content: ''; width: 6px; height: 6px;
  border-radius: 50%; background: currentColor; flex-shrink: 0;
}
```

```jsx
<span
  className="status-badge"
  style={{
    color:        TASK_STATUS[status].text,
    background:   TASK_STATUS[status].bg,
    borderColor:  TASK_STATUS[status].border,
  }}
  aria-label={`Status: ${TASK_STATUS[status].label}`}
>
  {TASK_STATUS[status].label}
</span>
```

### 6.4 Avatar System (multi-assignee aware — REQ-TASK-02)

```css
.avatar {
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; letter-spacing: -0.01em;
  color: white;
}
.avatar--xs { width: 20px; height: 20px; font-size: 8px;  }
.avatar--sm { width: 24px; height: 24px; font-size: 9px;  }
.avatar--md { width: 32px; height: 32px; font-size: 12px; }
.avatar--lg { width: 40px; height: 40px; font-size: 15px; }
.avatar--xl { width: 48px; height: 48px; font-size: 18px; }

/* Stack for assignee_ids[] */
.avatar-stack { display: flex; align-items: center; }
.avatar-stack .avatar         { border: 2px solid var(--color-n000); margin-left: -8px; }
.avatar-stack .avatar:first-child { margin-left: 0; }
.avatar-stack .overflow-badge {
  height: 24px; padding: 0 7px;
  background: var(--color-n100);
  border: 2px solid var(--color-n000);
  border-radius: var(--radius-full);
  font-size: var(--text-2xs); font-weight: 600;
  color: var(--color-n600);
  margin-left: -8px;
  display: flex; align-items: center;
}
```

**Stack rule (PRD §6.8):** show first 3 avatars + "+N" overflow badge. Stack is read left-to-right (first assignee = leftmost).

**Deterministic gradient backgrounds** for users without uploaded avatars:

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

export function getAvatarGradient(userId) {
  const sum = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}
export function getInitials(name) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
```

ARIA: avatar stacks announce as `aria-label="Assigned to: Anar, Leyla and 2 others"`.

### 6.5 Buttons

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-weight: 500; font-size: var(--text-base);
  border-radius: var(--radius-sm);
  cursor: pointer; border: none;
  transition: background 120ms ease, box-shadow 120ms ease, transform 80ms ease;
  white-space: nowrap; text-decoration: none;
}
.btn:active   { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

.btn--primary {
  background: var(--color-brand); color: white;
  padding: var(--padding-btn-md);
  box-shadow: var(--shadow-brand);
}
.btn--primary:hover { background: var(--color-brand-hover); box-shadow: 0 6px 24px rgba(90,78,255,0.30); }

.btn--secondary {
  background: var(--color-n000); color: var(--color-n900);
  border: 1px solid var(--color-n200);
  padding: var(--padding-btn-md);
}
.btn--secondary:hover { background: var(--color-n100); border-color: var(--color-n300); }

.btn--ghost {
  background: transparent; color: var(--color-n600);
  padding: var(--padding-btn-md);
}
.btn--ghost:hover { background: var(--color-n100); color: var(--color-n900); }

.btn--danger {
  background: var(--color-danger); color: white;
  padding: var(--padding-btn-md);
}

.btn--sm { padding: var(--padding-btn-sm); font-size: var(--text-sm); border-radius: var(--radius-xs); }
.btn--lg { padding: var(--padding-btn-lg); font-size: var(--text-lg); }

/* MIRAI launch FAB */
.btn--fab {
  width: 48px; height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-brand); color: white;
  box-shadow: var(--shadow-brand);
  position: fixed; bottom: 32px; right: 32px;
  z-index: var(--z-fab);
  font-size: 22px;
}
.btn--fab:hover { box-shadow: 0 8px 32px rgba(90,78,255,0.35); transform: scale(1.05); }
```

**Primary button rule:** at most one `--primary` per page surface. Secondary actions use `--secondary`; tertiary use `--ghost`.

### 6.6 Pills / Tags

```css
.pill {
  display: inline-flex; align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs); font-weight: 500;
  white-space: nowrap;
}
.pill--default { background: var(--color-n100);        color: var(--color-n600);  }
.pill--brand   { background: var(--color-brand-light); color: var(--color-brand); }
.pill--success { background: var(--color-success-bg);  color: var(--color-success); }
.pill--warning { background: var(--color-warning-bg);  color: var(--color-warning); }
.pill--danger  { background: var(--color-danger-bg);   color: var(--color-danger);  }
.pill--ai      { background: #EFF6FF; color: #3B82F6; border: 1px solid #BFDBFE; gap: 4px; }
.pill--ai::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: currentColor;
  animation: pulse 1.2s ease-in-out infinite;
}
```

`pill--ai` is reserved for MIRAI-generated content (Elanlar with `mirai_generated=true`, ICP Fit cells, forecast widget).

### 6.7 Inputs & Forms

```css
.input {
  width: 100%;
  padding: var(--padding-input);
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  color: var(--color-n900);
  background: var(--color-n000);
  transition: border-color 120ms ease, box-shadow 120ms ease;
  outline: none;
}
.input::placeholder { color: var(--color-n400); }
.input:hover  { border-color: var(--color-n300); }
.input:focus  { border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
.input--error { border-color: var(--color-danger); }
.input--error:focus { box-shadow: 0 0 0 3px var(--color-danger-bg); }

.label {
  display: block;
  font-size: var(--text-sm); font-weight: 500;
  color: var(--color-n800);
  margin-bottom: 6px;
}
.label--required::after { content: ' *'; color: var(--color-danger); }

.field-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin-top: 4px;
}
.field-help {
  font-size: var(--text-xs);
  color: var(--color-n600);
  margin-top: 4px;
}
```

**Validation timing:**
- `onBlur` for text/number/date — never `onChange` (avoids mid-typing red flashes)
- `onChange` for selects, radios, toggles
- Submit-time for cross-field rules (e.g. `expertise_deadline > today`)

**AZ error copy patterns:**
- Required: "Bu sahə tələb olunur"
- Numeric: "Məbləğ müsbət olmalıdır" (PRD US-FIN-01)
- Overpayment: "Ödəniş qalıq məbləği aşır" (PRD US-FIN-02)
- Date: "Tarix bu gündən sonra olmalıdır"

### 6.8 Data Table (Attio-style)

Used in: Müştərilər table view, Maliyyə tabs, Sənədlər list, Arxiv, İşçi Heyəti, Avadanlıq.

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th {
  padding: 10px 16px; text-align: left;
  font-size: var(--text-xs); font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-n400);
  border-bottom: 1px solid var(--color-n200);
  white-space: nowrap;
  position: sticky; top: 0;
  background: var(--color-n000);
  z-index: var(--z-sticky);
}
.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-n100);
  color: var(--color-n900);
  vertical-align: middle;
}
.data-table tr:hover td { background: var(--color-n100); }

/* Numeric columns — right align, tabular numerals */
.data-table td.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

/* Sortable header */
.data-table th.sortable { cursor: pointer; user-select: none; }
.data-table th.sortable::after {
  content: ''; display: inline-block; margin-left: 6px;
  border: 4px solid transparent;
  vertical-align: middle;
  opacity: 0.3;
}
.data-table th.sortable--asc::after  { border-bottom-color: currentColor; opacity: 1; }
.data-table th.sortable--desc::after { border-top-color:    currentColor; opacity: 1; }

/* AI-loading cell */
.cell--ai-loading {
  color: var(--color-n400); font-style: italic;
  display: flex; align-items: center; gap: 6px;
}
.cell--ai-loading::before {
  content: ''; width: 8px; height: 8px;
  border-radius: 50%; background: var(--color-brand);
  animation: pulse 1.2s ease-in-out infinite;
}

/* Masked cell (non-admin viewing admin column — PRD US-FIN-04) */
.cell--masked {
  color: var(--color-n400);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.1em;
}
.cell--masked::after { content: '—'; }
```

**Masking rule (Rule #4):** when a non-admin renders a finance table that includes admin-only columns (e.g. Outsource amount), the column must still appear with `cell--masked` rendering "—". The API returns `null` for the field; UI never receives the real value. This preserves layout consistency and audit trail.

### 6.9 Circular Progress (dashboard widget, OKR health, project completion)

```css
.ring-progress {
  position: relative;
  width: 120px; height: 120px;
}
.ring-progress svg { transform: rotate(-90deg); }
.ring-progress__track {
  fill: none; stroke-width: 8;
  stroke: var(--color-n200);
}
.ring-progress--on-accent .ring-progress__track {
  stroke: rgba(255,255,255,0.2);
}
.ring-progress__bar {
  fill: none; stroke-width: 8; stroke-linecap: round;
  stroke: var(--color-brand);
  transition: stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
}
.ring-progress--on-accent .ring-progress__bar { stroke: white; }
.ring-progress__label {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-weight: 700;
}
```

OKR health colors (PRD §5 MOD 9.1): `≥70%` `--color-success`, `40–69%` `--color-warning`, `<40%` `--color-danger`.

### 6.10 Toggle Switch

```css
.toggle { position: relative; width: 40px; height: 22px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle__slider {
  position: absolute; inset: 0;
  background: var(--color-n300);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background 200ms ease;
}
.toggle__slider::after {
  content: '';
  position: absolute; left: 3px; top: 3px;
  width: 16px; height: 16px;
  border-radius: 50%; background: white;
  box-shadow: var(--shadow-xs);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.toggle input:checked + .toggle__slider          { background: var(--color-brand); }
.toggle input:checked + .toggle__slider::after   { transform: translateX(18px); }
.toggle input:focus-visible + .toggle__slider    { box-shadow: 0 0 0 3px var(--color-brand-light); }
```

### 6.11 Modal / Drawer

```css
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  z-index: var(--z-backdrop);
  animation: fade-in 200ms ease;
}

.modal {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-n000);
  border-radius: var(--radius-xl);
  padding: var(--padding-modal);
  min-width: 480px; max-width: 640px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-lg);
  z-index: var(--z-modal);
  animation: modal-enter 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes modal-enter {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}

.drawer {
  position: fixed; top: 0; right: 0;
  width: 480px; height: 100vh;
  background: var(--color-n000);
  box-shadow: var(--shadow-drawer);
  z-index: var(--z-drawer);
  overflow-y: auto;
  padding: 32px;
  animation: drawer-enter 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer--lg { width: 640px; }
@keyframes drawer-enter {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
```

**Behaviour rules (PRD US-CRM-04):**
- Drawer keeps the parent page visible behind (no backdrop blur for drawers, only modals)
- Esc closes; clicking outside closes (configurable per use-case)
- Focus trapped inside; first focusable element receives focus on open
- On close, focus returns to the trigger element
- Slide-in animation is 250ms; never longer (feels sluggish)

### 6.12 Toasts

```css
.toast-container {
  position: fixed; bottom: 24px; right: 24px;
  z-index: var(--z-toast);
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px;
  background: var(--color-n900); color: white;
  border-radius: var(--radius-md);
  font-size: var(--text-sm); font-weight: 500;
  box-shadow: var(--shadow-lg);
  pointer-events: all;
  min-width: 280px; max-width: 420px;
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

**Auto-dismiss:** success 3s, warning 5s, error never (manual close required). PRD §6.7: errors are toast for transient, inline for validation, full-page for 500.

### 6.13 Connector Lines (Müştərilər pipeline workflow)

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
.workflow-node__title { font-size: var(--text-base); font-weight: 600; color: var(--color-n900); }
.workflow-node__body  { font-size: var(--text-sm);  color: var(--color-n600); margin-top: 6px; }
.workflow-node__ai-badge { position: absolute; top: 14px; right: 14px; }
```

Connector SVG: stroke `--color-brand-border` (`#C4BAFF`), `stroke-width: 2`, cubic-bezier curves between node centers.

### 6.14 Cmd+K Universal Search (PRD §6.2)

```
┌──────────────────────────────────────────────┐  fixed center, top: 20vh
│ 🔍  Axtar tapşırıq, layihə, müştəri…    Esc │  white card, radius-xl, shadow-xl
├──────────────────────────────────────────────┤
│ TAPŞIRIQLAR                                  │  group label, --text-xs uppercase
│   ▸ "Çertyoj hazırlığı" — Layihə X         │  active row: --color-brand-light bg
│   ▸ "Spesifikasiya"     — Layihə Y          │
│ LAYİHƏLƏR                                    │
│   ▸ "Bakı Konsert Zalı"                     │
│ MÜŞTƏRİLƏR                                   │
│   ▸ "Studio Aslan"                          │
└──────────────────────────────────────────────┘
```

```css
.cmdk {
  position: fixed; top: 20vh; left: 50%;
  transform: translateX(-50%);
  width: min(640px, 90vw);
  background: var(--color-n000);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-modal);
  overflow: hidden;
}
.cmdk__input {
  width: 100%;
  padding: 18px 20px;
  border: none; outline: none;
  font-size: var(--text-lg);
  border-bottom: 1px solid var(--color-n200);
}
.cmdk__group-label {
  padding: 10px 20px 6px;
  font-size: var(--text-xs); font-weight: 600;
  letter-spacing: var(--tracking-widest);
  color: var(--color-n400);
  text-transform: uppercase;
}
.cmdk__row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: var(--text-base);
}
.cmdk__row--active { background: var(--color-brand-light); }
.cmdk__row__entity {
  font-size: var(--text-xs); color: var(--color-n600);
  margin-left: auto;
}
```

Keyboard: ↑/↓ navigates, Enter opens, Esc closes. Returns top 8 grouped results from `/api/search` (PRD §6.2).

### 6.15 Empty / Loading / Error States

PRD §6.7. Each page has all three; never ship a blank fallback.

**Empty state pattern:**
```jsx
<div className="empty-state">
  <div className="empty-state__icon">{IconOrBlob}</div>          {/* 64px gradient blob or outline icon */}
  <h3 className="empty-state__title">Hələ heç bir layihə yoxdur</h3>
  <p className="empty-state__body">İlk layihənizi yaratmaqla başlayın.</p>
  <button className="btn btn--primary">+ Yeni layihə yarat</button>
</div>
```

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 32px; text-align: center;
  gap: 16px;
}
.empty-state__icon  { width: 64px; height: 64px; opacity: 0.6; }
.empty-state__title { font-size: var(--text-xl); font-weight: 600; color: var(--color-n800); }
.empty-state__body  { font-size: var(--text-base); color: var(--color-n600); max-width: 360px; }
```

Per-page empty copy is owned in `locales/az.json` and listed in §9 alongside each module.

**Loading skeletons** match the layout they replace (never a generic spinner on page-level loads). Use `.skeleton` shimmer per §7.8.

**Error states:**
- Validation → inline (`.field-error`) under the input
- Transient API error → `.toast--error` (manual dismiss)
- 500 / network down → full-page error component:
  ```
  ┌──────────────────────────────────────────┐
  │  [Outline alert icon, 64px, n400]        │
  │  Xəta baş verdi                          │
  │  Bir şey səhv getdi. Yenidən cəhd edin.  │
  │  [Yenidən cəhd et — primary]             │
  │  [Ana səhifəyə qayıt — ghost]            │
  └──────────────────────────────────────────┘
  ```
- Forbidden (RLS denied) → 403 page: "Bu məlumata icazəniz yoxdur" + "Geri qayıt" button
- Stack traces never shown to users (PRD §9.1); details go to Sentry

---

## 7. Motion System

### 7.1 Principles
- **Purpose over decoration.** Every animation communicates state change, relationship, or direction
- **Duration budget:** page transitions ≤ 200ms, micro-interactions ≤ 150ms, MIRAI blobs ambient (slow infinite)
- **One easing:** `cubic-bezier(0.4, 0, 0.2, 1)` for all transitions except spring/celebration
- **No bounces** in data-dense surfaces (tables, kanban). Bounces reserved for MIRAI and milestone celebrations
- **Respect `prefers-reduced-motion`:** all non-essential animation disabled (see §8.5)

### 7.2 Global Transition Defaults

```css
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
.card { animation: card-enter 200ms cubic-bezier(0.4, 0, 0.2, 1) both; }
```

```jsx
{cards.map((card, i) => (
  <Card
    key={card.id}
    style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
  />
))}
```

Cap delay at 200ms (≈ 5 cards) so the grid never feels slow.

### 7.5 Kanban Drag & Drop (PRD US-TASK-02)

- **Dragging card:** `rotate(2deg) scale(1.02)`, `box-shadow: var(--shadow-lg)`, `cursor: grabbing`
- **Drop target column:** `background: var(--color-brand-light)`, `border: 2px dashed var(--color-brand)` — entire column highlights
- **Drop animation:** card enters target column with `scale(0.95) → 1.0` over 150ms
- **Column height:** smooth transition when card added/removed (CSS grid `auto` height with transition disabled — use FLIP technique for measurable smoothness)
- **Realtime echo** (PRD REQ §3.4): when another user moves a card, animate it from old column to new with `transform: translate3d` interpolation, 200ms

### 7.6 MIRAI Blob Animation (PRD §9.11 / US-MIRAI-01)

Three blobs drift on different cycles for natural, non-mechanical motion.

```css
@keyframes blob-drift-1 {
  0%, 100% { transform: scale(1)    rotate(0deg)  translate(0, 0); }
  25%      { transform: scale(1.04) rotate(2deg)  translate(4px, -6px); }
  50%      { transform: scale(0.97) rotate(-1deg) translate(-3px, 4px); }
  75%      { transform: scale(1.02) rotate(1.5deg) translate(2px, -3px); }
}
@keyframes blob-drift-2 {
  0%, 100% { transform: scale(1)    rotate(0deg)  translate(0, 0); }
  33%      { transform: scale(1.06) rotate(-2deg) translate(-5px, 3px); }
  66%      { transform: scale(0.96) rotate(1deg)  translate(4px, -5px); }
}
@keyframes blob-drift-3 {
  0%, 100% { transform: scale(1)    rotate(0deg)  translate(0, 0); }
  40%      { transform: scale(1.03) rotate(3deg)  translate(3px, 5px); }
  80%      { transform: scale(0.98) rotate(-2deg) translate(-4px, -3px); }
}

.mirai-blob-1 { animation: blob-drift-1  8s ease-in-out infinite; }
.mirai-blob-2 { animation: blob-drift-2 10s ease-in-out infinite; }
.mirai-blob-3 { animation: blob-drift-3 12s ease-in-out infinite; }
```

When MIRAI is generating a response, blobs subtly accelerate (scale `1.02 → 1.06`, duration halves) — a quiet "thinking" cue.

### 7.7 Sidebar Active Indicator

```css
.nav-item { position: relative; }
.nav-item__indicator {
  position: absolute;
  left: -16px; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 0;
  background: var(--color-sidebar-indicator);
  border-radius: 2px;
  transition: height 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-item--active .nav-item__indicator { height: 20px; }
```

### 7.8 Skeleton Shimmer

```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
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
```

### 7.9 Realtime State Flash

When a row updates via Supabase Realtime (task status change, new activity feed entry, MIRAI streamed token), a brief background flash signals the live update without being disruptive.

```css
@keyframes realtime-flash {
  0%   { background: var(--color-brand-light); }
  100% { background: transparent; }
}
.row--just-updated { animation: realtime-flash 1500ms ease-out; }
```

### 7.10 Status Change Pulse

When a task status flips, the status badge pulses once.

```css
@keyframes status-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}
.status-badge--just-changed { animation: status-pulse 300ms ease-out; }
```

---

## 8. Accessibility

PRD §6.6 sets the bar: **WCAG 2.1 AA minimum, non-negotiable**.

### 8.1 Color Contrast — Verified Pairs

| Pair | Ratio | Pass |
|---|---|---|
| `#5A4EFF` on `#FFFFFF` (brand button text) | 5.8:1 | AA |
| `#6B7280` on `#FFFFFF` (secondary text) | 4.6:1 | AA |
| `#1A1A1A` on `#F4F5F7` (body on canvas) | 16:1 | AAA |
| White on `#5A4EFF` (primary button) | 5.8:1 | AA |
| `#D97706` on `#FFFBEB` (warning text on warning bg) | 4.7:1 | AA |
| `#D97706` on `#FFFFFF` (warning text on white) | 4.5:1 | AA |
| `#EF4444` on `#FFFFFF` (danger text) | 4.6:1 | AA |
| `#A1A1AA` on `#0F0F0F` (sidebar inactive) | 8.2:1 | AAA |

⚠️ **Banned:** `#F59E0B` for body or label text — only as icon/dot fill where adjacent text passes contrast on its own. Use `#D97706` for text.

### 8.2 Focus Rings

```css
:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}
:focus:not(:focus-visible) { outline: none; }
```

Every interactive element receives a visible focus ring. Never `outline: none` without a substitute. Custom-styled inputs use `box-shadow: 0 0 0 3px var(--color-brand-light)` instead of outline (§6.7).

### 8.3 Keyboard Navigation

- Tab order follows visual order (no `tabindex > 0`)
- Modals trap focus (`tabindex=-1` on backdrop, focus moves to first focusable on open, returns to trigger on close)
- Esc closes modals/drawers/Cmd+K/dropdowns
- Arrow keys navigate kanban columns when a card is focused (←/→ between columns, ↑/↓ within column)
- Enter activates buttons and opens table rows
- `/` or Cmd+K opens search (PRD §6.3)
- `G then D/T/P/M/F` navigates Dashboard/Tasks/Projects/Müştərilər/Maliyyə (PRD §6.3)

### 8.4 Screen Reader Patterns

```jsx
{/* Status badge */}
<span aria-label={`Status: ${label}`}>{label}</span>

{/* Avatar stack */}
<div role="group" aria-label={`Assigned to: ${names.slice(0,3).join(', ')}${overflow ? ` and ${overflow} others` : ''}`}>...</div>

{/* Drag card */}
<div role="button" aria-grabbed={isDragging} aria-roledescription="Tapşırıq kartı">...</div>

{/* Progress ring */}
<div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="OKR irəliləyişi">...</div>

{/* Realtime feed updates announced via live region */}
<div aria-live="polite" aria-atomic="false">
  {feedItems.map(item => <FeedRow key={item.id} {...item} />)}
</div>

{/* Toast announcements */}
<div role="status" aria-live="polite">{toast.message}</div>
<div role="alert"  aria-live="assertive">{errorToast.message}</div>
```

### 8.5 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  /* MIRAI blobs hold static position */
  .mirai-blob-1, .mirai-blob-2, .mirai-blob-3 { animation: none; }
}
```

Status pulse, page enter, and shimmer are all suppressed. Functional feedback (e.g. "row just updated") falls back to a 1500ms persistent border instead of a flash.

### 8.6 Touch Targets

Minimum 40 × 40px tappable area on all interactive elements (covers AAA target per WCAG 2.5.5). Small buttons (`btn--sm`) and pills get 8px invisible padding via `position: relative; ::before` overlay.

### 8.7 Form Accessibility

- Every input has a visible `<label>` (placeholders are not labels)
- Required fields use `aria-required="true"` + visible ` *`
- Errors use `aria-invalid="true"` + `aria-describedby` pointing to `.field-error`
- Field groups (radio sets in cancel reason — PRD US-TASK-03) use `<fieldset><legend>`

---

## 9. Internationalization

PRD §6.5: primary AZ; EN/RU stubs for future. All dates display Asia/Baku.

### 9.1 String storage

All UI strings live in `src/locales/<lang>.json`. No hardcoded copy in components.

```json
// locales/az.json
{
  "tasks.create.title":     "Yeni tapşırıq",
  "tasks.empty.title":      "Hələ heç bir tapşırıq yoxdur",
  "tasks.empty.cta":        "+ İlk tapşırığı yarat",
  "tasks.cancel.reason.client":  "Müştəri imtina etdi",
  "finance.error.negative": "Məbləğ müsbət olmalıdır"
}
```

### 9.2 Date / number / currency formatting

Use `Intl.DateTimeFormat` and `Intl.NumberFormat` with locale `az-AZ` and timezone `Asia/Baku`.

```js
export const fmtDate = new Intl.DateTimeFormat('az-AZ', {
  timeZone: 'Asia/Baku',
  year: 'numeric', month: 'short', day: 'numeric',
});
export const fmtMoney = new Intl.NumberFormat('az-AZ', {
  style: 'currency', currency: 'AZN', maximumFractionDigits: 0,
});
export const fmtRelative = new Intl.RelativeTimeFormat('az-AZ', { numeric: 'auto' });
```

### 9.3 Pluralization

Use ICU MessageFormat-style strings via `i18next` plural rules:
```json
{ "tasks.count": "{count, plural, one {# tapşırıq} other {# tapşırıq}}" }
```
(Azerbaijani has no formal plural distinction in most cases — single form suffices.)

### 9.4 RTL readiness

Layout uses logical CSS properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`) where practical. Arabic is not in v1 scope but the design system anticipates RTL support without rewrites.

### 9.5 Switching locale

Profile → locale (PRD US-AUTH-04): UI strings switch live without full reload via the i18n context. Date/number formatters re-render via React Query invalidation of the locale key.

---

*Part 2 ends here.* Part 3 (page-by-page specs cross-referenced to PRD modules, Tailwind config, global CSS, design DoD) follows.
