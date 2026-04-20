-- ═══════════════════════════════════════════════
-- REFLECT ARCHITECTS OS — VERİLƏNLƏR BAZASI
-- Supabase SQL Editor-ə yapışdırın → Run
-- ═══════════════════════════════════════════════

-- 1. ROLLAR (dinamik, əlavə/sil/dəyiş mümkün)
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_az text not null,
  level int default 5,
  is_outsource boolean default false,
  created_at timestamptz default now()
);

insert into roles (title, title_az, level) values
  ('Founding Architect & CEO', 'Təsisçi Memarı və CEO', 1),
  ('Senior Associate', 'Baş Əməkdaş', 2),
  ('Project Manager', 'Layihə Rəhbəri', 3),
  ('Project Architect', 'Layihə Memarı', 3),
  ('Architect', 'Memar', 4),
  ('Junior Architect', 'Kiçik Memar', 5),
  ('Architectural Assistant', 'Memar Köməkçisi', 6),
  ('Head of BD & Community', 'Biznes İnkişaf Rəhbəri', 2),
  ('Junior BDM', 'Kiçik BD Menecer', 4),
  ('Graphic Designer', 'Qrafik Dizayner', 5)
on conflict do nothing;

-- Outsource rolu
insert into roles (title, title_az, level, is_outsource) values
  ('Outsource Specialist', 'Müqavilə Mütəxəssisi', 9, true)
on conflict do nothing;

-- 2. İSTİFADƏÇİ PROFİLLƏRİ
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role_id uuid references roles(id),
  department text,
  monthly_salary numeric(12,2) default 0,
  hourly_rate numeric(8,2) default 0,
  joining_date date,
  whatsapp_number text,
  is_active boolean default true,
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. İCAZƏ MATRİSİ (dinamik)
create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references roles(id) on delete cascade,
  section text not null,
  access_level text default 'none' check (access_level in ('full', 'readonly', 'own', 'none')),
  unique(role_id, section)
);

-- Founding Architect — tam giriş
insert into role_permissions (role_id, section, access_level)
select r.id, s.section, 'full'
from roles r
cross join (values
  ('dashboard'),('layiheler'),('tapshiriqlar'),('is-ucotu'),('icazeler'),
  ('sifarisci-idareetme'),('pipeline'),('kommersiya-teklifleri'),('muqavileler'),('portfel'),
  ('daxilolmalar'),('hesab-fakturalar'),('xercler'),('podrat-isleri'),
  ('debitor-borclar'),('daxili-kocurmeler'),('tesisci-borclari'),('hesabatlar'),('sabit-xercler'),
  ('isci-heyeti'),('emek-haqqi'),('elanlar'),('hadiseler'),('mezuniyyet'),('avadanliq'),
  ('hedef-netice'),('mezmun-planlamasi'),('sened-arxivi'),('qaynaqlar'),
  ('parametrler'),('sistem-arxivi')
) as s(section)
where r.title = 'Founding Architect & CEO'
on conflict do nothing;

-- Senior Associate & Project Manager
insert into role_permissions (role_id, section, access_level)
select r.id, s.section, s.access_level
from roles r
cross join (values
  ('dashboard','full'),('layiheler','full'),('tapshiriqlar','full'),('is-ucotu','full'),
  ('icazeler','full'),('sifarisci-idareetme','full'),('pipeline','full'),
  ('kommersiya-teklifleri','full'),('muqavileler','full'),('portfel','full'),
  ('daxilolmalar','full'),('hesab-fakturalar','full'),('xercler','full'),
  ('podrat-isleri','full'),('debitor-borclar','full'),('hesabatlar','full'),('sabit-xercler','full'),
  ('daxili-kocurmeler','none'),('tesisci-borclari','none'),('emek-haqqi','none'),
  ('isci-heyeti','readonly'),('elanlar','full'),('hadiseler','full'),
  ('mezuniyyet','full'),('avadanliq','readonly'),
  ('hedef-netice','readonly'),('mezmun-planlamasi','full'),
  ('sened-arxivi','full'),('qaynaqlar','full'),('parametrler','readonly'),('sistem-arxivi','none')
) as s(section, access_level)
where r.title in ('Senior Associate', 'Project Manager')
on conflict do nothing;

-- Architect / Junior Architect — öz məlumatları
insert into role_permissions (role_id, section, access_level)
select r.id, s.section, s.access_level
from roles r
cross join (values
  ('dashboard','readonly'),('layiheler','own'),('tapshiriqlar','own'),
  ('is-ucotu','own'),('icazeler','readonly'),('portfel','readonly'),
  ('elanlar','readonly'),('hadiseler','readonly'),('mezuniyyet','own'),
  ('podrat-isleri','readonly'),('sened-arxivi','readonly'),('qaynaqlar','full')
) as s(section, access_level)
where r.title in ('Architect','Junior Architect','Architectural Assistant','Project Architect')
on conflict do nothing;

-- Outsource — yalnız öz portalı
insert into role_permissions (role_id, section, access_level)
select r.id, 'tapshiriqlar', 'own'
from roles r where r.is_outsource = true
on conflict do nothing;

