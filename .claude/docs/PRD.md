# Reflect Architects OS — Product Requirements Document
**Version:** 3.0 (Production-Ready Spec)
**Date:** 2026-05-03
**Product Owner:** Talifa İsgəndərli
**Status:** Pre-PMF / Active Development
**Scope of this document:** Functional, data, integration, security, AI, ops, and acceptance specifications for a fully-ready product. **UI/UX visual design is intentionally excluded** and lives in a separate design-system spec.

---

## 0. How to read this document

- §1–2: Why & for whom
- §3: Architecture, data model, RLS, performance budgets
- §4: Navigation contract (final structure)
- §5: Module-by-module functional spec, with user stories + acceptance criteria + data contracts + RLS + edge cases
- §6: Cross-cutting requirements (activity log, errors, jobs, search, accessibility)
- §7: AI (MIRAI) — personas, RAG, cost, privacy
- §8: Integrations (Telegram, Calendar, Drive, RSS feeds)
- §9: Non-functional requirements (security, performance, reliability, observability)
- §10: Data lifecycle & migration discipline (NO DATA LOSS)
- §11: Release plan, MoSCoW, definition of done
- §12: Open questions & explicit non-goals

Every requirement uses a stable ID (`REQ-<MODULE>-NN`) so it can be referenced from tickets, tests and PRs.

---

## 1. Product Vision

### 1.1 Positioning
Reflect Architects OS is the **first business-management platform built exclusively for architecture firms** that feels genuinely modern. Existing tools (Deltek Ajera, Monograph, ArchiOffice, BQE Core) are too enterprise-heavy, too generic, or aesthetically outdated. Reflect is powerful, flexible, fast — built by an architect, for architects.

### 1.2 North Star Metric
**Weekly Active Projects (WAP)** — projects with ≥1 task update in a rolling 7-day window. Target: 100% of active projects touched weekly.

### 1.3 Six-month Success Metrics
- ≥80% of tasks updated within 24h of status change (task velocity)
- ≤2 min from invite-accept to first task created (onboarding speed)
- ≥70% monthly retention of invited team members (stickiness)
- ≥4.5/5 NPS from client retrospective surveys
- 0 hours/month of manual bookkeeping for the firm (finance automation completeness)
- MIRAI: ≥1 useful interaction/user/week, $0 over budget

### 1.4 Product Principles
1. **No data loss, ever.** Migrations are additive; deprecations rename, never drop. (See §10.)
2. **Privacy by RLS, not by UI.** Hidden ≠ secure. Every guard exists at the database layer. (See §9.1.)
3. **Speed over completeness.** A 60-second task creation beats a 6-field "perfect" form.
4. **Architect-native vocabulary.** Phases, expertise, ekspertiza subtasks, AZ-specific fields — not generic project-management abstractions.
5. **AI is an assistant, not an authority.** MIRAI cites sources; uncertain answers say so.

---

## 2. Users & Roles

### 2.1 Personas
| Persona | Role | Jobs-to-be-Done |
|---|---|---|
| Studio Director | Talifa (Creator/Admin) | Firm health, risk, payments, hiring |
| Project Architect | Senior architect | Project tasks, deadlines, expertise coordination |
| Designer | Mid-level | Update task status, log time, access files |
| Intern | Junior | View assigned tasks, mark done, see announcements |
| BD Lead | Business dev | Pipeline, proposals, interactions |
| Finance Manager | Admin/accountant | Income/expense, outsource payments, forecast |
| Outsource Specialist | External | Own tasks only |
| Client | External | Public document/survey access via share token |

### 2.2 Role Hierarchy (numeric levels)
```
Level 1  Creator   (is_creator = true; Talifa) — unrestricted
Level 2  Admin     — full read/write except creator-only settings
Level 3  Team Lead — manage own projects + team tasks
Level 4  Member    — own tasks + assigned projects
Level 5  External  — own outsource tasks only (no project tree)
```

Helper functions in Postgres:
- `is_creator()` → `profiles.is_creator = true`
- `is_admin()` → `roles.level <= 2 OR is_creator()`
- `is_team_lead()` → `roles.level <= 3 OR is_creator()`
- `current_role_level()` → integer

**Rule:** sidebar visibility never substitutes for RLS. Every component that renders financial values must call a role check inline (`useRoleLevel() <= 2`) AND the underlying query must be RLS-protected.

---

## 3. Technical Architecture

### 3.1 Stack
```
Frontend:   React 18 + Vite + Tailwind CSS
Routing:    React Router v6
State:      React Query (server) + Zustand (UI)
Backend:    Supabase (PostgreSQL 15, RLS, Auth, Storage, Realtime, Edge Functions)
API:        Vercel Serverless Functions (/api/*) for AI + cron + privileged ops
Hosting:    Vercel (frontend + /api), Supabase Cloud (backend)
AI:         Claude Haiku 4.5 via Anthropic API (MIRAI)
Vector DB:  pgvector extension on Supabase (RAG)
Jobs:       Vercel Cron + Supabase pg_cron for scheduled work
Email:      Resend (transactional) — magic links via Supabase Auth
Telegram:   Bot API (one Reflect bot, per-user chat_id linking)
```

