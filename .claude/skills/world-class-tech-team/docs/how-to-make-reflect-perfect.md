# How to Make Reflect Perfect
**Full Deep-Dive Audit — All Experts — 2026-05-03**
**Lead: Staff Engineer + Designer II + Senior PM + Innovation Specialist + CCO**

This document is the single source of truth for every gap between the current codebase and the final approved spec. It supersedes all previous audit fragments. Issues are ordered by blast radius — fixes that unblock other work come first.

---

## PART 1 — CRITICAL DATA BUGS (Fix immediately, data is wrong right now)

### 1.1 DashboardPage — Expense filter completely broken
- `expenses` query selects: `amount, payment_method, category, edv_amount, amount_with_edv`
- `expense_date` is NOT selected → `matchesPeriod(e.expense_date)` is always `undefined` → filter always fails
- **Fix:** Add `expense_date` to the select string

### 1.2 DashboardPage — Monthly income chart uses wrong year
- `const currentYear = new Date().getFullYear()` hardcoded on line 113
- Chart filters by `currentYear` but user may have selected `filterYear` (e.g. 2024)
- Chart always shows current year regardless of filter
- **Fix:** Replace `currentYear` with `filterYear` in `monthlyIncome` calculation

### 1.3 DashboardPage — Aging debt ignores year/month filter
- `debts` fetched without date filter, aging calculation uses raw `debts` array (all time)
- Switching year/month doesn't affect aging chart
- **Fix:** Apply `matchesPeriod(d.expected_date)` before aging calculation

### 1.4 DashboardPage — "Gecikmiş alacaqlar" shows "Alacaq" hardcoded
- Widget renders `<div className="text-xs font-medium text-[#0f172a]">Alacaq</div>` — no client/project name
- DB has `receivables` linked to projects/clients via foreign key but join not done
- **Fix:** Add `.select('*, projects(name, clients(name))')` and display proper names

### 1.5 App.jsx — `hesab-fakturalar` route duplicated
- Route defined twice (line 103 and line 129) — second definition silently overrides first
- **Fix:** Remove duplicate

### 1.6 App.jsx — `/employee-dashboard` has no protection
- Any authenticated user can navigate to `/employee-dashboard` directly (no `AdminRoute`)
- `RoleBasedDashboard` is correct but direct URL access bypasses it
- **Fix:** Wrap in `AdminRoute` or remove the direct route (access only via `/`)

### 1.7 PerformansPage — Reads from wrong table
- Page queries `performance_reviews` (old schema)
- MIRAI schema created `performance_surveys` (new table, 2026-05-03)
- These two tables never sync — admin enters data twice
- **Fix:** Migrate PerformansPage to read `performance_surveys`, run migration SQL to copy old data

### 1.8 PerformansPage — taskScore hardcoded 0
- `taskScore` is calculated as `0` in all cases → overall score always wrong
- **Fix:** Query tasks completed by user within period, calculate on-time % for score

### 1.9 LayihelerPage — `phase` vs `phases` schema mismatch
- New schema uses `phases` (array) but form saves to `phase` (singular, old field)
- New projects created with wrong field name
- **Fix:** Update form to use `phases` array, add migration to copy old `phase` → `phases[0]`

### 1.10 PortfelPage — Shows old `phase` field
- Portfolio cards read `project.phase` (singular) — always empty for new projects
- **Fix:** Read from `phases` array, display `phases[0]` or join them

---

## PART 2 — SECURITY HOLES

### 2.1 Authorization — Pages accessible without role check
These pages have zero `isAdmin` guard — any authenticated user can access full data and perform destructive actions:
- `HesabatlarPage` — full financial reports visible to all
- `KommersiyaTeklifleriPage` — any user can create/edit/delete proposals
- `MuqavilelerPage` — any user can create/edit/delete contracts
- `DaxilolmalarPage` — any user can record income
- `XerclerPage` — any user can record expenses
- `ParametrlerPage` — system settings accessible to all
- **Fix:** Add `AdminRoute` wrapper in App.jsx for each (already done for some — verify all)

### 2.2 ElanlarLovhesiPage — Edit/delete visible to non-admin
- Edit and delete buttons rendered for all users regardless of `isAdmin`
- **Fix:** Wrap buttons with `{isAdmin && <button>...}` guard

