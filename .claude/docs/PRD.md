# Reflect Architects OS — Product Requirements Document
**Version:** 2.0  
**Date:** 2026-05-03  
**Product Owner:** Talifa İsgəndərli  
**Status:** Active Development — Pre-PMF Stage

---

## 1. Product Vision

### Positioning Statement
Reflect Architects OS is the **first business management platform built exclusively for architecture firms** that feels genuinely modern. Existing tools (Deltek Ajera, Monograph, ArchiOffice, BQE Core) are either too enterprise-heavy, too generic, or aesthetically outdated. Reflect is powerful, flexible, and fast — built by an architect, for architects.

### North Star Metric
**Weekly Active Projects** — the number of projects with at least one task update in a 7-day window. Target: 100% of active projects touched weekly.

### Success Metrics (6 months post-launch)
- ≥ 80% of team tasks updated within 24h of status change (task velocity)
- ≤ 2 min to create a new project + first task (onboarding speed)
- ≥ 70% monthly retention (stickiness)
- ≥ 4.5/5 NPS from client retrospective surveys
- $0 manual bookkeeping time (finance automation completeness)

---

## 2. Target Users

### Primary — Architecture Firm (5–30 person studio)

| Persona | Role | Key Jobs-to-be-Done |
|---------|------|---------------------|
| **Studio Director** | Talifa (Creator/Admin) | See firm health at a glance, catch risks early, approve payments |
| **Project Architect** | Senior architect | Manage project tasks, track deadlines, coordinate expertise |
| **Designer** | Mid-level | Update task status, log time, access project files |
| **Intern** | Junior | View assigned tasks, mark done, see announcements |
| **BD Lead** | Business dev | Manage client pipeline, track proposals, log interactions |
| **Finance Manager** | Admin/accountant | Track income/expense, manage outsource payments, forecast |

### Secondary — External Collaborators
- Outsource specialists (limited access — own tasks only)
- Clients (survey response, shared document portal)

---

## 3. Technical Architecture

### 3.1 Tech Stack

```
Frontend:  React 18 + Vite + Tailwind CSS
Backend:   Supabase (PostgreSQL 15 + RLS + Auth + Storage + Realtime)
Hosting:   Vercel (frontend) + Supabase Cloud (backend)
AI:        Claude Haiku 4.5 via Anthropic API (MIRAI)
Vector DB: pgvector extension on Supabase (RAG)
Fonts:     Rubik (Google Fonts)
```

### 3.2 Database Schema Overview

**Core tables:**
- `profiles` — user accounts, roles, is_creator flag, telegram_chat_id
- `roles` — permission levels (level 1–5)
- `projects` — architecture projects, phases[], expertise tracking
- `tasks` — 7-status task model, parent_task_id (subtask tree), workload fields
- `clients` — CRM records, pipeline stage, expected value, confidence %
- `client_stage_history` — pipeline stage change log
- `activity_log` — universal audit log (entity_type + entity_id pattern)

**Finance tables:**
- `incomes` — project income records
- `expenses` — firm expenses
- `outsource_items` — external contractor work orders

**Communication tables:**
- `project_documents` — contracts, invoices, acts, letters (Drive link or auto-generated)
- `retrospective_surveys` — client NPS surveys (share_token public access)
- `templates` — letter/invoice/survey templates with variable system

**Portfolio & closeout:**
- `closeout_checklists` — project closeout workflow
- `portfolio_workflows` — award submissions, publish tracking
- `system_awards` — award database (5 seeded)

**AI:**
- `mirai_conversations` — conversation history per user
- `mirai_usage_log` — token tracking per user per month ($5 hard limit)
- `knowledge_base` — embedded AZ law + normative PDFs (pgvector)

**System:**
- `okrs` — company + personal OKRs
- `system_settings` — key/value config (bd_head_email, etc.)
- `announcements` — firm-wide announcements

### 3.3 Authentication & Authorization

```
Auth provider: Supabase Auth (email/password)
Session:       JWT tokens, auto-refresh
RLS:           Row Level Security on ALL tables — no exceptions

Role hierarchy:
  Level 1 = Creator (Talifa) — unrestricted access
  Level 2 = Admin — full read/write except creator-only settings
  Level 3 = Team Lead — manage projects + team tasks
  Level 4 = Member — own tasks + assigned projects
  Level 5 = External — own outsource tasks only

Helper functions:
  is_admin()   → levels 1–2 OR is_creator = true
  is_creator() → is_creator = true only
```