### 3.2 Database — Core Tables (canonical list)

**Identity & access**
- `profiles` (id, email, full_name, avatar_url, role_id, is_creator, telegram_chat_id, telegram_linked_at, locale, created_at)
- `roles` (id, key, level, name, is_admin)
- `invitations` (id, email, role_id, invited_by, token, expires_at, accepted_at)

**Work**
- `projects` (id, name, client_id, phases[] text[], requires_expertise, expertise_deadline, payment_buffer_days, deadline, start_date, status, created_by, created_at, archived_at)
- `tasks` (id, project_id, title, description, status, parent_task_id, task_level, assignee_ids uuid[], start_date, deadline, estimated_duration, duration_unit, risk_buffer_pct, is_expertise_subtask, workload, workload_calculated_at, cancel_reason, archived_at, created_by)
- `task_status_history` (id, task_id, from_status, to_status, changed_by, changed_at)
- `task_comments` (id, task_id, user_id, body, mentions uuid[], created_at)

**Clients / CRM**
- `clients` (id, name, company, email, phone, pipeline_stage, confidence_pct, expected_value, last_interaction_at, ai_icp_fit, ai_icp_calculated_at, created_by)
- `client_stage_history` (id, client_id, from_stage, to_stage, changed_by, changed_at, lost_reason)
- `client_interactions` (id, client_id, type, note, occurred_at, logged_by)

**Finance**
- `incomes` (id, project_id, client_id, amount, payment_method, occurred_at, invoice_number, note, created_by)
- `expenses` (id, project_id, category, amount, vendor, occurred_at, note, created_by, recurring_rule_id)
- `recurring_expenses` (id, label, amount, period, next_run_at)
- `outsource_items` (id, project_id, work_title, contact_person, contact_company, amount, paid_at, payment_method, responsible_user_id, deadline, status)
- `outsource_user_view` (Postgres view exposing outsource_items WITHOUT amount/paid_at/payment_method to non-admins)
- `receivables` (id, client_id, project_id, amount, due_at, paid_amount, status)
- `cash_forecasts` (id, generated_at, horizon_days, projected_balance, confidence_low, confidence_high, generated_by)

**Documents**
- `project_documents` (id, project_id, client_id, category, title, source enum('drive_link','auto_generated','upload'), external_link, storage_path, share_token, shared_with[], created_by, created_at)  ← absorbs the legacy Sənəd Arxivi
- `templates` (id, category, name, body, variables jsonb, mime_type, created_by)
- `retrospective_surveys` (id, project_id, client_id, share_token, sent_at, responded_at, nps_score, ratings jsonb, comment)
- `closeout_checklists` (id, project_id, items jsonb, completed_at)
- `portfolio_workflows` (id, project_id, selected_awards uuid[], website_published_at, press_release_sent, applications jsonb)
- `system_awards` (id, name, organizer, deadline_month, url, criteria)

**Communication**
- `announcements` (id, title, body, category, cover_url, is_featured, mirai_generated, approved, approved_by, created_by, published_at, read_by jsonb)
- `calendar_events` (id, title, description, starts_at, ends_at, all_day, recurrence_rule, location, meet_url, organizer_id, attendees uuid[], external_emails text[], project_id, created_at)
- `notifications` (id, user_id, kind, payload jsonb, read_at, created_at)

**AI**
- `mirai_conversations` (id, user_id, persona, started_at, last_message_at, archived_at)
- `mirai_messages` (id, conversation_id, role, content, tokens_in, tokens_out, cost_usd, tools_used jsonb, created_at)
- `mirai_usage_log` (id, user_id, period_yyyymm, tokens_in, tokens_out, cost_usd)
- `knowledge_base` (id, source_pdf, chunk_index, content, embedding vector(1536), uploaded_by, uploaded_at)
- `mirai_feed_posts` (id, source_url, source_kind enum('trend','opportunity'), summary, deadline_at, fetched_at, posted_announcement_id)

**System**
- `okrs` (id, scope enum('company','personal'), employee_id NULL, period, objective, owner_id, created_at)
- `key_results` (id, okr_id, title, metric_type, current_value, target_value, unit, updated_at)
- `system_settings` (key, value, updated_by, updated_at)
- `activity_log` (id, entity_type, entity_id, user_id, action, field_name, old_value, new_value, created_at)
- `audit_log` (id, actor_id, action, resource, ip, user_agent, created_at)
- `equipment` (id, name, kind, serial, assigned_to, condition, purchased_at, notes)

### 3.3 Auth
- Supabase Auth (email/password + magic-link reset)
- JWT, auto-refresh
- Session 7 days, idle timeout 24h
- All `/api/*` endpoints verify `Authorization: Bearer <jwt>` server-side; DB role lookup, not header trust
- `ADMIN_EMAILS` env var deprecated — role from `profiles.role_id` only