### 2.3 api/telegram.js — Webhook secret optional
- If `TELEGRAM_WEBHOOK_SECRET` env var not set, signature validation is skipped
- Any POST to `/api/telegram` is accepted as legitimate Telegram message
- **Fix:** Make secret mandatory; return 403 if env var missing rather than skipping check

### 2.4 api/agent.js — Cron secret in query param
- `?secret=<value>` visible in server access logs and browser history
- **Fix:** Accept only `Authorization: Bearer` header, reject query param auth

### 2.5 api/agent.js — No cron deduplication
- If cron fires twice (clock skew, retry), duplicate Telegram notifications sent
- **Fix:** Insert idempotency key (`date + type`) into `telegram_notifications` before sending; skip if exists

### 2.6 api/mirai.js — Groq fallback silent fail
- `GROQ_API_KEY` empty string → Groq request sends empty auth → fails → no error logged
- User gets no response and no indication of failure
- **Fix:** Check `GROQ_API_KEY` exists before attempting fallback; return explicit error if both Claude + Groq unavailable

### 2.7 outsource_user_view not used in MaliyyeMerkeziPage
- Page queries `outsource_works` directly instead of `outsource_user_view` (privacy view)
- Non-admins (if ever given access) would see financial columns they shouldn't
- **Fix:** Switch to `outsource_user_view` which already filters sensitive columns

---

## PART 3 — MISSING CORE FEATURES (Spec-approved, not implemented)

### 3.1 Cash Cockpit — Admin sticky top bar
- **Spec:** MainLayout top bar shows `🏦 Nağd ₼X | 💵 Köçürmə ₼X | 📊 ƏDV ₼X` for admin always
- **Current:** Nothing. Admin sees same blank top area as user
- **Fix:** Add `CashCockpit` component in `MainLayout.jsx`, fetch from `incomes`+`expenses` with current month filter, cache 60s

### 3.2 MusterilerPage — Mandatory fields per stage transition
- **Spec:** Each stage transition enforces required fields:
  - Lead → Təklif: `phone`, `email`, `expected_value`
  - Təklif → Müzakirə: `contact_person`
  - Müzakirə → İmzalanıb: linked `kommersiya_teklifleri` record
  - İmzalanıb → İcrada: linked `muqavileler` record
- **Current:** Any stage jump accepted without validation
- **Fix:** `validateStageTransition(from, to, client)` function checked before `handleStageChange`

### 3.3 MusterilerPage — Third view (Detail Panel)
- **Spec:** 3 views: Kanban / Cədvəl / Detail (full client profile slide-in)
- **Current:** 2 views only (Kanban + List)
- **Fix:** Add `viewMode === 'detail'` branch with client profile panel showing all sub-sections

### 3.4 MusterilerPage — Client sub-features missing
- Workload Estimator: estimate project hours/team before signing
- Retrospective Survey: mandatory survey trigger when stage → Bitib
- Communication Log: call/email/meeting log per client with date + summary
- Document Center: file attachments per client (contract, brief, renders)
- **Fix:** Each as a tab in the client detail panel

### 3.5 HierarchyPage — User position highlight + career path
- **Spec:** User sees their own position highlighted in the org tree; section below shows "Bu vəzifəyə çatmaq üçün: [criteria]"
- **Current:** `useAuth()` not imported — completely impossible to implement without refactor
- **Fix:** Import `useAuth`, use `profile.role_id` to highlight user's card, add career path section below tree

### 3.6 HedefNeticeOKRPage — Company tab hidden from non-admin
- **Spec:** Non-admin users only see "Şəxsi OKR" tab; company OKR is admin-only
- **Current:** Default tab is 'company' for ALL users → non-admin sees empty company tab first
- **Fix:** `useState(isAdmin ? 'company' : 'personal')` for initial tab; hide company tab for non-admins

### 3.7 PerformansPage — Gauge chart missing
- **Spec:** Semicircle gauge 0-40 red / 40-70 yellow / 70-100 green for overall score
- **Current:** Only `ScoreBar` horizontal bars exist
- **Fix:** Implement SVG arc gauge component; render above score breakdown