### 3.4 Real-time Requirements
- Task status changes → broadcast to all users on same project (Supabase Realtime)
- Activity log entries → update Dashboard feed without page refresh
- Finance totals → recalculate on income/expense insert

### 3.5 Performance Targets
- First Contentful Paint ≤ 1.5s (Vercel CDN, code splitting per route)
- Supabase query p95 ≤ 200ms (all indexed, RLS optimized)
- MIRAI first token ≤ 800ms (Haiku 4.5 streaming)

---

## 4. Design System (Unified)

### Token Summary (full spec in design-system.md)
```
Font:        Rubik (400/500/600/700/800)
Canvas bg:   #F4F5F7 + dots (radial-gradient 20px)
Brand:       #5A4EFF (indigo)
Near-black:  #1A1A1A
Cards:       #FFFFFF, border #E5E7EB, radius 16px
Sidebar:     #0F0F0F (dark — signature contrast)
Motion:      200ms cubic-bezier(0.4,0,0.2,1), staggered card entrance
```

---

## 5. Module Specifications + User Stories

---

### MODULE 1: Giriş / Authentication

**Screen:** Single centered card on `#F4F5F7` canvas with Attio-style grid lines + isometric outline hexagons decorating top-right corner. Reflect logo top-left. No registration — invite-only.

**User Stories:**

```
US-AUTH-01
AS A team member
I WANT to log in with my email and password
SO THAT I can access the platform securely

Acceptance Criteria:
- Given valid credentials → redirect to Dashboard within 500ms
- Given invalid credentials → inline error below field, field highlighted red
- Given empty field on submit → field-level validation, no server call
- Password field has show/hide toggle
- "Şifrəni unutdum" → email reset flow (Supabase magic link)
- Session persists 7 days, auto-refresh

US-AUTH-02
AS A creator (Talifa)
I WANT to invite team members by email
SO THAT I control who accesses the platform

Acceptance Criteria:
- Admin panel → "Dəvət et" → email input + role selector
- Invited user receives email with magic link (expires 48h)
- Pending invitations listed in admin panel
- Revoke invitation before acceptance
```

---

### MODULE 2: Dashboard

**Screen:** Dark sidebar left (240px) + light bento grid content area. Top: greeting + date. Bento grid = 12-column, cards snap to 4/6/12 column widths.

**Layout (default):**
```
Row 1: [Active Projects widget - 8col] [Quick actions - 4col]
Row 2: [My Tasks today - 6col] [Finance snapshot - 6col]  
Row 3: [Team workload - 8col] [Upcoming deadlines - 4col]
Row 4: [Activity feed - 12col]
```

**User Stories:**

```
US-DASH-01
AS A studio director
I WANT to see the health of all active projects at a glance
SO THAT I can identify risks before they escalate

Acceptance Criteria:
- Active Projects widget: list of projects with phase badge, task completion %, deadline proximity color (green/amber/red)
- Amber = deadline < 14 days, Red = deadline < 3 days or past
- Clicking project → opens ProjectDetailPage
- Empty state: "Aktiv layihə yoxdur — Yeni layihə yarat" CTA

US-DASH-02  
AS A team member
I WANT to see my tasks due today and this week
SO THAT I know exactly what to work on

Acceptance Criteria:
- "Bu gün" and "Bu həftə" tab toggle
- Tasks sorted: overdue first → today → future
- Each task: title, project name, status badge, due date
- Click → opens task detail inline panel (not page navigation)
- Complete task from dashboard → Tamamlandı, removed from list with animation

US-DASH-03
AS A finance manager / director
I WANT to see this month's income vs expense snapshot
SO THAT I can track cash position daily

Acceptance Criteria:
- Finance widget: Gəlir / Xərc / Balans (3 numbers, tabular numerals)
- Trend indicator: ↑ or ↓ vs last month, color coded
- Bar showing month progress (days elapsed / total days)
- Click → navigates to Maliyyə Mərkəzi

US-DASH-04
AS A studio director
I WANT to see a live activity feed of team actions
SO THAT I stay informed without asking team members

Acceptance Criteria:
- Feed shows last 50 activity_log entries
- Each entry: user avatar + name, action description, entity link, timestamp (relative)
- Filter by: All / Tasks / Projects / Finance / Clients
- Realtime: new entries appear at top without refresh
- Empty state: "Hələ heç bir fəaliyyət yoxdur"

US-DASH-05
AS A team lead
I WANT to see team workload at a glance
SO THAT I can redistribute tasks before someone burns out

Acceptance Criteria:
- Each team member: avatar + name + task count (open tasks) + workload bar
- Workload bar: green (1–5 tasks) / amber (6–9) / red (10+)
- Clicking member → filters Tapşırıqlar to that member
```

