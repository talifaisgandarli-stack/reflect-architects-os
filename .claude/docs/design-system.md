# Reflect Architects OS — Design System
**Version:** 2.5 (aligned to PRD v3.6 — audit absorption: dashboard motivation widgets, performance 360 flow + score breakdown, mobile keyboard handling, kanban touch fallback)
**Date:** 2026-05-04
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

The PRD's 8-status model (PRD §5 MODULE 4 / v3.2) renders identically everywhere it appears: kanban column header, task card pill, archive list, dashboard "my tasks" rows.

| Status (AZ) | Semantic key | Text | BG | Border | Dot |
|---|---|---|---|---|---|
| İdeyalar | `ideas` | `#A78BFA` | `#FAF5FF` | `#E9D5FF` | `#A78BFA` |
| Başlanmayıb | `queued` | `#94A3B8` | `#F8FAFC` | `#E2E8F0` | `#94A3B8` |
| İcrada | `active` | `#3B82F6` | `#EFF6FF` | `#BFDBFE` | `#3B82F6` |
| Yoxlamada | `review` | `#D97706` | `#FFFBEB` | `#FDE68A` | `#F59E0B` |
| Ekspertizada | `expert` | `#8B5CF6` | `#F5F3FF` | `#DDD6FE` | `#8B5CF6` |
| Tamamlandı | `done` | `#22C55E` | `#F0FDF4` | `#BBF7D0` | `#22C55E` |
| Portfolio | `portfolio` | `#10B981` | `#ECFDF5` | `#A7F3D0` | `#10B981` |
| Cancelled | `cancel` | `#EF4444` | `#FEF2F2` | `#FECACA` | `#EF4444` |

> Yoxlamada uses `#D97706` for text (WCAG AA) and `#F59E0B` for the dot only.
> Portfolio reaches only via Tamamlandı + portfolio-candidate flag from closeout (PRD §4.1).

### 2.2.a Task Priority — left-edge tick

`tasks.priority` enum (PRD REQ-TASK-12) renders as a 3px left-edge accent on the task card (§6.2). Used for sort order in Mənim Tapşırıqlarım.

| Priority | Color | Sort weight |
|---|---|---|
| urgent | `#EF4444` (danger) | 4 |
| high | `#F59E0B` (warning-icon) | 3 |
| medium | `#3B82F6` (info) | 2 |
| low | `#9CA3AF` (n400) | 1 |

When task is **also** overdue or expertise, priority tick takes precedence on the left edge; the overdue/expertise indicator moves to a top-right corner badge.

### 2.2.b Task Kind — badge icon

`tasks.task_kind` enum (PRD REQ-TASK-11) renders as an emoji badge prefix on task cards in unified views (Mənim Tapşırıqlarım, dashboard deadline widget, search results). Hidden in project-scoped Kanban (always `work` there).

| Kind | Badge | Source surface |
|---|---|---|
| `work` | (no badge — default) | manual create |
| `portfolio` | 🏆 | closeout portfolio flow |
| `closeout` | 📋 | project closeout checklist |
| `leave_approval` | ✅ | leave_requests insert |
| `followup` | 💬 | CRM interaction follow-up |

### 2.3 Pipeline Stage Color Map (PRD §5 MODULE 6 v3.4, 8 stages)

| Stage (AZ) | Color | Confidence |
|---|---|---|
| Lead | `#6B7280` | 10% |
| Təklif | `#3B82F6` | 30% |
| Müzakirə | `#D97706` | 50% |
| İmzalanıb | `#8B5CF6` | 75% |
| İcrada | `#22C55E` | 95% |
| Bitib | `#10B981` | — |
| Arxiv | `#9CA3AF` | — |
| İtirildi | `#EF4444` | 0% |

Used in: pipeline kanban headers, client card stage badge, table stage cell, drawer header chip.

> **Note:** CRM does NOT include a `Portfolio` stage. Portfolio submission lives entirely in the task system (PRD §4.1 task status `Portfolio`). Avoiding double-bookkeeping for the same lifecycle event.

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

**Mobile keyboard handling (audit E4 fix):**
- On viewport ≤768px when an input gains focus, the modal/drawer auto-scrolls so the focused input sits in the visible area above the keyboard
- Implementation: listen for `focusin` events; on focus, `scrollIntoView({ block: 'center', behavior: 'smooth' })` if `visualViewport.height < window.innerHeight × 0.65`
- Modal max-height adjusts to `min(90vh, visualViewport.height - 32px)` to never bleed under the keyboard
- Drawer on mobile promotes to bottom-sheet so keyboard pushes content up naturally rather than covering the input

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

## 10. Page-by-Page Specifications

Each page maps to a PRD module (§5) and lists the `REQ-*` / `US-*` IDs it implements. The visual composition is described in terms of components from §6; only page-level layout and copy live here.

### 10.1 Giriş (Login) — REQ-AUTH-01..03 / US-AUTH-01..04

**Canvas:** `#F4F5F7` + 1px grid lines `rgba(0,0,0,0.06)` at 40px spacing (NOT dots — login only).

**Layout — split:**
```
┌──────────────────────────────┬──────────────────────────────┐
│ LEFT (decorative)            │ RIGHT (login card)           │
│                              │                              │
│ [Reflect logo top-left]      │       [centered card]        │
│                              │       width 400px            │
│ [Outline hexagons SVG        │       padding 40px           │
│  scattered top-right;        │       radius 20px            │
│  1px stroke #9CA3AF]         │       shadow-md              │
│                              │                              │
│ "Reflecting Excellence"      │       Xoş gəldiniz           │
│  Rubik 400 italic 18px       │       Hesabınıza daxil olun  │
│  #9CA3AF                     │                              │
│                              │       [Email input]          │
│                              │       [Şifrə input + 👁]     │
│                              │       Şifrəni unutdum?       │
│                              │       [Daxil ol — primary]   │
│                              │                              │
│                              │   "Platforma yalnız dəvətlə  │
│                              │    əlçatandır"               │
└──────────────────────────────┴──────────────────────────────┘
```

**Copy:**
- H1: `Xoş gəldiniz` (Rubik 700 32px `--color-n900`)
- Sub: `Hesabınıza daxil olun` (Rubik 400 15px `--color-n600`)
- Forgot link: `Şifrəni unutdum?` (right-aligned, brand)
- Invite-only note: `Platforma yalnız dəvətlə əlçatandır` (centered, `--color-n400`, 13px)

**States:**
- Invalid credentials → inline `.field-error` under password ("E-mail və ya şifrə yanlışdır")
- Rate limited (5 fails / 15min — REQ-AUTH-01) → top banner "Çox sayda cəhd. {N} dəq sonra yenidən cəhd edin"
- Loading → button shows spinner, all fields disabled
- Magic-link sent (forgot password) → success state: "Mesajı yoxlayın — keçid 30 dəqiqə işləkdir"

**Mobile:** stacks vertically, decorative left becomes thin header band.

### 10.2 Dashboard — REQ-DASH-01..05 / US-DASH-01..05

Two variants, **same component shell**, different widget set selected by `useRoleLevel()`.

**Header bar (64px sticky):**
- Left: `Salam, {ad} 👋` (Rubik 600 20px) + today's date Asia/Baku (400 14px `--color-n600`)
- Right: notification bell (with red dot if unread > 0), MIRAI launch FAB inline, avatar dropdown

#### Admin variant — bento grid

```
Row 1:  [Aktiv Layihələr — col-8 accent card] [Sürətli əməllər — col-4 base]
Row 2:  [Bu gün tapşırıqlarım — col-6]        [Maliyyə (bu ay) — col-6 featured]
Row 3:  [Komanda yükü — col-8]                [Yaxınlaşan deadline — col-4]
Row 4:  [Aktivlik axını (Realtime) — col-12 base]
```

- **Aktiv Layihələr accent card:** UPPERCASE label "AKTİV LAYİHƏLƏR" (xs white-70%), large count (3xl white bold), mini list of names (sm white-80%), "Hamısına bax →" bottom link
- **Maliyyə featured card:** "Bu ay" label, 3 numbers `Gəlir / Xərc / Balans` (tabular numerals), trend arrow vs last month (US-DASH-03)
- **Aktivlik axını:** Attio-style compact rows — `--avatar--sm` + `[Ad] [əməl] [obyekt linki]` + relative timestamp; filter pills above (Hamısı / Tapşırıqlar / Layihələr / Maliyyə / Müştərilər); Realtime updates via `.row--just-updated` flash (§7.9)
- **Komanda yükü:** each member = avatar + name + open task count + bar (green 1–5, amber 6–9, red 10+, US-DASH-05)
- **Yaxınlaşan deadline:** task list ordered by deadline; coloring per §2.5 health rule

#### User variant — single column, focused (REQ-DASH-02 expanded)

```
Row 1:  [Bu gün — col-12 — task list grouped Overdue/Today]
Row 2:  [Bu həftə — col-8] [Şəxsi OKR — col-4]
Row 3:  [Layihələrim necə gedir? — col-6] [Karyera yolum — col-6]
Row 4:  [Performans tendency — col-8] [Yaxınlaşan görüşlər — col-4]
Row 5:  [Vacib müştərilərim (BD users only) — col-6] [Oxunmamış elanlar — col-6]
```

- **Bu gün** widget: tabs `Bu gün / Bu həftə`; rows = task title + project pill + deadline badge + checkbox; ticking removes row with animation + emits `activity_log` (US-DASH-02)
- **Şəxsi OKR:** ring progress (§6.9) + 1 line current key result; clicking opens OKR page
- **Layihələrim necə gedir?** (audit D1): card per active project user is assigned to — name + status pill + completion ring + days-to-deadline. NO financial data. Empty: "Hələ aktiv layihəniz yoxdur".
- **Karyera yolum:** current level chip + next level chip + progress bar of next-level criteria (auto-checked + manual). "Növbəti səviyyəyə: Senior Designer — 2 kriteriya qaldı"
- **Performans tendency:** small bar chart of last 12 months published score (REQ-PERF-01); only shows months with `published_at IS NOT NULL`; before 2026 the widget reads "Bu il üçün məlumat yoxdur"
- **Vacib müştərilərim:** rendered ONLY for users whose role enables CRM access (BD Lead level 3); shows count + top 3 active deals owned. Hidden for Designers/Interns
- Finance widget hidden completely (RLS returns 0 rows; UI conditionally omits — US-DASH-03)

**Empty per widget:** AZ message + CTA. e.g. "Bu gün tapşırıq yoxdur — bu axşam erkən bağlana bilər 🎉".

### 10.3 Layihələr — REQ-PROJ-01..06 / US-PROJ-01..05

**Header bar:** title `Layihələr` + view toggle `Grid / Cədvəl` (right) + filter bar (status / phase multi-select / sort) + `+ Yeni Layihə` primary.

**Grid view:**
- 3 columns desktop, 2 tablet, 1 mobile
- Folder cards (§6.1) with phase-gradient header (120px) + body containing:
  - Project name (Rubik 600 17px) + client name (sm `--color-n600`)
  - Deadline badge (health-colored §2.5)
  - Completion ring (small, 32px) showing % tasks done
  - Avatar stack of project members
  - Expertise badge (purple "E" pill if `requires_expertise`)
- Card click → project detail page

**Project detail tabs (REQ-PROJ-03):** `Ümumi / Tapşırıqlar / Sənədlər / Maliyyə (admin) / Bağlanış / Tarixçə`

