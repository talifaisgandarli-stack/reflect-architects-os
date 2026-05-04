# Reflect Architects OS — Product Requirements Document
**Version:** 3.4 (Müştərilər lifecycle refactor — pipeline gating, BCC capture, letter composer, workload estimator, viewer log, lifetime value, MIRAI architecture mode + ZIP analysis, 2 user personas)
**Date:** 2026-05-04
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
- `projects` (id, name, client_id, phases[] text[], requires_expertise, expertise_deadline, payment_buffer_days, deadline, start_date, status, project_type, default_risk_buffer_pct, created_by, created_at, archived_at)
- `tasks` (id, project_id, title, description, status, task_kind, priority, parent_task_id, task_level, assignee_ids uuid[], start_date, deadline timestamptz, estimated_duration, duration_unit, risk_buffer_pct, is_expertise_subtask, workload, workload_calculated_at, cancel_reason, cancelled_at, deleted_at, archived_at, source_entity_type, source_entity_id, created_by)
- `task_status_history` (id, task_id, from_status, to_status, changed_by, changed_at)
- `task_comments` (id, task_id, user_id, body, mentions uuid[], created_at)
- `task_dependencies` (id, task_id, depends_on_task_id, kind enum('finish_to_start'), created_at)
- `task_tags` (id, name, color, created_by)
- `task_tag_assignments` (task_id, tag_id, applied_at, applied_by) — composite PK; works for tasks AND subtasks
- `stage_templates` (id, project_type, stage_name, default_duration_weeks, order_index)
- `scheduled_notifications` (id, schedule_type enum('daily_morning','daily_evening'), schedule_time time, enabled, user_id NULL, template jsonb)
- `user_notification_settings` (user_id PK, morning_summary, evening_motivation, telegram_chat_id, email_enabled)
- `mirai_blame_keywords` (id, keyword, weight, locale)

**Clients / CRM**
- `clients` (id, name, company, email, phone, pipeline_stage, confidence_pct, expected_value, expected_close_date, last_interaction_at, ai_icp_fit, ai_icp_calculated_at, total_lifetime_value, archived_at, created_by)
- `client_stage_history` (id, client_id, from_stage, to_stage, changed_by, changed_at, lost_reason, transition_payload jsonb) — `transition_payload` captures the per-transition mandatory fields (e.g. `{proposal_sent_at, proposal_amount}` for Lead→Təklif), used for audit + retroactive validation
- `client_interactions` (id, client_id, type, note, occurred_at, logged_by, source enum('manual','email_capture'))
- `client_email_captures` (id, client_id NULL, project_id NULL, from_address, to_address, bcc_match_token, subject, body_text, body_html, attachments jsonb, received_at, ai_match_confidence, ai_matched_by enum('email_pattern','project_name','client_name','manual'), reviewed boolean default false)
- `client_letters` (id, client_id, project_id NULL, template_id NULL, subject, body_html, variables_used jsonb, generated_pdf_url, signed_at, sent_at NULL, sent_via enum('email','manual_download','platform_share'), created_by)
- `document_views` (id, document_id references project_documents, share_token, viewer_ip, viewer_user_agent, viewed_at) — every share-token open is logged; surfaces "kim baxdı, nə vaxt baxdı"

**Finance**
- `incomes` (id, project_id, client_id, amount, payment_method, occurred_at, invoice_number, note, created_by)
- `expenses` (id, project_id, category, amount, vendor, occurred_at, note, created_by, recurring_rule_id)
- `recurring_expenses` (id, label, amount, period, next_run_at)
- `outsource_items` (id, project_id, work_title, contact_person NULL, contact_company NULL, amount, paid_at, payment_method, responsible_user_id NULL, deadline, status) — `contact_person`, `contact_company`, `responsible_user_id` are nullable: outsource items are routinely created with title + amount + deadline only, executor and contact filled in later as the engagement is finalized
- `outsource_user_view` (Postgres view exposing outsource_items WITHOUT amount/paid_at/payment_method to non-admins)
- `receivables` (id, client_id, project_id, amount, due_at, paid_amount, status)
- `cash_forecasts` (id, generated_at, horizon_days, projected_balance, confidence_low, confidence_high, generated_by)
- `cash_balances` (id, kind enum('bank','kassa'), label, current_balance, currency default 'AZN', updated_at, updated_by) — bank accounts and physical cash registers tracked separately; sum of all rows = total liquid balance shown in Cash Cockpit
- `cash_snapshots` (id, snapshot_date date, bank_total, kassa_total, grand_total, generated_at) — daily snapshot row written by `pg_cron` at 00:05 Asia/Baku, materialized view `cash_snapshot_mv` exposes 90-day rolling history for charts
- `internal_loans` (id, borrowing_project_id, lending_project_id, amount, reason, requested_by, approved_by, approved_at, repaid_at, status enum('open','repaid','written_off'), audit_pdf_url, created_at) — every loan auto-generates a PDF receipt for tax-audit defense (PRD §9.1)
- `project_overhead_allocations` (project_id PK, period_yyyymm PK, allocated_amount, computed_at, formula_version) — proxy-formula output written monthly by cron; one row per project per month

**Documents**
- `project_documents` (id, project_id, client_id, category enum('contract','price_protocol','invoice','act','email','letter','outsource_act','retro_survey','other'), title, source enum('drive_link','auto_generated','upload','email_capture'), external_link, storage_path, share_token, shared_with[], created_by, created_at)  ← absorbs the legacy Sənəd Arxivi; canonical category enum closes prior ambiguity
- `templates` (id, category enum('letter','invoice','delivery_act','email','outsource_act','survey'), subcategory text NULL, name, language text default 'az', body_html, variables jsonb, mime_type, is_default boolean default false, is_active boolean default true, created_by, created_at)
- `retrospective_surveys` (id, project_id, client_id, share_token, sent_at, responded_at, nps_score, ratings jsonb, comment)
- `closeout_checklists` (id, project_id, items jsonb, completed_at)
- `portfolio_workflows` (id, project_id, selected_awards uuid[], website_published_at, press_release_sent, applications jsonb)
- `system_awards` (id, name, organizer, deadline_month, url, criteria, region, is_custom boolean default false, created_by, created_at)

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

**REQ-PROJ-04** Closeout flow: editable checklist seeded with defaults (akt imzalandı, final sənədlər, arxiv, portfel, retrospektiv sorğu). Each item supports inline rename, delete, and `+ Yeni əlavə et`. Items persisted in `closeout_checklists.items jsonb` as `[{label, checked, is_default, can_delete}]`. All checked → "Layihəni Tamamla" → `status = closed`, portfolio workflow row created. Default items have `is_default=true, can_delete=false` (label still editable); user-added items are fully removable.

**REQ-PROJ-05** Award/portfolio submission: pick from `system_awards`. Table seeded with international defaults (Aga Khan Award for Architecture, MIPIM Awards, World Architecture Festival, Dezeen Awards, ArchDaily Building of the Year, Architizer A+Awards, RIBA International Awards) AND admin can add custom awards via "+ Yeni mükafat əlavə et" — adds row with `is_custom=true, region='AZ'` (or chosen region), creator stored. Per-award checklist, deadline indicator with days remaining. Custom awards appear alongside system awards in pick UI; admin may delete custom but not system rows.

**REQ-PROJ-06** **Schema migration safety:** legacy `phase` (singular) consolidated into `phases[]`. Migration runs additive: `phases[]` populated from `phase`, both kept until parity test passes 14 days, then `phase` renamed `_deprecated_phase`.

**RLS:**
- `projects` SELECT: assigned team_members + admin
- Financial fields exposed via `projects_admin_view`; non-admins query `projects_user_view` (no amount columns)

**Edge cases:**
- Project with no tasks → closeout still allowed (warning surfaced)
- Reopen closed project: admin only; appends `reopened_at`

---

### MODULE 4 — Tapşırıqlar (Tasks)

> Authoritative source for tasks behaviour. This module supersedes prior task spec drafts and incorporates `tapsiriqlar-spec.md` v2.

#### 4.1 Status model (8)

```
İdeyalar      backlog
Başlanmayıb   queued
İcrada        active
Yoxlamada     review (in-house QA)
Ekspertizada  external expert review pending (state agency etc.)
Tamamlandı    done — auto-triggers Portfolio workflow eligibility
Portfolio     post-completion award/portfolio submission state
Cancelled     cancelled (with required reason)
```

**Flow:**
```
İdeyalar → Başlanmayıb → İcrada → Yoxlamada → Ekspertizada → Tamamlandı → Portfolio
                                                                     ↓ ↑
                                                                  Cancelled (revertible)
```

`Portfolio` is reached only from `Tamamlandı` and only when the project is flagged as a portfolio candidate during closeout (REQ-TASK-25). It is NOT a Yoxlamada/Ekspertizada review state.

**Legacy status migration map (zero data loss, per §10):**
| Legacy | New |
|---|---|
| `todo` | `Başlanmayıb` |
| `in_progress` | `İcrada` |
| `review` | `Yoxlamada` |
| `done` | `Tamamlandı` |
| `archived` | preserved + status → `Tamamlandı` + `archived_at = now()` |

#### 4.2 Core requirements

**REQ-TASK-01** Quick create (title only, lands in current column) + full create modal: title, description (plain text), assignee_ids[], project, task_kind, priority, start_date, deadline (datetime — see REQ-TASK-13), estimated_duration, duration_unit, risk_buffer_pct, is_expertise_subtask, task_level, parent_task_id, tag_ids[].

**REQ-TASK-02** Multi-assignee — `assignee_ids uuid[]` replaces legacy single `assignee_id`. Migration: copy → drop column renamed `_deprecated_assignee_id` (per §10).

**REQ-TASK-03** Drag between status columns → status update + `task_status_history` row + `activity_log` entry.

**REQ-TASK-04** Cancellation requires reason from list `[Müştəri imtina etdi | Layihə dəyişdi | Texniki problem | Yenidən planlaşdırılır | Digər (with text)]`. On cancel: `cancel_reason` and `cancelled_at` set; status = `Cancelled`. **Cancel revert (REQ-TASK-04a):** admin OR assignee may reopen a cancelled task → status restored to its previous value (read from `task_status_history`), `cancelled_at` cleared, `cancel_reason` archived to history. Reopen logged in `activity_log` as `cancel_reverted`.

**REQ-TASK-05** Subtask completion blocking: parent task cannot move to `Tamamlandı` while any direct child is open. Modal lists blockers and offers "Hamısını tamamla" shortcut.

**REQ-TASK-06** Workload formula:
```
workload = estimated_duration × (1 + risk_buffer_pct/100)
```
`workload_calculated_at` updated on save. Project-level default `projects.default_risk_buffer_pct` prefilled into new tasks.

**REQ-TASK-07** Mention `@userId` format inside `task_comments.body`; `mentions[]` populated server-side via parser; mentioned users notified (in-app + Telegram if linked).

**REQ-TASK-08** Archive: tasks in `Tamamlandı` / `Portfolio` / `Cancelled` may be archived → `archived_at = now()`. Hidden from board, surfaced in Arxiv (Module 5). Bulk archive supported (no other bulk operations in v1).

**REQ-TASK-09** Expertise auto-subtasks: when project `requires_expertise = true` AND a task is created with `is_expertise_subtask = true`, the following 5 children are **automatically inserted** with calculated dates (per backward planning in REQ-TASK-15):
1. Ekspertiza üçün çap sənədlərinin hazırlanması (3 gün)
2. Ekspertizaya göndərmək (1 gün)
3. Ekspertiza cavabı gözləmə (30 gün)
4. İrad düzəltmə buffer (10 gün)
5. Son təsdiq alınması (variable)

Auto-creation may be disabled by uncheck on the create modal.

#### 4.3 Hierarchy & deletion (REQ-TASK-10)

3-level conceptual hierarchy:
```
🏗️ LAYİHƏ (Project — from Module 3)
   └── 📋 TASK
        └── ☐ SUBTASK (and sub-sub-…, no depth limit)
```

Subtasks use the same `tasks` row with `parent_task_id` set. **No nesting depth limit** in v1.

