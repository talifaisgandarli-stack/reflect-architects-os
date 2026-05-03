-- Part 2 audit remaining items: A1, A4, A10, A8-A9, A3, C2 schema additions
-- Run after 2026_05_invoices_extended.sql

-- A1: link incomes back to invoices for auto-create + cascade
alter table incomes add column if not exists invoice_id uuid references invoices(id) on delete cascade;
create index if not exists idx_incomes_invoice_id on incomes(invoice_id);

-- A10: pipeline lost reason + stage validation metadata
alter table clients add column if not exists lost_reason text;
alter table clients add column if not exists lost_at     timestamptz;

-- A3: backfill phases array from legacy phase column
-- phases is text[] (converted by 2026_05_phases_consolidation.sql), not jsonb
update projects
   set phases = array[phase]::text[]
 where (phases is null or cardinality(phases) = 0)
   and phase is not null;

-- A8-A9: holiday calendar for vacation workday computation
create table if not exists holidays (
  date date primary key,
  name text not null,
  created_at timestamptz default now()
);

insert into holidays (date, name) values
  ('2026-01-01', 'Yeni İl'),
  ('2026-01-02', 'Yeni İl (2)'),
  ('2026-01-20', '20 Yanvar — Ümumxalq Hüzn günü'),
  ('2026-03-08', 'Beynəlxalq Qadınlar günü'),
  ('2026-03-20', 'Novruz bayramı'),
  ('2026-03-21', 'Novruz bayramı'),
  ('2026-03-22', 'Novruz bayramı'),
  ('2026-03-23', 'Novruz bayramı'),
  ('2026-03-24', 'Novruz bayramı'),
  ('2026-05-09', 'Faşizm üzərində qələbə günü'),
  ('2026-05-28', 'Müstəqillik günü'),
  ('2026-06-15', 'Milli Qurtuluş günü'),
  ('2026-06-26', 'Silahlı Qüvvələr günü'),
  ('2026-10-18', 'Müstəqilliyin bərpası günü'),
  ('2026-11-09', 'Dövlət Bayrağı günü'),
  ('2026-11-12', 'Konstitusiya günü')
on conflict (date) do nothing;

alter table holidays enable row level security;

drop policy if exists "holidays_select_all"    on holidays;
drop policy if exists "holidays_insert_admin"  on holidays;
drop policy if exists "holidays_update_admin"  on holidays;
drop policy if exists "holidays_delete_admin"  on holidays;

create policy "holidays_select_all" on holidays for select using (true);
-- No INSERT/UPDATE/DELETE policies — only service_role (bypasses RLS) can mutate.
