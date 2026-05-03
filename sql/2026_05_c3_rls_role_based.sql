-- C3: Role-based RLS policies enforced at database level
-- Strategy: SECURITY DEFINER helper avoids RLS recursion when checking roles.
-- Admin (roles.level <= 2) gets full access; non-admins read-only on most tables,
-- write only on their own data.
--
-- IMPORTANT: this migration is INCREMENTAL and idempotent.
-- - DROP POLICY IF EXISTS guards prevent duplicate-policy errors on re-run
-- - ALTER TABLE ENABLE RLS is safe to run multiple times
-- - If any single block fails, the rest will still apply
--
-- Run in Supabase SQL editor. Test access immediately after with a non-admin
-- account before relying on it.

-- ─── Helper function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
      FROM profiles p
      JOIN roles r ON r.id = p.role_id
     WHERE p.id = auth.uid()
       AND r.level <= 2
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Allow authenticated users to call the helper
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ─── profiles: read all (org-wide visibility), edit own row only ──────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin"  ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin"          ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin"          ON profiles;

CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_self_or_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE TO authenticated USING (public.is_admin());

-- ─── salary_history: admin-only (sensitive financial data) ────────────────────
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salary_history_admin_all" ON salary_history;
DROP POLICY IF EXISTS "salary_history_self_read" ON salary_history;

CREATE POLICY "salary_history_admin_all" ON salary_history
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Optionally allow employees to see their own salary history (read-only)
CREATE POLICY "salary_history_self_read" ON salary_history
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

-- ─── performance_reviews: admin write, employee read own ──────────────────────
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "performance_reviews_admin_all" ON performance_reviews;
DROP POLICY IF EXISTS "performance_reviews_self_read" ON performance_reviews;

CREATE POLICY "performance_reviews_admin_all" ON performance_reviews
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "performance_reviews_self_read" ON performance_reviews
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

-- ─── Financial tables: admin-only writes, all-read for transparency ───────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'invoices', 'incomes', 'expenses', 'receivables',
    'internal_transfers', 'owner_loans',
    'subscriptions', 'subscription_payments', 'contracts'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_authenticated" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_admin_write" ON %I', t, t);

    EXECUTE format(
      'CREATE POLICY "%s_select_authenticated" ON %I
         FOR SELECT TO authenticated USING (true)', t, t);

    EXECUTE format(
      'CREATE POLICY "%s_admin_write" ON %I
         FOR ALL TO authenticated
         USING (public.is_admin())
         WITH CHECK (public.is_admin())', t, t);
  END LOOP;
END $$;

-- ─── Operational tables: all authenticated can read+write (team collaboration) ──
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tasks', 'task_checklists', 'task_comments',
    'projects', 'events', 'notices',
    'outsource_works', 'documents', 'proposals'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_authenticated_all" ON %I', t, t);

    EXECUTE format(
      'CREATE POLICY "%s_authenticated_all" ON %I
         FOR ALL TO authenticated
         USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ─── clients: admin write, all read ────────────────────────────────────────────
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_select_all" ON clients;
DROP POLICY IF EXISTS "clients_admin_write" ON clients;

CREATE POLICY "clients_select_all" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clients_admin_write" ON clients
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── leave_requests: self-write, admin override ───────────────────────────────
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave_requests_self_or_admin" ON leave_requests;

CREATE POLICY "leave_requests_self_or_admin" ON leave_requests
  FOR ALL TO authenticated
  USING (member_id = auth.uid() OR public.is_admin())
  WITH CHECK (member_id = auth.uid() OR public.is_admin());

-- ─── notifications: user sees own, admin sees all ─────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_self_or_admin" ON notifications;

CREATE POLICY "notifications_self_or_admin" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ─── system_settings + roles: admin-only ──────────────────────────────────────
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_settings_select_all" ON system_settings;
DROP POLICY IF EXISTS "system_settings_admin_write" ON system_settings;

CREATE POLICY "system_settings_select_all" ON system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "system_settings_admin_write" ON system_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select_all" ON roles;
DROP POLICY IF EXISTS "roles_admin_write" ON roles;

CREATE POLICY "roles_select_all" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "roles_admin_write" ON roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── okrs: all authenticated can read, admin write ────────────────────────────
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "okrs_select_all" ON okrs;
DROP POLICY IF EXISTS "okrs_admin_write" ON okrs;

CREATE POLICY "okrs_select_all" ON okrs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "okrs_admin_write" ON okrs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Verify helper works ──────────────────────────────────────────────────────
-- Run after migration: SELECT public.is_admin();
-- Should return TRUE for admin users, FALSE for non-admins, NULL for anon.