**Backward-planned timeline visualization (US-PROJ-02):**
```
Expertise: 30 İyun
   │
   ├─ −10 ödəniş bufferi
   ├─ −30 ekspertiza gözləntisi
   ├─ −10 düzəliş
   └─ −3  çap hazırlığı
          ↓
Dizayn deadline: 8 May  ⚠️ 14 gün qaldı
```
Each step is a horizontal segment on a stepped timeline; banner turns red if `design_deadline` < 14 days.

**Closeout drawer (US-PROJ-03 / REQ-PROJ-04):** right drawer (`--lg` 640px). Each checklist row is editable inline:

```
☐ [Sifarişçi ilə final təhvil-təslim edilib]    [✏️] [🗑]
☐ [Müştəri retrospektiv anketi göndərildi]      [✏️] [🗑(disabled)]
☐ [Portfolio namizədi (Y/N)]                     [✏️] [🗑(disabled)]
   ○ Bəli → Portfolio workflow açılır
   ○ Xeyr → keç
☐ [+ Yeni checkbox əlavə et]
```

- Default items (`is_default=true`): rename allowed (✏️), delete disabled (`🗑(disabled)` with tooltip "Default item-lər silinə bilməz, yalnız adı dəyişdirilə bilər")
- Custom items (`is_default=false`): rename + delete both enabled
- "+ Yeni checkbox əlavə et" appends a row at the bottom; appears in editable state immediately
- "Layihəni Tamamla" primary button activates only when all rows are checked
- On portfolio "Bəli" tick → second drawer opens (Portfolio Workflow — see below)

**Portfolio Workflow drawer (REQ-PROJ-05):** opens after closeout's portfolio "Bəli". Two sections:

```
🏆 PORTFOLIO HAZIRLIĞI
─────────────────────
☐ Müştəridən icazə alındı                  [✏️] [🗑]
☐ Foto/render hazırdır                      [✏️] [🗑]
☐ Layihə təsviri yazıldı                    [✏️] [🗑]
☐ Komanda kreditləri qeyd olundu            [✏️] [🗑]
[+ Yeni əlavə et]

🎖️ AWARD NAMİZƏDLİYİ
─────────────────────
Sistem awardları:
☐ Aga Khan Award for Architecture    Mart  [12 gün qaldı]
☐ MIPIM Awards                       Yanvar
☐ World Architecture Festival        Noyabr
☐ Dezeen Awards                      Aprel
☐ ArchDaily Building of the Year     Yanvar
☐ Architizer A+Awards                Mart
☐ RIBA International Awards          May

Öz awardlarım:
☐ State Architecture Award (AZ)      Sentyabr  [əlavə etdim] [🗑]
[+ Yeni mükafat əlavə et]            ← admin-only

📅 Veb sayta əlavə tarixi: [____]
✏️ Press release yazılacaq? [toggle]
```

- System awards (`is_custom=false`): silmək olmaz; yalnız tick
- Custom awards (`is_custom=true`): admin tərəfindən əlavə edilib, silinə bilər
- "+ Yeni mükafat əlavə et" yalnız admin görür → modal açır: name, organizer, deadline_month picker (1-12), region select, url
- Award seçildikdə → arxa planda `tasks` row yaradılır (`task_kind='portfolio'`, owner = closeout-u edən şəxs, deadline = next occurrence of `deadline_month`) per PRD REQ-TASK-11; cardın küncündə "🏆 Tapşırıq yaradıldı" toast

**Empty state:** centered MIRAI-inspired gradient blob (small, decorative), `Hələ heç bir layihə yoxdur`, `+ Yeni layihə yarat` primary.

### 10.4 Tapşırıqlar — REQ-TASK-01..23 / US-TASK-01..22

**Header:**
- View tabs: `Kanban / Cədvəl / Mənim Tapşırıqlarım` (sliding underline indicator)
- Right: project filter + assignee filter + tag filter (chip multi-select) + priority filter + `Arxivlə` ghost + `Yeni tapşırıq` primary

#### 10.4.1 Kanban — 8 columns (REQ-TASK-01)

**Mobile constraint (audit E3):** drag-drop on touch devices is NOT supported in v1 (PRD §12.1). Mobile users see the same 8 columns horizontally scrollable but cards are non-draggable; status change happens via card menu `⋯` → "Statusu dəyiş" → bottom-sheet status picker. Desktop drag-drop unchanged.


```
İdeyalar | Başlanmayıb | İcrada | Yoxlamada | Ekspertizada | Tamamlandı | Portfolio | Cancelled
```

- Each column: `min-width: 280px`, horizontal scroll if overflow
- Column header: status dot (§2.2) + label (Rubik 500 13px) + task count badge
- Column body: task cards (§6.2 + §10.4.2 below) + dashed `+ Əlavə et` button at bottom for quick create
- Drag-over highlight: `--color-brand-light` bg + 2px dashed `--color-brand` border on whole column (§7.5)
- Realtime echo: cards moved by other users animate cross-column (§7.5)
- **Portfolio column:** only populated by tasks transitioned from Tamamlandı during closeout's portfolio flow (PRD REQ-TASK-25). Quick-create `+` is disabled in this column with tooltip "Portfolio tapşırıqları layihə bağlanışından avtomatik yaranır"
- **Cancelled column:** quick-create disabled; cards display with `--color-n400` opacity 0.55 (§6.2 `task-card--cancelled`)

#### 10.4.2 Task Card — extended with priority + kind + tags + dependency

```
┌──────────────────────────────────┐  border-radius: 12px
│┃ 🏆 [Project pill]          [⋯] │  ← left-edge 3px priority tick
│┃                                 │  ← kind emoji prefix (if not 'work')
│┃ Task title — Rubik 600 15px     │
│┃ ↳ 2 blocking · 3/8 ☐            │  dependency badge + subtask counter
│┃ [tag] [tag] [+1]                │  tag chips, max 3 + overflow
│┃ [Bugün 17:00]   [Avatar stack]  │  time-of-day deadline if set
└──────────────────────────────────┘
```

Priority left-edge tick:
```css
.task-card { position: relative; }
.task-card::before {
  content: '';
  position: absolute;
  left: 0; top: 12px; bottom: 12px;
  width: 3px;
  border-radius: 3px;
  background: var(--task-priority-color, transparent);
}
.task-card[data-priority="urgent"] { --task-priority-color: var(--color-danger); }
.task-card[data-priority="high"]   { --task-priority-color: var(--color-warning-icon); }
.task-card[data-priority="medium"] { --task-priority-color: var(--color-info); }
.task-card[data-priority="low"]    { --task-priority-color: var(--color-n400); }
```

When the card is also `--overdue` or `--expertise`, the existing `border-left: 3px solid` (§6.2) is removed in favor of the `::before` priority tick; the overdue/expertise indicator moves to a top-right corner badge (`⚠️` or `E`).

Tag chips inside card:
```css
.task-card__tags {
  display: flex; gap: 4px; margin-top: 8px; flex-wrap: nowrap;
}
.task-card__tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 6px;
  background: var(--tag-bg, var(--color-n100));
  color: var(--tag-color, var(--color-n600));
  border-radius: var(--radius-xs);
  font-size: var(--text-2xs); font-weight: 500;
  max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
```

Time-of-day deadline rendering:
- Date only → `15 May` (existing health-color)
- Datetime today → `Bugün 17:00` (with health-amber if T-2h, red if T-30m)
- Datetime tomorrow → `Sabah 09:30`
- Datetime this week → `Cüm 14:00`
- Datetime later → `15 May 17:00`

#### 10.4.3 Quick create inline (US-TASK-01)

- Click `+ Əlavə et` in column → input appears in card slot
- Title only, Enter to commit, Esc to cancel
- Defaults applied: priority=`medium`, task_kind=`work`, no assignee (creator implicit)
- Created task lands in column with `card-enter` animation

#### 10.4.4 Full create modal — extended

```
┌─────────────────────────────────────────────────────┐
│  Yeni tapşırıq                                  [✕] │
├─────────────────────────────────────────────────────┤
│  Başlıq: [_____________________________________]    │
│  Açıqlama: [textarea — plain text, not rich]        │
│                                                      │
│  Layihə: [picker]    Priority: [⚪ Aşağı  ⚪ Orta   │
│                              ⦿ Yüksək  ⚪ Təcili]  │
│  Cavabdehlər: [chip multi-select with avatars]      │
│  Tag-lar: [chip picker — yeni yarat OR mövcuddan]   │
│                                                      │
│  ☐ Ekspertiza subtask-ı (auto 5 child)               │
│  ☐ Asılıdır: [task search picker — finish_to_start]  │
│                                                      │
│  Başlama: [📅 date]   Deadline: [📅 date 🕐 time]   │
│                                                      │
│  Estimated: [4] [həftə ▼]   Risk buffer: [10%] ━━○━ │
│  Workload: 4.4 həftə  ✨ MIRAI hesablamasıdır        │
│                                                      │
│  Parent task: [search picker — opsional]            │
│                                                      │
│  [Ləğv et]                          [Saxla — primary]│
└─────────────────────────────────────────────────────┘
```

- Workload live computes per REQ-TASK-06
- Time picker default `18:00 Asia/Baku` if user picks date but skips time (REQ-TASK-13)
- If project `requires_expertise = true` AND ekspertiza toggle on → "Auto Planner backward dates" panel appears (see 10.4.5)
- If parent_task selected → `task_level` increments automatically; no UI limit on depth
- Description plain text only — no formatting toolbar (PRD §4.17)

#### 10.4.5 Auto Planner panel (REQ-TASK-15)

When the create modal detects `requires_expertise = true` and Ekspertiza toggle on, a collapsible panel above the date inputs renders:

```
✨ MIRAI Auto Planner — Geri hesablama
─────────────────────────────────────
Layihə deadline: 15 Avq 2026
   ↓  −10 gün ödəniş bufferi
Ekspertiza son təsdiq: 5 Avq
   ↓  −30 gün ekspertiza gözləntisi
   ↓  −10 gün irad düzəltmə
Ekspertizaya təhvil: 12 İyun
   ↓  −3 gün çap hazırlığı
Dizayn deadline: 9 İyun  ⚠️ 14 gündən az qaldı

[Tarixləri qəbul et]    [Manual təyin edirəm]
```

- "Tarixləri qəbul et" prefills `start_date` + `deadline` from computation
- Override anywhere → re-renders chain showing impact

#### 10.4.6 Expertise auto-subtasks toggle (REQ-TASK-09)

When `is_expertise_subtask = true` in the modal:

```
Ekspertiza zəncirini avtomatik yarat:
  ☑ Ekspertiza üçün çap sənədlərinin hazırlanması (3 gün)
  ☑ Ekspertizaya göndərmək (1 gün)
  ☑ Ekspertiza cavabı gözləmə (30 gün)
  ☑ İrad düzəltmə buffer (10 gün)
  ☑ Son təsdiq alınması
  ────────────────────────────────────
  Hamısını: ☐ uncheck → manual yaradacam
```

On save, 5 child subtasks auto-inserted with backward-planned dates. Each child marked with purple "E" badge (`task-card--expertise`).

#### 10.4.7 Task dependency (REQ-TASK-16)

In create modal: "Asılıdır" picker → search existing tasks → only `finish_to_start` in v1.

On Kanban card: dependency badge `↳ 2 blocking` (when other tasks depend on this) or `↳ Asılıdır: A` (when this task waits on A).

Drag attempting to move dependent task to `İcrada` while predecessor not `Tamamlandı` → blocking modal:

```
┌─────────────────────────────────────────┐
│  Bu tapşırıq başlaya bilməz             │
│                                          │
│  Aşağıdakı tapşırıqlar bitməyib:         │
│   • A — Konstruksiya hesablaması         │
│     status: İcrada · deadline 5 İyun     │
│                                          │
│  [A-ya keç]                  [Bağla]     │
└─────────────────────────────────────────┘
```