---

### MODULE 3: Layihələr (Projects)

**Screen:** Grid of project cards (folder style — gradient header top, white body). Filter bar top. "Yeni Layihə" FAB bottom-right.

**Project Card contains:**
- Gradient header (color varies by phase)
- Project name (Rubik 600)
- Client name
- Phase badge(s) — `phases[]` array displayed as horizontal pills
- Task completion ring (circular progress)
- Team avatars (stacked, max 4 + overflow count)
- Deadline date
- Expertise flag icon (if requires_expertise = true)

**User Stories:**

```
US-PROJ-01
AS AN architect
I WANT to create a new project with all key details
SO THAT the team has a single source of truth from day one

Acceptance Criteria:
- Modal: project name, client (select/create inline), phases (multi-select: Konsepsiya/SD/DD/CD/Tender/İcra nəzarəti), start date, deadline, requires_expertise toggle, expertise_deadline (shown only if toggle on), payment_buffer_days (default 10)
- Create → card appears in grid with entrance animation
- Required: name, client, at least one phase, deadline

US-PROJ-02
AS A project architect
I WANT to see a backward-planned timeline when expertise is required
SO THAT I know the real design deadline, not just the contract deadline

Acceptance Criteria:
- If requires_expertise = true:
  - System calculates: design_deadline = expertise_deadline - 10 days (payment) - 40 days (expertise wait + revision) - 3 days (print prep)
  - Design deadline shown in red banner inside project if < 14 days away
  - Timeline visualization: contract deadline ← 10d (payment) ← 30d (expertise) ← 10d (revision) ← 3d (print) = design deadline

US-PROJ-03
AS A studio director
I WANT to manage the closeout workflow when a project is done
SO THAT nothing is missed at project completion

Acceptance Criteria:
- "Layihəni Bağla" button → opens closeout checklist drawer
- Default checklist items (from closeout_checklists.items jsonb):
  □ Son akt imzalandı
  □ Müştəriyə final sənədlər göndərildi
  □ Arxivə yükləndi
  □ Portfel hazırlığı başlandı
  □ Retrospektiv sorğu göndərildi
- Each item checkable inline
- All checked → "Layihəni Tamamla" button activates
- On complete: project status → closed, portfolio_workflow record created

US-PROJ-04
AS A studio director
I WANT to submit completed projects for architecture awards
SO THAT I don't miss application deadlines

Acceptance Criteria:
- Portfolio workflow: system_awards list browseable, filterable by deadline_month
- Select awards to apply → saved to portfolio_workflows.selected_awards
- Website publish date field, press release toggle
- Award application checklist (custom per award)
- Deadline month indicator: "Ağ Xan mükafatı — Mart" with days remaining
```

---

### MODULE 4: Tapşırıqlar (Tasks)

**Screen:** 3 views — Kanban (default) / Cədvəl / Mənim Tapşırıqlarım

**Status System (7 columns):**
```
İdeyalar      → #a78bfa (violet)  — backlog ideas
başlanmayıb   → #94a3b8 (gray)    — queued
İcrada        → #3b82f6 (blue)    — active
Yoxlamada     → #f59e0b (amber)   — review
Ekspertizada  → #8b5cf6 (purple)  — expert review pending
Tamamlandı    → #22c55e (green)   — done
Cancelled     → #ef4444 (red)     — cancelled with reason
```

**User Stories:**

