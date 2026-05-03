-- ── phase → phases[] consolidation (2026-05-03) ──────────────────────────────
-- Adds phases text[] to projects and backfills from singular phase column.
-- Keeps phase column (NOT dropped per zero-data-loss rule).
-- Idempotent: safe to re-run.

-- 1. Add phases array column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phases text[] DEFAULT '{}';

-- 2. Backfill: where phases is empty but phase exists
UPDATE projects
   SET phases = ARRAY[phase]
 WHERE phase IS NOT NULL
   AND (phases IS NULL OR array_length(phases, 1) IS NULL OR array_length(phases, 1) = 0);

-- 3. Trigger: keep phase in sync with first element of phases on write
CREATE OR REPLACE FUNCTION sync_project_phase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phases IS NOT NULL AND array_length(NEW.phases, 1) > 0 THEN
    NEW.phase := NEW.phases[1];
  ELSIF NEW.phase IS NOT NULL
    AND (NEW.phases IS NULL OR array_length(NEW.phases, 1) IS NULL) THEN
    NEW.phases := ARRAY[NEW.phase];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_sync_phase ON projects;
CREATE TRIGGER projects_sync_phase
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION sync_project_phase();

-- 4. Parity check (run manually after migration):
-- SELECT count(*) FILTER (WHERE phase IS NOT NULL AND (phases IS NULL OR array_length(phases,1)=0)) AS mismatched
-- FROM projects;
-- Should be 0.