#### 10.4.8 Cancel dialog (US-TASK-03)

Centered modal width 400px, radio list of reasons, "Digər" reveals text input, `Ləğv et` danger button.

**Cancel revert (US-TASK-09):** Cancelled column cards have inline `↩ Ləğvi geri qaytar` button (admin or assignee only). Click → confirms → status restores to prior value from history; toast "Tapşırıq bərpa olundu — {old status}".

#### 10.4.9 Delete (US-TASK-10)

Card `⋯` menu has `🗑 Sil` (admin or creator only). Confirms via dialog:

```
Bu tapşırığı silmək istədiyinizdən əminsiniz?
3 alt-tapşırıq da birlikdə silinəcək.
[Bağla] [Sil — danger]
```

Subtask delete: same pattern, only that one row. Each deletion (including each cascaded child) emits its own activity_log entry — visible in the parent task's Activity tab as separate lines.

Soft-deleted (≤90 days): admin Arxiv-də "Silinmişlər" filter ilə görür və bərpa edə bilər.

#### 10.4.10 Subtask hierarchy

Subtask tree renders inline within task detail drawer:

```
📋 Tam işçi layihənin hazırlanması       [⋯]
    Status: İcrada     Deadline: Bugün 17:00
    
    🔁 Subtask-lar (5/8 tamamlandı)         [+ Subtask əlavə et]
    ──────────────────────────────────────
    ☑ Plan layihəsinin hazırlanması · Aydan
    ☑ Elevation planın hazırlanması · Aydan
    ☐ Tirlər və konstruksiya · Turkan · 12 May
        🔁 Sub-subtask-lar (1/3)             [+ əlavə et]
        ──────────────────────────────
        ☑ Hesablama
        ☐ Çertyoj
        ☐ Yoxlama
    ☐ Detallar
    ☐ Ekspertiza üçün hazırlıq · Ekspertiza zənciri (5 child) ▸
```

- No depth limit (PRD §4.3) → indented 16px per level
- Tag chips on subtasks too (REQ-TASK-14) — same chip system
- Subtask blocker modal (US-TASK-04) when parent dragged to Tamamlandı with open children: lists ALL descendants (depth-first), `Hamısını tamamla` shortcut

#### 10.4.11 Mənim Tapşırıqlarım view (US-TASK-06, US-TASK-12)

- Filtered to `assignee_ids contains auth.uid()` AND not deleted/archived
- **Sort:** priority (urgent → low) THEN deadline ASC (REQ-TASK-12)
- Grouped sections (collapsible):
  - `Gecikmiş` (red header)
  - `Bu gün`
  - `Bu həftə`
  - `Sonra`
- Each row shows kind emoji prefix (10.4.2), priority tick, title, project pill, deadline (with time-of-day if set), tag chips
- Inline status update: checkbox for `Tamamlandı`, dropdown for others
- **Cross-module rows surface here** (PRD REQ-TASK-11): portfolio submission tasks (🏆), leave approval tasks for managers (✅), closeout chores (📋), CRM follow-ups (💬)

#### 10.4.12 Smart Reminder UI (REQ-TASK-23)

Smart Reminder is a notification, not a page surface. UI touches:

- In-app toast on receipt:
  ```
  🤖 Aydan, sənin Bilgə Qrup tapşırığın sabah deadline-da.
     Estimated 2 həftə idi, indi 13 gün keçib. Yetişəcəkmi?
  [Tapşırığa keç]   [48 saat susdur]   [Bağla]
  ```
- Telegram parity (same wording)
- "48 saat susdur" → user opt-out for that task only, 48h
- Per-event toggle in Sistem → Bildirişlər → "Smart Reminder" matrix row

#### 10.4.13 Daily 09:00 / 18:00 notification UI (REQ-TASK-21)

Two scheduled notifications. UI touches:

**09:00 Günün özeti** in-app card (also Telegram):
```
🌅 Sabahınız xeyir, Aydan!

📋 Bu gün tapşırıqlarınız (3):
   • 🏆 Aga Khan application (deadline: bu gün!)
   • Bilgə Qrup — Eskiz təqdimatı (deadline: bu gün!)
   • Hacıkənd — Konsept icmal (deadline: cüm)

📅 Görüşləriniz (1):
   • 14:00 — Talifa ilə həftəlik review

✨ "Memarlıq icra olunmuş ideyaların qalıb gedən izidir."
   — Frank Lloyd Wright

[Bütün tapşırıqlara bax]
```

**18:00 Gün sonu** in-app card (also Telegram):
```
🌙 Yaxşı işləmisiniz, Aydan!

Bugünkü nəticələriniz:
   ✅ 2 tapşırıq tamamlandı
   ✅ 4 subtask qapandı
   💬 8 şərh yazdınız

✨ "Sadəlik mürəkkəbliyin ən yüksək formasıdır."
   — Leonardo da Vinci
```

Both honor `user_notification_settings.morning_summary` / `.evening_motivation` toggles in Sistem → Bildirişlər.

#### 10.4.14 Empty states

- Kanban: "Hələ heç bir tapşırıq yoxdur — Cmd+N ilə yarat" + primary CTA
- Mənim Tapşırıqlarım: "Bu gün tapşırıq yoxdur — bu axşam erkən bağlana bilər 🎉"
- Filter qaytarıldıqda boş: "Filterə uyğun tapşırıq tapılmadı — filteri sıfırla"

#### 10.4.15 Activity tab (within task detail drawer)

Renders `activity_log` rows for the task in reverse chron, including subtask deletions cascaded from parent (US-TASK-10):

```
📜 AKTİVLİK
─────────────────────────────────────────────
🟢 03 May 14:30 — Talifa: status "Başlanmayıb" → "İcrada"
💬 03 May 14:25 — Aydan: "@turkan klientdən cavab gözlədik"
✏️ 02 May 18:00 — Talifa: deadline 12 May → 15 May
👤 02 May 09:15 — Talifa: assignee Aydan əlavə etdi
🗑 02 May 08:30 — Talifa: subtask "Köhnə eskiz" silindi
✅ 01 May 09:00 — Aydan: subtask "Mass plan" tamamlandı
🆕 28 Apr 14:00 — Talifa: tapşırıq yaratdı
```

Admin sees inline `🚫 Performansa təsir göstərməsin` button on every entry → toggles `is_blame_excluded` (REQ-TASK-19). MIRAI-detected blame keyword entries show a yellow banner row above:

```
🤖 MIRAI: Bu komment-də "sifarişçi gecikdirdi" qeyd olunub.
   Bunun performansa təsir göstərməməsini tövsiyə edirəm.
   [Təsdiq et]   [Rədd et]
```

### 10.5 Arxiv — REQ-ARC-01..03 / US-ARC-01..02

Read-only view under İŞ group. Combines `tasks` (`archived_at IS NOT NULL`) and `projects` (`status='closed'`).

**Header:** title `Arxiv` + filter bar (project / assignee / date range / status / type).

**Two stacked tables:**
1. **Arxivləşdirilmiş Tapşırıqlar** — columns: Başlıq / Layihə / Status / Arxivləşmə tarixi / Məsul / [Restore — admin only]
2. **Bağlanmış Layihələr** — columns: Ad / Müştəri / Bağlanma tarixi / Müddət / [Yenidən aç — admin only]

Restore action confirms via `confirm()` dialog → admin-only RLS guard server-side (REQ-ARC-02). Non-admin sees no restore action and is scoped to own items (REQ-ARC-03).

### 10.6 Müştərilər (CRM) — REQ-CRM-01..15 / US-CRM-01..15

**Page header (admin only):**
```
Müştərilər                                       [+ Yeni müştəri — primary]
🟢 Komanda yükü: 65% (sağlam) — Yeni layihə qəbul edə bilirik
₼ Pipeline value (weighted): ₼287,500
```

Header indicator color: 🟢 ≤70% / 🟡 70–90% / 🔴 >90% (REQ-CRM-12).

**View toggle:** `Pipeline / Cədvəl`. Detail opens as right drawer (`--lg`) over either view.

#### 10.6.1 Pipeline view (Attio workflow)

- Dots canvas background
- 8 stage columns: Lead / Təklif / Müzakirə / İmzalanıb / İcrada / Bitib / Arxiv / İtirildi (note: NO Portfolio — see §2.3)
- Column header: stage name + total `Σ(expected_value × confidence_pct/100)` (REQ-CRM-02)
- Client cards = workflow nodes (§6.13): company logo + name (`--text-base` 600), confidence %, last interaction relative time, AI ICP badge (`pill--ai`)
- Drag between columns → **transition gating modal** (§10.6.2, REQ-CRM-01)
- Drop on `İtirildi` → required `lost_reason` enum + note dialog
- Skip-stage drag → blocking modal (admin sees override option)

#### 10.6.2 Stage transition modal (US-CRM-07)

When a card is dropped on the next valid stage, the modal collects mandatory payload before the drop commits:

```
┌─────────────────────────────────────────────────────┐
│  Lead → Təklif                          [×]          │
├─────────────────────────────────────────────────────┤
│  Bilgə Qrup mərhələni dəyişir.                       │
│                                                       │
│  Təklif tarixi*:    [📅 ____]                        │
│  Təklif məbləği*:   [₼ ______]                       │
│                                                       │
│  Qeyd: bu məlumatlar audit izinə qaydalanır.         │
│                                                       │
│  [Ləğv et]                       [Mərhələni dəyiş]   │
└─────────────────────────────────────────────────────┘
```

Per-transition field set per PRD §6.2:
| Transition | Modal fields |
|---|---|
| Lead → Təklif | Təklif tarixi + Təklif məbləği |
| Təklif → Müzakirə | Müştəri cavabı + Cavab tarixi |
| Müzakirə → İmzalanıb | Müqavilə Drive linki (URL validation) + İmzalanma tarixi |
| İmzalanıb → İcrada | Avans məbləği + Avans tarixi (auto-creates income+receivable) |
| İcrada → Bitib | Təhvil-təslim aktı (project_documents picker) + Final ödəniş tarixi |
| → İtirildi | Səbəb (radio: Büdcə / Müddət / Rəqib / Müştəri ləğv etdi / Digər) + Qeyd (məcburi if Digər) |

**Skip-stage block modal (non-admin):**
```
⚠️ Mərhələ atlamaq olmaz
Atlanmış mərhələlər: Təklif, Müzakirə
Bu mərhələləri əvvəlcə tamamlamaq lazımdır.
[Geri qayıt]
```

**Skip-stage admin override:** same modal but adds at bottom:
```
─────────────────────────────────────
Override (admin):
Səbəb*: [text input]
[Geri qayıt]    [Override et — danger]
```

Override commit logs both `transition_payload.override_reason` and an `audit_log` row.

#### 10.6.3 Table view

Columns: Şirkət (logo + name) / Əlaqə / Mərhələ / Gözlənilən dəyər (numeric) / Ehtimal % / Son aktivlik / **Lifetime ₼** (NEW) / ICP Fit (AI) / Əlaqə gücü

BD Lead role (level 3): financial columns `Gözlənilən dəyər` + `Lifetime ₼` masked with `cell--masked` per RLS.

#### 10.6.4 Client Drawer (US-CRM-04, US-CRM-14)

Header (Statistika summary):
```
Bilgə Qrup                                  [Edit] [Arxiv]
─────────────────────────────────────────────────────────
📊 Ümumi gəlir: ₼285,000  Layihə sayı: 3
   İlk əlaqə: 2024-08    Son layihə: 2026-04
   Ortalama: ₼95,000
─────────────────────────────────────────────────────────
[Stage chip — pipeline color]   [Mərhələni dəyiş ▼]
```

