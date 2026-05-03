-- ============================================================
-- PART 2 SCHEMA MIGRATION — Reflect Architects OS
-- Zero Data Loss — Additive only (no DROP TABLE/COLUMN)
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. tasks — new columns ────────────────────────────────
alter table tasks
  add column if not exists start_date date,
  add column if not exists estimated_duration int,
  add column if not exists duration_unit text default 'days' check (duration_unit in ('days','weeks')),
  add column if not exists risk_buffer_pct int default 0,
  add column if not exists is_expertise_subtask boolean default false,
  add column if not exists workload_calculated_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists parent_task_id uuid references tasks(id),
  add column if not exists task_level text default 'task' check (task_level in ('card','task','subtask'));

-- ── 2. Status migration (old → new values) ───────────────
do $$
declare
  v_todo int; v_in_progress int; v_review int; v_done int; v_archived int;
begin
  select count(*) into v_todo        from tasks where status = 'todo';
  select count(*) into v_in_progress from tasks where status = 'in_progress';
  select count(*) into v_review      from tasks where status = 'review';
  select count(*) into v_done        from tasks where status = 'done';
  select count(*) into v_archived    from tasks where status = 'archived';
  raise notice 'BEFORE — todo: %, in_progress: %, review: %, done: %, archived: %',
    v_todo, v_in_progress, v_review, v_done, v_archived;
end $$;

update tasks set status = 'başlanmayıb' where status = 'todo';
update tasks set status = 'İcrada'      where status = 'in_progress';
update tasks set status = 'Yoxlamada'   where status = 'review';
update tasks set status = 'Tamamlandı'  where status = 'done';
update tasks set status = 'Tamamlandı'  where status = 'archived' and archived_at is not null;

do $$
declare v_total int;
begin
  select count(*) into v_total from tasks
  where status not in ('İdeyalar','başlanmayıb','İcrada','Yoxlamada','Ekspertizada','Tamamlandı','Cancelled');
  if v_total > 0 then
    raise warning 'UNMAPPED STATUSES: % rows still have old status values', v_total;
  else
    raise notice 'STATUS MIGRATION OK — all rows mapped';
  end if;
end $$;

-- ── 3. projects — new columns ────────────────────────────
alter table projects
  add column if not exists requires_expertise boolean default false,
  add column if not exists expertise_deadline date,
  add column if not exists payment_buffer_days int default 10;

-- ── 4. clients — new columns ─────────────────────────────
alter table clients
  add column if not exists expected_value numeric,
  add column if not exists confidence_pct numeric,
  add column if not exists expected_close_date date,
  add column if not exists lost_reason text,
  add column if not exists archived_at timestamptz,
  add column if not exists total_lifetime_value numeric,
  add column if not exists pipeline_stage text default 'Lead';

-- ── 5. activity_log ──────────────────────────────────────
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  field_name text,
  old_value text,
  new_value text,
  metadata jsonb default '{}',
  is_blame_excluded boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_activity_log_entity  on activity_log(entity_type, entity_id);
create index if not exists idx_activity_log_user    on activity_log(user_id);
create index if not exists idx_activity_log_created on activity_log(created_at desc);

alter table activity_log enable row level security;
drop policy if exists "activity_log_read"   on activity_log;
drop policy if exists "activity_log_insert" on activity_log;
create policy "activity_log_read"   on activity_log for select using (true);
create policy "activity_log_insert" on activity_log for insert with check (auth.uid() is not null);

-- ── 6. closeout_checklists ───────────────────────────────
create table if not exists closeout_checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  items jsonb default '[]',
  closed_at timestamptz,
  closed_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
alter table closeout_checklists enable row level security;
drop policy if exists "closeout_rw" on closeout_checklists;
create policy "closeout_rw" on closeout_checklists for all using (auth.uid() is not null);

-- ── 7. portfolio_workflows ───────────────────────────────
create table if not exists portfolio_workflows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  checklist_items jsonb default '[]',
  selected_awards jsonb default '[]',
  website_publish_date date,
  press_release_planned boolean default false,
  created_at timestamptz default now()
);
alter table portfolio_workflows enable row level security;
drop policy if exists "portfolio_rw" on portfolio_workflows;
create policy "portfolio_rw" on portfolio_workflows for all using (auth.uid() is not null);

-- ── 8. system_awards ─────────────────────────────────────
create table if not exists system_awards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text,
  category text,
  application_url text,
  deadline_month int,
  description text,
  is_active boolean default true
);
alter table system_awards enable row level security;
drop policy if exists "system_awards_read" on system_awards;
create policy "system_awards_read" on system_awards for select using (true);

insert into system_awards (name, region, category, application_url, deadline_month, description) values
  ('Aga Khan Award for Architecture', 'Global', 'Architecture', 'https://www.akdn.org/architecture', 3, '3 illik mükafat. 100+ ölkədən nominasiyalar.'),
  ('World Architecture Festival (WAF)', 'Global', 'Architecture', 'https://www.worldarchitecturefestival.com', 6, 'İllik. Layihə kateqoriyaları üzrə.'),
  ('Dezeen Awards', 'Global', 'Architecture & Design', 'https://www.dezeen.com/awards', 5, 'İllik mükafat. Online nominasiya.'),
  ('Architizer A+ Awards', 'Global', 'Architecture', 'https://architizer.com/awards', 1, 'İllik. Professional + Popular.'),
  ('RIBA Awards', 'UK/Global', 'Architecture', 'https://www.architecture.com/awards', 2, 'Royal Institute of British Architects. İllik.')