```
US-TASK-01
AS A project architect
I WANT to create tasks with time estimates and deadlines
SO THAT workload is visible and plannable

Acceptance Criteria:
- Quick create: click "+" in any column → inline input, Enter to save
- Full create modal: title, assignee(s), project, start_date, deadline, estimated_duration + duration_unit (days/weeks), risk_buffer_pct, is_expertise_subtask toggle, task_level (card/task/subtask)
- parent_task_id: select parent task to create subtask
- Required: title only (all others optional for speed)

US-TASK-02
AS A team member
I WANT to move tasks between status columns by dragging
SO THAT updating status is instant and visual

Acceptance Criteria:
- Drag-and-drop between all 7 columns
- Drop on column → status updates to column key, activity_log entry created
- If dragging to "Cancelled" → cancel dialog appears (cannot skip)
- Cancel dialog: select reason from list OR type custom
  [ Müştəri imtina etdi | Layihə dəyişdi | Texniki problem | Yenidən planlaşdırılır | Digər ]
- On cancel confirm: status = 'Cancelled', cancel_reason saved, card grayed

US-TASK-03
AS A team member
I WANT to see only MY tasks in a focused view
SO THAT I'm not overwhelmed by the team's entire backlog

Acceptance Criteria:
- "Mənim Tapşırıqlarım" view: filter tasks where assignee = current user
- Grouped by: Today / This Week / Later / Overdue
- Overdue group shown first in red
- Each task: title, project, deadline, status badge
- Can update status inline (checkbox for Tamamlandı, dropdown for others)

US-TASK-04
AS A studio director
I WANT to archive completed and cancelled tasks automatically
SO THAT the board stays clean without manual cleanup

Acceptance Criteria:
- "Arxivlə" button in page header
- On click: all tasks with status Tamamlandı or Cancelled → archived_at = now(), hidden from board
- Confirmation dialog: "X tapşırıq arxivlənəcək. Davam et?"
- Archived tasks accessible via "Arxiv" toggle filter

US-TASK-05
AS A project architect
I WANT the system to calculate workload based on estimates
SO THAT I can plan sprints realistically

Acceptance Criteria:
- Workload = estimated_duration * (1 + risk_buffer_pct/100)
- workload_calculated_at timestamp updated on save
- Dashboard team workload widget uses this for bar visualization
- If no estimate → task counts as 1 unit (neutral)

US-TASK-06
AS AN architect
I WANT to create subtasks under expertise tasks
SO THAT expertise submission is broken into trackable steps

Acceptance Criteria:
- is_expertise_subtask = true → subtask displayed with purple "E" badge
- Typical expertise subtasks auto-suggested:
  □ Çertyoj hazırlığı
  □ Spesifikasiya yazılması  
  □ Möhür + imza
  □ Çap + ciltləmə
  □ Ekspertizaya təhvil
- Parent task progress = completed subtasks / total subtasks %
```

---

### MODULE 5: Müştərilər (Clients / CRM)

**Screen:** 3 views — Pipeline Kanban / Cədvəl / Müştəri Detay Panel

**Pipeline Stages (8):**
```
Lead          → 10% confidence  → #6B7280
Təklif        → 30% confidence  → #3B82F6
Müzakirə      → 50% confidence  → #F59E0B
İmzalanıb     → 75% confidence  → #8B5CF6
İcrada        → 95% confidence  → #22C55E
Portfolio     → 100%            → #10B981
Udulan        → 0%              → #EF4444
Arxiv         → —               → #9CA3AF
```

**Client card (Attio workflow style):** white card, connector lines showing deal flow, AI analysis badge.

**User Stories:**