### 3.8 MainLayout — Client search route broken
- Line 159: client search results link to `/sifarisci-idareetme` (removed route)
- **Fix:** Change to `/musteriler`

### 3.9 AuthContext — Role changes not propagated
- Admin changes a user's role in DB → that user's session still reflects old role until they re-login
- `refreshProfile()` not exposed in context value
- **Fix:** Expose `refreshProfile` from context; optionally add Supabase realtime subscription on `profiles` row for current user

### 3.10 AvadanliqPage — No database persistence
- All equipment data stored in React state only — lost on page refresh
- No SQL table exists for `avadanliq` (equipment)
- **Fix:** Write SQL schema; implement full Supabase CRUD in AvadanliqPage

### 3.11 Legacy routes still active in App.jsx
- `/sifarisci-idareetme` and `/pipeline` still defined as active routes
- Per final nav spec, these are replaced by `/musteriler`
- **Fix:** Remove or redirect both to `/musteriler`

---

## PART 4 — MIRAI AI GAPS

### 4.1 Chat history not persisted to DB
- `MiraiChat.jsx` never writes to `mirai_sessions` or `mirai_messages` tables
- Tables exist (created in `sql/2026_05_mirai_schema.sql`) but are empty
- Chat is lost on page close/reload
- **Fix:** On first message, create session in `mirai_sessions`; on each message pair, insert into `mirai_messages`

### 4.2 Compressed history never written
- `mirai_sessions.compressed_history` column exists but never written
- After 10 messages, history should be summarized and stored to save tokens
- **Fix:** After 10th message, call Claude to summarize conversation, write to `compressed_history`, truncate `mirai_messages` to last 3

### 4.3 Budget warning before limit hit
- Currently: user gets error only when budget is exhausted (0 remaining)
- **Spec:** Warning shown at 80% spend ($4 of $5)
- **Fix:** Add `if (monthly_spend > monthly_budget * 0.8)` warning banner in `MiraiChat` usage indicator

### 4.4 No MIRAI feedback mechanism
- Users cannot rate responses — no thumbs up/down, no correction flow
- No way to improve prompt quality over time
- **Fix:** Add 👍/👎 buttons on each assistant message bubble; write rating to `mirai_messages.feedback` column (add column to schema)

### 4.5 MIRAI not auto-opened with context on critical alerts
- **Spec:** When user sees overdue task / low cash warning, MIRAI should auto-open with pre-filled question
- **Current:** MIRAI only opens on manual click
- **Fix:** Expose `openMiraiWithMessage(text)` from a context/ref; call from critical alert components

### 4.6 Non-admin users — Chief Architect persona prompt
- Non-admin users get `chief_architect` persona correctly
- But the system prompt for Chief Architect doesn't differentiate admin vs user context
- User-facing MIRAI should NOT answer finance questions; should humorously deflect
- **Fix:** Add `isAdmin` flag to persona prompt builder; user chief_architect prompt explicitly blocks financial queries

---

## PART 5 — FINANCE MODULE GAPS (maliyye-merkezi-spec.md)

### 5.1 Per-project P&L not implemented
- **Spec:** Each project has Gross Margin / Net Margin / Final P&L breakdown
- Gross = contract_value - direct costs; Net = Gross - overhead allocation; Final = Net - outsource
- **Current:** Only total income/expense shown, no per-project drill
- **Fix:** Add P&L tab in LayihelerPage project detail; query `incomes+expenses+outsource` filtered by `project_id`

### 5.2 Forecast engine missing
- **Spec:** Receivables forecast with confidence scoring (high/medium/low) based on pipeline_stage
- **Current:** Only historical data shown
- **Fix:** Multiply `expected_value` × `stage.confidence` for each pipeline client; sum as 3-tier forecast

### 5.3 Cross-project lending not tracked
- **Spec:** When cash moves between projects (DaxiliKocurmelePage), audit trail with who approved
- **Current:** Transfers recorded but no approval field, no audit trail view
- **Fix:** Add `approved_by` + `approved_at` to `internal_transfers` table; display in MaliyyeMerkeziPage