Tabs: `Statistika / Ümumi / Timeline / Layihələr / Sənədlər / Kommunikasiya / Əlaqə şəxsləri`

- **Statistika** (default tab) — header summary expanded with sparkline of incomes per quarter; AI ICP score with refresh button (throttled 1/24h, US-CRM-03)
- **Ümumi** — contact info, expected value, confidence slider, expected close date
- **Timeline** — `client_stage_history` rows reverse chron with avatar + transition + transition_payload summary chips (e.g. "Avans: ₼15K, 02 May")
- **Layihələr** — list of projects with status pill + deadline + last activity
- **Sənədlər** — `project_documents` rows for this client; categories (Müqavilə, Qiymət protokolu, Hesab-faktura, Akt, Email, Məktub) shown as filter pills above; per-row "Baxılma tarixçəsi" expansion (§10.6.5)
- **Kommunikasiya** (NEW) — unified feed: `client_interactions` + `client_email_captures` reverse chron; quick-log form at top (type pill + text + submit, ≤30s); "✉️ Məktub yaz" button opens letter composer (§10.6.6); BCC-captured emails marked with 📥 badge + "BCC capture" pill
- **Əlaqə şəxsləri** — multi-contact rows (admin only edit)

#### 10.6.5 Document viewer log (US-CRM-08)

Inside any document row in Sənədlər tab, expandable "Baxılma tarixçəsi":

```
👁 Baxılma tarixçəsi (12)
─────────────────────────────
03 May 14:32 · 95.85.xx.xx · Chrome/Mac
03 May 14:30 · 95.85.xx.xx · Chrome/Mac
02 May 09:18 · 188.72.yy.yy · Safari/iOS
... [Hamısına bax →]
```

- Empty state: "Hələ heç kim açmayıb"
- Repeat opens from same IP within 5min collapsed into single row with `(N dəfə)` count
- Admin "Tokeni iptal et" action → confirms → URL returns 410 Gone

#### 10.6.6 Rəsmi Məktub Composer (US-CRM-09)

Drawer (`--lg` 640px) opened from Kommunikasiya tab "✉️ Məktub yaz":

```
┌─────────────────────────────────────────────────────────────┐
│  Yeni məktub — Bilgə Qrup                              [×]  │
├─────────────────────────────────────────────────────────────┤
│  Mövzu: [_______________________________________________]   │
│  Alıcı:  client@bilge-qrup.az                                │
│                                                              │
│  ┌─ Şablon ────────┐  ┌─ Məzmun ──────────────┐  ┌─ Önizləmə ┐
│  │ ▸ Müqavilə      │  │ [WYSIWYG editor]      │  │ [Logo]    │
│  │ ▸ Faktura       │  │ {{client_name}} chips │  │ [Letter   │
│  │ ▸ Təşəkkür      │  │ paragraf...           │  │  preview] │
│  │ ▸ Sorğu         │  │                       │  │ [İmza+    │
│  │ [+ Yeni şablon] │  │                       │  │  möhür]   │
│  └─────────────────┘  └───────────────────────┘  └───────────┘
│                                                              │
│  ☐ Email göndər (avtomatik Resend)                           │
│                                                              │
│  [PDF endir]   [Email göndər]   [Yadda saxla]   [Ləğv et]   │
└─────────────────────────────────────────────────────────────┘
```

Variable chips (right-side variable picker) drag-drop into editor; double-click any chip to insert at cursor. Unresolved variables on save → toast warning "Bəzi dəyişənlər boş qaldı" + highlights `[Yoxdur]` placeholders.

Output:
- **PDF endir:** generates PDF (logo + signature + content); inserts `project_documents` row + share_token; download starts
- **Email göndər:** Resend → `client_letters.sent_via='email'` + `sent_at`
- **Yadda saxla:** `client_letters` draft, no project_documents row yet

#### 10.6.7 Email BCC capture inbox (US-CRM-15)

Sistem → Email captures (admin only). Layout:

```
📥 Email captures inbox  ·  3 manual matching gözləyir
───────────────────────────────────────────────────────
○ "Layihə təklifi haqqında" — to: client@bilge-qrup.az
   from: aydan@reflect.app  ·  03 May 14:30  ·  AI: 0.4 ⚠️
   [Müştəri picker]  [Layihə picker]  [Saxla]  [Sil]
   
✓ "Final təhvil" — to: yeni@hacikend.az  ·  matched ✓
   from: talifa@reflect.app  ·  02 May 18:00  ·  AI: 0.95 ✅
```

Matched rows (confidence ≥0.5) auto-disappear from this inbox after 7 days; unmatched stay until human action.

#### 10.6.8 Workload estimator + Net Income (US-CRM-11)

Surfaces in 3 places:

**A. Müştərilər page header** (already shown §10.6 top):
```
🟢 Komanda yükü: 65% (sağlam) — Yeni layihə qəbul edə bilirik
```

**B. Proposal flow modal** (when creating proposal for client):
```
┌──────────────────────────────────────────────────────┐
│  📊 Çatdırılma müddəti hesablaması                   │
├──────────────────────────────────────────────────────┤
│  Müştəri: Bilgə Qrup                                  │
│  Layihə: Yay evi (residential, 200 m²)                │
│                                                       │
│  ⏱ Variantlar:                                        │
│  ⦿ ⚡ Ən tez: 6 həftə      (estimated × 0.6)          │
│  ○ 🎯 Orta:    10 həftə     (estimated × 1.0)         │
│  ○ 🌿 Tam rahat: 14 həftə  (estimated × 1.5)          │
│                                                       │
│  💰 Net qazanc proqnozu (₼100K müqavilə):            │
│     Müqavilə dəyəri:        ₼100,000                  │
│     − Outsource (estimate): ₼ 25,000                  │
│     − Overhead allocation:  ₼ 18,000                  │
│     ────────────────────────────────                  │
│     Reflect-ə net qalır:    ₼ 57,000  (57%)  🟢       │
│                                                       │
│  💡 MIRAI tövsiyəsi: Orta variant + ₼100K müqavilə   │
│     Səbəb: Komanda yükü uyğundur, net qazanc 57%      │
│                                                       │
│  [Ləğv et]              [Variantı seç və davam et]   │
└──────────────────────────────────────────────────────┘
```

**C. Inline MIRAI tool** in chat for "Bu layihəni qəbul edə bilərikmi?" type questions; same content rendered as MIRAI bubble.

#### 10.6.9 Auto-archive (US-CRM-12)

Daily cron flips inactive (>6mo) clients to `Arxiv`. Archived clients hidden from default pipeline; appear under "Arxiv" stage column with muted opacity. Admin can reactivate via card menu `↩ Bərpa et` → returns card to its `previous_stage` from `client_stage_history`.

#### 10.6.10 Retrospective survey (US-CRM-06)

Triggered from project closeout. Public form at `/r/{share_token}` — no auth, NPS 0–10 row of 11 buttons + per-category 1–5 stars + free-text + submit.

### 10.7 Maliyyə Mərkəzi — REQ-FIN-01..09 / US-FIN-01..08

Single page, 6 tabs. Sticky `Cash Cockpit` summary above tabs.

**Sticky top bar (Cash Cockpit balance) — Bank vs Kassa split, US-FIN-09:**
```
┌────────────────────────────────────────────────────────────────────────┐
│  🏦 Bank: ₼145,000   💵 Kassa: ₼8,500   📊 Cəmi: ₼153,500              │
│  📈 30g: ₼178K   90g: ₼165K   12ay: ₼240K                              │
│  ⚠️ Min. tələb (3 ay runway): ₼210K → 🟡 Diqqət                         │
│  [+ Gəlir — primary] [+ Xərc — secondary]                              │
└────────────────────────────────────────────────────────────────────────┘
```

- Featured-style gradient border card
- Numbers tabular, large (`--text-3xl`), AZN-formatted via `Intl.NumberFormat('az-AZ')`
- Bank icon `🏦` + Kassa icon `💵` rendered inline; tooltip on each shows breakdown if multiple rows (e.g. "Kapital ₼90K + PASHA ₼55K")
- Runway gauge color: 🟢 ≥3mo / 🟡 2–3mo / 🔴 <2mo (REQ-FIN-14)
- Insufficient history (< 6 months expenses) → runway line replaced with muted text "Burn rate hesablaması üçün 6 aylıq tarixçə lazımdır"
- "+ Gəlir" / "+ Xərc" modals require selecting target balance row (radio of bank/kassa rows) — empty state never appears (CHECK trigger ensures sum)

**Tabs:** `Cash Cockpit / P&L / Outsource / Xərclər / Debitor / Forecast`

#### 10.7.1 Cash Cockpit
- Featured balance (already sticky above)
- 3 metric cards row: `Gəlir / Xərc / Gözlənilən` (this month, tabular)
- **Cash snapshot chart** (REQ-FIN-11): area chart of last 90 days from `cash_snapshot_mv`. Two-band area: `bank_total` (blue tint) + `kassa_total` (green tint). Stacked. X axis: date. Y axis: AZN tabular.
- **Token Counter Dashboard widget** (REQ-FIN-18, US-FIN-17): admin-only card under Cash Cockpit row:
  ```
  ┌────────────────────────────────────────┐
  │ 🤖 MIRAI istifadəsi (May 2026)         │
  │ ₼3.20 / ₼5.00 budget  ━━━━━─── 64%     │
  │                                         │
  │ Persona: CFO ₼1.20 · HR ₼0.80 · ...    │
  │ User: Talifa ₼2.10 · Aydan ₼0.70 · ... │
  │ [30-day sparkline of daily tokens]      │
  └────────────────────────────────────────┘
  ```
  - Bar fill: green <80%, yellow 80–100%, red ≥100%
  - At 100% → red banner under widget: "🔄 Pulsuz model rejiminə keçildi (Groq llama-3.3)"
- Recent transactions table (compact): Tarix / Növ / Layihə / Bank/Kassa / Məbləğ (color-coded: gəlir green, xərc red, internal_loan brand)
- "Hamısına bax" link → opens Xərclər/Debitor based on type

#### 10.7.2 P&L — 3-level (US-FIN-12, REQ-FIN-06)

Firm-level header row, project rows below.

**Project row layout:**
```
Layihə X — Bilgə Qrup                                    [⋯]
   Gross    ₼100,000
   Net      ₼ 75,000   (Gross − ₼25,000 outsource)
   Final    ₼ 68,375   (Net − ₼6,625 overhead)    🟢
```

- Each level on its own line, tabular numerals, right-aligned
- Health emoji at end of Final line:
  - 🟢 Final ≥ 30% of Gross
  - 🟡 10–30%
  - 🔴 < 10%
- Click row → drawer opens with breakdown:
  - Income transactions list
  - Outsource items list
  - **Overhead allocation breakdown** (US-FIN-13, REQ-FIN-13): per-month rows showing `month / firm_overhead / share_% / allocated`. Override button per row → modal accepts `override_amount` + `override_reason`; flagged rows show `↺ Manual` chip
  - **MIRAI alert banner** if 25% peer divergence: "⚠️ Bu layihənin overhead-ı oxşar müddətli digər layihələrdən %X yüksəkdir. Səbəbi araşdırın."
- Sort: by Final descending (default), Gross / Net / project name as alternates
- "Excel ixracı" button (right) → `.xlsx` download with all 3 levels + monthly overhead allocation history

#### 10.7.3 Outsource (US-FIN-04, REQ-FIN-07)
- Table: Layihə / İş növü / Məsul / Deadline / Status (always visible)
- Admin-only columns: Məbləğ / Ödəniş tarixi / Metod
- Non-admins: those columns render as `cell--masked` (—) — see §6.8
- Status workflow indicator: Sifariş → İcra → Təhvil → Ödənildi (4-dot stepper inline)