```
US-CRM-01
AS A BD lead
I WANT to track potential clients through a visual pipeline
SO THAT I know exactly where each deal stands

Acceptance Criteria:
- Kanban: 6 active stages (Lead → İcrada) + 2 end states (Udulan/Arxiv) in collapsed side column
- Each card: client name, company, expected_value (if set), confidence_pct badge, days in current stage
- Drag between stages → stage_history record created, changed_by = current user
- Moving to "Udulan" → lost_reason dialog (required)
- Auto-calculate pipeline value: sum(expected_value * confidence_pct/100) per stage

US-CRM-02
AS A BD lead
I WANT to log every client interaction in 30 seconds
SO THAT the CRM is always current without being a burden

Acceptance Criteria:
- Client detail panel: "+ Qeyd əlavə et" always visible at top
- Quick log: free text input + interaction type (Zəng/Email/Görüş/WhatsApp) + date (default today)
- Submit: activity_log entry, panel refreshes inline
- Log entries shown in reverse chronological feed with type icon + timestamp

US-CRM-03
AS A studio director
I WANT to see AI-enriched client data (ICP fit, ARR estimate, connection strength)
SO THAT I prioritize high-value relationships

Acceptance Criteria:
- Attio-style table view: columns = Company, Contact, Stage, Expected Value, Confidence, Last Activity, ICP Fit (AI), Connection Strength
- ICP Fit: AI-generated badge (Excellent/Good/Medium/Low) based on project history + expected value
- "AI is thinking..." animated state when MIRAI calculates
- Connection strength: auto-derived from interaction frequency (last 30 days: daily=Very strong, weekly=Strong, monthly=Good, >month=Weak)

US-CRM-04
AS A BD lead
I WANT to create proposals linked to clients
SO THAT proposals are tracked alongside the client record

Acceptance Criteria:
- Client detail → "Təklif yarat" button → proposal creation drawer
- Proposal = project_documents record (category = 'price_protocol')
- Linked to client_id + optional project_id
- Share token auto-generated → shareable link for client view
- Proposal status: Draft / Sent / Accepted / Rejected
- Attio workflow card visualization (Pin 10 style) for proposal pipeline

US-CRM-05
AS A studio director
I WANT to send retrospective surveys after project completion
SO THAT I collect NPS data and improve service

Acceptance Criteria:
- Closeout flow triggers "Sorğu göndər" option
- Survey uses default template (or custom) with share_token link
- Client receives email with link → public form (no login required)
- Form: 1–5 star ratings per category + NPS 0–10 + free text comment
- On submit: responded_at filled, nps_score saved, director notified
- Dashboard shows average NPS, last 5 responses
```

---

### MODULE 6: Maliyyə Mərkəzi (Finance)

**Screen:** 6 tabs across top. Accent card (gradient) for key balance number.

**Tabs:**
1. Cash Cockpit (overview)
2. P&L (income vs expense)
3. Outsource (contractor payments)
4. Xərclər (expenses)
5. Debitor (receivables)
6. Forecast (AI-powered)

**User Stories:**

```
US-FIN-01
AS A finance manager
I WANT to see current month cash position in one glance
SO THAT I never lose track of firm liquidity

Acceptance Criteria:
- Cash Cockpit: gradient accent card with current balance (tabular numerals)
- Below: Gəlir this month / Xərc this month / Pending receivables
- Timeline bar: days remaining in month
- Recent transactions list (last 10, grouped by date)
- Color coding: green = income, red = expense

US-FIN-02
AS A finance manager
I WANT to log income when a client payment arrives
SO THAT the books are always current

Acceptance Criteria:
- "+ Gəlir" button → modal: amount, project (select), client, payment_method (Köçürmə/Nəğd/Kart), date, invoice_number, note
- On save: incomes record, activity_log entry
- Related project balance automatically updated
- If amount matches open invoice → invoice marked paid (status update)

US-FIN-03
AS A finance manager  
I WANT to track outsource payments separately with privacy controls
SO THAT sensitive payment data isn't visible to all team members

Acceptance Criteria:
- Outsource tab: project, work_title, contact_person, contact_company, amount, paid_at, payment_method, responsible_user_id, deadline, status
- Privacy: amount and paid_at visible ONLY to admin/creator (RLS-enforced)
- outsource_user_view (Postgres view) exposed to non-admins: hides amount/paid_at/payment_method
- Status: Gözlənilir / Ödənilib / Ləğv edildi

US-FIN-04
AS A studio director
I WANT an AI-powered cash forecast for next 30/60/90 days
SO THAT I can plan hiring and expenses proactively

Acceptance Criteria:
- Forecast tab: MIRAI analyzes income patterns + open receivables + known upcoming expenses
- Output: projected balance at 30d / 60d / 90d with confidence range
- "Bu proqnoz son 6 ayın məlumatlarına əsaslanır" disclaimer
- Refresh on demand (rate limited: max once per 24h per user)

US-FIN-05
AS A finance manager
I WANT to generate invoices and acts from templates
SO THAT document creation takes seconds not minutes

Acceptance Criteria:
- "Sənəd yarat" → select template (invoice/act/letter) → variable filling form
- Variables auto-filled where possible: client name, project name, today's date, firm details
- Preview rendered HTML → "PDF yüklə" or "Link kopyala" (share_token)
- Saved to project_documents linked to client + project
```