### 3.4 Real-time
Supabase Realtime channels:
- `tasks:project_id=<uuid>` → status changes broadcast
- `activity_log` → Dashboard feed
- `announcements` → unread badge updates
- `mirai_messages:conversation_id=<uuid>` → streaming surface for handoff

### 3.5 Performance Budgets
| Surface | Metric | Target |
|---|---|---|
| Web | LCP | ≤1.5s on Vercel CDN |
| Web | TTI | ≤2.5s on 4G mid-tier mobile |
| API | p50 | ≤80ms |
| API | p95 | ≤200ms |
| MIRAI | first token | ≤800ms |
| MIRAI | end-to-end (short query) | ≤4s |
| Realtime | task event delivery | ≤500ms p95 |

---

## 4. Navigation Contract (final structure)

```
İŞ
├── Dashboard          (admin/user variants)
├── Layihələr          (admin: financials; user: no financials)
├── Tapşırıqlar
├── Arxiv              (admin: all; user: own tasks/projects only)
└── Podrat İşləri      (admin: amounts; user: operational view)

MÜŞTƏRİLƏR             (admin only)
└── Müştərilər

MALİYYƏ MƏRKƏZİ        (admin only)
└── Maliyyə Mərkəzi

KOMANDA
├── İşçi Heyəti
├── Əmək Haqqı         (admin: all; user: own salary)
├── Performans         (admin: all; user: self, all years)
├── Məzuniyyət
├── Təqvim
├── Elanlar            (MIRAI feed + manual posts)
└── Avadanlıq

ŞİRKƏT
├── OKR                (admin: company + everyone; user: self only)
├── Karyera Strukturu  (admin: edit; user: read + promotion path)
└── Məzmun Planlaması  (admin only)

SİSTEM                  (admin only)
└── Parametrlər
    ├── Ümumi
    ├── Şablonlar
    ├── Bilik Bazası   (legacy Qaynaqlar PDFs + MIRAI RAG sources)
    └── Bildirişlər
```

**Removed from nav:** Sənəd Arxivi (data → `project_documents`), Qaynaqlar (PDFs → Parametrlər/Bilik Bazası).
**Moved:** Arxiv from System group → İŞ group.

**Rule:** Removing a nav item NEVER drops the underlying table. See §10.

---

## 5. Module Specifications

> Each module: purpose → entities → user stories with acceptance criteria → RLS → edge cases.

### MODULE 1 — Authentication & Onboarding

**REQ-AUTH-01 — Login**
- Email + password via Supabase
- Invalid → inline field error
- Reset → magic link email (Resend)
- Session 7d, idle 24h
- Failed login: 5 attempts/15 min/IP → 429

**REQ-AUTH-02 — Invite-only registration**
- Creator/Admin invites by email + role
- Invitation token expires 48h
- Pending invitations listed; revoke supported
- On accept: `profiles` row created, `role_id` assigned

**REQ-AUTH-03 — Profile**
- Each user manages: avatar, full_name, locale (az/en/ru), telegram_chat_id (linking flow → §8.1)
- Email/role: admin only

**RLS:**
- `profiles`: select all rows authenticated; update only `auth.uid() = id` or admin
- `invitations`: admin only

**Edge cases:**
- Re-invite same email (existing pending) → reuse and bump expiry
- Deactivated user: `is_active = false` blocks login but preserves history

---

### MODULE 2 — Dashboard

**Variants:** admin Dashboard (firm-wide) / user Dashboard (self-focused).

**REQ-DASH-01** Admin sees: active projects health, team workload, this-month cash position, deadlines ≤14d, 50 latest activity entries (Realtime), MIRAI quick-launch.
**REQ-DASH-02** User sees: own tasks today/this-week, own deadlines, unread announcements, upcoming meetings, personal OKR progress.
**REQ-DASH-03** Activity feed filter: All / Tasks / Projects / Finance / Clients (client-side).
**REQ-DASH-04** Task health colors: green ≥14d, amber <14d, red <3d or overdue.
**REQ-DASH-05** Empty states designed per widget (text only — visual lives in design-system spec).

**RLS:** widgets that aggregate financial values check `is_admin()` server-side; non-admins receive `0` masked values rather than NULL to keep the API contract uniform.

---

### MODULE 3 — Layihələr (Projects)

**Entities:** `projects`, `tasks` (project_id), `closeout_checklists`, `portfolio_workflows`.

**REQ-PROJ-01** Create project: name, client (select/create inline), `phases[]` (Konsepsiya/SD/DD/CD/Tender/İcra nəzarəti), start_date, deadline, requires_expertise, expertise_deadline, payment_buffer_days (default 10).

**REQ-PROJ-02** Backward-planned timeline when `requires_expertise = true`:
```
design_deadline = expertise_deadline
                  − payment_buffer_days (default 10)
                  − 30 (expertise wait)
                  − 10 (revision)
                  − 3  (print prep)
```
Working-days mode is a v2 toggle; v1 = calendar days.

**REQ-PROJ-03** Project detail tabs: Overview / Tasks / Documents (`project_documents`) / Finance (admin only) / Closeout / History.

