# Reflect Architects OS — Implementation Progress

> **Tarix:** 2026-05-03  
> **Branch:** `claude/pull-main-review-tasks-iDfwh`  
> **Növbəti sessiya üçün başlanğıc nöqtəsi:** Part 2 davam — TapshiriqlarPage "My Tasks" view + MusterilerPage

---

## 📦 PART 1 — TAMAMLANDI ✅

### Texnologiya stack
- React + Vite frontend, Supabase (Postgres + RLS), Tailwind CSS, Vercel
- Node.js `api/agent.js` — Vercel serverless (daily briefing bot)

### Design system tokenları (tailwind.config.js + index.css)
```
accent:    #4F6BFB
bg-dark:   #1A1D23 (sidebar)
surface:   #FFFFFF
muted:     #F2F3F7
border:    #E8E9ED
dot-grid:  radial-gradient(circle, #D1D5E0 1px, transparent 1px) / 20px 20px
```

### Tamamlanan fayllar

| Fayl | Nə edildi |
|------|-----------|
| `tailwind.config.js` | Attio cool neutral tokenlar, animasiyalar, shadows |
| `src/index.css` | Skeleton shimmer, fade-in, slide-in-right, card-hover |
| `src/components/ui/index.jsx` | StatCard, Badge, Button (#4F6BFB), Card, EmptyState, Skeleton, Modal, ConfirmDialog, PageLoadingShell, TableSkeleton, CardGridSkeleton |
| `src/pages/LoginPage.jsx` | Dot grid bg, Inter 800 "Reflect" logo, accent button |
| `src/components/layout/Sidebar.jsx` | #1A1D23 dark, ADMIN_GROUPS + USER_GROUPS ayrı, 6 qrup, active=bg-white/10 |
| `src/components/layout/MainLayout.jsx` | Dot grid content area #F2F3F7, cool neutral top bar |
| `src/App.jsx` | /musteriler, /maliyye-merkezi, /arxiv routes; karyera+emek-haqqi users-a açıq |
| `src/contexts/AuthContext.jsx` | isCreator flag, isAdmin = isCreator OR roleLevel≤2 |
| `src/components/ProtectedRoute.jsx` | Attio loading screen |
| `api/agent.js` | BD head email DB-driven (system_settings.bd_head_email), Bakı timezone fix (UTC+4) |
| `src/lib/logActivity.js` | act{} helpers: statusChange, deadlineChanged, assigned, etc. |
| `src/pages/DashboardPage.jsx` | Team avatars, today's events card, recent notices card |
| `src/pages/DaxilolmalarPage.jsx` | amount≤0 guard |
| `src/pages/DebitorBorclarPage.jsx` | markPaid uses paid_date (not paid_at), guards, overpayment warning |
| `src/pages/SabitXerclerPage.jsx` | amount≤0 guard |
| `src/pages/TapshiriqlarPage.jsx` | @[uuid] mention format, dropdown fix, assignee_ids support |

### SQL Migrations (run edildi ✅)

| Fayl | Status |
|------|--------|
| `sql/2026_05_creator_status_and_rls.sql` | ✅ Done — is_creator, telegram_chat_id, is_admin() update, OKR RLS fix, bd_head_email seed |
| `sql/2026_05_assignee_ids_migration.sql` | ✅ Done — assignee_ids uuid[], GIN index, sync trigger |
| `sql/2026_05_phases_consolidation.sql` | ✅ Done — phases text[] (jsonb→text[] conversion + cardinality() fix) |

---

## 🚧 PART 2 — DAVAM EDİR

### Tamamlanan

| Fayl | Status |
|------|--------|
| `sql/2026_05_part2_schema.sql` | ✅ Yaradıldı — RUN EDİLMƏYİB hələ |
| `src/pages/TapshiriqlarPage.jsx` | 🔶 7-status COLUMNS + Cancelled handler tamamlandı |

### Part 2 Schema (run edilməmiş — növbəti sessiyada run et)
Fayl: `sql/2026_05_part2_schema.sql`

**tasks** yeni sütunlar:
```sql
start_date date, estimated_duration int, duration_unit text default 'days',
risk_buffer_pct int default 0, is_expertise_subtask boolean default false,
workload_calculated_at timestamptz, cancel_reason text,
parent_task_id uuid references tasks(id),
task_level text default 'task'  -- card|task|subtask
```

**Status migration** (SQL-də var):
```
todo → başlanmayıb | in_progress → İcrada | review → Yoxlamada | done → Tamamlandı
```

**projects** yeni sütunlar: `requires_expertise, expertise_deadline, payment_buffer_days`

**clients** yeni sütunlar: `expected_value, confidence_pct, expected_close_date, lost_reason, archived_at, total_lifetime_value, pipeline_stage`

**Yeni cədvəllər:**
- `activity_log` — universal activity log (entity_type, entity_id, action, field_name, old_value, new_value, is_blame_excluded)
- `closeout_checklists` — smart closeout
- `portfolio_workflows` — portfolio + awards
- `system_awards` — 5 default award (Aga Khan, WAF, Dezeen, Architizer A+, RIBA)
- `client_stage_history` — pipeline stage transitions
- `project_documents` — link-based doc center (share_token built-in)
- `retrospective_surveys` — share token, NPS score
- `templates` — hybrid templates (admin+system defaults)

### TapshiriqlarPage — qalan iş (növbəti sessiyada)

```
COLUMNS (7 status — DONE ✅):
  İdeyalar / başlanmayıb / İcrada / Yoxlamada / Ekspertizada / Tamamlandı / Cancelled

Qalan:
□ "Mənim tapşırıqlarım" view (3-cü view button — IconUser)
  - user.id ilə assignee_ids filter
  - Status qrupları ilə sadə list
  - Drag/drop yox, yalnız read + status dəyiş
□ CancelDialog component (Modal + CANCEL_REASONS radio)
□ Kanban genişliyi: 7 sütun üçün minWidth = 7*280px
□ filterOverdue-da 'Cancelled' tapşırıqları nəzərə alma
□ Status select-də COLUMNS.map istifadəsi artıq düzgündür
```

### MusterilerPage — sıfırdan yazılacaq (növbəti sessiyada)

**Fayl:** `src/pages/MusterilerPage.jsx`  
**Route:** `/musteriler` (App.jsx-də redirect `/sifarisci-idareetme`-dən dəyişdiriləcək)

**3 görünüş:**
1. **Pipeline** — 8 sütunlu Kanban (Lead→İtirildi), drag-drop, confidence % göstər
2. **Cədvəl** — standard table, sort, filter
3. **Detail** — sağ panel slide (Attio model): stats + timeline + layihələr + sənədlər

**Pipeline stages + confidence:**
```
Lead(10%) → Təklif(30%) → Müzakirə(50%) → İmzalanıb(75%) → İcrada(95%) → Bitib → Arxiv → İtirildi(0%)
```

**Stage keçid qaydaları:**
- Mərhələ atlamaq olmaz (məcburi sıra)
- İtirildi: səbəb məcburi (enum)
- Override: yalnız admin + səbəb

**DB:** `clients` cədvəli (mövcud) + `client_stage_history` (yeni)

### MaliyyəMərkeziPage — sıfırdan yazılacaq

**Fayl:** `src/pages/MaliyyeMerkeziPage.jsx`  
**Route:** `/maliyye-merkezi`

**6 tab:**
1. **Cash Cockpit** — nağd vs köçürmə, aylıq trend (recharts BarChart)
2. **P&L** — gəlir vs xərc, net income, margin %
3. **Outsource** — `outsource_user_view` (privacy filter)
4. **Xərclər** — mövcud XerclerPage məzmunu
5. **Debitor** — mövcud DebitorBorclarPage məzmunu
6. **Forecast** — weighted pipeline (clients.expected_value × confidence_pct)

---

## 📋 PART 3 — PLANLANIR (Növbəti sessiya)

- **MIRAI** — 6 admin persona + 1 user persona (Claude Haiku 4.5, $5/ay budget)
  - Admin: Chief Architect, CFO, BD Director, HR Director, Operations, Risk Advisor
  - User: Project Support (yalnız əməliyyati məlumat, maliyyə yox)
  - Spec: `.claude/skills/world-class-tech-team/docs/mirai-spec.md`
- **Telegram onboarding** — token → bot → chat_id flow
- **Təqvim** — Google Calendar parity
- **pgvector RAG** — AZDNT normativ PDF-lər (Supabase pgvector extension)

---

## 🔑 Kritik texniki qeydlər

### Supabase schema qaydaları
- **ZERO DATA LOSS**: heç vaxt `DROP TABLE/COLUMN` — yalnız RENAME + additive
- `array_length()` jsonb-ə işləmir → `cardinality()` istifadə et (text[])
- `ALTER COLUMN TYPE ... USING` içinə subquery yazma → əvvəlcə funksiya yarat
- `ALTER COLUMN TYPE` əvvəl `DROP DEFAULT` etmək lazımdır
- `system_settings` cədvəlinin yalnız `key` və `value` sütunları var (label/description yoxdur)

### Auth + RLS
```js
isCreator = profile?.is_creator === true
isAdmin = isCreator || roleLevel <= 2
```
```sql
is_admin() -- roleLevel ≤ 2 OR is_creator = true
is_creator() -- is_creator = true (yalnız Talifa)
```

### activity_log pattern (universal)
```js
// logActivity.js-dən istifadə et
await logActivity(taskId, userId, act.statusChange(from, to), { old_status, new_status })
// Birbaşa activity_log cədvəlinə yazmaq üçün:
await supabase.from('activity_log').insert({
  entity_type: 'task',  // task|project|client|income|expense
  entity_id: id,
  user_id: userId,
  action: 'status dəyişdi',
  old_value: oldStatus,
  new_value: newStatus,
})
```

### TapshiriqlarPage status sabitləri (v3.0)
```js
const COLUMNS = [
  { key: 'İdeyalar',     label: 'İdeyalar',     color: '#a78bfa', bg: '#faf5ff', border: '#e9d5ff' },
  { key: 'başlanmayıb',  label: 'Başlanmayıb',  color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
  { key: 'İcrada',       label: 'İcrada',       color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'Yoxlamada',    label: 'Yoxlamada',    color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: 'Ekspertizada', label: 'Ekspertizada', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'Tamamlandı',   label: 'Tamamlandı',   color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  { key: 'Cancelled',    label: 'Ləğv edildi',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
]
const CANCEL_REASONS = [
  'Müştəri imtina etdi', 'Layihə dəyişdi', 'Texniki problem',
  'Yenidən planlaşdırılır', 'Digər',
]
```

### Backward planning alqoritmi (Auto Planner)
```js
// Ekspertiza üçün geri hesablama
const paymentBuffer = project.payment_buffer_days || 10
const expertiseFinalDate = subtractBusinessDays(contract_deadline, paymentBuffer)
const expertiseSubmitDate = subtractBusinessDays(expertiseFinalDate, 30 + 10) // wait + revision
const designFinalDate = subtractBusinessDays(expertiseSubmitDate, 3) // print prep
// → designFinalDate = deadline tapşırığın son tarixi
```

### Pipeline confidence (forecast üçün)
```js
const PIPELINE_CONFIDENCE = {
  'Lead': 0.10, 'Təklif': 0.30, 'Müzakirə': 0.50,
  'İmzalanıb': 0.75, 'İcrada': 0.95, 'Bitib': 1.0,
  'Arxiv': 0, 'İtirildi': 0,
}
```

### Outsource privacy filter
```sql
-- view yaradıldı: outsource_user_view
-- amount, paid_at, payment_method intentionally OMITTED
-- Users bu view-dan oxuyur, admins isə outsource_items-dan
```

---

## 🚀 Növbəti sessiyada ilk addımlar

1. `sql/2026_05_part2_schema.sql` — Supabase-də run et
2. **TapshiriqlarPage** qalan iş:
   - `CancelDialog` component əlavə et (fayl yuxarısında)
   - "Mənim tapşırıqlarım" (my tasks) view əlavə et
   - Kanban minWidth 7*280px
3. **MusterilerPage** — sıfırdan yaz
4. **MaliyyeMerkeziPage** — 6 tab consolidated

**Branch:** `claude/pull-main-review-tasks-iDfwh`  
**Base:** `main`
