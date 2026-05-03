-- ============================================================
-- MIRAI SCHEMA — Reflect Architects OS
-- Zero Data Loss — Additive only
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. mirai_sessions ────────────────────────────────────
create table if not exists mirai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  persona text default 'chief_architect',  -- cfo|hr|coo|cco|cmo|chief_architect
  page_context text,
  entity_type text,
  entity_id uuid,
  compressed_history jsonb default '[]',   -- xülasə (10 mesajdan sonra)
  created_at timestamptz default now(),
  last_active_at timestamptz default now()
);
create index if not exists idx_mirai_sessions_user on mirai_sessions(user_id, last_active_at desc);
alter table mirai_sessions enable row level security;
drop policy if exists "mirai_sessions_own" on mirai_sessions;
create policy "mirai_sessions_own" on mirai_sessions
  for all using (auth.uid() = user_id);

-- ── 2. mirai_messages ────────────────────────────────────
create table if not exists mirai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references mirai_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool')),
  content text not null,
  tool_calls jsonb,
  tool_results jsonb,
  tokens_input int default 0,
  tokens_output int default 0,
  cost_usd numeric(10,6) default 0,
  cached boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_mirai_messages_session on mirai_messages(session_id, created_at asc);
alter table mirai_messages enable row level security;
drop policy if exists "mirai_messages_own" on mirai_messages;
create policy "mirai_messages_own" on mirai_messages
  for all using (
    session_id in (select id from mirai_sessions where user_id = auth.uid())
  );

-- ── 3. mirai_usage ───────────────────────────────────────
create table if not exists mirai_usage (
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  request_count int default 0,
  token_input_total int default 0,
  token_output_total int default 0,
  cost_usd numeric(10,6) default 0,
  primary key (user_id, date)
);
alter table mirai_usage enable row level security;
drop policy if exists "mirai_usage_own" on mirai_usage;
drop policy if exists "mirai_usage_admin_read" on mirai_usage;
create policy "mirai_usage_own" on mirai_usage
  for all using (auth.uid() = user_id);
create policy "mirai_usage_admin_read" on mirai_usage
  for select using (public.is_admin());

-- ── 4. mirai_knowledge (RAG — Phase 3b) ──────────────────
-- Requires pgvector extension to be enabled first:
-- Dashboard → Database → Extensions → vector → Enable
-- Then uncomment below:
--
-- create extension if not exists vector;
--
-- create table if not exists mirai_knowledge (
--   id uuid primary key default gen_random_uuid(),
--   source_type text,          -- law | normative | practice | case
--   source_name text,
--   content text,
--   embedding vector(1536),
--   locale text default 'az',
--   valid_from date,
--   valid_until date,
--   tags text[],
--   created_at timestamptz default now()
-- );
-- create index on mirai_knowledge using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);
-- alter table mirai_knowledge enable row level security;
-- create policy "mirai_knowledge_read" on mirai_knowledge for select using (true);

-- ── 5. performance_surveys ───────────────────────────────
create table if not exists performance_surveys (
  id uuid primary key default gen_random_uuid(),
  survey_year int not null,
  subject_user_id uuid references profiles(id) on delete cascade,
  reviewer_user_id uuid references profiles(id) on delete set null,
  scores jsonb default '{}',   -- {teamwork:4, quality:5, deadline:3, communication:4}
  comment text,
  manager_review text,
  final_score numeric(4,2),
  created_at timestamptz default now()
);
create index if not exists idx_perf_surveys_subject on performance_surveys(subject_user_id, survey_year);
alter table performance_surveys enable row level security;
drop policy if exists "perf_surveys_admin" on performance_surveys;
drop policy if exists "perf_surveys_own_year_end" on performance_surveys;
create policy "perf_surveys_admin" on performance_surveys
  for all using (public.is_admin());
-- Workers see own scores only (admin manually shares)
create policy "perf_surveys_own_year_end" on performance_surveys
  for select using (auth.uid() = subject_user_id);

-- ── 6. telegram_notifications ────────────────────────────
-- Extends existing notification log with MIRAI-specific fields
create table if not exists telegram_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references profiles(id) on delete set null,
  telegram_chat_id text,
  message_text text not null,
  trigger_type text default 'proactive',  -- proactive|deadline|cash|blocked|outsource
  entity_type text,                        -- project|task|client|finance
  entity_id uuid,
  sent_at timestamptz default now(),
  read_at timestamptz,
  mirai_generated boolean default true,
  error_message text
);
create index if not exists idx_tg_notifications_user on telegram_notifications(recipient_user_id, sent_at desc);
alter table telegram_notifications enable row level security;
drop policy if exists "tg_notifications_admin" on telegram_notifications;
create policy "tg_notifications_admin" on telegram_notifications
  for all using (public.is_admin());

-- ── 7. Verification ──────────────────────────────────────
select
  (select count(*) from mirai_sessions)         as mirai_sessions,
  (select count(*) from mirai_messages)         as mirai_messages,
  (select count(*) from mirai_usage)            as mirai_usage,
  (select count(*) from performance_surveys)    as performance_surveys,
  (select count(*) from telegram_notifications) as telegram_notifications;