---

### MODULE 7: MIRAI (AI Assistant)

**Screen:** Isolated dark-ish canvas (#EBEBEB), full-bleed organic gradient blob shapes (pink/yellow/blue) animating slowly. Chat interface overlaid — minimalist, no cards, open space.

**Architecture:**
- Claude Haiku 4.5 (cost: ~$0.25/1M input tokens, $1.25/1M output tokens)
- Hard limit: $5/user/month → ~4M input tokens/month per user (generous)
- Streaming responses (SSE)
- RAG: pgvector + embedded AZ construction law + normative documents
- 6 admin personas + 1 user persona (different system prompts per selection)

**6 Admin Personas:**
```
1. Əməliyyat Direktoru  — business ops, finance, HR decisions
2. Layihə Mühəndisi     — technical architecture, engineering review
3. Hüquqşünas          — AZ contract law, expertise requirements (RAG)
4. Marketinq Direktoru  — brand, client communication, proposals
5. Maliyyə Analitiki    — cashflow, pricing, P&L analysis
6. Strateq             — growth, positioning, competitive analysis
```

**1 User Persona:**
```
Komanda Köməkçisi — task help, deadline questions, team FAQs
```

**User Stories:**

```
US-MIRAI-01
AS A studio director
I WANT to ask MIRAI questions in Azerbaijani and get expert answers
SO THAT I have an always-available senior advisor

Acceptance Criteria:
- Chat interface: text input at bottom, streaming response above
- Language: Azerbaijani primary, auto-detect if other language used
- Persona selector: 6 icon cards at top of chat (admin only), 1 for users
- Persona switch → new conversation context (history not carried over)
- Each response: persona name shown as sender label

US-MIRAI-02
AS A studio director
I WANT MIRAI to answer questions about AZ construction law and expertise requirements
SO THAT I don't need to call a lawyer for routine questions

Acceptance Criteria:
- RAG pipeline: question → embed → pgvector search top-5 chunks → inject into context
- Sources cited at end of response: "Mənbə: AZ İnşaat Normaları, Maddə 4.2.1"
- If no relevant chunk found → MIRAI states clearly: "Bu məsələ üzrə dəqiq məlumatım yoxdur, hüquqşünasla məsləhətləşin"
- Knowledge base updatable by admin (PDF upload → chunking → embedding)

US-MIRAI-03
AS ANY user
I WANT MIRAI to know my current project context
SO THAT answers are relevant, not generic

Acceptance Criteria:
- Before sending, system prompt injects: current user's active projects (names, phases, deadlines), open tasks count, today's date
- MIRAI can reference: "Sizin X layihənizdə deadline 14 gün sonradır"
- MIRAI cannot access: other users' data, financial amounts (unless admin persona + explicit permission)

US-MIRAI-04
AS A studio director
I WANT to see MIRAI usage and costs
SO THAT I can manage the $5/user/month budget

Acceptance Criteria:
- Admin panel: MIRAI usage table — user, this month tokens, estimated cost, % of limit
- User approaching limit (80%) → warning banner in MIRAI chat
- At 100% → chat disabled until next calendar month, message shown: "Bu ay MIRAI limitinə çatdınız"
- Creator always exempt from limit (is_creator bypass)
```

---

### MODULE 8: Elanlar (Announcements)

**Screen:** Whenevr-style editorial layout. Hero featured card (large) + 3-column card grid below. Category pill filter bar top.

**User Stories:**

```
US-ELAN-01
AS A studio director
I WANT to publish announcements to the whole team
SO THAT important news reaches everyone immediately

Acceptance Criteria:
- "Yeni Elan" button (admin only) → rich text editor (title, body, category, cover image/gradient)
- Categories: Xəbər / Hadisə / Siyasət / Layihə / Digər
- Publish → appears in feed, all users see it on next login/refresh
- Featured toggle: mark one announcement as featured → shown in hero position

US-ELAN-02
AS A team member
I WANT to see announcements filtered by category
SO THAT I find relevant information quickly

Acceptance Criteria:
- Category pills filter in real-time (client-side, no reload)
- All / Xəbər / Hadisə / Siyasət / Layihə shown as pills
- Active filter: indigo (#5A4EFF) background, white text
- "Bu kateqoriyada elan yoxdur" empty state per filter

US-ELAN-03
AS A team member
I WANT to see announcements I haven't read yet
SO THAT I don't miss anything important

Acceptance Criteria:
- Unread indicator: indigo dot on sidebar nav icon
- Card level: subtle "Yeni" badge top-right on unread cards
- Read state: tracked per user (announcements_read junction or read_by jsonb)
- "Hamısını oxunmuş işarələ" button in page header
```

---

### MODULE 9: Performans (OKRs)

**Screen:** Company OKRs + Personal OKRs (tab toggle). Progress rings for each objective. Key results as checklist rows with numeric progress.

**User Stories:**

```
US-OKR-01
AS A studio director
I WANT to set company-level OKRs per quarter
SO THAT the whole team knows what we're working toward

Acceptance Criteria:
- Objective: title, period (Q1/Q2/Q3/Q4 + year), owner (team member)
- Key results: title, metric_type (numeric/boolean/percentage), current_value, target_value, unit
- Progress = avg(key results progress %)
- Company OKRs visible to all (employee_id = null)

US-OKR-02
AS A team member
I WANT to see and update my personal OKRs
SO THAT I track my own growth and contributions

Acceptance Criteria:
- Personal OKRs: employee_id = auth.uid() — only visible to self + admin (RLS)
- Update current_value inline → progress ring animates
- Weekly nudge: if no OKR update in 7 days → MIRAI suggests an update prompt

US-OKR-03
AS A studio director
I WANT to see team OKR health at a glance
SO THAT I catch lagging objectives early

Acceptance Criteria:
- Admin OKR overview: all team members, their personal OKR completion %
- Health status: On Track (≥70%) / At Risk (40–69%) / Off Track (<40%)
- Color coded: green / amber / red
- Click member → their personal OKRs expanded
```

---

### MODULE 10: Sənədlər / Templates

**Screen:** Attio-style data table. Category tabs top. "+ Sənəd əlavə et" FAB.

**Document Categories:**
- Müqavilə (contract)
- Qiymət protokolu (price protocol)
- Faktura (invoice)
- Akt (act)
- Email / Məktub (letter)
- Ekspertiza aktı (outsource act)

**User Stories:**

```
US-DOC-01
AS A project architect
I WANT to add a Google Drive link as a project document
SO THAT all project documents are accessible from one place

Acceptance Criteria:
- "+ Sənəd" → modal: category, title, external_link (Drive/Dropbox URL), project, client
- Saved → row in table with favicon icon, category badge, link button
- source = 'drive_link'

US-DOC-02
AS A finance manager
I WANT to generate an invoice from a template
SO THAT it's ready in under 60 seconds

Acceptance Criteria:
- "Yarat" button → template selector → variable fill form
- Variables: client name (auto from project), amount, date, invoice number (auto-increment), services table
- Preview → PDF download or share link (share_token)
- Saved with source = 'auto_generated'

US-DOC-03
AS A studio director
I WANT to share a document with a client without requiring login
SO THAT clients can access their documents easily

Acceptance Criteria:
- Each document has share_token (unique hex string)
- "Linki paylaş" → copy `app.domain/docs/{share_token}` to clipboard
- Public route: no auth required, shows read-only document view
- Revoke share: regenerate share_token (old link broken)

US-DOC-04
AS A team member
I WANT Excel and Word templates to follow Attio's data model style
SO THAT exports look professional and structured

Acceptance Criteria:
- Excel export: Attio-style table — company logo column (favicon), colored status pills, tabular numerals right-aligned for amounts
- Word template: Rubik font, firm header, variable substitution markers {{variable_name}}
- Download formats: .xlsx / .docx
- Template managed in templates table (category = 'excel_template' / 'word_template')
```

---

### MODULE 11: Telegram Integration

**User Stories:**

```
US-TG-01
AS A team member
I WANT to receive task deadline reminders via Telegram
SO THAT I never miss a deadline even when not logged in

Acceptance Criteria:
- Profile settings → "Telegram-ı qoş" → bot link + 6-digit code
- On link: telegram_chat_id saved to profile, telegram_linked_at stamped
- Reminders sent: 3 days before deadline, day before, day of
- Message format: "📋 {task_title} — deadline sabah! [{project_name}]"

US-TG-02
AS A studio director
I WANT to receive finance alerts via Telegram
SO THAT large payments don't go unnoticed

Acceptance Criteria:
- Alert triggers: income > 5000 AZN logged, expense > 2000 AZN logged, debitor payment overdue
- Admin configures threshold amounts in system_settings
- Only creator and admin role receive finance alerts
```

---

## 6. Cross-Cutting Requirements

### 6.1 Activity Log
Every create/update/delete on tasks, projects, clients, incomes, expenses → `activity_log` entry.

```
entity_type: 'task' | 'project' | 'client' | 'income' | 'expense' | 'outsource'
entity_id:   uuid of the record
user_id:     auth.uid()
action:      'created' | 'updated' | 'status_changed' | 'deleted' | 'commented'
field_name:  (for updates) which field changed
old_value:   previous value (text)
new_value:   new value (text)
```

### 6.2 Empty States (all pages)
Every list/grid page must have a designed empty state:
- Illustration (simple SVG or gradient blob)
- Message in Azerbaijani ("Hələ heç bir X yoxdur")
- Primary CTA button ("Yeni X yarat")

### 6.3 Loading States
- Page-level: skeleton cards (not spinners) — match layout of actual content
- Widget-level: shimmer animation on number fields
- MIRAI: streaming cursor animation while response generating

### 6.4 Error States
- Network error: toast notification "Bağlantı xətası. Yenidən cəhd edin."
- RLS violation: "Bu məlumatı görmək üçün icazəniz yoxdur."
- Validation error: inline field-level, never blocking alerts

### 6.5 Keyboard Shortcuts
```
Cmd/Ctrl + K     → Global search (command palette)
Cmd/Ctrl + N     → New task (context-aware: project page → task in that project)
Cmd/Ctrl + /     → Open MIRAI
G then D         → Go to Dashboard
G then T         → Go to Tapşırıqlar
G then P         → Go to Layihələr
G then M         → Go to Müştərilər
G then F         → Go to Maliyyə
Escape           → Close modal/panel
```

### 6.6 Notion-Style Avatar System
- All user avatars: circular, 32px (inline) / 40px (profile) / 24px (stacked)
- If no photo: initials on gradient background (hashed from user id → deterministic color)
- Stack: max 3 visible + "+N" overflow pill
- Hover stack → tooltip with all names

---

## 7. Out of Scope (v1.0)

- Mobile native app (web responsive is sufficient for v1)
- Time tracking (logged hours per task)
- Video calls / screen recording
- Client portal login (clients access via share links only)
- Multi-firm / agency mode
- Custom domain per firm
- Stripe/payment integration for firm billing

---

## 8. Prioritization — MoSCoW

### Must Have (Sprint 1–3)
- [x] Auth + roles + RLS
- [x] Projects CRUD + phases
- [x] Tasks 7-status kanban
- [ ] Dashboard bento grid (basic widgets)
- [ ] Müştərilər pipeline (basic)
- [ ] Maliyyə: income/expense log

### Should Have (Sprint 4–6)
- [ ] MIRAI chat (basic persona, no RAG)
- [ ] Elanlar feed
- [ ] Sənədlər: Drive link + share token
- [ ] Retrospective survey (basic)
- [ ] Activity log feed on Dashboard

### Could Have (Sprint 7–9)
- [ ] OKRs
- [ ] Telegram integration
- [ ] MIRAI RAG (law PDFs)
- [ ] Portfolio workflow + awards
- [ ] Finance forecast (MIRAI)
- [ ] Excel/Word template generation

### Won't Have (v1.0)
- Anything in Out of Scope section above

---

## 9. Open Questions

1. **Billing model:** $5/user/month MIRAI limit — is this firm-wide budget or per-user? Recommendation: per-user, simplest to implement and explain.
2. **Expertise deadline calculator:** Does it account for weekends/holidays in AZ? Recommendation: v1 = calendar days, v2 = working days.
3. **Multi-project tasks:** Can one task belong to multiple projects? Decision needed. Recommendation: No — one task, one project. Cross-project work → duplicate task.
4. **Client access to proposals:** Should clients get a login, or share_token only? Recommendation: share_token only for v1 (no client auth complexity).
5. **Offline mode:** Is offline task update needed? Recommendation: No — Supabase realtime requires connection, acknowledge this in onboarding.

---

*Last updated: 2026-05-03*  
*Next review: After Sprint 3 retrospective*