**Lazy executor assignment** (PRD REQ-FIN-07): outsource items routinely have unknown executor at create time. Required at create: `work_title`, `project_id`, `amount`, `deadline`. Optional (NULL allowed): `contact_person`, `contact_company`, `responsible_user_id`.

In the table, empty `Məsul` cell renders as muted placeholder:
```
[+ Cavabdeh təyin et]    ← inline picker, italic --color-n400
```

Inline edit on click → user picker → save → row updates without modal.

**Status gating:** transition to `İcra` is blocked if `responsible_user_id IS NULL`. The status dropdown shows `İcra` disabled with tooltip "Cavabdeh şəxs təyin edilməlidir". Admin attempting drag/select gets toast:

```
⚠️ Bu outsource üçün cavabdeh şəxs təyin edilməlidir.
   "Sifariş" mərhələsində qaldı.
```

Other status transitions (Sifariş → Sifariş, Sifariş → Təhvil-skip, Cancelled) remain available.

#### 10.7.4 Xərclər
- Tabs within: `Birdəfəlik / Sabit (təkrar)`
- Birdəfəlik: standard table
- Sabit: list of `recurring_expenses` with period pill + next_run_at countdown; `pg_cron` materializes monthly into `expenses` (REQ-FIN-05)

#### 10.7.5 Debitor
- Receivables table: Müştəri / Layihə / Məbləğ / Ödənilib / Qalıq / Vaxt / Status
- Status pills: `Tam ödənilib` (success) / `Qismən` (warning) / `Vaxtı keçib` (danger)
- Row action: `Ödəniş qeyd et` opens partial-payment modal with overpayment guard ("Ödəniş qalıq məbləği aşır", US-FIN-02)

#### 10.7.6 Forecast — two-line confidence chart (US-FIN-15, REQ-FIN-15..17)

**Horizon tabs:** `30 gün / 90 gün / 365 gün`

**Two-line area chart layout:**
```
Balance (₼)
  ↑
  │           ╱─── Optimistic (dashed)  ← all sources @ full
  │       ╱──╱       confidence
  │   ╱──╱
  │ ╱─    ━━━━━━━ Confident (solid)  ← only ≥90% confidence
  │       ━━━━ ⓘ
  │  shaded warning-bg = risk zone
  └─────────────────────→ date
```

```css
.forecast-chart .line--confident { stroke: var(--color-brand); stroke-width: 2; fill: none; }
.forecast-chart .line--optimistic { stroke: var(--color-brand-border); stroke-width: 2; stroke-dasharray: 6 4; fill: none; }
.forecast-chart .risk-zone        { fill: var(--color-warning-bg); opacity: 0.5; }
.forecast-chart .axis-grid        { stroke: var(--color-n200); }
.forecast-chart .axis-label       { font-size: var(--text-xs); fill: var(--color-n400); }
```

**Right side panel:**
- Source contributions list (collapsible per confidence tier):
  - 95% — Müqaviləli + avans alınmış (₼XX)
  - 75% — Müqaviləli, avans yox (₼XX)
  - 60% — CRM İcrada (₼XX)
  - 30% — CRM Təklif/İmzalanıb (₼XX)
  - 10% — CRM Lead (₼XX)
- "Yenilə" button — rate-limited 1×/24h per user, shows next-allowed time on hover
- Disclaimer: "Bu proqnoz son 6 ayın məlumatlarına əsaslanır"

**Calibration banner (US-FIN-16):** when MIRAI detects a confidence tier consistently miscalibrated by >15% over 3 months, banner appears above the chart:

```
🤖 İcrada confidence 60% → 55% tövsiyə olunur
   Son 3 ayın faktiki nəticələri: 55%, 53%, 57%.
   [Tətbiq et]   [Sonra]   [Detallar]
```

#### 10.7.7 Cross-Project Funding suggester (US-FIN-11, REQ-FIN-12)

When MIRAI detects shortfall + sibling surplus, a modal opens automatically (admin only):

```
┌──────────────────────────────────────────────────────┐
│  🤖 MIRAI: Daxili maliyyələşdirmə təklifi             │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Z layihəsinin maaş ödənişi 3 gün içində çatmır.      │
│  Lazım olan məbləğ: ₼15,000                           │
│                                                       │
│  Mövcud opsiyalar:                                    │
│  ⦿ X layihəsi  (₼45,000 sərbəst, avans alındı)       │
│  ○ Y layihəsi  (₼20,000 sərbəst, final gözlənilir)   │
│  ○ Sabit kassadan (₼8,500 — yetərsiz ⚠️)             │
│                                                       │
│  💡 Tövsiyəm: X layihəsi                              │
│     Səbəb: Z 2 ay sonra ₼60K gətirəcək, X-də buffer  │
│     var, final ödəniş 3 ay sonradır.                  │
│                                                       │
│  Səbəb: [_______________________________________]    │
│  [Canvas signature pad]                               │
│                                                       │
│  [Ləğv et]    [Y-dən götür]    [X-dən götür — primary]│
└──────────────────────────────────────────────────────┘
```

- Selected source highlighted with `--color-brand-light` row
- Insufficient sources shown with `⚠️` and disabled radio
- Səbəb text required to commit
- Canvas signature pad (300×100px) — captures signature
- On commit:
  - `internal_loans` row inserted
  - PDF auto-generated with all `audit_chain` fields embedded (REQ-FIN-19)
  - Toast: "Daxili borc qeyd olundu — PDF audit-də saxlanılır"
- Repayment prompt appears later as a Mənim Tapşırıqlarım row (`task_kind='followup'`) when borrowing project receives income

**Audit chain panel** (REQ-FIN-19) on internal loan detail drawer:
```
🔒 Audit zənciri
─────────────────
IP: 95.85.xx.xx
Tarix: 04 May 2026 14:32:08 (Asia/Baku)
Aktiv: talifa@example.com
Imza: [thumbnail of canvas signature]
Email təsdiqi: ✅ talifa@... (2 dəq sonra)
```

#### 10.7.8 `+ Gəlir` / `+ Xərc` modal (REQ-FIN-01, REQ-FIN-04)
- Fields: amount (positive validated) + project + client + payment_method + **target balance row (radio: 🏦 Kapital / 🏦 PASHA / 💵 Main kassa)** + date + invoice_number + note
- On save: row insert + activity_log + receivable auto-mark-paid if amount matches + target `cash_balances.current_balance` increment (US-FIN-01)
- Negative amount → `.input--error` + "Məbləğ müsbət olmalıdır"

**Invoice template generator (US-FIN-08):**
- Template picker → fill missing variables modal → preview → save
- Output: `project_documents` row with `source='auto_generated'`, PDF + share-token
- Invoice number auto-incremented per fiscal year, format `AZ-YYYY-NNNN`

### 10.8 İşçi Heyəti — PRD §5 MOD 8.1

**Layout:** card grid (3 cols), each card:
```
┌──────────────────────────────┐
│  [Avatar lg]  Anar Quliyev   │
│               Senior Designer │
│  ───────────────────────────  │
│  📧 anar@…   📱 +994…        │
│  Avadanlıq: 2  Yük: 6 task   │
└──────────────────────────────┘
```
Click → opens employee detail drawer (Profil, Kompensasiya — admin only, Performans, Avadanlıq, Tarixçə).

### 10.9 Əmək Haqqı — US-SAL-01..02

- **User view (US-SAL-01):** single card showing current effective salary + history table (effective_from / effective_to / amount / components breakdown)
- **Admin view (US-SAL-02):** all employees table with current salary + "Yenilə" action; update modal inserts new `salaries` row (no overwrite), prev row's `effective_to` set to day before; `audit_log` entry recorded

### 10.10 Performans — US-PERF-01..02 / REQ-PERF-01

- **User view:** vertical list of yearly cards for years where `published_at IS NOT NULL`. Each card: ring progress (§6.9) + ratings breakdown bars + reviewer name + publish date in subtitle ("Yayımlandı: 18 Dek 2026"). Years without published reviews simply don't appear; **no draft data leaks**.
- 3 years employed + all published → 3 cards.
- **Admin view:** switchable between "Mənim" and per-employee dropdown. Each row shows BOTH draft and published years; draft rows have a yellow `📝 Qaralama` pill, published rows have green `✅ Yayımlandı`.
- **Yeni qiymətləndirmə modal** (admin, REQ-PERF-01):
  ```
  Yeni qiymətləndirmə — Aydan, 2026
  ─────────────────────────────────
  Score (0–100):     [_____]
  Ratings (4 ölçü):  [components form]
  Xülasə:            [textarea]
  
  ☐ İndi yayımla (işçi dərhal görəcək)
  
  [Ləğv et]   [Qaralama saxla]   [Yarat və yayımla — primary]
  ```
- "Qaralama saxla" → `published_at = NULL` (default). User cannot see.
- "Yayımla" button on existing draft rows → confirms → `published_at = now()`, in-app + Telegram notification "{year} performans nəticəniz hazırdır" fires to employee.
- **Unpublish flow:** admin opens published row → `⋯` menu → "Yayımı geri al" → confirm dialog → `published_at = NULL`; logged in `audit_log`. UI strongly discourages this with copy: "İşçi bu yekunu artıq görüb. Geri almaq görmə tarixçəsini silmir."
- **HR persona summary preview** (PRD §7.2): admin viewing a draft sees an inline "🤖 MIRAI HR önizləməsi" card above the form fields → blame-exclusion-aware aggregation visible to admin even before publish (see §10.19 İK persona).

**Metrics displayed (proxy from REQ-FIN-13, NO timesheet — REQ-PERF-02):**

```
Aydan Məmmədova — Aprel 2026
─────────────────────────────────────
Aktiv iş günü:        18 gün
Tamamlanan tapşırıq:  23/26 (88%)  🟢
Orta tamamlanma:      2.3 gün
Bloklanmış:           2
Excluded delays:      3 (sifarişçi)
─────────────────────────────────────
🤖 MIRAI HR analizi: yüksək performans —
   sifarişçi kateqoriyasında flag-lər istisna
   edildikdə score 92/100
```

- **NEVER show hours / saat** — only calendar days (per PRD §4.17 timesheet exclusion)
- "Aktiv iş günü" = `Σ project_active_user_days(P, M)` for the user (single source of truth with finance overhead allocation REQ-FIN-13)
- Color-coded completion ratio: 🟢 ≥85% / 🟡 70–84% / 🔴 <70%
- Excluded delays count makes the blame-exclusion (REQ-TASK-19) visible to admin without judging — answers "delay var, amma niyə?"

- Activates from year 2026 (REQ-Komanda 8.3)

**Score breakdown card (REQ-PERF-03):**

```
Final score: 88/100  🟢
─────────────────────────────────────
🤝 360° Survey       (40%)   91 → 36.4
👤 Manager review    (30%)   85 → 25.5
🤖 MIRAI HR analiz   (30%)   88 → 26.4
─────────────────────────────────────
                      Cəmi:  88.3
```

**360° survey flow (REQ-PERF-04):**

Admin "360 sorğusu başla" button → modal:

```
┌──────────────────────────────────────────────┐
│ 360° Sorğu — Aydan, 2026                     │
├──────────────────────────────────────────────┤
│ Reviewer-ləri seç (5–10):                    │
│ ☑ Turkan H.  (komanda yoldaşı)              │
│ ☑ Nurlan H.  (junior)                        │
│ ☑ Talifa İ.  (manager)                       │
│ ☐ ...                                        │
│                                              │
│ ☑ Anonimdir (default)                        │
│                                              │
│ [Ləğv et]              [Sorğu göndər]        │
└──────────────────────────────────────────────┘
```