**REQ-PROJ-04** Closeout flow: built-in checklist (akt imzalandı, final sənədlər, arxiv, portfel, retrospektiv sorğu). All checked → "Layihəni Tamamla" → `status = closed`, portfolio workflow row created.

**REQ-PROJ-05** Award/portfolio submission: pick from `system_awards` (5 seeded), per-award checklist, deadline indicator with days remaining.

**REQ-PROJ-06** **Schema migration safety:** legacy `phase` (singular) consolidated into `phases[]`. Migration runs additive: `phases[]` populated from `phase`, both kept until parity test passes 14 days, then `phase` renamed `_deprecated_phase`.

**RLS:**
- `projects` SELECT: assigned team_members + admin
- Financial fields exposed via `projects_admin_view`; non-admins query `projects_user_view` (no amount columns)

**Edge cases:**
- Project with no tasks → closeout still allowed (warning surfaced)
- Reopen closed project: admin only; appends `reopened_at`

---

### MODULE 4 — Tapşırıqlar (Tasks)

**Status model (7):**
```
İdeyalar      backlog
başlanmayıb   queued
İcrada        active
Yoxlamada     review
Ekspertizada  expert review pending
Tamamlandı    done
Cancelled     cancelled (with reason)
```

**REQ-TASK-01** Quick create (title only) + full create modal (title, assignee_ids[], project, start_date, deadline, estimated_duration, duration_unit, risk_buffer_pct, is_expertise_subtask, task_level, parent_task_id).

**REQ-TASK-02** Multi-assignee — `assignee_ids uuid[]` replaces legacy single `assignee_id`. Migration: copy → drop column renamed `_deprecated_assignee_id` (per §10).

**REQ-TASK-03** Drag between status columns → status update + `task_status_history` row + `activity_log` entry.

**REQ-TASK-04** Cancellation requires reason from list `[Müştəri imtina etdi | Layihə dəyişdi | Texniki problem | Yenidən planlaşdırılır | Digər (with text)]`.

**REQ-TASK-05** Subtask completion blocking: parent task cannot move to Tamamlandı while any child is open. Modal shows blockers and offers "Hamısını tamamla" shortcut.

**REQ-TASK-06** Workload formula:
```
workload = estimated_duration × (1 + risk_buffer_pct/100)
```
`workload_calculated_at` updated on save.

**REQ-TASK-07** Mention `@userId` format inside `task_comments.body`; `mentions[]` populated server-side via parser; mentioned users notified (in-app + Telegram if linked).

**REQ-TASK-08** Archive: tasks `Tamamlandı`/`Cancelled` → `archived_at = now()`. Hidden from board, surfaced in Arxiv module (see Module 5).

**REQ-TASK-09** Expertise subtasks auto-suggested when `is_expertise_subtask = true`:
- Çertyoj hazırlığı / Spesifikasiya / Möhür+imza / Çap+ciltləmə / Ekspertizaya təhvil

**RLS:** `tasks` SELECT: project members + admin. Comments visible to anyone with task SELECT.

**Edge cases:**
- Reassign last assignee → must replace, not empty
- Bakı timezone: all `*_at` stored UTC; UI renders Asia/Baku

---

### MODULE 5 — Arxiv

**Lives under İŞ.** Read-only view of:
- `tasks` where `archived_at IS NOT NULL`
- `projects` where `status = 'closed'`

**REQ-ARC-01** Filters: by project / assignee / date range / status.
**REQ-ARC-02** "Restore" admin-only → clears `archived_at` / reopens project.
**REQ-ARC-03** User scope: own tasks + projects they were on. Admin: everything.

---

### MODULE 6 — Müştərilər (Clients / CRM)

**Pipeline (8 stages):**
```
Lead          10%
Təklif        30%
Müzakirə      50%
İmzalanıb     75%
İcrada        95%
Portfolio     100%
Udulan         0%
Arxiv          —
```

**REQ-CRM-01** Pipeline kanban with drag → `client_stage_history` entry; "Udulan" requires `lost_reason`.
**REQ-CRM-02** Pipeline value per stage: `Σ(expected_value × confidence_pct/100)`.
**REQ-CRM-03** Quick interaction log (≤30s): type (Zəng/Email/Görüş/WhatsApp), free text, date.
**REQ-CRM-04** AI ICP enrichment via MIRAI (cached `ai_icp_fit` until inputs change; refresh max 1×/24h/client).
**REQ-CRM-05** Slide-in detail panel (no full-page nav); sections: overview, interactions, proposals, projects, documents.
**REQ-CRM-06** Proposals = `project_documents` rows with `category='price_protocol'`, optional `project_id`. Share token enables public read-only access.
**REQ-CRM-07** Retrospective survey: triggered from closeout, public form, NPS 0–10 + per-category 1–5 stars + free text.

**RLS:** `clients` admin-only by default. BD Lead role (level 3) granted SELECT/INSERT but NOT financial fields (`expected_value`).

---

### MODULE 7 — Maliyyə Mərkəzi (Finance)