-- 4. MÜŞTƏRİLƏR (Sifarişçilər)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  project_type text,
  status text default 'lead' check (status in ('lead','proposal','in_progress','completed','archived')),
  priority text default 'medium' check (priority in ('high','medium','low')),
  last_contact date,
  notes text,
  created_at timestamptz default now()
);

-- 5. LAYİHƏLƏR
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid references clients(id),
  contract_value numeric(12,2) default 0,
  advance_paid numeric(12,2) default 0,
  status text default 'waiting' check (status in ('waiting','active','on_hold','completed')),
  risk_level text default 'normal' check (risk_level in ('critical','attention','normal')),
  phase text default 'concept' check (phase in ('concept','working_drawings','expertise','author_supervision')),
  completion_percent numeric(5,2) default 0,
  deadline date,
  start_date date,
  lead_architect uuid references profiles(id),
  vat_included boolean default false,
  vat_amount numeric(12,2) default 0,
  blocker text,
  next_action text,
  notes text,
  payment_method text default 'transfer' check (payment_method in ('transfer','cash')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. TAPŞIRIQLAR
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project_id uuid references projects(id) on delete cascade,
  assignee_id uuid references profiles(id),
  status text default 'not_started' check (status in ('not_started','in_progress','done','cancelled')),
  priority text default 'medium' check (priority in ('high','medium','low')),
  due_date date,
  completed_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 7. DAXİLOLMALAR
create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_id uuid references projects(id),
  client_id uuid references clients(id),
  amount numeric(12,2) not null default 0,
  payment_date date,
  payment_method text default 'transfer',
  income_type text default 'general' check (income_type in ('general','invoice_payment')),
  month date,
  notes text,
  created_at timestamptz default now()
);

-- 8. XƏRCLƏR
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  amount numeric(12,2) not null default 0,
  expense_date date,
  payment_method text default 'transfer',
  project_id uuid references projects(id),
  team_member_id uuid references profiles(id),
  monthly_budget numeric(12,2) default 0,
  notes text,
  created_at timestamptz default now()
);

-- 9. HESAB-FAKTURALAR
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid references clients(id),
  project_id uuid references projects(id),
  project_estimate numeric(12,2) default 0,
  invoice_date date,
  payment_date date,
  month date,
  status text default 'draft' check (status in ('draft','sent','paid','overdue')),
  notes text,
  created_at timestamptz default now()
);

-- 10. PODRAT İŞLƏRİ
create table if not exists outsource_works (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  outsource_type text default 'company' check (outsource_type in ('company','individual')),
  project_id uuid references projects(id),
  work_type text,
  phase text,
  contract_amount numeric(12,2) default 0,
  total_paid numeric(12,2) default 0,
  -- Mərhələlər
  paid_30_percent boolean default false,
  paid_30_date date,
  interim_payment numeric(12,2) default 0,
  interim_date date,
  paid_final_10 boolean default false,
  paid_final_10_date date,
  client_approval_date date,
  -- Status
  payment_status text default 'not_started' check (payment_status in ('not_started','30_paid','interim_paid','hold_10','fully_closed')),
  payment_method text default 'transfer',
  contract_number text,
  -- Deadlinlər
  planned_deadline date,
  actual_deadline date,
  followup_date date,
  work_status text default 'not_started' check (work_status in ('not_started','in_progress','completed','overdue')),
  notes text,
  created_at timestamptz default now()
);

-- 11. DEBİTOR BORCLAR (Alacaqlar)
create table if not exists receivables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_id uuid references projects(id),
  client_id uuid references clients(id),
  expected_amount numeric(12,2) default 0,
  paid_amount numeric(12,2) default 0,
  expected_date date,
  reminder_date date,
  contact_person text,
  paid boolean default false,
  paid_date date,
  notes text,
  created_at timestamptz default now()
);

-- 12. DAXİLİ KÖÇÜRMƏLƏr
create table if not exists internal_transfers (
  id uuid primary key default gen_random_uuid(),
  from_project_id uuid references projects(id),
  to_project_id uuid references projects(id),
  amount numeric(12,2) not null default 0,
  transfer_date date,
  reason text,
  return_deadline date,
  returned_date date,
  returned boolean default false,
  status text default 'open' check (status in ('open','returned','problematic')),
  approved_by uuid references profiles(id),
  notes text,
  created_at timestamptz default now()
);

-- 13. TƏSİSÇİ BORCLARI
create table if not exists owner_loans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  payment_date date,
  amount numeric(12,2) not null default 0,
  payment_type text default 'cash' check (payment_type in ('cash','transfer')),
  notes text,
  created_at timestamptz default now()
);

-- 14. SABİT XƏRCLƏR (Abunəliklər)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12,2) not null default 0,
  frequency text default 'monthly' check (frequency in ('monthly','yearly','quarterly')),
  sub_type text,
  cycle_start_date date,
  next_payment_date date,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- 15. ELANLAR LÖVHƏSİ
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  priority text default 'normal' check (priority in ('urgent','normal','info')),
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- 16. BİLDİRİŞ AYARLARI (AI Agent ON/OFF)
create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value boolean default true,
  label text,
  description text,
  updated_at timestamptz default now()
);