Reviewer notification:
```
🤝 360° qiymətləndirmə dəvəti
Aydan üçün rəyiniz lazımdır. 5 dəq çəkir, anonimdir.
[Sorğunu doldur]
```

Reviewer form: 4 Likert 1–5 sahə (komanda işi, keyfiyyət, deadline, ünsiyyət) + sərbəst şərh. Submit → `performance_360_invitations.completed_at`.

Admin dashboard panel above publish form (≥3 completion-dan sonra):
- Aggregated score per category (bar chart)
- Anonymous comments stripped of identity
- "Bu data ilə score_360 hesablandı: 91/100"

### 10.11 Məzuniyyət — US-LEAVE-01..02

**Layout:** split — left: own requests list, right: team calendar overview (mini month view).
- "Yeni məzuniyyət" modal: kind pill row (Məzuniyyət / Xəstəlik / Şəxsi) + date range picker + note
- Status pills: `Gözləmədə` (warning) / `Təsdiq` (success) / `Rədd` (danger)
- Admin queue: pending requests at top with `Təsdiq / Rədd` buttons inline
- On approve → calendar event auto-created (US-LEAVE-02)

### 10.12 Təqvim — US-CAL-01..03 (PRD §8.2 Google parity)

**View tabs:** `Ay / Həftə / Gün` (sliding underline indicator)

**Month view:**
- 7-column grid, day cells `min-height: 96px`
- Today: `--color-brand-light` bg + brand dot top-left
- Events: pill bars (project color or category color), max 3 visible + "+N daha"
- Click cell → "Yeni hadisə" with prefilled date

**Week view:** 7 day columns × 24 hour rows, events as floating positioned blocks

**Day view:** single column, hour rows, side panel for selected event

**Event modal:** Başlıq / Açıqlama / Başlama / Bitmə / Bütün gün toggle / Təkrarlanma (RRULE picker) / Yer / Meet linki / Daxili iştirakçılar (multi) / Xarici e-poçtlar (chip input) / Layihə (picker)

**`Meet yarat` button (US-CAL-02):** opens `https://meet.new` in new tab → user pastes URL back → "Görüşə qoşul" button appears in event view; `.ics` for external attendees includes URL.

### 10.13 Elanlar — REQ-Komanda 8.6 / US-ELAN-01..03

Editorial Whenevr-style.

**Layout:**
```
[Featured card — full width 480px height]
[3-column card grid below]
```

**Featured card:**
- Left half: full-bleed image OR gradient (category-driven; MIRAI posts use `--grad-mirai-1`)
- Right half: white
  - Category pill top (`pill--brand` for manual, `pill--ai` for `mirai_generated`)
  - Title: Rubik 700 28px, line-height tight
  - Description: 400 15px `--color-n600`, max 3 lines
  - Footer: `5 dəq oxu • {date}`
- Radius 16px overflow hidden

**Grid cards:**
- Image/gradient top (160px) with category pill overlaid top-right
- Title: Rubik 600 17px
- Description: 2-line clamp `--color-n600`

**Filter bar (horizontal scrollable pills):** Hamısı / Xəbər / Hadisə / Trend (AI) / Opportunity (AI) / Siyasət / Layihə / Digər
- Active pill: `--color-brand` bg + white text
- Inactive: `--color-n100` bg + `--color-n600` text
- AI categories show animated dot prefix

**MIRAI moderation queue (admin only, US-ELAN-02):** banner at top "{N} MIRAI yazısı təsdiqləmə gözləyir →" → opens table with `Saxla / Rədd` row actions.

**`Hamısını oxunmuş işarələ`** action top-right; per-item unread dot via `read_by jsonb`.

### 10.14 Avadanlıq — US-EQUIP-01

Table view: İkon + Ad / Növ / Seriya / Təyin olunub / Vəziyyət / Tarixçə.
- Row action: "Təyin et / Geri al"
- Transfer history opens drawer with timeline list (avatar + ad + tarix)

### 10.15 OKR — US-OKR-01..03

**Tabs (admin):** `Şirkət / Şəxsi / Komanda baxışı`. Non-admin sees only `Şəxsi`.

**Şirkət OKR card layout:**
```
Q2 2026 — Müştəri sayını ikiqat artır
Owner: Talifa
[Ring progress 56%]
KR1: Yeni müştərilər: 12 / 20  ━━━━━━━─── 60%
KR2: Pipeline value: 45k / 80k ━━━━━━─── 56%
KR3: NPS: 4.2 / 4.5             ━━━━━━━━─ 80%
```

**Komanda baxışı:** member rows with health pill (On Track ≥70% green / At Risk 40–69% amber / Off Track <40% red); click expands into their personal OKRs.

**Weekly nudge:** if no update in 7 days, MIRAI sends in-app notification "OKR-ı yeniləməyi unutmayın" (US-OKR-02).

### 10.16 Karyera Strukturu — US-CAREER-01

Vertical level ladder; user's current level highlighted with `--color-brand-light` halo. Each level card shows requirements as checklist (already-met items get green check, e.g. "≥3 closed projects"). "Növbəti səviyyəyə yol" section shows remaining criteria as progress.

Admin: edit-mode toggle reveals inline editing of level requirements.

### 10.17 Məzmun Planlaması — admin only

Calendar grid view + list view toggle. Each `content_plans` entry: channel pill (Instagram / LinkedIn / Blog / Newsletter) + title + scheduled time + owner avatar + status pill (`Layihə / Hazır / Yayımlandı`). Owner gets reminder 2 days before scheduled_at.

### 10.18 Sistem / Parametrlər — admin only

**Left rail tabs:** `Ümumi / Şablonlar / Bilik Bazası / Bildirişlər`

#### Ümumi
- Firm name input, logo uploader, default currency picker, working hours range, AZ holidays multi-select calendar

#### Şablonlar (US-SYS-01, REQ-CRM-15)

Two sections rendered as collapsible groups:

**📦 Sistem default şablonları** (seeded, editable, revertible):
| Şablon | Kateqoriya |
|---|---|
| Email — Təşəkkür | `email` |
| Email — Faktura göndəriş | `email` |
| Akt — Podratçı (individual) | `outsource_act / individual` |
| Akt — Podratçı (şirkət) | `outsource_act / company` |
| Anket — Müştəri retrospektiv | `survey` |

Each row has `↺ Default-a qaytar` action; admin edits restore via this button.

**✏️ Sizin yaratdığınız şablonlar** (initially empty):
| Şablon | Kateqoriya |
|---|---|
| (boş) Rəsmi məktub | `letter` |
| (boş) Hesab-faktura | `invoice` |
| (boş) Sifarişçi ilə təhvil-təslim aktı | `delivery_act` |

Empty rows show `[+ Şablon yarat]` CTA inline.

**Editor drawer** (`--lg`):
- Split — left: rich-text editor (TipTap) with `{{variable}}` chip autocomplete from REQ-CRM-13 registry
- Right: live preview rendered with sample values (e.g. `{{client_name}}` → "Bilgə Qrup")
- Top: language selector (AZ/EN/RU) — switches active body
- Variables auto-extracted on save; missing required variables flagged with yellow warnings
- "Önbaxış PDF" button generates sample PDF

#### Bilik Bazası (US-SYS-02)
- Drag-drop PDF uploader
- Uploaded files table: Ad / Səhifə sayı / Chunks / Yüklənmə tarixi / Yenidən embed et
- Pipeline status: `Çıxarılır / Embed edilir / Hazır / Xəta`
- Re-upload same filename → confirms versioning replacement

#### Bildirişlər
- Matrix UI: rows = event kinds, columns = channels (In-app / Email / Telegram), cells = toggle switches (§6.10)
- Stored in `notification_preferences (user_id, channel, event_kind, enabled)`

**Event kind rows (full list, PRD §6.4 + §4.13 + REQ-TASK-21 + REQ-TASK-23):**
| Event kind | AZ label |
|---|---|
| `deadline` | Tapşırıq deadline yaxınlaşır / keçdi |
| `mention` | Komment-də etiketlənmə |
| `status_change` | Tapşırıq statusu dəyişdi (mənə təyin olunan) |
| `assignment` | Yeni tapşırıq mənə təyin olundu |
| `finance_alert` | Maliyyə xəbərdarlığı (yalnız admin/creator) |
| `mirai_feed` | MIRAI Elanlar yayımı |
| `morning_summary` | 09:00 günün özeti |
| `evening_motivation` | 18:00 gün sonu motivasiyası |
| `smart_reminder` | MIRAI elapsed-vs-estimate xəbərdarlığı |
| `performance_published` | İllik performans yekunu yayımlandı |
| `loan_proposal` | Daxili borc təklifi (admin only) |
| `internal_loan_repayment_due` | Borc qaytarma xatırlatması (admin only) |

User toggles each cell. Defaults: in-app=ON for all; Telegram=ON for deadline/mention/finance_alert/morning_summary; Email=OFF except `performance_published`.

### 10.19 MIRAI — REQ-MIRAI-* / US-MIRAI-01..13 (PRD §7 v3.5)

**Canvas:** `--color-canvas-mirai` (`#EBEBEB`) — slightly darker than app canvas to create focus isolation.

**Blob layer (3 large blurred animating blobs §7.6):**
```
Left:    pink/rose      → "Operational Intelligence" label
Center:  yellow/amber   → "Spatial Intelligence" label
Right:   orange/white   → "Artistic Intelligence" label
```

```css
.mirai-blob {
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.75;
  position: absolute;
  pointer-events: none;
}
.mirai-blob--1 { width: 300px; height: 300px; background: var(--grad-mirai-1); top: 10%; left: 8%; }
.mirai-blob--2 { width: 260px; height: 260px; background: var(--grad-mirai-2); top: 15%; left: 38%; }
.mirai-blob--3 { width: 280px; height: 280px; background: var(--grad-mirai-3); top: 8%; right: 8%; }
```

Optional geometric overlay: SVG lines connecting dots at blob centers (1px stroke `--color-n900`, dot r=3) — adds the "constellation" feel.

**Persona selector:**
- Admin: 8 pill buttons in horizontally scrollable row — `Əməliyyat Direktoru (COO) / Layihə Mühəndisi / Hüquqşünas / CMO / Maliyyə Analitiki (CFO) / Strateq / İK Direktoru (HR) / Kommunikasiya Direktoru (CCO)`
- Each pill carries an emoji prefix for fast recognition: 🎯 COO / 🏗️ Layihə / ⚖️ Hüquqşünas / 📣 CMO / 💰 CFO / 🧭 Strateq / 👥 HR / ✉️ CCO
- User: 2 pills — `🏛 Komanda Köməkçisi (Memarlıq)` / `🤝 Komanda Köməkçisi (Ümumi)` (PRD §7.2 v3.4)
  - Memarlıq pill is the default for users; persona switch starts a new conversation
  - Memarlıq pill surfaces an additional **mode toggle** above the chat input: `🇦🇿 AZ rejimi` / `🌍 Global rejimi` (REQ-MIRAI-ARCH-02). Switching mode re-runs RAG with new bias for next message
  - Memarlıq pill enables file upload (📎 chip beside send button) — accepts ZIP/PDF up to limits (10 MB / 25 MB), shows progress + "🤖 Bu sual 30 saniyəyə qədər çəkə bilər..." loading copy (REQ-MIRAI-ARCH-01)
  - Ümumi pill has no file upload, no mode toggle
- Active persona: `--color-brand` bg + white text; inactive: `--color-n100` bg
- Switching persona starts a new conversation (PRD §7.2)

