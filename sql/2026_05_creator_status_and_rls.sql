-- ── Creator status + RLS hardening (2026-05-03) ──────────────────────────────
-- Adds is_creator flag to profiles for platform founder (Talifa)
-- Adds telegram_chat_id for Telegram onboarding (Sprint 1 prep)
-- Fixes OKR RLS: users see only personal OKRs (employee_id = own)
--
-- Run in Supabase SQL editor.
-- No data loss: additive only.
-- Idempotent: safe to re-run.

-- ── 1. Add is_creator column to profiles ─────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_creator boolean DEFAULT false;

-- ── 2. Add Telegram fields to profiles ───────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id bigint;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_linked_at timestamptz;

-- ── 3. Update is_admin() helper to include creator bypass ────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
      FROM profiles p
      JOIN roles r ON r.id = p.role_id
     WHERE p.id = auth.uid()
       AND (r.level <= 2 OR p.is_creator = true)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 4. Add is_creator() helper ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_creator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
     WHERE id = auth.uid() AND is_creator = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin()   TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_creator() TO authenticated;

-- ── 5. Fix OKR policy: users see ONLY personal OKRs ─────────────────────────
-- (okrs table: employee_id nullable — null = company OKR, set = personal OKR)
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "okrs_select_all"           ON okrs;
DROP POLICY IF EXISTS "okrs_admin_write"           ON okrs;
DROP POLICY IF EXISTS "okrs_select_role_based"     ON okrs;
DROP POLICY IF EXISTS "okrs_write_role_based"      ON okrs;

-- Admins see all OKRs; users see only OKRs where employee_id = their own ID
CREATE POLICY "okrs_select_role_based" ON okrs
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR employee_id = auth.uid()
  );

-- Only admins can write OKRs
CREATE POLICY "okrs_write_role_based" ON okrs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 6. Set creator flag for Talifa (replace email with actual email) ─────────
-- Run this manually after confirming Talifa's email:
-- UPDATE profiles SET is_creator = true WHERE email = 'talifa@reflect.az';

-- ── 7. Seed system_settings for bd_head_email ────────────────────────────────
-- Set real email after running this migration
INSERT INTO system_settings (key, value)
VALUES ('bd_head_email', '')
ON CONFLICT (key) DO NOTHING;

-- ── Verification ──────────────────────────────────────────────────────────────
-- SELECT public.is_admin();    -- true for admins
-- SELECT public.is_creator();  -- true only for Talifa
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('is_creator','telegram_chat_id');