### 5.4 XerclerPage — Missing features
- No receipt/invoice file attachment
- No budget enforcement warning (no check if expense exceeds project budget)
- No expense approval workflow (direct save without any review)
- Hardcoded `CATEGORIES` array (should be DB-driven or at least configurable)
- **Fix:** Each as separate card in XerclerPage; file upload via Supabase Storage

### 5.5 DebitorBorclarPage — Missing features
- No aging report export (CSV/PDF)
- `contact_person` field exists in DB but not shown in table view
- "Mark as paid" form doesn't have `notes` field
- Reminder notification not connected to Telegram
- **Fix:** Add export button; show `contact_person` column; add notes to paid dialog; wire to `telegram_notifications`

### 5.6 HesabatlarPage — Financial data security + quality
- Non-admin users currently see full financial reports (no isAdmin check)
- CSV export has no column headers and raw numbers (no `₼` currency format)
- YoY / MoM comparison missing
- Hardcoded years `[2024, 2025, 2026, 2027]` — will fail in 2028
- **Fix:** Add `AdminRoute`; fix CSV; add comparison columns; use `new Date().getFullYear() + [-2,-1,0,1]` for year list

---

## PART 6 — TASK MANAGEMENT GAPS (tapsiriqlar-spec.md)

### 6.1 Smart Closeout workflow missing
- **Spec:** When task → Tamamlandı, trigger checklist modal: deliverables handed over? client notified? files archived?
- After checklist → portfolio entry creation flow
- **Current:** Status change is direct, no closeout ceremony
- **Fix:** `onStatusChange('done')` opens `CloseoutModal` with editable checklist; on complete → `PortfolioEntryModal`

### 6.2 Auto Task Planner missing
- **Spec:** Given deadline + task type, AI generates subtasks with backward-planned dates
- **Current:** No planning automation
- **Fix:** MIRAI COO tool `plan_task(title, deadline, type)` → returns subtask list; user approves → bulk insert

### 6.3 Activity log incomplete
- Only status changes logged to `activity_log`
- Assignee changes, deadline changes, priority changes, description edits — not logged
- **Spec:** Universal activity log for blame-free review (client delay tracking)
- **Fix:** Wrap all field updates with `logActivity(taskId, field, oldValue, newValue)` helper

### 6.4 Dual assignee system not cleaned up
- `assignee_id` (singular) and `assignee_ids` (array) both exist and both used
- Filters break depending on which field is populated
- **Fix:** Migration SQL: copy `assignee_id` → `assignee_ids[0]` for all tasks; remove `assignee_id` references from all pages

---

## PART 7 — HR / TEAM MODULE GAPS

### 7.1 Missing page files
- `KadrSeyyahligiPage.jsx` — does not exist (HR movement/transfer tracking)
- `MaasHesablamaPage.jsx` — does not exist (salary calculation)
- Both referenced in docs but never built
- **Fix:** Create stubs with DB queries and basic CRUD; full feature in Phase 2

### 7.2 IshciHeyetiPage — Missing features
- Delete button absent (handler written but no UI element)
- Avatar/profile photo upload missing
- Role assignment has no hierarchy validation (any role assignable to any level)
- No career progression history or audit log
- **Fix:** Add delete button with confirm dialog; Supabase Storage for avatars; validate role level against target user's level

### 7.3 PerformansPage + performance_surveys sync
- `performance_reviews` (old) and `performance_surveys` (new MIRAI schema) are separate tables
- Admin manually enters data twice
- **Fix:** Write migration SQL: insert into `performance_surveys` from `performance_reviews`; redirect PerformansPage to new table

---

## PART 8 — PARAMETRLER / SETTINGS GAPS

### 8.1 Notification toggles not persisted
- Toggle state only in React local state — resets on reload
- **Fix:** Read/write to `settings` table with key `notifications_config` as JSONB

### 8.2 APPROVERS array hardcoded
- `APPROVERS = ['Nicat', 'Talifa', 'Türkan']` hardcoded in ParametrlerPage
- Should be fetched from `profiles` where `is_admin = true` or `role_level <= 2`
- **Fix:** `useEffect → supabase.from('profiles').select().eq('is_active', true).lte('roleLevel', 2)`