**CCO persona — special surfaces:**
- Drafts client-facing copy: emails, proposal cover letters, retro survey invites, official letters (rəsmi məktub), award narratives
- Auto-detects target language from `clients.locale` (AZ default, EN/RU/TR supported)
- Output rendered in CCO bubble with a "Dilə dəyiş" mini-dropdown above (preserve drafts across language switches)
- "Drafts only" pill below CCO output: "📝 Yalnız qaralama — admin redaktə + göndərmə"
- Send button is intentionally absent — copy-to-clipboard + "Müştəri panelinə apar" instead

**İK Direktoru (HR) persona — special surfaces:**
- Monthly performance summary card (auto-rendered on Performans page top, admin-only) per Module 8.3
- Sample card layout:
  ```
  🤖 MIRAI HR — Aydan üçün Aprel analizi
  ─────────────────────────────────────
  Bu ay 5 tapşırıq deadline-dan keçib:
    ✓ 3 sifarişçi gecikdi (excluded)
    ✓ 1 outsource Tek-Strukt günahı (excluded)
    ✗ 1 Aydanın özü ilə bağlı
  
  📊 Yenidən hesablanmış score: 92/100
  [Detallara bax]
  ```
- HR persona NEVER appears in user view (RLS-enforced)

**Chat interface:**
- Positioned bottom half of viewport
- History scroll area: `max-height: calc(100vh - 340px)`
- Input: 48px height, `--radius-2xl`, white bg, indigo focus ring; right side has send button + "+" attach (future)
- Streaming response: cursor blinks at end of generating text via `::after { content: '▌'; animation: blink 1s }` 
- User bubble: right-aligned, `--color-brand-light` bg, rounded with smaller bottom-right corner
- MIRAI bubble: left-aligned, white card `--shadow-sm`, persona label above (xs uppercase)
- Citations (Hüquqşünas, US-MIRAI-02): inline `Mənbə: <pdf>, Maddə X.Y.Z` styled as `pill--ai` size sm
- Tool invocations: collapsed accordion above response — "🔧 İstifadə olunmuş alətlər: list_my_tasks" (audit transparency)

**Cost guardian banner (US-MIRAI-04):**
- 80% used: top yellow banner "MIRAI ayllıq limitinin 80%-nə çatdınız"
- 100% used: chat disabled, full overlay "Bu ay MIRAI limitinə çatdınız. Növbəti ay 1 yenidən aktiv olacaq."
- Creator exempt (no banner shown if `is_creator`)

**Privacy denial state — satirik tone (US-MIRAI-03, PRD §7.3):**

When a non-admin asks a finance/salary/budget/outsource-payment question, MIRAI responds with a culturally-warm, lightly-satirical AZ refusal (never robotic). Reference template:

```
┌─ MIRAI ─────────────────────────────────────────┐
│ 🎯 Əməliyyat Direktoru                           │
│                                                   │
│ Hörmətli istifadəçi, maliyyə məlumatlarımız     │
│ korporativ məxfilik qaydalarımıza tabedir —     │
│ Reflect-də belə suallar etik sayılmır 😊        │
│                                                   │
│ Sahə eksperti kimi memarlıq sualınız varsa,      │
│ məmnuniyyətlə cavablandırım!                     │
└──────────────────────────────────────────────────┘
```

Visual rules:
- Use the standard MIRAI bubble — no special "warning" styling (denial should feel conversational, not punitive)
- The 😊 emoji is **part of the brand voice** — keep it; never strip
- Tool denial logged silently to `tools_used` (`mirai_messages.tools_used jsonb`); never expose which tool was denied to the user
- MIRAI rephrases per response (avoid mechanical repetition), but always preserves: politeness + light humor + offer to help on architectural topics
- Never shame the user; never use words like "icazəniz yoxdur" / "qadağandır" / "səhvdir"
- Refusal renders WITHOUT the persona-thinking blob acceleration (§7.6) — short, warm, immediate

#### 10.19.1 Pop-up state + auto-routing (US-MIRAI-08, US-MIRAI-12)

The pop-up is global (Zustand store `useMiraiStore`), persists across page navigation. Behaviour:

- **First open on a page:** auto-routes to suggested persona based on `(page_context, last query keywords)` per PRD §7.7.1. Suggested pill pulses once subtly to indicate auto-selection
- **Manual persona switch:** sticks for the rest of this conversation; new conversation reset re-runs routing
- **Navigation while open:** persona + history preserved; auto-routing does NOT re-run mid-conversation
- **Close + reopen:** auto-routing recomputes for current page; "Keçmiş" tab in pop-up header shows last 10 conversations grouped by persona

```
┌─ MIRAI (sağ-aşağı 56px FAB) ──────┐
│  🤖  • [unread badge if N>0]       │
└────────────────────────────────────┘
        ↓ click
┌─ Pop-up 400×500 ───────────────────┐
│ 🤖 MIRAI       [Keçmiş] [⤢] [✕]   │
│ ─────────────────────────────────── │
│ [persona pill row, scrollable]      │
│ [active persona pulses if routed]   │
│ ─────────────────────────────────── │
│ [conversation history]              │
│ ─────────────────────────────────── │
│ [3 suggestion chips]                │
│ [📎] [Sual yaz...        ] [→]     │
└────────────────────────────────────┘
```

Mobile: bottom-sheet promotion at ≤768px breakpoint. Genişlət (⤢) → 800×600 right-side panel.

#### 10.19.2 Suggestion chips (US-MIRAI-08)

Below the input, 3 chips render based on active page (PRD §7.7.2):

```css
.mirai-chip {
  padding: 6px 12px;
  background: var(--color-n100);
  border: 1px solid var(--color-n200);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 120ms ease;
}
.mirai-chip:hover {
  background: var(--color-brand-light);
  border-color: var(--color-brand-border);
  color: var(--color-brand);
}
```

Click → text inserts into input; user submits or edits.

#### 10.19.3 Tool calls UI — preview vs result (US-MIRAI-06)

Read tools execute silently; result rendered as MIRAI bubble. Top of bubble shows collapsed accordion: "🔧 Alət: query_financials" — admin click reveals raw query + rows for transparency.

Read tool denial:
```
┌─ MIRAI ──────────────────────────────────┐
│ 🎯 Əməliyyat Direktoru                    │
│                                            │
│ [Satirik AZ refusal tone — §10.19 prior]  │
└────────────────────────────────────────────┘
```
The denied tool name is logged to `tools_used.denied=[query_financials]` but NEVER shown to user.

#### 10.19.4 Write tool approve flow (US-MIRAI-07)

Write tools open a preview modal BEFORE execution. Pattern for `send_telegram`:

```
┌──────────────────────────────────────────────────────┐
│  📤 Telegram göndərilsin?                       [✕]  │
├──────────────────────────────────────────────────────┤
│  Alıcı: 👤 Aydan Məmmədova                            │
│                                                       │
│  Mesaj:                                               │
│  ┌────────────────────────────────────────────────┐  │
│  │ Sabah saat 14:00-da ofisdə toplantımız var.   │  │
│  │ Nəriman Towers layihəsinin son nəticələrini    │  │
│  │ müzakirə edəcəyik.                             │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ⏱ Approval token 60 saniyəyə qədər keçərlidir       │
│                                                       │
│  [Ləğv et]                       [Göndər — primary]  │
└──────────────────────────────────────────────────────┘
```

- Approval token (60s TTL) generated when modal renders
- Click "Göndər" → token consumed, action commits
- TTL expiry → `Göndər` button disabled, "Yenidən təklif tələb et" appears
- Pattern identical for `create_task` (preview = inline editable task form) and `draft_email` (preview = drawer with subject + body, "Email müştəri panelinə apar" / "Mətn kopyala" actions, no send)

#### 10.19.5 Trigger-based notifications surface (US-MIRAI-09)

Trigger notifications arrive via Telegram (per PRD §7.6.2 cron) AND surface as in-app toast (`§6.12`):

```
┌─ Toast (top-right, 380px) ──────────────────────┐
│ 🚨 Cash balansı kritik                          │
│ Min. 3 ay runway tələbinin 80%-dən aşağıdır.    │
│ Cari: ₼125K, tələb: ₼210K                       │
│ [Maliyyə Mərkəzinə keç]              [Bağla]    │
└──────────────────────────────────────────────────┘
```

Trigger emoji map for visual recognition:
- 🚨 `cash_low` (danger color)
- ⏰ `deadline_7d` (warning color)
- ⏸️ `task_blocked_3d` (warning color)
- 💬 `client_silent_5d` (info color)
- 💰 `outsource_payment_2d` (warning color)

#### 10.19.6 File upload UI (US-MIRAI-11)

`📎` button beside send. Click → file picker (multi-select up to 3, accept `.pdf,.docx,.jpg,.jpeg,.png`).

Uploaded files render as chips above input:
```
[📄 müqavilə.pdf · 2.1 MB · ✕]   [🖼 render.jpg · 1.4 MB · ✕]
```

Per-chip ✕ removes; "Maksimum 3 fayl" toast if user picks 4th. Per-file >5 MB → toast "Fayl ölçüsü 5 MB-dan böyükdür".

Submit with files → loading bubble: "🤖 Bu sual 30 saniyəyə qədər çəkə bilər — sənədləri oxuyur..." with progress spinner. Disable input until response arrives.

Daily limit (5 analyses) reached → on attempt: toast "Gündəlik fayl analizi limitiniz dolub. Sabah yenidən cəhd edin." — `📎` button greys out until midnight Asia/Baku.

#### 10.19.7 Firm-wide budget banner (US-MIRAI-13)

Banner above pop-up persona selector when applicable:

**80% (≥$4 spent):**
```
⚠️ MIRAI 80% limitinə çatdı (₼6.97 / ₼8.50). Diqqətli istifadə edin.
```
Yellow background (`--color-warning-bg`), warning icon.

**100% (Groq fallback active):**
```
🔄 Pulsuz model rejimi — Groq llama-3.3
   Keyfiyyət bir az aşağı ola bilər. Ay sonu primary model qayıdacaq.
```
Brand-light background, info-style.

Banner dismissible per-session by user; recurs on next pop-up open until threshold drops or month resets.

#### 10.19.8 Knowledge base chunks UI (US-MIRAI-10)

When a response cites RAG chunks, citations render as inline `pill--ai` size sm:

```
"...AZ-də ekspertiza prosesi 30 günə qədər çəkə bilər
[🤖 AZDNT 2.08.01-89, Maddə 4.2.1]. Lakin 2024 dəyişikliyi
ilə yeni binalar üçün..."
```

Hover the citation pill → tooltip shows source name + valid_from + valid_until (NULL = "qüvvədədir"):
```
┌──────────────────────────────────────┐
│ Mənbə: AZDNT 2.08.01-89              │
│ Maddə 4.2.1                          │
│ Qüvvədə: 2018-03-01 → indi           │
└──────────────────────────────────────┘
```

Superseded chunks NEVER appear in citations (RAG filter `valid_until IS NULL OR valid_until > now()`).

### 10.20 Telegram (Profil → Telegram tab) — US-TG-01..03

```
┌──────────────────────────────────┐
│  Telegram bağlantısı             │
│                                  │
│  ⚪ Qoşulmayıb                    │
│  [Telegram-ı qoş — primary]      │
└──────────────────────────────────┘
```

After click:
```
┌──────────────────────────────────┐
│  Kodu Reflect botuna göndərin:   │
│       ┌───────────┐              │
│       │  4 8 2 1 9 3│             │
│       └───────────┘              │
│  [Bot-u aç →]                    │
│  10 dəq ərzində istifadə edin    │
└──────────────────────────────────┘
```