**Single page, 6 tabs:**
1. Cash Cockpit (sticky top bar with current balance)
2. P&L (project-level + firm-level)
3. Outsource (admin amounts; users: hidden via view)
4. Xərclər (one-off + recurring)
5. Debitor (receivables)
6. Forecast (MIRAI 30/60/90d)

**REQ-FIN-01** "+ Gəlir" modal: amount, project, client, payment_method, date, invoice_number, note. On save → `incomes` row + activity_log + receivable status sync.
**REQ-FIN-02** Receivable overpayment validation: `paid_amount` cannot exceed `amount`. Excess flagged, blocks save.
**REQ-FIN-03** `markPaid` partial fix: supports partial payments (`paid_amount += delta`), updates `status` only when fully paid.
**REQ-FIN-04** Negative-amount validation across `incomes`, `expenses`, `outsource_items`: `amount > 0` check at DB and form layers.
**REQ-FIN-05** Sabit (recurring) xərclər: format normalized — `recurring_expenses` table, period enum (`weekly|monthly|quarterly|yearly`), `pg_cron` materializes monthly entries into `expenses`.
**REQ-FIN-06** Project P&L view: per-project income, direct expenses, outsource costs, net.
**REQ-FIN-07** Outsource hybrid workflow: status transitions Sifariş → İcra → Təhvil → Ödənildi. Users can update operational status without seeing amounts.
**REQ-FIN-08** Forecast: MIRAI persona "Maliyyə Analitiki" computes `cash_forecasts` row daily (cron) for horizons 30/60/90; UI displays latest with confidence range and disclaimer.
**REQ-FIN-09** Bakı timezone fix: all date math (month boundaries, due dates) computed in `Asia/Baku` not UTC.

**RLS:**
- `incomes`, `expenses`, `outsource_items`, `receivables`, `cash_forecasts`: admin only
- `outsource_user_view`: returns project, work_title, deadline, status, responsible_user_id ONLY (no money fields) — granted to authenticated

---

### MODULE 8 — Komanda

#### 8.1 İşçi Heyəti
List of `profiles`, role, contact, equipment count, current workload.

#### 8.2 Əmək Haqqı
- `salaries` (id, employee_id, amount, currency, effective_from, effective_to, components jsonb)
- Admin sees all; user sees own only (RLS by `auth.uid() = employee_id`)

#### 8.3 Performans
- Yearly performance gauges per employee
- Activates from year 2026 onward
- User sees self for all years; admin sees all
- `performance_reviews` (id, employee_id, year, score, ratings jsonb, reviewer_id, summary)

#### 8.4 Məzuniyyət
- `leave_requests` (id, employee_id, kind, starts_at, ends_at, days, status, approver_id, note)
- Workflow: request → admin approve/deny → calendar event auto-created on approve

#### 8.5 Təqvim — see §8 Integrations (Google Calendar parity)

#### 8.6 Elanlar
- Manual posts + MIRAI auto-posts (`mirai_generated = true, approved = false` until admin approves)
- Categories: Xəbər / Hadisə / Siyasət / Layihə / Trend (MIRAI) / Opportunity (MIRAI) / Digər
- Unread tracking via `read_by jsonb` keyed by user_id
- "Hamısını oxunmuş işarələ" bulk action

#### 8.7 Avadanlıq
- `equipment` table; assign/unassign, condition log, transfer history

---

### MODULE 9 — Şirkət

#### 9.1 OKR
- Company OKR (admin only)
- Personal OKR (user sees own; admin sees all)
- Weekly nudge via MIRAI if no update in 7 days
- Health: On Track ≥70%, At Risk 40–69%, Off Track <40%

#### 9.2 Karyera Strukturu
- `career_levels` (id, name, level_index, requirements jsonb)
- Admin edits; users read + see promotion path from current level → next

#### 9.3 Məzmun Planlaması
- Editorial calendar for marketing/social posts (admin only)
- `content_plans` (id, channel, scheduled_at, topic, owner_id, status, body)

---

### MODULE 10 — Sistem / Parametrlər

#### 10.1 Ümumi
- Firm name, logo, default currency, working hours, AZ holidays
- `system_settings` key/value

#### 10.2 Şablonlar
- Letter, invoice, act, survey templates
- Variable system `{{variable_name}}` with auto-fill registry
- Excel/Word export support

#### 10.3 Bilik Bazası
- Replaces legacy "Qaynaqlar" nav
- Admin uploads PDFs (AZ construction law, AZDNT normatives)
- Pipeline: PDF → text extraction → chunk → embed → `knowledge_base` row
- Used by MIRAI RAG (Hüquqşünas persona)

#### 10.4 Bildirişlər
- Per-channel toggles (in-app, email, Telegram)
- Per-event toggles (deadlines, mentions, status changes, finance alerts, MIRAI feed)
- Stored in `notification_preferences (user_id, channel, event_kind, enabled)`

---

## 6. Cross-Cutting Requirements