### 8.3 Four-tab structure missing
- **Spec:** Parametrlər has 4 tabs: Ümumi / Şablonlar / Bilik Bazası / Bildirişlər
- **Current:** All settings in single flat page
- **Fix:** Add tab navigation; move relevant sections; Şablonlar = contract/proposal templates; Bilik Bazası = RAG knowledge entries; Bildirişlər = notification toggles

### 8.4 Telegram onboarding incomplete
- User should enter bot token → system verifies → provides `/start` command → user sends from Telegram → `chat_id` auto-linked
- **Current:** Manual chat_id entry only
- **Fix:** Add token verification step in Parametrler; generate deep link with pre-filled command

---

## PART 9 — UI/UX DESIGN GAPS (Designer I + II)

### 9.1 Sidebar collapse missing
- **Spec:** Sidebar toggles between 220px (full) and 56px (icon-only)
- **Current:** Always 220px, no collapse button
- **Fix:** Add `collapsed` state to MainLayout; CSS transition `width: collapsed ? 56px : 220px`; hide labels when collapsed

### 9.2 Mobile responsiveness missing
- No hamburger menu on mobile
- Sidebar either always visible (blocks content) or always hidden (no way to open)
- **Fix:** Overlay sidebar on mobile with hamburger toggle; close on route change

### 9.3 Global search keyboard shortcut missing
- `Cmd+K` / `Ctrl+K` should open global search
- **Current:** Search only accessible via icon click in top bar
- **Fix:** `useEffect → keydown listener for (e.metaKey || e.ctrlKey) && e.key === 'k'` → `setSearchOpen(true)`

### 9.4 Empty state CTAs missing
- Most pages show "məlumat yoxdur" on empty table with no action button
- First-time user has no idea what to do
- **Fix:** Add illustration + primary CTA button in every empty state (`Yeni layihə əlavə et`, etc.)

### 9.5 Loading skeleton inconsistency
- Some pages: `PageLoadingShell + TableSkeleton + CardGridSkeleton` (correct)
- Other pages: `null` return while loading (blank flash)
- Other pages: `<Skeleton />` only on one section
- **Fix:** Audit all pages; every page must return `<PageLoadingShell>` during load

### 9.6 Dot grid background not universal
- Design system specifies `#F2F3F7` dot grid background on main content area
- Some pages apply it, others use plain white
- **Fix:** Apply `dotGridBg` class (already defined in index.css) to main content wrapper in `MainLayout`

### 9.7 Year filter hardcoded everywhere
- `[2024, 2025, 2026, 2027]` hardcoded in DashboardPage, SabitXerclerPage, HesabatlarPage
- Will fail silently in 2028
- **Fix:** `Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i)` everywhere

---

## PART 10 — AZERBAIJANI LANGUAGE / CCO AUDIT

### 10.1 Inconsistent formal register
- Some pages use `Siz` form in tooltips/placeholders; others use informal `sən` form
- Within same page, register switches mid-UI
- **Fix:** Standardize all UI text to formal `Siz` form (architecture firm context = professional)

### 10.2 Mixed Azerbaijani / Russian UI patterns
- Some labels use Russian loanwords unnecessarily: `status` (→ `vəziyyət`), `manager` (→ `rəhbər`), `deadline` (→ `son tarix` preferred in formal context)
- Other places use correct modern Azerbaijani
- **Fix:** Audit all string literals; prefer modern Azerbaijani where established equivalents exist; keep `deadline` as widely accepted in Baku professional context

### 10.3 Toast messages inconsistent tone
- Some toasts: `"Uğurla yadda saxlandı"` (warm, correct)
- Others: `"Xəta baş verdi"` (correct but cold)
- Error toasts should include next step: `"Xəta baş verdi. Yenidən cəhd edin."` (already done in some places but not all)
- **Fix:** Standardize all success/error/warning toast strings into a single `messages.js` constants file

### 10.4 Number formatting not Azerbaijani
- Currency shows as `₼12345` — no thousands separator
- Should be `₼12.345` (Azerbaijani convention uses period as thousands separator)
- `fmt()` function uses `.toLocaleString()` — works only if browser locale is `az-AZ`
- **Fix:** `new Intl.NumberFormat('az-AZ').format(n)` explicitly, not relying on browser locale