After successful link:
```
┌──────────────────────────────────┐
│  ✅ Qoşulub  • @talifa            │
│  Bağlandı: 03 May 2026           │
│  [Bağlantını kəs — danger]       │
└──────────────────────────────────┘
```

Notification preferences for Telegram channel managed in §10.18 Bildirişlər matrix.

### 10.21 Sənədlər (now under Layihə detail / Müştəri drawer) — REQ-PROJ-03

Sənəd Arxivi nav item is removed (PRD §4); documents render embedded inside Project detail and Müştəri drawer tabs.

**Project Sənədlər tab columns:** İkon + Başlıq / Kateqoriya / Tarix / Mənbə / Paylaş

- Mənbə badge variants:
  - `Drive linki` — gray `pill--default`
  - `Avtomatik` — `pill--brand`
  - `Yükləndi` — `pill--success`
- Paylaş icon → copy share-token URL → toast
- Row click → preview drawer:
  - Drive: iframe embed attempt; fallback `Drive-da aç` button
  - Auto-generated: rendered HTML template + `PDF yüklə`
  - Bottom: share-token QR code

---

## 11. Tailwind Config

Drop-in `tailwind.config.cjs` mirroring tokens from §2–4. Component classes (e.g. `.btn`, `.card`) live in `src/index.css` via `@layer components`; Tailwind utilities apply on top.

```js
// tailwind.config.cjs
const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
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
        canvas: {
          DEFAULT: '#F4F5F7',
          mirai:   '#EBEBEB',
          dots:    '#D1D5DB',
        },
        sidebar: {
          DEFAULT:   '#0F0F0F',
          hover:     '#1F1F1F',
          border:    '#2A2A2A',
          text:      '#A1A1AA',
          active:    '#FFFFFF',
          indicator: '#5A4EFF',
        },
        n: {
          900: '#1A1A1A', 800: '#2D2D2D', 700: '#4B5563',
          600: '#6B7280', 400: '#9CA3AF', 300: '#D1D5DB',
          200: '#E5E7EB', 100: '#F9FAFB', 0:   '#FFFFFF',
        },
        // Task statuses
        status: {
          ideas: '#A78BFA', queued: '#94A3B8', active: '#3B82F6',
          review: '#D97706', expert: '#8B5CF6', done: '#22C55E', cancel: '#EF4444',
        },
        // Health
        health: { ok: '#22C55E', warn: '#D97706', crit: '#EF4444' },
        // Semantic
        success: '#22C55E', warning: '#D97706', danger: '#EF4444', info: '#3B82F6',
      },
      fontSize: {
        '2xs':  '10px',
        xs:     '11px',
        sm:     '13px',
        base:   '15px',
        lg:     '17px',
        xl:     '20px',
        '2xl':  '24px',
        '3xl':  '32px',
        '4xl':  '48px',
        '5xl':  '64px',
      },
      spacing: {
        1:  '4px',  2:  '8px',  3:  '12px', 4:  '16px',
        5:  '20px', 6:  '24px', 8:  '32px', 10: '40px',
        12: '48px', 16: '64px', 20: '80px',
      },
      borderRadius: {
        xs:    '4px',
        sm:    '8px',
        md:    '12px',
        lg:    '16px',
        xl:    '20px',
        '2xl': '28px',
        full:  '9999px',
      },
      boxShadow: {
        xs:     '0 1px 2px rgba(0,0,0,0.05)',
        sm:     '0 2px 8px rgba(0,0,0,0.06)',
        md:     '0 4px 16px rgba(0,0,0,0.08)',
        lg:     '0 8px 32px rgba(0,0,0,0.10)',
        xl:     '0 16px 48px rgba(0,0,0,0.14)',
        brand:  '0 4px 20px rgba(90,78,255,0.20)',
        hover:  '0 8px 24px rgba(90,78,255,0.12)',
        drawer: '-8px 0 32px rgba(0,0,0,0.12)',
      },
      backgroundImage: {
        dots:           'radial-gradient(circle, #D1D5DB 1px, transparent 1px)',
        'grad-mirai-1': 'radial-gradient(circle at 40% 40%, #FFB5C8, #EEA0FF)',
        'grad-mirai-2': 'radial-gradient(circle at 60% 50%, #FFE082, #FFA07A)',
        'grad-mirai-3': 'radial-gradient(circle at 50% 40%, #FFD700, #FFFFFF)',
        'grad-folder':  'linear-gradient(135deg, #FFE082 0%, #EEA0FF 55%, #B5C8FF 100%)',
        'grad-feature': 'linear-gradient(135deg, #5A4EFF 0%, #9B7FFF 100%)',
        'grad-border':  'linear-gradient(135deg, #FFB347 0%, #EEA0FF 50%, #5A4EFF 100%)',
        'grad-green':   'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)',
      },
      backgroundSize: { dots: '20px 20px' },
      letterSpacing: {
        tight:   '-0.02em',
        normal:  '0',
        wide:    '0.04em',
        widest:  '0.08em',
      },
      animation: {
        'page-enter':    'page-enter 200ms cubic-bezier(0.4,0,0.2,1)',
        'card-enter':    'card-enter 200ms cubic-bezier(0.4,0,0.2,1) both',
        'modal-enter':   'modal-enter 200ms cubic-bezier(0.4,0,0.2,1)',
        'drawer-enter':  'drawer-enter 250ms cubic-bezier(0.4,0,0.2,1)',
        'toast-enter':   'toast-enter 200ms ease',
        'shimmer':       'shimmer 1.5s ease-in-out infinite',
        'pulse':         'pulse 1.2s ease-in-out infinite',
        'realtime':      'realtime-flash 1500ms ease-out',
        'status-pulse':  'status-pulse 300ms ease-out',
        'blob-1':        'blob-drift-1 8s ease-in-out infinite',
        'blob-2':        'blob-drift-2 10s ease-in-out infinite',
        'blob-3':        'blob-drift-3 12s ease-in-out infinite',
      },
      keyframes: {
        'page-enter':   { from: { opacity: '0', transform: 'translateY(8px)'  }, to: { opacity: '1', transform: 'translateY(0)' } },
        'card-enter':   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'shimmer':      { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        'realtime-flash': { '0%': { background: '#EEE9FF' }, '100%': { background: 'transparent' } },
        'status-pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
      },
      zIndex: {
        sticky: '10', sidebar: '50', fab: '100',
        dropdown: '150', backdrop: '200', modal: '201',
        drawer: '201', toast: '500', tooltip: '600',
      },
    },
  },
  plugins: [],
}
```

---

## 12. Global CSS — `src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Reset ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; scroll-behavior: smooth; }
body {
  font-family: 'Rubik', system-ui, -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: #1A1A1A;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── App canvas with dots ──────────────────────── */
.app-canvas {
  background-color: #F4F5F7;
  background-image: radial-gradient(circle, #D1D5DB 1px, transparent 1px);
  background-size: 20px 20px;
  min-height: 100vh;
}

/* ── Tabular numerals ──────────────────────────── */
.tabular { font-variant-numeric: tabular-nums; }

/* ── Truncation utilities ──────────────────────── */
.truncate-1, .truncate-2, .truncate-3 {
  display: -webkit-box; -webkit-box-orient: vertical;
  overflow: hidden;
}
.truncate-1 { -webkit-line-clamp: 1; }
.truncate-2 { -webkit-line-clamp: 2; }
.truncate-3 { -webkit-line-clamp: 3; }

/* ── Focus ring ────────────────────────────────── */
:focus-visible {
  outline: 3px solid #5A4EFF;
  outline-offset: 2px;
  border-radius: 4px;
}
:focus:not(:focus-visible) { outline: none; }

/* ── Custom scrollbar ──────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

/* ── Selection ─────────────────────────────────── */
::selection { background: #EEE9FF; color: #5A4EFF; }

/* ── Reduced motion ────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .mirai-blob-1, .mirai-blob-2, .mirai-blob-3 { animation: none; }
}

/* Component layer (truncated — see §6 for full definitions) */
@layer components {
  .card { @apply bg-n-0 border border-n-200 rounded-lg shadow-sm transition-all; padding: 20px 24px; }
  .card:hover { @apply -translate-y-0.5 shadow-hover; }
  .btn { @apply inline-flex items-center justify-center gap-1.5 font-medium rounded-sm cursor-pointer transition-all; }
  .btn--primary { @apply bg-brand text-white shadow-brand; padding: 10px 18px; }
  .btn--primary:hover { @apply bg-brand-hover; }
  /* …rest of component layer per §6… */
}
```

---

## 13. Design Definition of Done

Every feature PR must pass this checklist before merge. It complements PRD §11.3 (functional DoD).

### 13.1 Per-component
- [ ] Uses tokens from §2 — no hex values inline
- [ ] Uses spacing from §4 — no arbitrary px values
- [ ] Typography matches §3.3 usage table for the context
- [ ] Hover, focus, active, disabled states all defined
- [ ] `:focus-visible` outline present and visible
- [ ] Touch target ≥ 40 × 40px (§8.6)
- [ ] AZ strings sourced from `locales/az.json`

### 13.2 Per-page
- [ ] Empty state designed and implemented (§6.15)
- [ ] Loading state uses skeleton matching layout (§7.8)
- [ ] Error state implemented (toast / inline / full-page per type)
- [ ] 403 RLS-denied state for non-admin attempts (§6.15)
- [ ] Realtime updates animated via `.row--just-updated` (§7.9)
- [ ] Mobile (≤768px) layout verified
- [ ] Keyboard navigation: Tab order correct, Esc closes overlays, Cmd+K reachable

### 13.3 Cross-cutting (Rule #4 — Hidden ≠ secure)
- [ ] Any admin-only data field uses `cell--masked` for non-admins (never absent)
- [ ] Underlying API/RLS verified to deny non-admin access (PRD §9.1)
- [ ] Sidebar nav variant correct for current role (§5.1.2)
- [ ] All financial values use tabular numerals
- [ ] All dates render Asia/Baku via `Intl.*` (§9.2)

### 13.4 Accessibility audit
- [ ] Contrast pairs verified (§8.1) — no `#F59E0B` on text
- [ ] ARIA labels on status badges, avatar stacks, drag cards, progress rings
- [ ] Live regions for realtime updates (`aria-live="polite"`)
- [ ] Reduced motion respected (§8.5)
- [ ] Form inputs: visible label + `aria-invalid` + `aria-describedby` for errors

### 13.5 Visual audit (PRD §10.5)
- [ ] Before/after screenshots in PR for any data-touching change
- [ ] Cards animate in via stagger (§7.4) — capped at 200ms
- [ ] No new gradient surfaces outside Rule #2 (MIRAI / folder hero / featured widget)
- [ ] Sidebar remains `#0F0F0F` (Rule #1)
- [ ] One primary button per page surface (§6.5)

### 13.6 Performance
- [ ] LCP ≤ 1.5s on Vercel CDN (PRD §3.5)
- [ ] No layout shift during skeleton → content swap
- [ ] Images: `loading="lazy"` for below-fold, `width`/`height` set to prevent CLS
- [ ] Font loaded with `display=swap`

---

*Last updated: 2026-05-04 (v2.5 — audit absorption: §6.11 mobile keyboard handling with visualViewport scroll-into-view; §10.4.1 kanban touch fallback (mobile uses status dropdown, not drag); §10.10 Performans score breakdown card (40-30-30 split) + 360° survey reviewer-pick modal + form + aggregated admin panel; §10.2 user dashboard +5 motivation widgets (project health, career path next-level chip, performance tendency bar, important clients for BD-side users))*
*Owner: Talifa İsgəndərli*
*Review cycle: after each module's first implementation; full review at v1.0 release*