**Delete (REQ-TASK-10a):** admin OR creator may delete a task or subtask → soft-delete via `deleted_at = now()`. Deletion cascades to child subtasks (each child's `deleted_at` set independently). Each deletion (parent + each child) emits its own `activity_log` entry of action `deleted` so subtask removal is visible in the parent's activity feed and in the project history. Deleted rows excluded from all default queries; recoverable from Arxiv by admin within 90 days, then permanently purged.

#### 4.4 Cross-module task hub (REQ-TASK-11)

`tasks.task_kind` enum unifies all accountability under one inbox:

| Kind | Source | Default assignee | Visible kind badge |
|---|---|---|---|
| `work` | manual create | creator picks | (none — default) |
| `portfolio` | Closeout flow when project is portfolio candidate | per-award owner | 🏆 |
| `closeout` | Project closeout checklist items | closeout owner | 📋 |
| `leave_approval` | `leave_requests` insert (Module 8.4) | requester's manager / admin | ✅ |
| `followup` | CRM `client_interactions` opt-in "follow up in N days" | interaction logger | 💬 |

`tasks.source_entity_type` + `source_entity_id` link back to originating row (e.g. `portfolio_workflows.id`, `leave_requests.id`). When the task transitions to `Tamamlandı`, a DB trigger updates the source row's status (e.g. leave request → `approved`, portfolio submission → `submitted`).

**Effect:** "Mənim Tapşırıqlarım", dashboard deadline widgets, Telegram D-3/D-1/D reminders all surface every accountability across the firm — not only `work` tasks. This closes the gap where portfolio award deadlines, leave approvals, and closeout chores were previously invisible.

**RLS:** `task_kind = 'leave_approval'` rows are SELECT-able only by the assignee (manager) and admin, never by the requester (would create circular notification).

#### 4.5 Priority (REQ-TASK-12)

`tasks.priority` enum: `low | medium | high | urgent` (default `medium`). Used for sort order in "Mənim Tapşırıqlarım" (urgent → high → medium → low, then deadline ASC) and surfaced as a small left-edge color tick on task cards.

#### 4.6 Time-of-day deadline (REQ-TASK-13)

`tasks.deadline` is `timestamptz` (not `date`). UI defaults the time to `18:00 Asia/Baku` if user picks a date only. Same-day urgent tasks (e.g. "müştəriyə 17:00-a kimi göndər") are first-class. Telegram reminder cron already runs at `09:00 Asia/Baku` daily; for tasks with `deadline` ≤ end of today, an extra reminder fires 2 hours before the deadline timestamp.

#### 4.7 Tags / labels (REQ-TASK-14)

`task_tags` table holds firm-wide tag definitions (name + color). `task_tag_assignments` is the m2m link, applicable to **both tasks and subtasks**. Tags are manually assigned via a chip picker on the create/edit modal and via the kanban card's `⋯` menu. Filterable in all 3 task views (Kanban, Cədvəl, Mənim Tapşırıqlarım).

Out of scope v1: bulk tag operations, AI tag suggestions.

#### 4.8 Auto Planner & backward planning (REQ-TASK-15)

When a task is created with a project that has `requires_expertise = true`, MIRAI computes dates by working backwards from the project deadline:

```
expertise_final = project.deadline − payment_buffer_days
expertise_submit = expertise_final − 30 (review) − 10 (revision buffer)
design_final = expertise_submit − 3 (print prep)
```

The Auto Planner offers these dates as suggestions in the create modal; user may accept or override. Days are calendar days in v1; working-day mode is v2.

#### 4.9 Task dependencies (REQ-TASK-16)

`task_dependencies` (id, task_id, depends_on_task_id, kind). Only `finish_to_start` supported in v1.

- Task B with dependency on Task A: B cannot transition to `İcrada` until A is `Tamamlandı`. Attempted transition shows blocking modal listing predecessors.
- When A's deadline shifts later, MIRAI proposes shifting B's start_date; user confirms.
- Visual: dependency badge "↳ {N} blocking" on task card.
- Critical path computation deferred to v2 (Gantt-light view).

#### 4.10 Stage templates (REQ-TASK-17)

`stage_templates` table seeded with project-type-specific stages. `projects.project_type` enum: `residential | commercial | interior | urban`. On project creation, selecting a type prefills phases:

| Type | Stages (weeks) |
|---|---|
| Residential | Konsept (2) → Eskiz (3) → İşçi (4) → Ekspertiza (6) → Müəllif nəzarəti (5) |
| Commercial | Konsept (3) → Eskiz (5) → İşçi (7) → Ekspertiza (6) → Müəllif (4) |
| Interior | Konsept (1) → 3D (2) → İşçi (3) → Müəllif (2) (no expertise) |
| Urban | Konsept (3) → Master plan (6) → Detallar (10) → Ekspertiza (6) → Müəllif (4) |

Templates are editable by admin in Sistem → Şablonlar (Module 10.2).

#### 4.11 Proposal calculation includes expertise (REQ-TASK-18)

When generating a proposal (Module 6, US-CRM-05) for a project that requires expertise, the proposal's "Çatdırılma müddəti" calculation must include the full expertise chain (3+30+10 = ~43 days minimum). Surfaced in proposal preview as a line item:
```
Ekspertiza paketi: 3 gün
Ekspertiza gözləmə: 30 gün
İrad düzəltmə buffer: 10 gün
Son təsdiq + ödəniş buffer: 10 gün
```

#### 4.12 Activity log + blame exclusion (REQ-TASK-19)

The universal `activity_log` (§6.1) gains `is_blame_excluded boolean default false`. When set, the entry is excluded from performance score calculations (Module 8.3).

- **Manual exclude:** admin clicks "Performansa təsir göstərməsin" on any activity entry.
- **MIRAI auto-detect (REQ-TASK-20):** scans new task comments for blame keywords from `mirai_blame_keywords` table (e.g. "sifarişçi gecikdirdi", "müştəri cavab vermir", "outsource gecikdi"). On match, MIRAI proposes the flag → admin one-click confirms.
- **Excluded delays** are not counted against assignee performance scores.

#### 4.13 Daily scheduled notifications (REQ-TASK-21)

`scheduled_notifications` + `user_notification_settings` drive two cron jobs:

- **09:00 Asia/Baku — Günün özeti:** for every user with `morning_summary=true`, send in-app + Telegram (if linked) message with: today's tasks (deadline = today), this week's tasks, today's calendar events, motivational quote (rotating from a curated AZ list).
- **18:00 Asia/Baku — Gün sonu motivasiyası:** for every user with `evening_motivation=true`, send a summary of completed tasks today + closed subtasks + comments authored, plus a different quote.

User toggles in Sistem → Bildirişlər (Module 10.4).

#### 4.14 MIRAI Smart Reminder — proactive elapsed-vs-estimate (REQ-TASK-23)

Hourly cron checks open tasks where `(now() - start_date)` in days approaches `estimated_duration` (converted to days from `duration_unit`). When elapsed ≥ 80% of estimate AND task is not `Tamamlandı` AND deadline ≤ 48h away, MIRAI sends an in-app + Telegram (if linked) nudge to the assignee:

> *"Aydan, sənin Bilgə Qrup tapşırığın sabah deadline-da. Estimated 2 həftə idi, indi 13 gün keçib. Yetişəcəkmi?"*

**Computation uses calendar-elapsed time only** (`now() - start_date`) — no actual time tracking is collected (per §4.15 / §12.1 timesheet exclusion). The reminder is purely a wall-clock progress check, not a productivity metric.

Per-user rate limit: max 1 Smart Reminder per task per 24h. User can dismiss → 48h silence on that task. Honors `notification_preferences` for the channel.

#### 4.16 Activity log archival policy (REQ-TASK-22)

`activity_log` rows older than 12 months are migrated to `activity_log_archive` (same schema) by a monthly `pg_cron` job. Default queries hit only the live table; archive is queried explicitly from Sistem → Audit (admin only).

#### 4.17 Out-of-scope clarifications

Explicitly NOT in v1 (do not implement, do not design):
- File attachments to tasks
- Recurring tasks
- Watchers / subscribe (only assignees + mentions trigger notifications)
- Rich text in task description (plain text only)
- Draft autosave on create modal
- Bulk operations beyond bulk archive
- Reviewer/approver workflow with explicit reviewer_id (Yoxlamada / Ekspertizada have no formal reviewer field)
- Human-readable task IDs (UUIDs only)
- Reassign handover note
- Saved per-user filter views
- Time tracking per task / timesheet at any granularity (gün/həftə estimate only; no actual hour tracking)
- Calendar embedding of tasks (calendar remains a separate page — Module 8.5)

#### 4.18 RLS

- `tasks` SELECT: project members + admin + (for `task_kind='leave_approval'`) assignee only
- `task_tags` SELECT: all authenticated; INSERT/UPDATE: admin
- `task_dependencies` SELECT: same as task SELECT
- Comments visible to anyone with task SELECT

#### 4.19 Edge cases

- Reassign last assignee → must replace, not empty
- Bakı timezone: all `*_at` stored UTC; UI renders `Asia/Baku`
- Cancel revert restores prior status from `task_status_history`; if history empty, defaults to `Başlanmayıb`
- Deleting a parent task cascades soft-delete to all children regardless of depth
- A task with kind `leave_approval` cannot be manually deleted; only the source `leave_requests` row drives its lifecycle

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

> Authoritative source for CRM behaviour. v3.4 absorbs `musteri-lifecycle-spec.md` (transition gating, BCC capture, letter composer, workload estimator, MIRAI architecture mode, viewer logging, lifetime value).

#### 6.1 Pipeline stages

```
Lead       10%   İlk əlaqə
Təklif     30%   Kommersiya təklifi göndərildi
Müzakirə   50%   Müştəri ilə danışıq aktiv
İmzalanıb  75%   Müqavilə imzalandı, avans yox
İcrada     95%   Avans alındı
Bitib      —     Layihə tamamlandı (Tamamlandı task statusu ilə sinxron)
Arxiv      —     6+ ay aktivlik yox (auto)
İtirildi    0%   Səbəb məcburi
```

**Note (PM rationale):** CRM stops at `Bitib`. Portfolio submission lives entirely in the task system (PRD §4.1 Portfolio task status). Duplicating it as a CRM stage would be double-bookkeeping for the same lifecycle event.

#### 6.2 Stage transition gating (REQ-CRM-01)

Forward transitions require typed payload; the kanban drop modal collects them and writes to `client_stage_history.transition_payload`. Skipping stages is forbidden except via admin override.

| Transition | Mandatory fields |
|---|---|
| Lead → Təklif | `proposal_sent_at` (date), `proposal_amount` (numeric > 0) |
| Təklif → Müzakirə | `client_response_note` (text), `response_received_at` (date) |
| Müzakirə → İmzalanıb | `contract_external_link` (Drive URL) — validated as `https://`, `contract_signed_at` (date) |
| İmzalanıb → İcrada | `advance_amount` (numeric > 0), `advance_received_at` (date) → also auto-creates `incomes` row + receivable |
| İcrada → Bitib | `delivery_act_document_id` (FK to project_documents), `final_payment_received_at` (date) |
| → İtirildi | `lost_reason` enum (`budget`, `timeline`, `competitor`, `client_cancel`, `other`), `lost_reason_note` (text — required if `other`) |

**Skip-stage detection:** dragging a card past an intermediate stage shows a blocking modal listing skipped stages; admin sees an "Override (səbəb məcburi)" option, non-admin sees only "Geri qayıt".

**Override flow:** admin must enter `override_reason` (text); transition + reason logged to `audit_log` + `client_stage_history.transition_payload.override_reason`.

#### 6.3 Pipeline value (REQ-CRM-02)

Per-stage and total: `Σ(expected_value × confidence_pct/100)`. Confidence percentages are global (defined by stage) until calibrated per REQ-FIN-17.

#### 6.4 Quick interaction log (REQ-CRM-03)

≤ 30 seconds: type (Zəng / Email / Görüş / WhatsApp / Digər) + free text + date. On save updates `clients.last_interaction_at`.

#### 6.5 AI ICP enrichment (REQ-CRM-04)

MIRAI Strateq scores ICP fit (`Excellent / Good / Medium / Low`); cached in `ai_icp_fit` until inputs change. Refresh ≤ 1×/24h per client.

#### 6.6 Slide-in detail panel (REQ-CRM-05)

Right drawer (`--lg`, 640px). Tabs:

1. **Statistika** (header summary): Ümumi gəlir = `clients.total_lifetime_value`, layihə sayı, ilk əlaqə, son layihə, ortalama dəyər
2. **Ümumi** — contact info, expected_value, confidence slider, expected_close_date, AI ICP score with refresh button
3. **Timeline** — auto-rendered from `client_stage_history` rows in reverse chron with avatar + transition + payload summary
4. **Layihələr** — list of projects with status pill + deadline + last activity
5. **Sənədlər** — see §6.8 (with viewer log)
6. **Kommunikasiya** (NEW): unified feed of `client_interactions` + `client_email_captures` reverse-chron; quick-log form at top (PRD §6.4); "✉️ Məktub yaz" button opens letter composer (§6.10)
7. **Əlaqə şəxsləri** — multi-contact support (admin-only edit)

`clients.total_lifetime_value` is recomputed nightly via `pg_cron` from `Σ(incomes.amount where client_id = c.id)`.

#### 6.7 Proposals — share token (REQ-CRM-06)

Proposals = `project_documents` rows with `category='price_protocol'`. Share token enables public read-only access at `/d/{token}`. Each open emits `document_views` row (REQ-CRM-09); admin sees viewer log.

#### 6.8 Document share token + viewer log (REQ-CRM-09)

Every share-token URL open is logged to `document_views` with IP, user-agent, timestamp. Inside the document drawer, "Baxılma tarixçəsi" panel renders the latest 20 views as compact rows with relative time. Useful signals:
- Müştəri linki açdı? (eviction of "müştəri görmədi" excuse)
- Neçə dəfə? (interest signal)
- Hansı IP-dən? (multiple stakeholders viewing)

For Drive links: same proxy approach — `/d/{token}` is a Reflect-served redirector; the redirect emits the view log row before serving the Drive URL.

Tokens may be revoked by admin (`share_token = NULL` clears it; existing URLs return 410 Gone).

#### 6.9 Retrospective survey (REQ-CRM-07)

Triggered from closeout (PRD REQ-PROJ-04). Template selected from `templates` where `category='survey'` (default seeded). Public form, NPS 0–10 + per-category 1–5 stars + free text. Submission persists to `retrospective_surveys`; admin Dashboard updates rolling 12-month NPS.

#### 6.10 Rəsmi Məktub Composer (REQ-CRM-10)

Drawer-launched composer for client correspondence. Layout:

- Top: subject + recipient (auto-fills client.email)
- Template picker (left): templates of `category='letter'`
- WYSIWYG editor (center): plain-but-styled rich text — `{{variable}}` chips auto-populate from client / project context (variables resolved live, see §6.13)
- Right rail: Logo + möhür preview (firm logo from system_settings)
- Bottom actions:
  - **PDF endir** — generates PDF (logo + signature + content); inserts `project_documents` row `source='auto_generated'`, `category='letter'`; share_token issued
  - **Email göndər** — uses Resend; persists `client_letters.sent_via='email'`, `sent_at`
  - **Yadda saxla** — saves draft to `client_letters` without sending

Letters never bypass `project_documents` — every saved/sent letter creates a row so it surfaces in the Sənədlər tab and in the project Sənədlər list.

#### 6.11 Email capture via BCC (REQ-CRM-11)

**Workflow:**
1. Each admin gets a unique BCC address: `{firm-slug}-{secret-token}@reflect-capture.app` (stored in `profiles.email_bcc_address`)
2. When sending email to a client, employee adds the BCC address (invisible to client)
3. Resend webhook receives the email → POSTs to `/api/webhooks/email-capture`
4. AI matcher (Claude Haiku, single batched call per webhook) attempts to match `to_address` + email body against:
   - `clients.email` exact match (confidence 1.0, `ai_matched_by='email_pattern'`)
   - `clients.name` / `clients.company` token match in subject/body (confidence 0.7, `ai_matched_by='client_name'`)
   - `projects.name` token match in subject/body (confidence 0.7, `ai_matched_by='project_name'`)
5. Insert `client_email_captures` row + `project_documents` row (`category='email'`, `source='email_capture'`, attachments stored in Supabase Storage)
6. `clients.last_interaction_at` updated; surface in Kommunikasiya tab (§6.6)

**Privacy notes (PRD §9.1):**
- BCC addresses are per-admin secrets; rotated by admin via "BCC ünvanı yenilə" in Profil
- Captured emails admin-only RLS
- "Sender of capture" (admin) recorded; AI never reads beyond what employees explicitly BCC'd

**Failure mode:** if AI confidence < 0.5 across all matches → row inserted with `client_id NULL`, surfaced in Sistem → Email captures inbox for manual matching. No silent loss.

#### 6.12 Workload estimator + Net Income (REQ-CRM-12)

Surfaces in three places:
1. Müştərilər page header
2. Inside proposal generation flow (when creating a proposal for the client)
3. As MIRAI tool when admin asks "Bu layihəni qəbul edə bilərikmi?"

**Header indicator (Müştərilər page):**
```
🟢 Komanda yükü: 65% (sağlam)
⚠️ Yeni layihə qəbul edə bilirik (3 nəfərdə boşluq var)
```

Computation:
```
team_capacity        = Σ_{member m} (m.work_hours × m.availability)
firm_active_days     = REQ-FIN-13 firm_active_user_days for current month
load_pct             = firm_active_days / team_capacity
status:
  ≤ 70%   🟢 sağlam — yeni layihə qəbul edilə bilər
  70-90%  🟡 dolu — diqqətlə qəbul
  > 90%   🔴 həddi keçib — yeni layihə tövsiyə olunmur
```

**Proposal-time variants (3 options):** for a new project being scoped, MIRAI computes 3 timeline variants:
```
estimated_days     = Σ(stage_template.default_duration_weeks) × 5  (project type from stage_templates, REQ-TASK-17)
fastest            = estimated_days × 0.6
medium             = estimated_days × 1.0
comfortable        = estimated_days × 1.5
```

**Net Income preview** rendered alongside variants:
```
Müqavilə dəyəri:    ₼ contract_value
− Outsource:        ₼ estimated_outsource_cost  (admin enters manually)
− Overhead:         ₼ allocated_overhead         (proxy formula REQ-FIN-13 projected)
─────────────────────────────────────
Reflect-ə net qalır: ₼ X    (Y% of contract)
```

MIRAI recommends one of the 3 variants based on team load + net % healthiness (e.g. "Orta variant tövsiyə — 10 həftə, ₼100K, net 57% sağlamdır").

#### 6.13 Template variables (REQ-CRM-13)

Standard variable registry, auto-resolved by composer / invoice generator / letter generator:

| Variable | Source |
|---|---|
| `{{client_name}}` | `clients.name` |
| `{{client_company}}` | `clients.company` |
| `{{client_address}}` | `clients.address` (added to schema) |
| `{{client_email}}` | `clients.email` |
| `{{project_name}}` | `projects.name` |
| `{{contract_amount}}` | `projects.contract_value` |
| `{{vat_amount}}` | `contract_amount × 0.18` (AZ VAT, REQ-FIN-AZ-VAT) |
| `{{total_amount}}` | `contract_amount + vat_amount` |
| `{{date}}` | `now()` Asia/Baku formatted |
| `{{author_name}}` | `auth.user.full_name` |
| `{{author_position}}` | `roles.name` |
| `{{firm_name}}` | `system_settings.firm_name` |
| `{{firm_logo}}` | `system_settings.firm_logo_url` |

Variables undefined for the current context render as `[Yoxdur]` placeholder + admin warning toast on save: "Bəzi dəyişənlər boş qaldı".

#### 6.14 Auto-archive (REQ-CRM-14)

Daily `pg_cron` flips `pipeline_stage = 'Arxiv'` and sets `archived_at` for clients where `last_interaction_at < now() - interval '6 months'` AND `pipeline_stage NOT IN ('İcrada', 'Bitib', 'İtirildi')`. Archived clients hidden from default pipeline view; surface in Arxiv tab.

#### 6.15 Default templates (REQ-CRM-15)

System ships with seeded `templates` rows (`is_default=true`), per `musteri-lifecycle-spec.md` §Şablon Mərkəzi:

| Template | Subcategory | Source |
|---|---|---|
| Email — Təşəkkür | — | system default |
| Email — Faktura göndəriş | — | system default |
| Akt — Podratçı (individual) | `individual` | system default |
| Akt — Podratçı (şirkət) | `company` | system default |
| Anket — Müştəri retrospektiv | — | system default |

Admin-created (initially empty, admin populates):
- Letter — Rəsmi məktub
- Invoice — Hesab-faktura
- Delivery_act — Sifarişçi ilə təhvil-təslim aktı

Defaults are editable; reverting to default is one click in template detail.

#### 6.16 RLS

- `clients` admin-only by default. BD Lead role (level 3) granted SELECT/INSERT but NOT financial fields (`expected_value`, `total_lifetime_value`)
- `client_email_captures`, `client_letters`, `document_views`: admin only
- `templates`: SELECT all authenticated; INSERT/UPDATE admin only

---

### MODULE 7 — Maliyyə Mərkəzi (Finance)

> Authoritative source for finance behaviour. v3.3 absorbs `maliyye-merkezi-spec.md` (bank/kassa split, snapshots, internal loans, 3-level P&L, explicit forecast formula, audit chain).

**Single page, 6 tabs:**
1. Cash Cockpit (sticky top bar with bank + kassa breakdown + runway gauge)
2. P&L (firm-level + project-level — Gross / Net / Final)
3. Outsource (admin amounts; users: hidden via view)
4. Xərclər (one-off + recurring)
5. Debitor (receivables)
6. Forecast (MIRAI 30/60/90/365d with confidence chart)

#### 7.1 Core requirements

**REQ-FIN-01** "+ Gəlir" modal: amount, project, client, payment_method, target balance row (bank or kassa — REQ-FIN-10), date, invoice_number, note. On save → `incomes` row + activity_log + receivable status sync + `cash_balances.current_balance` increment.

**REQ-FIN-02** Receivable overpayment validation: `paid_amount` cannot exceed `amount`. Excess flagged, blocks save.

**REQ-FIN-03** `markPaid` partial fix: supports partial payments (`paid_amount += delta`), updates `status` only when fully paid.

**REQ-FIN-04** Negative-amount validation across `incomes`, `expenses`, `outsource_items`, `internal_loans`: `amount > 0` check at DB and form layers.

**REQ-FIN-05** Sabit (recurring) xərclər: format normalized — `recurring_expenses` table, period enum (`weekly|monthly|quarterly|yearly`), `pg_cron` materializes monthly entries into `expenses`.

**REQ-FIN-06** Project P&L — **3-level model:**
```
Gross  = Σ(incomes for project)
Net    = Gross − Σ(outsource_items.amount where paid)
Final  = Net   − allocated_overhead (per REQ-FIN-13)
```
UI shows all three numbers per project with health emoji: 🟢 Final ≥ 30% of Gross / 🟡 10–30% / 🔴 < 10%. Firm-level view aggregates rows.

**REQ-FIN-07** Outsource hybrid workflow: status transitions Sifariş → İcra → Təhvil → Ödənildi. Users can update operational status without seeing amounts. **Lazy executor assignment:** at row-create time only `work_title` + `project_id` + `amount` + `deadline` are required; `contact_person`, `contact_company`, and `responsible_user_id` may be set to NULL and filled in via inline edit later. Status `İcra` may not be entered until `responsible_user_id` is set; modal blocks the transition with "Cavabdeh şəxs təyin edilməlidir".

**REQ-FIN-07a** Outsource → expenses propagation table (canonical). Outsource cost flows to different surfaces with different rules:

| Surface | Inclusion |
|---|---|
| Cash Cockpit (real balance) | ✅ Included once `paid_at IS NOT NULL` (real cash leaves) |
| Monthly expenses table | ✅ Under category `outsource` |
| Firm overhead (forecast `reflect_overhead`) | ❌ NOT included (project-specific, not firm fixed cost) |
| Project P&L Net | ✅ Subtracted from Gross |
| Forecast `outsource_planned` | ✅ Separate line by deadline (even if unpaid) |

**REQ-FIN-08** Forecast: MIRAI persona "Maliyyə Analitiki" computes `cash_forecasts` row daily (cron) for horizons 30/60/90/365 days using the explicit formula in REQ-FIN-15; UI displays latest with confidence chart (REQ-FIN-16) and disclaimer.

**REQ-FIN-09** Bakı timezone fix: all date math (month boundaries, due dates, snapshot timing) computed in `Asia/Baku` not UTC.

#### 7.2 Bank vs Kassa split (REQ-FIN-10)

`cash_balances` table holds N rows, each typed `bank` or `kassa`. Cash Cockpit displays:

```
🏦 Bank: ₼145,000   💵 Kassa: ₼8,500   📊 Cəmi: ₼153,500
```

- Multi-bank supported (e.g. Kapital Bank + PASHA Bank rows)
- Multi-kassa supported (main register + project-site petty cash)
- "+ Gəlir" / "+ Xərc" modals require selecting target balance row — sum-of-rows must equal Cash Cockpit total at all times (DB CHECK enforced via trigger)
- Manual reconciliation supported: admin can adjust `current_balance` directly with required note → logs to `audit_log`

#### 7.3 Daily cash snapshot (REQ-FIN-11)

`pg_cron` job at 00:05 Asia/Baku writes a `cash_snapshots` row capturing bank_total + kassa_total + grand_total. Materialized view `cash_snapshot_mv` exposes the last 90 days for the Cash Cockpit chart. Older rows preserved in the table for compliance / auditing.

If the daily cron fails, the next-day run inserts both rows (gap-fill); never leaves holes in the series.

#### 7.4 Cross-Project Funding — internal loans (REQ-FIN-12)

When a project's near-term cash need exceeds its own available balance, MIRAI proposes internal funding from a sibling project's surplus. Real-world ssenari: maaş ödəniş tarixi gəlir, Z layihəsi hələ ödəniş almayıb, X layihəsindən borc lazımdır.

**Workflow:**
1. MIRAI Maliyyə Analitiki detects shortfall (cron hourly): `(project.next_known_cost - project.available_balance) > 0` AND another project has surplus
2. MIRAI surfaces a suggester dialog to admin:
   ```
   🤖 MIRAI: Z layihənin maaş ödənişi 3 gün içində çatmır. ₼15,000 lazımdır.
   Mövcud opsiyalar:
     ○ X layihəsi (₼45,000 sərbəst, avans alındı)
     ○ Y layihəsi (₼20,000 sərbəst, final ödəniş gözlənilir)
   💡 Tövsiyəm: X. Səbəb: Z 2 ay sonra ₼60K gətirəcək, X-də buffer var.
   [X-dən götür] [Y-dən götür] [Ləğv et]
   ```
3. Admin approves → `internal_loans` row inserted (`status='open'`)
4. **Auto-generated PDF receipt** stored at `audit_pdf_url`: borrowing project, lending project, amount, reason, date, signatures (canvas-captured admin signature + IP + timestamp + creator email — REQ-FIN-19)
5. When the borrowing project receives income, MIRAI prompts to mark loan repaid → `repaid_at` set, status → `repaid`

**Security / legal posture:** every loan PDF is the legal defense against tax-audit interpretations of cross-project funding as embezzlement. Without this audit trail the practice is dangerous; with it, it is standard internal-accounting hygiene.

**RLS:** `internal_loans` admin-only.

#### 7.5 Overhead allocation — proxy formula, no timesheet (REQ-FIN-13)

**Constraint:** PRD §4.17 forbids time tracking at any granularity. Yet project P&L Final (REQ-FIN-06) requires per-project overhead allocation. Resolved with a proxy formula based on existing task activity windows.

**Formula (per project, per month):**
```
project_active_user_days(P, M) = Σ_{user u, day d in M}
                                 ⟦ ∃ task t : project=P, assignees ∋ u,
                                   start_date ≤ d ≤ deadline,
                                   status ∉ {Tamamlandı, Cancelled} on d ⟧

firm_active_user_days(M) = Σ_{all projects P} project_active_user_days(P, M)

allocation_share(P, M) = project_active_user_days(P, M) / firm_active_user_days(M)

monthly_overhead(M) = Σ(salaries effective in M) + Σ(recurring_expenses materialized in M)
                     + Σ(one-off expenses with category='overhead' in M)

allocated_overhead(P, M) = monthly_overhead(M) × allocation_share(P, M)
```

A monthly `pg_cron` job (1st of every month for the prior month) writes `project_overhead_allocations` rows. `formula_version` integer allows future formula revisions without rewriting history.

**Accuracy expectation:** ~60–70%. MIRAI compares allocations against actual project income trajectories quarterly; if a single project's allocated overhead ratio diverges >25% from a peer of similar duration, surfaces "Bu layihənin overhead-ı qeyri-adi" alert for admin review.

**Override:** admin may manually set a project's monthly allocation in the P&L drawer; manual overrides flagged in UI and stored with `override_reason`.

#### 7.6 Minimum runway & burn rate (REQ-FIN-14)

Cash Cockpit displays a runway gauge:

```
⚠️ Min. tələb (3 ay runway): ₼210K → Status: ⚠️ Diqqət
```

**Computation:**
```
avg_monthly_burn = AVG(monthly_overhead) over last 6 months
min_runway_required = avg_monthly_burn × 3
runway_months = current_total_balance / avg_monthly_burn

Status:
  ≥ 3 months  → 🟢 Sağlam
  2–3 months  → 🟡 Diqqət
  < 2 months  → 🔴 Kritik
```

Fewer than 6 months of history → status disabled with message "Burn rate hesablaması üçün 6 aylıq tarixçə lazımdır".

#### 7.7 Forecast — explicit formula (REQ-FIN-15)

```
forecast_balance(date) =
    current_total_balance
  + Σ(expected_incomes ⋅ confidence)         [pipeline + receivables, by due_at ≤ date]
  − Σ(reflect_overhead)                       [monthly_overhead × months_until_date]
  − Σ(outsource_planned)                      [outsource_items unpaid, by deadline ≤ date]
  − Σ(one_time_planned)                       [scheduled one-off expenses by date]
```

`expected_incomes` come from receivables AND from CRM pipeline rows weighted by stage confidence:

| Source | Confidence |
|---|---|
| Müqaviləli + avans alınmış (receivable, paid_amount > 0) | 95% |
| Müqaviləli, avans yox (receivable, paid_amount = 0) | 75% |
| CRM stage = İcrada | 60% |
| CRM stage = Təklif / İmzalanıb | 30% |
| CRM stage = Lead | 10% |

#### 7.8 Forecast UI (REQ-FIN-16)

Two-line area chart:
- **Confident line** (solid) — only sources ≥ 90% confidence
- **Optimistic line** (dashed) — all sources at full confidence
- Area between the two lines shaded in `--color-warning-bg` = "risk zone"

Horizon tabs: 30 / 90 / 365 days. Refresh button rate-limited 1×/24h per user (US-FIN-07).

#### 7.9 Monthly forecast calibration (REQ-FIN-17)

End-of-month `pg_cron` compares the forecast generated at month-start vs. actual month-end balance per source bucket. Calibration outputs:

- `forecast_calibration_log` row per (month, confidence_tier) recording predicted vs actual
- If a confidence tier consistently over/under-shoots by >15% across 3 consecutive months, MIRAI proposes a confidence adjustment to admin (e.g. "İcrada confidence 60% → 55% tövsiyə olunur, son 3 ayın faktiki nəticəsinə əsasən")
- Admin one-click accepts → confidence tier updated for future forecasts

#### 7.10 Token Counter Dashboard widget (REQ-FIN-18)

A widget rendered in Maliyyə Mərkəzi → Cash Cockpit (admin only) showing real-time MIRAI usage and spend:

- This-month spend vs budget bar (color-coded at 80% / 100%)
- Per-persona breakdown (CFO / HR / COO / CCO / CMO / Strateq / Hüquqşünas / Layihə Mühəndisi — see §7.2)
- Per-user spend (admin sees firm-wide; helps spot runaway loops or expensive prompts)
- Sparkline of daily token usage (last 30 days)
- Alerts: 80% → yellow banner, 100% → red banner + "MIRAI bu ay üçün limitə çatdı"

Backed by aggregations over `mirai_usage_log`.

#### 7.11 AZ legal audit chain (REQ-FIN-19)

Every financial action that may be questioned by AZ tax authorities — internal loans, manual cash adjustments, signature on outsource delivery PDF — captures a defense bundle:

```
audit_chain {
  ip_address text,           -- HTTP request IP at action time
  user_agent text,           -- browser/client identification
  occurred_at timestamptz,   -- server time
  actor_email text,          -- snapshot of profile email (not FK — preserved)
  signature_data jsonb,      -- canvas-captured signature data + email confirmation token
  email_confirmation_id text -- optional: separate email token confirming the action
}
```

Stored on the relevant row (e.g. `internal_loans.audit_chain jsonb`, `outsource_items.delivery_audit_chain jsonb`). Canvas signature alone is weak evidence; combined with IP + timestamp + actor email + an email-confirmation token sent to the admin's recorded address, the bundle reaches "satisfactory commercial evidence" threshold under AZ Civil Code Art. 405 (electronic transactions).

#### 7.12 RLS

- `incomes`, `expenses`, `outsource_items`, `receivables`, `cash_forecasts`, `cash_balances`, `cash_snapshots`, `internal_loans`, `project_overhead_allocations`: admin only
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
- `performance_reviews` (id, employee_id, year, score, ratings jsonb, reviewer_id, summary, published_at NULL, published_by NULL)

**Visibility (REQ-PERF-01):**
- **Admin** sees all reviews (published or draft) in real time across every employee and year
- **Employee** sees their own review **only when `published_at IS NOT NULL`**. Draft reviews are invisible during the year
- An employee who has worked 3 years sees 3 published reviews (one per year), so long as the admin has clicked "Yayımla" on each. Unpublished years simply don't appear
- **Year-end publish flow:** admin opens Performans → selects year → reviews scores → clicks "Yayımla" → `published_at = now()`, `published_by = admin.id`. From that moment the employee can view it; an in-app + Telegram notification fires
- **Unpublish:** admin may revoke publication (sets `published_at = NULL`); logged in `audit_log`
- **HR persona summary** (PRD §7.2) operates on the live data regardless of `published_at`; admin can preview the not-yet-published summary before deciding to publish

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
**Admin (8):** Əməliyyat Direktoru (COO) / Layihə Mühəndisi / Hüquqşünas (RAG) / Marketinq Direktoru (CMO) / Maliyyə Analitiki (CFO) / Strateq / İK Direktoru (HR) / **Kommunikasiya Direktoru (CCO)**.
**User (2):** **Komanda Köməkçisi (Memarlıq)** / **Komanda Köməkçisi (Ümumi)**.

**User personas detail:**
- **Komanda Köməkçisi (Memarlıq):** AZDNT normativ axtarışı, ekspertiza qaydaları, məsafələr, AZ tikinti hüquqları, çertyoj standartları. Backed by Bilik Bazası RAG (PRD §10.18 Bilik Bazası). May analyze user-uploaded ZIP/PDF files (10 MB per file, 25 MB per ZIP — REQ-MIRAI-ARCH-01 below). Mode toggle: AZ-fokus (default) / Global. AZ mode prioritizes AZDNT + AZ Civil Code chunks; Global mode allows international references (RIBA, IBC, Eurocode).
- **Komanda Köməkçisi (Ümumi):** task / project / calendar köməkçi. "Mənim bu həftə tapşırıqlarım nədir?", "X layihəsinin son aktivlikləri", "Sabah hansı görüşlərim var?" type queries. No Bilik Bazası RAG; uses scoped tools per RLS.

**Switching:** user toggles via the same persona pill switcher (PRD §10.19 design). Conversation context resets between user personas (consistent with admin behaviour).

**Kommunikasiya Direktoru (CCO) responsibilities:**
- Drafts all client-facing written communication: emails to clients, proposal cover letters, retrospective survey invites, official letters (rəsmi məktub), award application narrative texts
- Native polyglot: AZ (default), EN, RU, TR — auto-detects target language from client profile
- Tone calibration per recipient: formal for governmental/expertise correspondence, warm-professional for commercial clients, concise for outsource vendors
- Drafts only — never sends. Admin reviews + edits + sends manually
- CCO has SELECT on `clients`, `client_interactions`, `project_documents` (admin scope) — never exposed to non-admin users via persona switch (RLS enforced).

Persona switch starts a new conversation context; history not carried across personas.

**İK Direktoru (HR) responsibilities:**
- Monthly performance summary per employee (aggregates `activity_log` entries respecting `is_blame_excluded`, surfaces in admin dashboard and Performans page — Module 8.3)
- Sample monthly summary output:
  ```
  🤖 MIRAI HR — Aydan üçün ay yekun analizi:
  Bu ay 5 tapşırıq deadline-dan keçib, AMMA:
    ✓ 3-ü "sifarişçi gecikdi" kateqoriyasında (excluded)
    ✓ 1-i outsource Tek-Strukt-un günahı (excluded)
    ✗ Yalnız 1-i Aydanın özü ilə bağlı
  Yenidən hesablanmış score: 92/100 (yüksək)
  ```
- Career path nudges (when user near next level criteria — Module 9.2)
- Birthday / anniversary reminders to admin
- HR persona has SELECT on `profiles`, `salaries` (admin-context only), `performance_reviews`, `activity_log` — never exposed to non-admin users via persona switch (RLS enforced).

### 7.3 Privacy Filter (mandatory, DB-level)
Every MIRAI tool call wraps the user's session JWT and queries via Supabase with that JWT. RLS enforces scope. The application layer additionally:
- Strips financial figures from any non-admin context
- Removes other-user PII unless admin
- Logs `tools_used` per message for audit

**Refusal tone (mandatory voice rule):** when a non-admin asks a financial / salary / budget / outsource-payment question, MIRAI declines with a culturally-warm, lightly-satirical AZ tone — never robotic. Reference template:

> *"Hörmətli istifadəçi, maliyyə məlumatlarımız korporativ məxfilik qaydalarımıza tabedir — Reflect-də belə suallar etik sayılmır 😊 Sahə eksperti kimi memarlıq sualınız varsa, məmnuniyyətlə cavablandırım!"*

The wording may vary across responses (MIRAI rephrases to avoid mechanical repetition) but **must** preserve: politeness, light humor, an offer to help on architectural topics. Never shame the user. Never expose which tool was denied. Auditable via `tools_used` in `mirai_messages`.

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

#### 7.6.1 Mandatory cost optimizations

Implementation MUST include all 10 of the following. Each is enforceable via CI / monitoring; absence = bug.

1. **Prompt caching** — Anthropic's `cache_control` markers on every system prompt block; ~90% discount on cached input tokens. Target cache hit rate ≥ 70%.
2. **Smart context pruning** — only inject the schema/data fields required for the current question. Persona-specific allow-lists in `mirai/context-rules.ts`.
3. **Rate limiting** — admin: 100 messages/day, user: 30 messages/day (per-user, rolling 24h). Enforced via Upstash Redis sliding window.
4. **Cached reports** — identical question text from same user within 24h → return cached response without LLM call. Hashed by `(user_id, prompt_hash, persona)`.
5. **Batch endpoint** — proactive analyses (Smart Reminder, monthly performance summary, forecast generation) use Anthropic Batch API (50% discount, async). Real-time chat stays on streaming endpoint.
6. **Session compression** — once a conversation reaches 10 messages, MIRAI summarizes the first half into a 1-paragraph context block; older messages dropped from prompt.
7. **Local heuristics first** — simple data lookups ("How many open tasks do I have?") run pure SQL via the tool layer without invoking the model; LLM only for synthesis.
8. **Monthly hard budget** — env var `MIRAI_MONTHLY_BUDGET_USD` (default 25); reaching it disables ALL non-creator chat (cron + Smart Reminder also paused). Alerts admin at 80%.
9. **Token counter dashboard** — real-time usage widget in Maliyyə Mərkəzi (REQ-FIN-18). Per-persona, per-user, per-day visibility.
10. **Free fallback** — when monthly budget hard limit is hit OR Anthropic API returns 5xx, MIRAI transparently falls back to Groq's `llama-3.3-70b` free tier for the remainder of the month / outage. Quality drop announced via small banner: "🔄 Pulsuz model rejimi — keyfiyyət bir az aşağı ola bilər". Functional parity for chat; RAG and tools remain operational with reduced reasoning.

#### 7.6.2 Telegram message generation policy

Telegram delivery is **template + cron** by default — not MIRAI-generated — for reliability, cost, and audit clarity. Reasons (PM rationale): cron is deterministic, free, easy to test; LLM-generated messages introduce latency, hallucination risk, and per-message cost.

**Hybrid exception:** the following high-stakes messages MAY be MIRAI-rewritten for tone:
- HR monthly performance summary (Module 8.3)
- Privacy refusal in chat (PRD §7.3)
- CMO weekly Elanlar feed posts (§7.8)
- Cross-project loan proposals (REQ-FIN-12)

All other Telegram traffic — deadline reminders, mention notifications, finance alerts, Smart Reminder, daily 09:00/18:00 summaries — uses fixed templates from `locales/az.json` filled in by cron, never MIRAI-generated.

### 7.7 Context Engine
System prompt injects: today's date (Asia/Baku), user role, active projects (names+phases+deadlines), open task count, persona-specific extras.

### 7.8 CMO → Elanlar Cron
Weekly Vercel cron: fetch ArchDaily / Dezeen / Architizer / WAF RSS + award calendars → MIRAI CMO summarizes & filters (architecture + AZ/regional relevance) → inserts `mirai_feed_posts` and creates `announcements` row with `mirai_generated=true, approved=false`. Admin moderation queue gates publication.

### 7.9 Performance Tracking
- Token usage per persona per week
- Avg response latency
- Refusal rate (tool denied / over-budget)
- User satisfaction thumbs (`mirai_feedback` table)

### 7.10 File analysis — ZIP/PDF (REQ-MIRAI-ARCH-01)

Komanda Köməkçisi (Memarlıq) and admin Layihə Mühəndisi accept file uploads for analysis:

- **Limits:** 10 MB per individual file, 25 MB per ZIP archive
- **Pipeline:** ZIP uploaded → server unzips into temp dir → PDFs forwarded to Anthropic Files API → MIRAI synthesizes ("Bu zip faylındakı sənədləri oxu və xülasə et")
- **Loading state:** chat input disables; bubble shows "🤖 Bu sual 30 saniyəyə qədər çəkə bilər — sənədləri oxuyur..." with progress spinner (PRD §10.19 chat UI)
- **Cleanup:** temp files deleted within 60 seconds of response delivery
- **Audit:** file hash + size + page count logged to `mirai_messages.tools_used`; PDF content NOT persisted server-side
- **Rate limit:** 5 file analyses per user per day (cost protection per §7.6.1)

### 7.11 Layihə Mühəndisi mode toggle (REQ-MIRAI-ARCH-02)

Layihə Mühəndisi (admin) and Komanda Köməkçisi (Memarlıq) (user) personas surface a mode toggle pill above the chat input:

- **🇦🇿 AZ rejimi (default):** RAG retrieval prioritizes Bilik Bazası rows where `source_pdf` matches AZDNT / AZ Civil Code / AZ tikinti normativləri. References cited with AZ section numbers ("Maddə X.Y.Z").
- **🌍 Global rejimi:** broadens RAG to international references (if uploaded), permits answers without AZ-specific source citations. Useful for design philosophy, parametric design, sustainability frameworks.

Mode toggle is per-conversation; switching re-runs RAG with new bias.

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
- **AZ legal audit chain (REQ-FIN-19):** for any financial action that may face tax-authority scrutiny (internal loans, manual cash adjustments, signed outsource delivery PDFs), capture an evidence bundle (`audit_chain jsonb`) on the row: `ip_address`, `user_agent`, `occurred_at` (server time), `actor_email` (snapshot, not FK), `signature_data` (canvas), and an optional email-confirmation token. Canvas signature alone is weak evidence under AZ Civil Code Art. 405; the bundle reaches "satisfactory commercial evidence" threshold.
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
- Time tracking of any kind (no timesheet at task, day, or any other level — `estimated_duration` is gün/həftə only; no actual-time logging)
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

## 13. User Stories (Given/When/Then)

> Format: PRDold v2.0 compatible (`US-<MODULE>-NN`) with explicit Given/When/Then acceptance criteria. Each story cross-references the requirement IDs from §5. Stories are the source of truth for QA test cases.

### MODULE 1 — Auth (refs REQ-AUTH-01..03)

```
US-AUTH-01  Login with email + password
AS A team member
I WANT to log in with email and password
SO THAT I access the platform securely

Given valid credentials
  When I submit the login form
  Then I am redirected to my role-appropriate Dashboard within 500ms
  And my session is persisted for 7 days

Given invalid credentials
  When I submit
  Then an inline error appears under the password field
  And no Dashboard data is fetched

Given 5 failed attempts in 15 minutes from one IP
  When I retry
  Then I receive HTTP 429 with retry-after header
```

```
US-AUTH-02  Creator invites a team member
AS A creator
I WANT to invite a team member by email + role
SO THAT I control who accesses the platform

Given I am authenticated as Creator/Admin
  When I submit "Dəvət et" with email + role
  Then an invitation row is created with token + 48h expiry
  And the invitee receives a magic-link email
  And the pending invitation is listed in the admin panel

Given a pending invitation
  When I click "Revoke"
  Then the token is invalidated
  And subsequent magic-link clicks return "invitation expired"
```

```
US-AUTH-03  Reset forgotten password
AS A team member
I WANT to reset my password via email
SO THAT a forgotten password is not a blocker

Given I click "Şifrəni unutdum" and submit my email
  When the email exists in profiles
  Then a Supabase magic-link is dispatched (≤10s)
  And the response is identical (200) regardless of email existence (no enumeration)
  And the link expires in 30 minutes
```

```
US-AUTH-04  Update profile
AS A user
I WANT to edit my avatar, name, and locale
SO THAT my identity reflects me

Given I am on Profile
  When I update locale to "en"
  Then UI strings switch to English without a full reload
  And my role/email fields remain read-only
```

---

### MODULE 2 — Dashboard (refs REQ-DASH-01..05)

```
US-DASH-01  Director sees firm health at a glance
AS A studio director
I WANT to see active project health on Dashboard
SO THAT I catch risks early

Given I am admin and 5 projects are active
  When Dashboard loads
  Then I see each project with phase badge, completion %, deadline color (green ≥14d / amber <14d / red <3d or overdue)
  And clicking a project opens its detail page
  And empty state shows "Aktiv layihə yoxdur — Yeni layihə yarat" CTA when none exist
```

```
US-DASH-02  Member sees own work for today / this week
AS A team member
I WANT to see my tasks due today and this week
SO THAT I know what to work on

Given I have 12 open tasks
  When I open Dashboard with the "Bu gün" tab
  Then only tasks where deadline = today appear
  And overdue tasks render at the top in red
  And "Bu həftə" tab shows tasks where deadline ≤ end of week

Given I tick a task as Tamamlandı from Dashboard
  When the API succeeds
  Then the row removes with animation
  And an activity_log entry is emitted
```

```
US-DASH-03  Finance snapshot for current month
AS A finance manager
I WANT this-month income vs expense in one place
SO THAT I track liquidity daily

Given I am admin
  When Dashboard loads
  Then I see Gəlir / Xərc / Balans as tabular numerals
  And a trend indicator vs last month (↑/↓ + %)
  And clicking the widget navigates to Maliyyə Mərkəzi

Given I am a non-admin user
  When the Dashboard renders
  Then the finance widget is absent (RLS returns 0 rows; UI hides widget entirely)
```

```
US-DASH-04  Live activity feed
AS A studio director
I WANT a live activity feed without refreshing
SO THAT I stay informed passively

Given activity_log has 50 recent entries
  When Dashboard renders
  Then the feed shows the latest 50 with avatar, action, entity link, relative timestamp
  And filter pills (All/Tasks/Projects/Finance/Clients) work client-side
  And new entries appear at top via Realtime within 500ms p95
```

```
US-DASH-05  Team workload overview
AS A team lead
I WANT to see each team member's open task load
SO THAT I redistribute before burnout

Given the team has 8 members
  When I open the workload widget
  Then each member shows avatar + name + open task count
  And the bar is green (1–5), amber (6–9), red (10+)
  And clicking a member filters Tapşırıqlar to their assignments
```

---

### MODULE 3 — Layihələr (refs REQ-PROJ-01..06)

```
US-PROJ-01  Create a new project
AS AN architect
I WANT to create a project with all key details
SO THAT the team has one source of truth from day one

Given I open "Yeni Layihə"
  When I submit name, client, ≥1 phase, deadline
  Then the project is created with phases[] populated
  And it appears in the grid with entrance animation
  And requires_expertise + expertise_deadline + payment_buffer_days are stored if provided

Given I leave required fields empty
  When I attempt save
  Then field-level validation prevents submission
```

```
US-PROJ-02  Backward-planned expertise timeline
AS A project architect
I WANT a calculated design deadline when expertise is required
SO THAT I know the real internal cutoff

Given requires_expertise = true and expertise_deadline = 2026-06-30
  When the project loads
  Then design_deadline = 2026-06-30 − 10 (payment) − 30 (expertise) − 10 (revision) − 3 (print) = 2026-05-08
  And a red banner appears if design_deadline is < 14 days away
  And a timeline visualization shows each subtraction step
```

```
US-PROJ-03  Closeout checklist
AS A studio director
I WANT a closeout checklist when finishing a project
SO THAT nothing is missed

Given a project with status = active
  When I click "Layihəni Bağla"
  Then a drawer opens with default items (akt / final sənədlər / arxiv / portfel / retrospektiv sorğu)
  And each item is checkable inline
  And "Layihəni Tamamla" activates only when all are checked

Given all items are checked and I confirm
  When the API succeeds
  Then project.status = 'closed'
  And a portfolio_workflows row is created
```

```
US-PROJ-04  Submit to architecture awards
AS A studio director
I WANT to submit completed projects for awards
SO THAT I don't miss application deadlines

Given a closed project
  When I open Portfolio
  Then system_awards are listed and filterable by deadline_month
  And selecting awards saves to portfolio_workflows.selected_awards
  And per-award checklists track application progress
  And deadline indicator shows "Ağ Xan mükafatı — Mart (12 gün qaldı)"
```

```
US-PROJ-05  Reopen a closed project (admin)
AS A studio director
I WANT to reopen a closed project
SO THAT I correct mistaken closures

Given a project with status = 'closed' and I am admin
  When I click "Yenidən aç"
  Then project.status = 'active'
  And reopened_at timestamp is set
  And an activity_log entry is created
```

---

### MODULE 4 — Tapşırıqlar (refs REQ-TASK-01..09)

```
US-TASK-01  Create task with quick or full form
AS A project architect
I WANT to create tasks fast or in detail
SO THAT capture friction is minimal

Given I click "+" in the İcrada column
  When I type a title and press Enter
  Then a task is created in İcrada with creator = me

Given I open the full-create modal
  When I submit title + assignees + project + deadline + estimate + risk_buffer
  Then workload = estimated_duration × (1 + risk_buffer_pct/100) is computed
  And workload_calculated_at is stamped
```

```
US-TASK-02  Drag task between status columns
AS A team member
I WANT to drag tasks between status columns
SO THAT updates are instant and visual

Given a task in İcrada
  When I drag to Yoxlamada and drop
  Then status updates to Yoxlamada
  And task_status_history + activity_log entries are created
  And other users on the same project receive Realtime update ≤500ms p95
```

```
US-TASK-03  Cancel a task with reason
AS A team member
I WANT to cancel a task with a reason
SO THAT historical context is preserved

Given I drag a task to Cancelled
  When the cancel dialog opens
  Then I must select from [Müştəri imtina etdi | Layihə dəyişdi | Texniki problem | Yenidən planlaşdırılır | Digər]
  And "Digər" requires a free-text reason
  And confirming sets status='Cancelled' and cancel_reason saved
  And the card is grayed visually
```

```
US-TASK-04  Subtask blocks parent completion
AS A project architect
I WANT parent tasks to wait for their subtasks
SO THAT incomplete work isn't marked done

Given a parent task with 2 open subtasks
  When I drag the parent to Tamamlandı
  Then a blocking modal lists the open subtasks
  And the parent stays in its current status
  And a "Hamısını tamamla" shortcut closes all children atomically
```

```
US-TASK-05  Mention a teammate in a comment
AS A team member
I WANT to @mention teammates in comments
SO THAT they are notified

Given I type "@" in a task comment
  When I select a teammate
  Then the comment body stores "@<userId>" format
  And mentions[] is populated server-side
  And the mentioned user receives in-app + Telegram (if linked) notification
```

```
US-TASK-06  My tasks focused view
AS A team member
I WANT a "Mənim Tapşırıqlarım" view
SO THAT I'm not overwhelmed by the team backlog

Given I open the personal view
  When tasks load
  Then they are filtered to assignee_ids contains auth.uid()
  And grouped: Overdue (red, top) / Today / This Week / Later
  And inline status update is supported (checkbox for Tamamlandı, dropdown for others)
```

```
US-TASK-07  Bulk archive completed and cancelled
AS A studio director
I WANT to archive done/cancelled tasks in one action
SO THAT the board stays clean

Given the board has 30 tasks in Tamamlandı or Cancelled
  When I click "Arxivlə" and confirm
  Then archived_at = now() is set on all 30
  And they disappear from the board
  And the Arxiv module shows them with restore option for admin
```

```
US-TASK-08  Expertise auto-subtasks (refs REQ-TASK-09)
AS AN architect
I WANT the standard expertise chain auto-created
SO THAT I never miss a step on a regulated project

Given I create a task with is_expertise_subtask = true on a project where requires_expertise = true
  When I save
  Then 5 child subtasks are auto-inserted with calculated dates per backward planning:
    □ Ekspertiza üçün çap sənədlərinin hazırlanması (3 gün)
    □ Ekspertizaya göndərmək (1 gün)
    □ Ekspertiza cavabı gözləmə (30 gün)
    □ İrad düzəltmə buffer (10 gün)
    □ Son təsdiq alınması
  And each subtask carries the purple "E" badge marker
  And I may uncheck the auto-generation toggle to disable
```

```
US-TASK-09  Cancel revert (refs REQ-TASK-04a)
AS AN admin or assignee
I WANT to undo a cancellation
SO THAT a wrong cancel isn't permanent

Given a task with status = 'Cancelled' and cancel_reason = 'Yenidən planlaşdırılır'
  When I click "Ləğvi geri qaytar"
  Then status restores to its prior value from task_status_history
  And cancelled_at clears
  And cancel_reason archives to history
  And an activity_log entry of action='cancel_reverted' is emitted
```

```
US-TASK-10  Delete task or subtask (refs REQ-TASK-10a)
AS AN admin or task creator
I WANT to delete a task or any of its subtasks
SO THAT mistaken or duplicate work disappears from the board

Given a task with 3 subtasks and I am the creator
  When I delete the parent
  Then deleted_at is set on the parent
  And deleted_at is cascaded to each child
  And each deletion (parent + each child) emits its own activity_log entry of action='deleted'
  And the parent's activity feed shows every removed subtask line
  And rows are recoverable from Arxiv by admin within 90 days

Given I delete a single subtask
  When I confirm
  Then deleted_at is set on that row only
  And an activity_log entry shows under the parent task's history
```

```
US-TASK-11  Cross-module task hub (refs REQ-TASK-11)
AS A team member
I WANT every accountability assigned to me to appear in "Mənim Tapşırıqlarım"
SO THAT nothing falls through cracks across leave / portfolio / closeout / followup

Given a portfolio submission deadline is added on a closed project
  When the system creates the task
  Then a tasks row is inserted with task_kind='portfolio', source_entity_type='portfolio_workflows', source_entity_id={pw.id}
  And the assigned owner sees it in "Mənim Tapşırıqlarım" with 🏆 badge
  And dashboard "Yaxınlaşan deadline" widget includes it
  And Telegram D-3 / D-1 / D reminders fire per US-TG-02

Given the task is moved to Tamamlandı
  When status updates
  Then a DB trigger updates the source row (portfolio_workflows.status='submitted')

Given a leave_requests row is inserted
  Then a tasks row with task_kind='leave_approval' is auto-created assigned to the requester's manager
  And only the manager and admin can SELECT this row (RLS)
  And on Tamamlandı the leave_request row's status flips to 'approved'
```

```
US-TASK-12  Priority sort in My Tasks (refs REQ-TASK-12)
AS A team member
I WANT to see urgent tasks first
SO THAT I work the right things

Given I have 12 open tasks across all priorities
  When I open Mənim Tapşırıqlarım
  Then they sort by priority (urgent → high → medium → low) then by deadline ASC
  And each card shows a left-edge color tick (red urgent / orange high / blue medium / gray low)
  And changing priority via card menu updates sort within 200ms
```

```
US-TASK-13  Time-of-day deadline (refs REQ-TASK-13)
AS A team member
I WANT to set a deadline at a specific hour
SO THAT same-day urgent work is supported

Given I create a task with deadline date = today and time = 17:00 Asia/Baku
  When the time reaches 15:00 Asia/Baku (T-2h)
  Then I receive an extra Telegram + in-app reminder
  And the task card displays "Bugün 17:00" instead of just the date
```

```
US-TASK-14  Tags on tasks and subtasks (refs REQ-TASK-14)
AS A studio director
I WANT to label tasks and subtasks with reusable tags
SO THAT cross-cutting categorization is searchable

Given I open a task or subtask edit modal
  When I open the tag chip picker
  Then I can pick from existing task_tags rows (admin-defined) or quick-create a new one
  And selected tags persist via task_tag_assignments
  And the tag chips render on the kanban card and in the table view tag column
  And filtering Kanban / Cədvəl / Mənim Tapşırıqlarım by tag narrows the view
```

```
US-TASK-15  Auto Planner backward dates (refs REQ-TASK-15)
AS AN architect
I WANT MIRAI to suggest dates by working backwards from project deadline
SO THAT I plan around expertise lead time

Given I create a task on a project where requires_expertise = true and deadline = 15 Aug
  When the create modal opens
  Then start_date and deadline fields are prefilled with backward-planned dates:
    expertise_final = 5 Aug (15 Aug − 10 day payment buffer)
    expertise_submit = 12 Jun (5 Aug − 30 review − 10 revision − 3 print)
    design_final = 9 Jun
  And I can override before saving
  And a banner shows "MIRAI hesablamasıdır — düzəliş edə bilərsiniz"
```

```
US-TASK-16  Task dependency blocks transition (refs REQ-TASK-16)
AS A project architect
I WANT a task to be blocked until its predecessors are done
SO THAT sequence integrity is enforced

Given Task B has a finish_to_start dependency on Task A and A is in İcrada
  When I drag B from Başlanmayıb to İcrada
  Then a blocking modal lists "Bu tapşırıq A bitənə kimi başlaya bilməz"
  And B remains in Başlanmayıb
  And B's card shows a "↳ 1 blocking" badge

Given A is moved to Tamamlandı
  When the realtime event fires
  Then B's blocking badge clears
  And B can be transitioned freely
```

```
US-TASK-17  Stage templates seed project phases (refs REQ-TASK-17)
AS AN architect
I WANT project phases prefilled by project type
SO THAT I don't recreate the same stages each time

Given I create a project and select project_type = 'residential'
  When the form renders
  Then phases[] prefills from stage_templates: Konsept / Eskiz / İşçi / Ekspertiza / Müəllif nəzarəti
  And default_duration_weeks per stage is shown next to each
  And admin can edit templates in Sistem → Şablonlar
```

```
US-TASK-18  Proposal includes expertise lead time (refs REQ-TASK-18)
AS A BD lead
I WANT proposals for expertise-required projects to surface the full lead time
SO THAT clients have realistic delivery expectations

Given I generate a proposal for a project with requires_expertise = true
  When the preview renders
  Then "Çatdırılma müddəti" includes line items:
    Ekspertiza paketi: 3 gün
    Ekspertiza gözləmə: 30 gün
    İrad düzəltmə buffer: 10 gün
    Son təsdiq + ödəniş buffer: 10 gün
  And the cumulative weeks total is highlighted
```

```
US-TASK-19  Blame-excluded delays don't hurt performance (refs REQ-TASK-19, REQ-TASK-20)
AS A studio director
I WANT delays caused by clients or outsource vendors excluded from team performance
SO THAT scores reflect actual employee accountability

Given a comment on a task contains "sifarişçi gecikdirdi"
  When MIRAI scans new comments (cron 5 min)
  Then a proposal is surfaced to admin: "is_blame_excluded suggested for this delay"
  And admin clicks "Təsdiq" to flag the activity_log entry
  And subsequent monthly performance score for the assignee excludes this delay

Given admin manually clicks "Performansa təsir göstərməsin" on any activity entry
  Then is_blame_excluded = true is set
  And the change is itself logged in audit_log
```

```
US-TASK-20  Daily 09:00 / 18:00 notifications (refs REQ-TASK-21)
AS A team member
I WANT a morning summary and an evening motivation
SO THAT my day is bookended with clarity

Given I am opted into morning_summary
  When the 09:00 Asia/Baku cron runs
  Then I receive an in-app + (if linked) Telegram message containing:
    today's tasks (deadline = today)
    this week's tasks count
    today's calendar events
    a rotating motivational quote
  And the same content respects my notification_preferences

Given I am opted into evening_motivation
  When the 18:00 Asia/Baku cron runs
  Then I receive a summary of today's completed tasks + closed subtasks + comments authored
  And a different rotating quote
```

```
US-TASK-21  Activity log archive after 12 months (refs REQ-TASK-22)
AS THE platform
I WANT activity_log rows older than 12 months to migrate to archive
SO THAT default queries stay fast at scale

Given activity_log has 200,000 rows over 18 months
  When the monthly pg_cron runs
  Then rows older than 12 months copy to activity_log_archive
  And the source rows are removed in the same transaction
  And admins can query the archive explicitly from Sistem → Audit
```

```
US-TASK-22  MIRAI Smart Reminder elapsed-vs-estimate (refs REQ-TASK-23)
AS A team member
I WANT MIRAI to nudge me when calendar time is running out vs my estimate
SO THAT I either accelerate or renegotiate the deadline early

Given a task with start_date = 2026-05-01, estimated_duration = 14 days, deadline = 2026-05-15, status != Tamamlandı
  When the hourly cron runs on 2026-05-13 (12 days elapsed = 86% of estimate, deadline in 48h)
  Then MIRAI sends an in-app + Telegram (if linked) message:
    "Aydan, sənin Bilgə Qrup tapşırığın sabah deadline-da. Estimated 2 həftə idi, indi 13 gün keçib. Yetişəcəkmi?"
  And the message respects notification_preferences (channel + smart_reminder event_kind)
  And rate limit: max 1 reminder per task per 24h
  And user dismiss → 48h silence on that task
  And no actual time tracking is collected (calendar elapsed only — see §4.17)
```

---

### MODULE 5 — Arxiv (refs REQ-ARC-01..03)

```
US-ARC-01  Browse archived work
AS A team member
I WANT to browse archived tasks and projects
SO THAT I find historical context

Given I open Arxiv
  When the page loads
  Then I see tasks with archived_at IS NOT NULL plus closed projects
  And filters work by project / assignee / date range / status
  And as a non-admin I see only my own archived items
```

```
US-ARC-02  Restore archived item
AS A studio director
I WANT to restore an archived item
SO THAT mistakes are recoverable

Given an archived task and I am admin
  When I click "Restore"
  Then archived_at = NULL
  And the task reappears on the kanban
  And an activity_log entry records the restoration
```

---

### MODULE 6 — Müştərilər (refs REQ-CRM-01..07)

```
US-CRM-01  Track clients through pipeline
AS A BD lead
I WANT to drag clients across pipeline stages
SO THAT I know where each deal stands

Given a client at Müzakirə (50%)
  When I drag to İmzalanıb (75%)
  Then client_stage_history records (from='Müzakirə', to='İmzalanıb', changed_by=me)
  And confidence_pct updates to 75%
  And pipeline value totals refresh per stage

Given I drag to Udulan
  When the dialog opens
  Then lost_reason is required before save
```

```
US-CRM-02  Quick interaction log
AS A BD lead
I WANT to log a client interaction in under 30 seconds
SO THAT the CRM stays current

Given I open a client detail panel
  When I type a note + select type (Zəng/Email/Görüş/WhatsApp) + submit
  Then a client_interactions row is inserted with logged_by=me
  And the feed refreshes inline (no page reload)
  And clients.last_interaction_at updates
```

```
US-CRM-03  AI-enriched ICP fit
AS A studio director
I WANT MIRAI to score each client's ICP fit
SO THAT I prioritize high-value relationships

Given a client with ≥3 interactions and project history
  When I click "AI analiz"
  Then "AI is thinking..." state appears
  And within 10s ai_icp_fit ∈ {Excellent/Good/Medium/Low} is saved
  And ai_icp_calculated_at stamps the run
  And subsequent calls are throttled to 1×/24h per client
```

```
US-CRM-04  Slide-in detail panel
AS A BD lead
I WANT a slide-in panel for client details
SO THAT I don't lose the pipeline context

Given I click a client card
  When the panel opens from the right
  Then the pipeline view stays visible behind it
  And tabs: Overview / Interactions / Proposals / Projects / Documents work without full nav
  And Esc closes the panel
```

```
US-CRM-05  Generate a proposal linked to client
AS A BD lead
I WANT to create a proposal from the client panel
SO THAT proposals stay linked to the relationship

Given a client and I click "Təklif yarat"
  When I fill the form and save
  Then a project_documents row is created with category='price_protocol' and client_id linked
  And share_token is generated
  And proposal status = 'Draft'
  And "Linki paylaş" copies app.domain/docs/<share_token> to clipboard
```

```
US-CRM-06  Send retrospective survey on closeout
AS A studio director
I WANT to send NPS surveys after project completion
SO THAT I collect satisfaction data

Given a project closeout completes
  When I click "Sorğu göndər"
  Then a retrospective_surveys row is created with share_token
  And the client receives an email with the link
  And the public form (no auth) accepts NPS 0–10 + per-category 1–5 + comment
  And on submit responded_at + nps_score are saved
  And admin Dashboard updates average NPS
```

```
US-CRM-07  Pipeline transition gating (refs REQ-CRM-01)
AS A BD lead
I WANT mandatory fields per stage transition
SO THAT pipeline data is auditable, not aspirational

Given I drag a client from Lead to Təklif
  When the transition modal opens
  Then I must enter proposal_sent_at AND proposal_amount > 0
  And on save the values persist to client_stage_history.transition_payload
  And confidence_pct updates to 30%

Given I attempt to drag from Lead directly to İmzalanıb (skipping Təklif and Müzakirə)
  Then a blocking modal lists skipped stages
  And as a non-admin I see only "Geri qayıt"
  And as admin I see "Override (səbəb məcburi)" — entering a reason logs it to audit_log

Given I drag to İmzalanıb → İcrada with advance_amount=15000
  Then advance creates an incomes row + receivable
  And cash_balances bank/kassa row is offered as target (REQ-FIN-10)
```

```
US-CRM-08  Document share token logs every view (refs REQ-CRM-09)
AS A studio director
I WANT to know when a client opens a shared document
SO THAT I have an auditable interest signal

Given a proposal share token at /d/{token}
  When the client opens the URL
  Then a document_views row is inserted with IP, user-agent, timestamp
  And the document drawer "Baxılma tarixçəsi" panel shows the latest 20 views

Given a Drive link wrapped in a share token
  When the client opens the URL
  Then the view is logged BEFORE the redirect to Drive

Given I revoke the token (admin)
  Then share_token = NULL
  And future opens return 410 Gone
```

```
US-CRM-09  Rəsmi məktub composer (refs REQ-CRM-10)
AS AN admin
I WANT a composer that produces a signed PDF letter
SO THAT formal correspondence is one click, not Word + Photoshop

Given I open Müştəri drawer → "✉️ Məktub yaz"
  When the composer renders
  Then the WYSIWYG editor pre-populates with selected template body
  And {{variables}} are auto-resolved from client + project context (US-CRM-12)
  And the firm logo + signature block render in the right rail preview

Given I click "PDF endir"
  Then a project_documents row is created (category='letter', source='auto_generated')
  And a share_token is issued
  And the PDF download begins

Given I click "Email göndər"
  Then Resend sends to clients.email
  And client_letters.sent_via='email', sent_at=now() are recorded
  And clients.last_interaction_at updates
```

```
US-CRM-10  Email BCC capture (refs REQ-CRM-11)
AS THE platform
I WANT emails BCC'd by employees to land in the right client/project record
SO THAT external correspondence isn't lost

Given employee Aydan has BCC address aydan-x7q9z@reflect-capture.app
  And she sends an email to "client@bilge-qrup.az" with BCC to her address
  When the Resend webhook posts to /api/webhooks/email-capture
  Then the AI matcher attempts client/project match
  And on confidence ≥ 0.5 a client_email_captures row is inserted
  And a project_documents row (category='email', source='email_capture') is inserted
  And clients.last_interaction_at is updated

Given AI confidence < 0.5
  Then the row is inserted with client_id=NULL
  And appears in Sistem → Email captures inbox for manual matching
```

```
US-CRM-11  Workload estimator + Net Income on proposal (refs REQ-CRM-12)
AS A BD lead
I WANT 3 timeline variants and Net Income preview before I price
SO THAT I price sustainably and don't over-commit the team

Given I am scoping a new project for a client (project_type=residential, 200m²)
  When I open the proposal calculator
  Then I see 3 variants:
    ⚡ Ən tez:    estimated_days × 0.6
    🎯 Orta:      estimated_days × 1.0
    🌿 Tam rahat: estimated_days × 1.5
  And Net Income preview shows: contract − outsource − allocated_overhead = net (with %)
  And MIRAI recommends one variant with reasoning

Given the firm load is 65%
  When the Müştərilər page header renders
  Then it shows "🟢 Komanda yükü: 65% (sağlam) — Yeni layihə qəbul edə bilirik"
```

```
US-CRM-12  Auto-archive inactive clients (refs REQ-CRM-14)
AS THE platform
I WANT clients with no activity for 6 months to auto-archive
SO THAT the active pipeline stays clean

Given a client where last_interaction_at < now() - interval '6 months'
  AND pipeline_stage NOT IN ('İcrada', 'Bitib', 'İtirildi')
  When the daily cron runs
  Then pipeline_stage = 'Arxiv', archived_at = now()
  And the row disappears from default pipeline view
  And surfaces in the Arxiv tab
```

```
US-CRM-13  MIRAI Komanda Köməkçisi (Memarlıq) with file analysis (refs REQ-MIRAI-ARCH-01, REQ-MIRAI-ARCH-02)
AS A team member
I WANT to ask AZDNT/expertise questions and analyze ZIP/PDF files
SO THAT I have a domain copilot

Given I am on persona "Komanda Köməkçisi (Memarlıq)" with mode "AZ"
  When I ask "AZDNT-yə uyğun kafe layihəsi necə olmalıdır?"
  Then RAG retrieves AZDNT chunks with high priority
  And the response cites "Mənbə: AZDNT YYYY-NN, Maddə X.Y.Z"

Given I upload a ZIP file (8 MB) with 3 PDF drawings
  When I ask "Bu sənədləri xülasə et"
  Then a loading message appears: "🤖 Bu sual 30 saniyəyə qədər çəkə bilər..."
  And the response references each PDF's contents
  And the temp files are deleted within 60s after delivery

Given I switch to mode "Global"
  When I ask the same question
  Then RAG broadens to international references (if uploaded)
  And the answer no longer requires AZ section citations
```

```
US-CRM-14  Lifetime value displayed on client header (refs §6.6)
AS A studio director
I WANT lifetime value visible at a glance per client
SO THAT I know who is strategically important

Given client Bilgə Qrup has 3 incomes summing ₼285,000
  When I open their drawer
  Then the Statistika header reads:
    Ümumi gəlir: ₼285,000
    Layihə sayı: 3
    İlk əlaqə: 2024-08
    Son layihə: 2026-04
    Ortalama layihə dəyəri: ₼95,000

Given an income is added or modified
  When the nightly cron runs
  Then clients.total_lifetime_value is recomputed
```

```
US-CRM-15  Manual email capture matching inbox (refs REQ-CRM-11)
AS AN admin
I WANT to manually match low-confidence captures
SO THAT no email is lost

Given a client_email_captures row with client_id=NULL and confidence 0.3
  When I open Sistem → Email captures
  Then I see the row with from/subject/excerpt
  And I can pick a client + project from dropdowns
  And on save the row is updated, project_documents row is moved into scope, and Kommunikasiya tabs refresh
```

---

### MODULE 7 — Maliyyə Mərkəzi (refs REQ-FIN-01..09)

```
US-FIN-01  Log income on payment receipt
AS A finance manager
I WANT to log income in seconds
SO THAT books stay current

Given I click "+ Gəlir"
  When I submit amount > 0, project, client, payment_method, date
  Then an incomes row is created
  And an activity_log entry is emitted
  And if the amount matches an open receivable, it auto-marks it paid

Given amount ≤ 0
  When I attempt save
  Then validation blocks the submission with "Məbləğ müsbət olmalıdır"
```

```
US-FIN-02  Receivable overpayment guard
AS A finance manager
I WANT the system to reject overpayments
SO THAT books don't go negative on accident

Given a receivable with amount=10000 paid_amount=8000
  When I attempt to record payment of 5000
  Then the form rejects with "Ödəniş qalıq məbləği aşır"
  And no row is written
```

```
US-FIN-03  Partial payment via markPaid
AS A finance manager
I WANT to record partial payments
SO THAT real-world payment flow is supported

Given a receivable with amount=10000 paid_amount=4000 status='partial'
  When I record an additional 3000
  Then paid_amount becomes 7000
  And status remains 'partial'
  And only at paid_amount=10000 does status flip to 'paid'
```

```
US-FIN-04  Outsource amounts hidden from non-admins
AS A non-admin team member
I WANT to see outsource items I'm responsible for, without the amount
SO THAT operational coordination works without exposing money

Given I am responsible_user_id on an outsource_items row
  When I open Outsource via the user route
  Then outsource_user_view returns project, work_title, contact_person, deadline, status only
  And money columns (amount, paid_at, payment_method) are absent from the API payload
```

```
US-FIN-05  Recurring expense generation
AS A finance manager
I WANT recurring expenses to materialize automatically
SO THAT I don't forget rent / subscriptions

Given a recurring_expenses row with period='monthly' and next_run_at = today
  When the daily pg_cron runs
  Then a new expenses row is inserted with the recurring_rule_id linked
  And next_run_at advances to the next period
  And an activity_log entry is created
```

```
US-FIN-06  Project P&L
AS A studio director
I WANT a P&L per project
SO THAT I see profitability granularly

Given a project with 3 incomes, 5 expenses, 2 outsource_items paid
  When I open Maliyyə → P&L → drill into the project
  Then I see Gəlir, Birbaşa Xərclər, Outsource, Net (tabular numerals, AZN)
  And export to xlsx is available
```

```
US-FIN-07  AI-powered cash forecast
AS A studio director
I WANT a 30/60/90-day cash forecast
SO THAT I plan hiring and expenses proactively

Given ≥6 months of historical incomes/expenses
  When I open Forecast
  Then the latest cash_forecasts row renders projected balance with confidence_low/confidence_high
  And a disclaimer "Bu proqnoz son 6 ayın məlumatlarına əsaslanır" is shown
  And "Yenilə" is rate-limited to 1×/24h per user
```

```
US-FIN-08  Generate invoice from template
AS A finance manager
I WANT to generate an invoice from a template
SO THAT it's ready in under 60s

Given a template with variables {{client_name}}, {{amount}}, {{date}}, {{services}}
  When I select a project and fill missing variables
  Then a project_documents row is saved with source='auto_generated'
  And PDF + share-token link are produced
  And invoice_number is auto-incremented per fiscal year (format AZ-YYYY-NNNN)
```

```
US-FIN-09  Bank vs Kassa balance breakdown (refs REQ-FIN-10)
AS A studio director
I WANT bank and kassa balances tracked separately
SO THAT the cockpit reflects real treasury structure

Given I have 2 bank rows (Kapital, PASHA) and 1 kassa row (main register)
  When the Cash Cockpit renders
  Then I see "🏦 Bank: ₼145,000  💵 Kassa: ₼8,500  📊 Cəmi: ₼153,500"
  And the sum of all cash_balances rows equals the displayed grand total (DB CHECK trigger)
  And "+ Gəlir" / "+ Xərc" modals require selecting a target balance row
```

```
US-FIN-10  Daily cash snapshot for history & charts (refs REQ-FIN-11)
AS A studio director
I WANT yesterday's balance preserved daily
SO THAT I can chart treasury history and answer audits

Given the snapshot cron runs at 00:05 Asia/Baku
  When today's snapshot is written
  Then a cash_snapshots row exists for today with bank_total, kassa_total, grand_total
  And cash_snapshot_mv exposes the last 90 days for the chart
  And a missed cron next-day backfills both rows (no holes in series)
```

```
US-FIN-11  Cross-project loan with audit PDF (refs REQ-FIN-12, REQ-FIN-19)
AS A studio director
I WANT a legally defensible internal loan workflow
SO THAT cross-project funding survives tax-audit scrutiny

Given Project Z has a maaş ödənişi shortfall of ₼15,000 and Project X has ₼45,000 surplus
  When the hourly cron detects shortfall
  Then MIRAI Maliyyə Analitiki surfaces a suggester to admin with options + recommendation
  
Given I approve "X-dən götür"
  When the loan executes
  Then internal_loans row is inserted with status='open'
  And a PDF receipt is auto-generated and stored at audit_pdf_url
  And the PDF carries: borrowing project, lending project, amount, reason, date, canvas signature, IP, timestamp, actor email
  And both projects' Project P&L Net reflects the transfer

Given Project Z later receives ₼80K income
  When MIRAI prompts to repay
  Then admin one-clicks "Bəli — qaytar"
  And internal_loans.repaid_at = now() and status = 'repaid'
```

```
US-FIN-12  Project P&L 3-level (Gross / Net / Final) (refs REQ-FIN-06)
AS A studio director
I WANT to see real per-project profitability after overhead
SO THAT I price future projects sustainably

Given a project with Gross ₼100,000, Outsource ₼25,000, allocated overhead ₼6,625 (May)
  When I open Maliyyə → P&L → drill into the project
  Then I see three numbers stacked:
    Gross  ₼100,000
    Net    ₼ 75,000
    Final  ₼ 68,375
  And health emoji renders next to Final: 🟢 (≥30% of Gross), 🟡 (10–30%), 🔴 (<10%)
  And tabular numerals + AZN formatting applied
```

```
US-FIN-13  Overhead allocation without timesheet (refs REQ-FIN-13)
AS THE platform
I WANT per-project overhead computed automatically
SO THAT P&L Final exists without requiring time tracking

Given May 2026 has 3 active projects with overlapping task date windows
  When the monthly cron runs on 1 June 2026
  Then project_overhead_allocations rows are written for each project for period_yyyymm='202605'
  And allocated_amount = monthly_overhead × project_active_user_days / firm_active_user_days
  And formula_version is stamped
  And the rows are exposed in P&L Final per project

Given the allocated amount diverges >25% from a similar-duration peer project
  When the quarterly check runs
  Then MIRAI surfaces "Bu layihənin overhead-ı qeyri-adi" alert to admin

Given admin manually overrides a month's allocation in P&L drawer
  Then the override is stored with override_reason
  And the row is flagged in UI
```

```
US-FIN-14  Runway gauge in Cash Cockpit (refs REQ-FIN-14)
AS A studio director
I WANT a 3-month runway gauge
SO THAT I see firm health at a glance

Given last 6 months avg burn = ₼70,000 and current total balance = ₼153,500
  When Cash Cockpit renders
  Then runway_months = 153500/70000 ≈ 2.2
  And status = "🟡 Diqqət" (2–3 months)
  And the line "⚠️ Min. tələb (3 ay runway): ₼210K → Status: ⚠️ Diqqət" is shown

Given fewer than 6 months of expense history exist
  Then the gauge is disabled with message "Burn rate hesablaması üçün 6 aylıq tarixçə lazımdır"
```

```
US-FIN-15  Forecast confidence chart with risk zone (refs REQ-FIN-15, REQ-FIN-16)
AS A studio director
I WANT an honest forecast that distinguishes confident from optimistic projections
SO THAT I plan against realistic downside

Given expected income sources at multiple confidence tiers
  When I open Forecast (90-day horizon)
  Then a two-line chart renders:
    Confident (solid) — only sources ≥90% confidence
    Optimistic (dashed) — all sources at full weight
  And the area between is shaded warning color (risk zone)
  And horizon tabs 30 / 90 / 365 are switchable
  And refresh button is rate-limited 1×/24h
```

```
US-FIN-16  Monthly forecast calibration (refs REQ-FIN-17)
AS THE platform
I WANT confidence percentages adjusted from observed outcomes
SO THAT predictions improve over time

Given the "İcrada" stage confidence is 60% and the last 3 months actual realization was ~55%
  When the monthly calibration cron runs
  Then forecast_calibration_log records (predicted, actual) per tier
  And MIRAI surfaces "İcrada confidence 60% → 55% tövsiyə" to admin
  And on accept the tier is updated for future forecasts (not retroactively)
```

```
US-FIN-17  Token Counter Dashboard widget (refs REQ-FIN-18)
AS A studio director
I WANT real-time MIRAI cost visibility
SO THAT runaway loops or expensive prompts get caught early

Given I am admin and current month spend = ₼3.20 against budget ₼5.00
  When I open Cash Cockpit
  Then a Token Counter widget renders:
    Header progress bar at 64% (yellow at ≥80%, red at 100%)
    Per-persona breakdown sorted by spend
    Per-user spend (firm-wide visibility)
    30-day daily-token sparkline
  And alerts appear at 80% / 100% thresholds
```

```
US-FIN-18  Free fallback when budget hit (refs REQ-FIN-18 / §7.6.1)
AS THE platform
I WANT MIRAI to keep working even when the monthly budget is exhausted
SO THAT the firm is never blocked

Given MIRAI_MONTHLY_BUDGET_USD is reached on day 22
  When a non-creator user sends a chat message
  Then the request transparently routes to Groq llama-3.3-70b free tier
  And a small banner renders: "🔄 Pulsuz model rejimi — keyfiyyət bir az aşağı ola bilər"
  And tools and RAG continue to operate
  And on the 1st of the next month the primary model resumes automatically

Given Anthropic returns 5xx for any single request
  When the retry policy exhausts
  Then the same fallback engages for that one outage and resumes once primary recovers
```

---

### MODULE 8 — Komanda

#### 8.1 Salary (REQ-Komanda 8.2)
```
US-SAL-01  User views own salary
AS A team member
I WANT to see only my own salary
SO THAT my privacy is preserved

Given my salaries.employee_id = auth.uid()
  When I open Əmək Haqqı
  Then I see my current effective salary + history
  And no other employee row is fetched (RLS verified)
```

```
US-SAL-02  Admin manages salaries
AS AN admin
I WANT to set / update salaries
SO THAT compensation records stay accurate

Given I am admin
  When I update an employee's salary with effective_from = next month
  Then a new salaries row is inserted (no overwrite)
  And the previous row's effective_to is set to the day before
  And an audit_log entry is recorded
```

#### 8.2 Performance
```
US-PERF-01  User sees own published performance reviews (refs REQ-PERF-01)
AS A team member
I WANT to see my performance reviews for each year admin has published
SO THAT I track my growth without seeing in-progress drafts

Given performance_reviews exist for me with published_at IS NOT NULL for years 2024 and 2025
  And a draft (published_at IS NULL) exists for 2026
  When I open Performans
  Then I see a gauge per published year (2024, 2025) with score + ratings breakdown
  And the 2026 row is invisible — no draft data leaks
  And no other employee data is visible (RLS enforced)

Given I have worked at the firm for 3 years and admin has published all 3 reviews
  Then I see 3 yearly gauges
```

```
US-PERF-02  Admin reviews and publishes performance (refs REQ-PERF-01)
AS AN admin
I WANT to draft, review, and publish performance reviews
SO THAT reviews are formal events, not surveillance

Given I am admin
  When I submit a review (year, score, ratings, summary)
  Then a performance_reviews row is created with reviewer_id = me, published_at = NULL
  And the employee CANNOT see it yet

Given I have finalized the review and click "Yayımla"
  When the API succeeds
  Then published_at = now() and published_by = me
  And the employee receives an in-app + Telegram notification "{year} performans nəticəniz hazırdır"
  And the gauge becomes visible to them

Given I click "Yayımı geri al"
  Then published_at = NULL
  And an audit_log entry records the unpublish action
```

#### 8.3 Leave
```
US-LEAVE-01  Request leave
AS A team member
I WANT to request leave
SO THAT my absence is approved and visible

Given I submit a leave request (kind, dates, note)
  When status defaults to 'pending'
  Then the approver (admin or my manager) receives a notification
  And the dates appear as "pending" on the team calendar (but not booked)
```

```
US-LEAVE-02  Approve leave
AS AN admin
I WANT to approve / deny leave
SO THAT planning is clear

Given a pending leave_request
  When I approve
  Then status='approved' and approver_id stamped
  And a calendar_events row is auto-created (kind='leave', attendees=[employee])
  And the requester receives in-app + Telegram notification
```

#### 8.4 Calendar
```
US-CAL-01  Create event with internal + external attendees
AS A team member
I WANT to create an event with internal teammates and external emails
SO THAT external collaborators are included

Given I open Yeni Hadisə
  When I add internal attendees + external_emails + recurrence_rule (RFC 5545)
  Then a calendar_events row is inserted
  And internal attendees receive in-app + Telegram notifications
  And external attendees receive an email with .ics attachment + mailto link
```

```
US-CAL-02  Add Google Meet link
AS AN organizer
I WANT to attach a Meet link to an event
SO THAT remote attendance works

Given I click "Meet yarat" on an event
  When meet.new opens in a new tab
  Then I copy the URL back to the event meet_url field
  And the saved event displays a "Görüşə qoşul" button to attendees
  And the .ics for external attendees includes the Meet URL
```

```
US-CAL-03  Switch calendar views
AS A team member
I WANT Month / Week / Day views
SO THAT I navigate at the right granularity

Given I am on Təqvim
  When I switch view modes
  Then events render correctly in each view
  And recurring events expand instances within the visible range
  And multi-day events span correctly
```

#### 8.5 Elanlar
```
US-ELAN-01  Publish manual announcement
AS AN admin
I WANT to publish announcements to the team
SO THAT important news reaches everyone

Given I am admin
  When I submit title + body + category (+ optional cover)
  Then an announcements row is created with mirai_generated=false, approved=true
  And all users see it on their next Dashboard render
  And Realtime pushes an unread badge update
```

```
US-ELAN-02  Approve MIRAI feed post
AS AN admin
I WANT to review MIRAI auto-feed posts before publication
SO THAT only relevant posts reach the team

Given a mirai_feed_posts entry with approved=false
  When I review and click "Saxla / Paylaş"
  Then announcements row is created with mirai_generated=true, approved=true, approved_by=me
  And it becomes visible to all users

Given I click "Rədd et"
  Then the post is hidden from the queue
  And no announcement is created
```

```
US-ELAN-03  Filter announcements by category
AS A team member
I WANT to filter announcements by category
SO THAT I find relevant info fast

Given I am on Elanlar
  When I click a category pill (Xəbər / Hadisə / Trend / Opportunity / Siyasət / Layihə)
  Then the list filters client-side without reload
  And the unread indicator persists per item
```

#### 8.6 Equipment
```
US-EQUIP-01  Assign equipment to a teammate
AS AN admin
I WANT to assign equipment to team members
SO THAT inventory ownership is tracked

Given I am admin
  When I select an equipment row and assign it
  Then assigned_to is updated
  And a history record is appended (transfer log)
  And the assignee receives an in-app notification
```

---

### MODULE 9 — Şirkət

#### 9.1 OKR
```
US-OKR-01  Admin sets company OKRs per quarter
AS AN admin
I WANT to set company OKRs per quarter
SO THAT the team has aligned objectives

Given I am admin
  When I create an OKR with scope='company', period='Q2 2026', objective + 3 key_results
  Then okrs row is created with employee_id=NULL
  And progress = average of key_results progress %
  And it is visible to all users (read-only for non-admin)
```

```
US-OKR-02  User updates personal OKR
AS A team member
I WANT to update my personal OKR progress
SO THAT my goals stay current

Given a personal OKR with scope='personal', employee_id=auth.uid()
  When I update a key_result current_value
  Then key_results.updated_at refreshes
  And progress recomputes
  And no other user can SELECT this row (RLS verified)

Given I have not updated in 7 days
  When the weekly cron runs
  Then MIRAI nudges me via in-app notification
```

```
US-OKR-03  Admin OKR health overview
AS AN admin
I WANT a team OKR overview
SO THAT I catch lagging objectives

Given I am admin and team OKRs exist
  When I open the OKR overview
  Then each member shows On Track (≥70%), At Risk (40–69%), Off Track (<40%)
  And clicking expands the personal OKRs of that member
```

#### 9.2 Karyera
```
US-CAREER-01  User views career path
AS A team member
I WANT to see my current level and the path to the next
SO THAT promotion criteria are transparent

Given I am at level "Mid Designer"
  When I open Karyera Strukturu
  Then I see my current level + requirements (read-only)
  And the next level "Senior Designer" with criteria checklist
  And criteria already met show a green check (e.g. "≥3 closed projects")
```

#### 9.3 Content
```
US-CONTENT-01  Plan content posts
AS AN admin
I WANT to plan editorial posts on a calendar
SO THAT marketing has a single calendar

Given I am admin
  When I create a content_plans entry (channel, scheduled_at, topic, owner, status='draft')
  Then it appears on the content calendar
  And owner receives a deadline reminder 2 days before scheduled_at
```

---

### MODULE 10 — Sistem / Parametrlər

```
US-SYS-01  Manage templates
AS AN admin
I WANT to author / version templates
SO THAT generated documents stay consistent

Given I am admin
  When I create / edit a template (category, body with {{variables}})
  Then the variable list is auto-extracted and stored in templates.variables
  And a preview renders with sample values
  And only admins can edit; users can use templates only

US-SYS-02  Upload PDF to Bilik Bazası
AS AN admin
I WANT to upload AZ law / AZDNT PDFs
SO THAT MIRAI's Hüquqşünas persona can cite them

Given I upload a PDF
  When the ingestion pipeline runs
  Then the file is text-extracted
  And chunks (≈500 tokens, 50 token overlap) are embedded via the configured model
  And rows are inserted into knowledge_base with source_pdf set
  And reuploading the same file replaces existing chunks (versioning)

US-SYS-03  Notification preferences
AS A team member
I WANT to choose which notifications I receive on which channel
SO THAT I'm not spammed

Given I open Parametrlər → Bildirişlər
  When I toggle "Telegram → Mention" off
  Then notification_preferences updates (user_id, channel='telegram', event_kind='mention', enabled=false)
  And subsequent mentions deliver only to in-app
```

---

### MODULE 11 — MIRAI

```
US-MIRAI-01  Ask MIRAI in Azerbaijani
AS A studio director
I WANT to ask MIRAI questions in Azerbaijani and get expert answers
SO THAT I have an always-available senior advisor

Given I open MIRAI and select persona "Strateq"
  When I ask a strategic question
  Then the response streams via SSE with first token ≤800ms p95
  And the persona name appears as the sender label
  And token usage is logged to mirai_messages + mirai_usage_log
```

```
US-MIRAI-02  Hüquqşünas cites AZ normative sources
AS A studio director
I WANT MIRAI to cite legal sources
SO THAT I trust the answer

Given persona = Hüquqşünas and my question is about expertise requirements
  When the model retrieves top-5 chunks via pgvector
  Then the response cites "Mənbə: <pdf_name>, Maddə X.Y.Z" inline
  And if no chunk scores above the relevance threshold
  Then MIRAI replies "Bu məsələ üzrə dəqiq məlumatım yoxdur, hüquqşünasla məsləhətləşin"
```

```
US-MIRAI-03  Privacy filter prevents data leakage
AS A non-admin user
I WANT MIRAI to refuse access to data outside my scope
SO THAT firm financials remain private

Given I am a Member (level 4) and ask "Bu ay nə qədər gəlirimiz olub?"
  When MIRAI's tool layer attempts firm_finance_snapshot
  Then the tool denies (admin-only)
  And the response politely declines: "Bu məlumat yalnız adminlər üçün açıqdır"
  And no financial values appear in the response
  And tools_used logs the denial
```

```
US-MIRAI-04  Cost guardian enforces $5/month/user
AS A studio director
I WANT a hard cap on MIRAI costs per user
SO THAT a runaway loop doesn't blow the budget

Given a user has consumed $4 of $5 in the current calendar month
  When they send another message
  Then a warning banner appears at the top of MIRAI: "80% limitə çatdınız"

Given the user reaches $5
  When they attempt another message
  Then MIRAI rejects with "Bu ay MIRAI limitinə çatdınız"
  And the chat is disabled until next month
  And the creator (is_creator=true) is exempt
```

```
US-MIRAI-05  CMO weekly feed posts
AS AN admin
I WANT MIRAI CMO to surface architecture trends and award opportunities
SO THAT the team stays informed without manual research

Given the weekly cron runs (Mon 09:00 Asia/Baku)
  When ArchDaily/Dezeen/Architizer/WAF feeds are fetched
  Then MIRAI summarizes + filters relevance (architecture + AZ/regional)
  And inserts mirai_feed_posts (source_kind='trend' or 'opportunity')
  And creates announcements rows with mirai_generated=true, approved=false
  And admins receive a moderation queue notification
```

---

### MODULE 12 — Telegram

```
US-TG-01  Link Telegram via in-app onboarding
AS A team member
I WANT to link my Telegram from inside Reflect
SO THAT setup is friction-free

Given I am on Profil → Telegram
  When I click "Telegram-ı qoş"
  Then a one-time 6-digit code is generated and stored server-side (TTL 10 min)
  And a deep link to the Reflect bot opens with the code prefilled
  And after I send the code in the bot, telegram_chat_id is saved + telegram_linked_at stamped
  And the in-app status flips to "Qoşulub"
```

```
US-TG-02  Receive task deadline reminders
AS A team member
I WANT Telegram reminders for my task deadlines
SO THAT I never miss a deadline

Given I am Telegram-linked and have a task with deadline = 2026-05-10
  When the reminder cron runs daily 09:00 Asia/Baku
  Then I receive messages on 2026-05-07 (D-3), 2026-05-09 (D-1), 2026-05-10 (D)
  And the format is "📋 {task_title} — deadline {when}! [{project_name}]"
  And reminders honor my notification_preferences (telegram + deadline)
```

```
US-TG-03  Finance alerts to admin only
AS A studio director
I WANT large income / expense / overdue alerts via Telegram
SO THAT I catch material events fast

Given thresholds in system_settings (income_alert=5000, expense_alert=2000)
  When an income > 5000 AZN is logged
  Then a Telegram message goes ONLY to admin/creator chat IDs
  And no non-admin chat ID receives any financial value
  And the message includes project + amount + logged_by
```

---

## 14. Story Coverage Matrix

| Module | Stories | Module | Stories |
|---|---|---|---|
| Auth | US-AUTH-01..04 | Salary | US-SAL-01..02 |
| Dashboard | US-DASH-01..05 | Performance | US-PERF-01..02 |
| Layihələr | US-PROJ-01..05 | Leave | US-LEAVE-01..02 |
| Tapşırıqlar | US-TASK-01..22 | Calendar | US-CAL-01..03 |
| Arxiv | US-ARC-01..02 | Elanlar | US-ELAN-01..03 |
| Müştərilər | US-CRM-01..15 | Equipment | US-EQUIP-01 |
| Maliyyə | US-FIN-01..18 | OKR | US-OKR-01..03 |
| Sistem | US-SYS-01..03 | Karyera | US-CAREER-01 |
| MIRAI | US-MIRAI-01..05 | Content | US-CONTENT-01 |
| Telegram | US-TG-01..03 | | |

**Total:** 89 user stories across 19 module groups (v3.4 — Müştərilər expanded 6 → 15: pipeline gating, viewer log, letter composer, BCC capture, workload estimator + Net Income, auto-archive, lifetime value, MIRAI architecture mode + ZIP analysis). Each story is QA-testable; cross-references exist to §5 REQ IDs.

---

*Last updated: 2026-05-04 (v3.4 — Müştərilər lifecycle refactor: pipeline transition gating with mandatory payloads, BCC email capture, rəsmi məktub composer, document viewer log, workload estimator + Net Income, lifetime value, auto-archive, 2 user personas + MIRAI architecture mode + ZIP analysis)*
*Owner: Talifa İsgəndərli*
*Next review: end of Part 1 sprint*