### 6.1 Universal Activity Log
Every create/update/delete on tasks, projects, clients, incomes, expenses, outsource_items, calendar_events → `activity_log` entry via DB trigger:
```
entity_type, entity_id, user_id, action, field_name, old_value, new_value, created_at
```
Surfaced on Dashboard feed (admin) and project History tab.

### 6.2 Cmd+K Universal Search
Server endpoint `/api/search?q=...` searches across: tasks, projects, clients, documents, announcements, team members. Returns top 8 grouped. Keyboard-first: arrows + Enter.

### 6.3 Keyboard Shortcuts
```
Cmd/Ctrl + K   global search
Cmd/Ctrl + N   new task (context-aware)
Cmd/Ctrl + /   open MIRAI
G then D/T/P/M/F   navigate Dashboard/Tasks/Projects/Müştərilər/Maliyyə
Escape   close modal/panel
```

### 6.4 Notifications
Pluggable channel system: in-app (default), email (Resend), Telegram. Each notification = `notifications` row + dispatch fan-out per user preferences.

### 6.5 i18n
Primary AZ. Strings in `locales/az.json`. EN/RU stubs for future. All dates in Asia/Baku display TZ.

### 6.6 Accessibility
- WCAG 2.1 AA color contrast (verified in design-system spec)
- Full keyboard navigability
- ARIA labels on all interactive non-button elements
- Screen reader announcements for Realtime updates

### 6.7 Empty / Loading / Error states
- Empty: AZ message + primary CTA per page
- Loading: skeleton matching layout
- Error: toast for transient, inline for validation, full-page for 500. Generic copy ("Xəta baş verdi"); details only in dev/admin diagnostics.

### 6.8 Avatars
Circular, initials fallback on deterministic gradient. Stack max 3 + "+N".

---

## 7. MIRAI (AI Assistant)

### 7.1 Architecture
- Provider: Anthropic Claude **Haiku 4.5** (`claude-haiku-4-5-20251001`)
- Pricing assumption: $0.25/1M input, $1.25/1M output
- Hard cap: $5/user/calendar-month → ~4M input tokens/user/month
- Streaming via SSE over `/api/mirai/chat`
- Server-side key only — never to client
- All requests authenticated; `user_id` logged per response (audit)

### 7.2 Personas
**Admin (6):** Əməliyyat Direktoru / Layihə Mühəndisi / Hüquqşünas (RAG) / Marketinq Direktoru (CMO) / Maliyyə Analitiki / Strateq.
**User (1):** Komanda Köməkçisi.

Persona switch starts a new conversation context; history not carried across personas.

### 7.3 Privacy Filter (mandatory, DB-level)
Every MIRAI tool call wraps the user's session JWT and queries via Supabase with that JWT. RLS enforces scope. The application layer additionally:
- Strips financial figures from any non-admin context
- Removes other-user PII unless admin
- Logs `tools_used` per message for audit

### 7.4 RAG
- `knowledge_base` (chunk + 1536-d embedding)
- Question → embed → cosine top-5 → inject into context with source labels
- Citations appended: `Mənbə: <pdf_name>, Maddə X.Y.Z`
- Empty result → MIRAI must reply: "Bu məsələ üzrə dəqiq məlumatım yoxdur."