insert into notification_settings (key, value, label, description) values
  ('agent_enabled', true, 'AI Agent', 'Bütün avtomatik bildirişlər'),
  ('daily_summary', true, 'Günlük xülasə', 'Hər gün saat 08:00'),
  ('deadline_warnings', true, 'Deadline xəbərdarlıqları', '3 gün, 1 gün, deadline günü'),
  ('meeting_reminders', true, 'Görüş xatırlatmaları', '24 saat + 1 saat əvvəl'),
  ('outsource_deadlines', true, 'Podrat deadline', '7, 3, 1 gün əvvəl'),
  ('finance_alerts', true, 'Maliyyə bildirişləri', 'Yalnız Founding Architect'),
  ('transfer_reminders', true, 'Köçürmə xatırlatması', '60 gün limitinə yaxınlaşanda'),
  ('weekly_report', false, 'Həftəlik hesabat', 'Hər Cümə saat 17:00'),
  ('monthly_report', false, 'Aylıq icmal', 'Hər ayın 1-i'),
  ('whatsapp_auto', true, 'WhatsApp avtomatik', 'Avtomatik bildirişlər WhatsApp-a'),
  ('whatsapp_manual', true, 'WhatsApp manual', 'Sistem daxilindən manual mesaj')
on conflict (key) do nothing;

-- ═══════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════

alter table profiles enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table clients enable row level security;
alter table incomes enable row level security;
alter table expenses enable row level security;
alter table invoices enable row level security;
alter table outsource_works enable row level security;
alter table receivables enable row level security;
alter table internal_transfers enable row level security;
alter table owner_loans enable row level security;
alter table subscriptions enable row level security;
alter table notices enable row level security;
alter table roles enable row level security;
alter table role_permissions enable row level security;
alter table notification_settings enable row level security;

-- Hər istifadəçi öz profilini görür
create policy "Own profile" on profiles for all using (auth.uid() = id);

-- Rolları hamı görür
create policy "Roles readable" on roles for select using (auth.role() = 'authenticated');
create policy "Permissions readable" on role_permissions for select using (auth.role() = 'authenticated');

-- Bildiriş ayarları — hamı oxuya bilər, yalnız admin dəyişə bilər
create policy "Notif settings read" on notification_settings for select using (auth.role() = 'authenticated');

-- Layihələr — autentifikasiya olunmuş istifadəçilər
create policy "Projects access" on projects for all using (auth.role() = 'authenticated');
create policy "Tasks access" on tasks for all using (auth.role() = 'authenticated');
create policy "Clients access" on clients for all using (auth.role() = 'authenticated');
create policy "Incomes access" on incomes for all using (auth.role() = 'authenticated');
create policy "Expenses access" on expenses for all using (auth.role() = 'authenticated');
create policy "Invoices access" on invoices for all using (auth.role() = 'authenticated');
create policy "Outsource access" on outsource_works for all using (auth.role() = 'authenticated');
create policy "Receivables access" on receivables for all using (auth.role() = 'authenticated');
create policy "Transfers access" on internal_transfers for all using (auth.role() = 'authenticated');
create policy "Owner loans access" on owner_loans for all using (auth.role() = 'authenticated');
create policy "Subscriptions access" on subscriptions for all using (auth.role() = 'authenticated');
create policy "Notices access" on notices for all using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════
-- AUTO UPDATED_AT TRİGGERI
-- ═══════════════════════════════════════════════
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════
-- PROFİL AUTO-CREATE (istifadəçi qeydiyyatında)
-- ═══════════════════════════════════════════════
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ═══════════════════════════════════════════════
-- NÜMUNƏ MƏLUMATLAR — Reflect Architects
-- ═══════════════════════════════════════════════

-- Sifarişçilər
insert into clients (name, contact_person, phone, status, priority, project_type) values
  ('Qarabağ Atçılıq Kompleksi', 'İlham bəy', '+994501234567', 'in_progress', 'high', 'Commercial'),
  ('Hacıkənd Qubadlı', 'Rəşad bəy', '+994502345678', 'in_progress', 'high', 'Residential'),
  ('Eyvazxanbəyli', 'Elnur bəy', '+994503456789', 'in_progress', 'medium', 'Residential'),
  ('Ağbənd Layihəsi', 'Tural bəy', '+994504567890', 'in_progress', 'medium', 'Infrastructure'),
  ('Xankəndi', 'Nicat bəy', '+994505678901', 'waiting', 'low', 'Residential'),
  ('Seabreeze Canyon', 'Anar bəy', '+994506789012', 'in_progress', 'high', 'Resort'),
  ('Şuşa Butik Otel', 'Leyla xanım', '+994507890123', 'in_progress', 'high', 'Hospitality'),
  ('Ağ Şəhər', 'Kamran bəy', '+994508901234', 'waiting', 'medium', 'Mixed Use')
on conflict do nothing;

select 'Reflect Architects OS — verilənlər bazası uğurla yaradıldı!' as result;