### 10.5 Date formatting inconsistent
- Some pages: `toLocaleDateString('az-AZ', {...})` — correct
- Others: raw ISO string displayed (`2026-05-03`)
- **Fix:** Create `formatDate(dateStr)` util in `dateUtils.js`; use everywhere

---

## PART 11 — ARCHITECTURE / SCHEMA GAPS (Engineer)

### 11.1 Missing SQL tables
- `avadanliq` — equipment tracking (AvadanliqPage exists but no table)
- `kadr_seyyahligi` — HR movement tracking (page doesn't exist either)
- `maas_hesablamasi` — salary calculation records
- `task_activity_log` — universal task activity (only `activity_log` exists, partial)
- **Fix:** Write additive migration SQL for each

### 11.2 RLS role-based policies
- `sql/2026_05_c3_rls_role_based.sql` written but unconfirmed as executed in Supabase
- Without this, RLS policies are not role-aware — basic user/admin split only
- **Fix:** Confirm execution; run verification query `SELECT policyname FROM pg_policies WHERE tablename IN ('tasks','projects','clients')`

### 11.3 No real-time subscriptions
- Profile role changes not propagated to active sessions
- Task status changes require page refresh to appear
- **Fix:** Add `supabase.channel().on('postgres_changes')` subscription in AuthContext for profile row; optionally for tasks in TapshiriqlarPage

### 11.4 No retry logic on Supabase queries
- All Supabase calls: one shot, no retry
- Mobile users on flaky connections get hard failures
- **Fix:** Wrap critical reads in `withRetry(fn, 3)` helper with exponential backoff

### 11.5 EDV_RATE hardcoded in 4+ files
- `EDV_RATE = 0.18` in DashboardPage, DaxiliKocurmelePage, TesisciBorclarPage, LayihelerPage
- Should come from `settings` table: `SELECT value FROM settings WHERE key = 'edv_rate'`
- **Fix:** Create `useSettings()` hook; cache EDV rate; expose globally

---

## PART 12 — INNOVATION / MIRAI COMPLETENESS

### 12.1 MIRAI RAG (pgvector) not implemented
- **Spec Phase 3b:** Knowledge base for Azerbaijan construction law, normatives, AZDNT standards
- Table `mirai_knowledge` commented out in SQL (needs pgvector extension)
- **Fix:** Enable pgvector in Supabase Dashboard → Extensions; uncomment and run table creation; seed with initial documents

### 12.2 Telegram proactive notifications — 09:00 / 18:00 schedule
- **Spec:** Morning briefing (overdue tasks, today's deadlines) + Evening summary (what was done)
- **Current:** Cron job exists in `api/agent.js` but not confirmed connected to Vercel cron schedule
- **Fix:** Verify `vercel.json` has cron entries; confirm `CRON_SECRET` set in Vercel env

### 12.3 MIRAI persona prompts not differentiated by page data
- `query_financials` tool returns raw numbers from DB
- CFO persona should frame numbers as P&L narrative, not raw data
- COO persona should frame tasks as operational risk, not just lists
- **Fix:** Add persona-specific response formatting instructions in system prompts

### 12.4 MIRAI session not linked to page entity
- `mirai_sessions.entity_type` + `entity_id` columns exist but never written
- MIRAI should know "user is looking at project X" when opened from project detail
- **Fix:** Pass `entity_type` + `entity_id` as props to `MiraiChat`; write to session on create

---

## SUMMARY COUNTS

| Category | Issues |
|---|---|
| Critical data bugs | 10 |
| Security holes | 7 |
| Missing core features | 11 |
| MIRAI AI gaps | 6 |
| Finance module gaps | 6 |
| Task management gaps | 4 |
| HR module gaps | 3 |
| Settings/Parametrler gaps | 4 |
| UI/UX design gaps | 7 |
| Language/CCO gaps | 5 |
| Architecture/Schema gaps | 5 |
| Innovation/AI completeness | 4 |
| **TOTAL** | **72** |

---

*Document created: 2026-05-03*
*Authors: Full World-Class Tech Team (Engineer + Designer I + Designer II + PM + CCO + Innovation)*
*Status: APPROVED — implementation plan follows*