### 7.5 Tool Layer
Whitelisted tools (server-executed, scoped by user role):
- `list_my_tasks`, `list_my_projects`
- `create_task` (current user as creator)
- `summarize_project` (project_id must be in user's scope)
- `firm_finance_snapshot` (admin only)
- `search_knowledge_base`
- `post_announcement_draft` (admin only — feeds Elanlar approval queue)

### 7.6 Cost Guardian
- Per-message: refuse if estimated cost would exceed remaining monthly budget
- 80% of budget → warning banner
- 100% → chat disabled until next calendar month, message shown
- Creator exempt from limit
- Daily cron rolls usage into `mirai_usage_log`

### 7.7 Context Engine
System prompt injects: today's date (Asia/Baku), user role, active projects (names+phases+deadlines), open task count, persona-specific extras.

### 7.8 CMO → Elanlar Cron
Weekly Vercel cron: fetch ArchDaily / Dezeen / Architizer / WAF RSS + award calendars → MIRAI CMO summarizes & filters (architecture + AZ/regional relevance) → inserts `mirai_feed_posts` and creates `announcements` row with `mirai_generated=true, approved=false`. Admin moderation queue gates publication.

### 7.9 Performance Tracking
- Token usage per persona per week
- Avg response latency
- Refusal rate (tool denied / over-budget)
- User satisfaction thumbs (`mirai_feedback` table)

---

## 8. Integrations

### 8.1 Telegram
- Single Reflect bot
- Linking flow: user opens "Telegram-ı qoş" → bot deep link with one-time code → bot sends code → user pastes back → server verifies and stores `telegram_chat_id`
- **Old direct-bot scripts removed.** Replaced by in-app onboarding.
- Notifications:
  - Task deadlines: D-3, D-1, D-day
  - Mentions
  - Status changes on assigned tasks
  - Finance alerts (admin/creator only): income > X AZN, expense > Y AZN, overdue receivables (X/Y in `system_settings`)
- All financial Telegram messages route ONLY to admin chat IDs.

### 8.2 Calendar (Google Parity)
| Capability | v1 implementation |
|---|---|
| Views | Month / Week / Day |
| Email invite | `.ics` attached + `mailto:` link (no Google API needed) |
| Google Meet link | Button opens `https://meet.new`; user pastes link to event |
| External attendees | `external_emails text[]` on event; `.ics` includes them |
| Internal notify | In-app + Telegram (if linked) |
| Recurring | RFC 5545 via `recurrence_rule` |
| Multi-day | Already supported by `starts_at`/`ends_at` |

**v2 (post-PMF):** OAuth Google Calendar API for native Meet link generation and 2-way sync.

### 8.3 Google Drive
- Documents support `external_link` to Drive/Dropbox
- No OAuth in v1 — link only

### 8.4 Email (Resend)
- Transactional only: invitations, password reset (via Supabase), survey links, share-token notifications, MIRAI usage warnings

### 8.5 RSS Feeds (MIRAI CMO)
- ArchDaily, Dezeen, Architizer, WAF — fetched server-side weekly
- HTML stripped, summary generated, deadline parsed if present

---

## 9. Non-Functional Requirements

### 9.1 Security (mandatory)
- **RLS on every table.** No `DISABLE ROW LEVEL SECURITY` — ever.
- Policies use `auth.uid()` + `roles.level`. Blanket `authenticated` grants forbidden.
- Financial tables (`incomes`, `expenses`, `salaries`, `outsource_items`, `receivables`, `cash_forecasts`) **no SELECT for non-admin** under any condition.
- Every new table requires policies before deploy (CI check: `psql -f rls_audit.sql` fails build if a table has no policy).
- All `/api/*`: JWT verified server-side, role re-checked from DB. Client claims not trusted.
- Rate limits: 100 req/min admin, 30 req/min user, 10 req/min anonymous. Implementation: Upstash Redis sliding window per IP+user.
- Input sanitization: zod schemas at API boundary; parameterized queries only; HTML sanitization for rich text (DOMPurify).
- Secrets: never in repo; only via Vercel/Supabase env vars; `VITE_*` prefix indicates safe-for-client.
- `console.log` stripped in production builds.
- Errors to users are generic; stack traces hidden in prod; full details to `audit_log` and Sentry.
- MIRAI: API key server-side; tool layer scoped; user_id audit per response; RAG cannot return chunks containing other firms' data (single-tenant in v1, but enforced by upload tagging).
- Telegram: financial messages only to admin chat IDs.
- Dependency hygiene: `npm audit` weekly cron; high/critical → block deploy until patched.

**Mandatory question for every new feature:** *"Can someone who shouldn't see this data see it?"* If yes → fix before deploy.

### 9.2 Performance
See §3.5. Verified via:
- Vercel Analytics (LCP/TTI)
- Supabase query insights (p50/p95)
- MIRAI custom metrics (`mirai_messages` durations)

### 9.3 Reliability
- Backups: Supabase daily PITR + weekly `pg_dump` to off-site bucket
- Manual `pg_dump` taken before every schema migration
- Migrations: every up + down; CI rejects PRs without `down()`
- Parity tests pre-deploy (counts, sums) for any rename/migration. Failing parity blocks deploy.
- Health checks: `/api/health` returns DB + AI provider status

### 9.4 Observability
- **Sentry** for frontend + serverless errors
- **Logflare/Vercel logs** for `/api/*`
- **Supabase logs** for DB
- **MIRAI cost dashboard** in admin Sistem → Bildirişlər
- **Audit log** for any privileged action (role change, RLS policy change, settings.update)

### 9.5 Browser Support
Latest 2 versions of Chrome, Edge, Safari, Firefox. iOS Safari 16+. No IE.

---

## 10. Data Lifecycle & Migration Discipline (NO DATA LOSS)

### 10.1 Pre-change protocol
1. `pg_dump` backup, dated, stored locally + off-site
2. Migration written with `up()` AND `down()`
3. Parity SQL written

### 10.2 Forbidden operations
```sql
-- NEVER:
DROP TABLE x;
DROP COLUMN y;

-- INSTEAD:
ALTER TABLE x RENAME TO _archived_x_<yyyymm>;
ALTER TABLE t RENAME COLUMN y TO _deprecated_y;
```

### 10.3 Additive feature pattern
- New table created in parallel with old
- Data backfilled
- `VIEW` unifies if needed
- Code reads from `VIEW` only
- Old table renamed `_archived_*` after 14d parity green

### 10.4 Pre-deploy parity test
```sql
SELECT COUNT(*), SUM(amount) FROM old_table;
SELECT COUNT(*), SUM(amount) FROM new_view;
-- mismatch → deploy blocked
```

### 10.5 Visual audit per changed page
- All old records visible?
- All filters work?
- Each old record detail opens?
- Before/after screenshot pair stored in PR

### 10.6 Nav removal ≠ data deletion
- `HesabFakturalarPage` removed from routes → table preserved
- Qaynaqlar removed from nav → PDFs migrated to Bilik Bazası, old table preserved
- Sənəd Arxivi removed from nav → data migrated to `project_documents`, old table renamed `_archived_document_archive_2026`

---

## 11. Release Plan

### 11.1 Sprint phases
**Part 1 — Təməl (foundation)**
- Design tokens, login redesign (UI track — separate doc)
- Sidebar dark + admin/user nav variants
- RLS role-based + creator status
- Sidebar URL bypass fix
- `api/agent.js` hardcoded email → DB lookup
- `assignee_id` → `assignee_ids[]` migration
- `HesabFakturalarPage` removed from routes
- `phase` → `phases[]` migration
- Mention `@userId` parser
- Universal `activity_log`
- Subtask → Done blocking modal
- Receivable overpayment validation
- `markPaid` partial fix
- Negative amount validation
- Bakı timezone fix
- Dashboard avatar + meeting + announcement widget

**Part 2 — Əsas Featurelər**
- Tapşırıqlar 7 status + migration
- Timesheet/day log UI
- Maliyyə Mərkəzi (8 pages → 1 + tabs)
- Cash Cockpit sticky top bar
- Project P&L
- Outsource hybrid workflow
- Forecast engine
- Recurring expenses format fix
- Müştəri lifecycle 8-stage pipeline
- Müştəri slide-in detail panel
- Workload estimator
- Retrospective survey
- Şablon Mərkəzi
- Qaynaqlar → Parametrlər/Bilik Bazası migration
- Sənəd Arxivi → `project_documents` migration
- Arxiv → İŞ group + RLS
- Cmd+K universal search
- Karyera Strukturu user promotion path
- Performance gauge + 2026 activation
- Salary user-self view
- OKR personal scope

**Part 3 — MIRAI + Telegram + Təqvim**
- Old Telegram bot scripts removed
- In-app Telegram onboarding (chat_id flow)
- MIRAI pop-up + persona router
- MIRAI privacy filter
- MIRAI context engine
- MIRAI tool layer
- MIRAI cost guardian
- MIRAI Telegram notifications
- MIRAI CMO → Elanlar cron
- MIRAI RAG engine + pgvector
- MIRAI performance tracking
- Calendar Month/Week/Day views
- Calendar `.ics` email invite
- Calendar `meet.new` integration

### 11.2 MoSCoW (cumulative)
**Must:** Auth, Roles+RLS, Projects, Tasks 7-status, Dashboard widgets (admin+user), Müştərilər pipeline, Maliyyə Mərkəzi income/expense, Activity log, Migrations §10.
**Should:** MIRAI basic chat (no RAG), Elanlar feed + MIRAI moderation, Documents + share token, Retrospective survey, Calendar Month/Week/Day, Telegram link + reminders.
**Could:** OKRs, MIRAI RAG, Portfolio + awards, Forecast, Excel/Word template generator, Karyera promotion path, Equipment.
**Won't (v1):** mobile native, time-tracking against tasks, video calls, client login portal, multi-firm tenancy, custom domains, Stripe firm billing, native Google Calendar OAuth (v2).

### 11.3 Definition of Done (every feature)
- [ ] Functional acceptance criteria met
- [ ] RLS policy in place + tested with non-admin user
- [ ] `up()` + `down()` migration; parity test green
- [ ] Activity log entries emitted where relevant
- [ ] Empty / loading / error states implemented
- [ ] Keyboard navigable
- [ ] AZ strings in `locales/az.json`
- [ ] Sentry error path verified (forced failure → captured)
- [ ] Pre/post screenshots for visual audit
- [ ] Manual test pass on Chrome + Safari
- [ ] PR description references requirement IDs

---

## 12. Out of Scope & Open Questions

### 12.1 Out of scope (v1.0)
- Native mobile app (web responsive only)
- Time tracking per task (timesheet exists at day-level only)
- Video calls / screen recording
- Client login portal (share-token only)
- Multi-firm / multi-tenant
- Per-firm custom domains
- Stripe firm-billing
- Native Google Calendar OAuth + Meet API (deferred to v2)
- Offline mode

### 12.2 Open questions
1. **MIRAI budget granularity:** firm-wide vs per-user? *Recommendation: per-user, $5/mo, simplest to communicate.*
2. **Working-day expertise calc:** AZ holiday calendar v1 or v2? *Recommendation: v1 calendar days; v2 working days.*
3. **Task project cardinality:** 1:1 or many:many? *Recommendation: 1:1 for v1; cross-project work duplicated.*
4. **Client identity for proposals:** share-token vs login? *Recommendation: share-token only v1.*
5. **Outsource specialist account creation:** invite (Level 5) vs anonymous link? *Recommendation: invite — keeps RLS clean.*
6. **MIRAI feed approval SLA:** auto-publish after N hours if admin doesn't act? *Decision pending.*

---

*Last updated: 2026-05-03*
*Owner: Talifa İsgəndərli*
*Next review: end of Part 1 sprint*