on conflict (name) do nothing;

-- ── 9. client_stage_history ──────────────────────────────
create table if not exists client_stage_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  changed_at timestamptz default now(),
  changed_by uuid references profiles(id) on delete set null,
  notes text
);
create index if not exists idx_stage_history_client on client_stage_history(client_id, changed_at desc);
alter table client_stage_history enable row level security;
drop policy if exists "stage_history_read"   on client_stage_history;
drop policy if exists "stage_history_insert" on client_stage_history;
create policy "stage_history_read"   on client_stage_history for select using (auth.uid() is not null);
create policy "stage_history_insert" on client_stage_history for insert with check (auth.uid() is not null);

-- ── 10. project_documents ────────────────────────────────
create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  category text not null,
  title text not null,
  external_link text,
  internal_file_url text,
  source text default 'drive_link',
  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  created_by uuid references profiles(id) on delete set null
);
create index if not exists idx_project_docs_project on project_documents(project_id);
create index if not exists idx_project_docs_client  on project_documents(client_id);
alter table project_documents enable row level security;
drop policy if exists "project_docs_rw"           on project_documents;
drop policy if exists "project_docs_public_share" on project_documents;
create policy "project_docs_rw"           on project_documents for all    using (auth.uid() is not null);
create policy "project_docs_public_share" on project_documents for select using (share_token is not null);

-- ── 11. retrospective_surveys ────────────────────────────
create table if not exists retrospective_surveys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  template_id uuid,
  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  sent_at timestamptz,
  responded_at timestamptz,
  ratings jsonb default '{}',
  comment text,
  nps_score int check (nps_score >= 0 and nps_score <= 10),
  created_at timestamptz default now(),
  created_by uuid references profiles(id) on delete set null
);
alter table retrospective_surveys enable row level security;
drop policy if exists "surveys_auth_rw"        on retrospective_surveys;
drop policy if exists "surveys_public_respond" on retrospective_surveys;
create policy "surveys_auth_rw"        on retrospective_surveys for all    using (auth.uid() is not null);
create policy "surveys_public_respond" on retrospective_surveys for update using (share_token is not null)
  with check (responded_at is not null);

-- ── 12. templates ─────────────────────────────────────────
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  subcategory text,
  name text not null,
  language text default 'az',
  body_html text,
  variables jsonb default '[]',
  is_default boolean default false,
  is_active boolean default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique(category, name, language)
);
alter table templates enable row level security;
drop policy if exists "templates_read"  on templates;
drop policy if exists "templates_write" on templates;
create policy "templates_read"  on templates for select using (true);
create policy "templates_write" on templates for all    using (public.is_admin());

insert into templates (category, name, language, is_default, body_html, variables) values
  ('survey', 'Standart Retrospektiv Anket', 'az', true,
   '<h2>{{project_name}} — Əməkdaşlıq qiymətləndirməsi</h2><p>Hörmətli {{client_name}}, layihəmizi tamamladıq. Sizin rəyiniz bizim üçün çox vacibdir.</p>',
   '[{"key":"project_name","label":"Layihə adı","required":true},{"key":"client_name","label":"Müştəri adı","required":true}]'),
  ('letter', 'Standart İş Məktubu', 'az', true,
   '<p>{{date}}</p><p>Hörmətli {{recipient_name}},</p><p>{{body}}</p><p>Hörmətlə,<br>{{sender_name}}<br>{{company_name}}</p>',
   '[{"key":"date","label":"Tarix","required":true},{"key":"recipient_name","label":"Alıcı adı","required":true},{"key":"body","label":"Məktub mətni","required":true},{"key":"sender_name","label":"Göndərən","required":true},{"key":"company_name","label":"Şirkət adı","required":true}]')
on conflict (category, name, language) do nothing;

-- ── 13. outsource_user_view (privacy filter) ─────────────
-- Exposes only non-financial columns from outsource_works
create or replace view outsource_user_view as
select
  id, name, outsource_type, project_id,
  work_type, phase,
  planned_deadline, actual_deadline, followup_date,
  work_status, notes, created_at
  -- contract_amount, total_paid, payment_status, payment_method intentionally omitted
from outsource_works;

-- ── 14. Verification ─────────────────────────────────────
select
  (select count(*) from activity_log)           as activity_log,
  (select count(*) from closeout_checklists)    as closeout_checklists,
  (select count(*) from portfolio_workflows)    as portfolio_workflows,
  (select count(*) from system_awards)          as system_awards,
  (select count(*) from client_stage_history)   as client_stage_history,
  (select count(*) from project_documents)      as project_documents,
  (select count(*) from retrospective_surveys)  as retrospective_surveys,
  (select count(*) from templates)              as templates;

do $$
declare
  v_tasks_total  int;
  v_valid        int;
begin
  select count(*) into v_tasks_total from tasks;
  select count(*) into v_valid from tasks
  where status in ('İdeyalar','başlanmayıb','İcrada','Yoxlamada','Ekspertizada','Tamamlandı','Cancelled');
  if v_tasks_total = v_valid then
    raise notice 'PARITY CHECK PASSED — all % tasks have valid statuses', v_tasks_total;
  else
    raise warning 'PARITY CHECK FAILED — % tasks total, % have valid statuses', v_tasks_total, v_valid;
  end if;
end $$;
