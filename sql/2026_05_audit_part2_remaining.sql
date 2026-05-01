-- Part 2 audit remaining items: A1, A4, A10, A8-A9, A3, C2 schema additions
-- Run after 2026_05_invoices_extended.sql

-- A1: link incomes back to invoices for auto-create + cascade
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_incomes_invoice_id ON incomes(invoice_id);

-- A10: pipeline lost reason + stage validation metadata
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lost_at     TIMESTAMPTZ;

-- A3: backfill phases array from legacy phase column for any project still using single field
UPDATE projects
   SET phases = ARRAY[phase]::text[]
 WHERE (phases IS NULL OR array_length(phases, 1) IS NULL)
   AND phase IS NOT NULL;

-- A8-A9: holiday calendar for vacation workday computation
CREATE TABLE IF NOT EXISTS holidays (
  date DATE PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common AZ public holidays (2026) — admins can edit later
INSERT INTO holidays (date, name) VALUES
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
ON CONFLICT (date) DO NOTHING;

-- RLS policies for holidays: everyone can read, only admins can write
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holidays_select_all" ON holidays
  FOR SELECT USING (true);

CREATE POLICY "holidays_insert_admin" ON holidays
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "holidays_update_admin" ON holidays
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "holidays_delete_admin" ON holidays
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
