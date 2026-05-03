-- ── phase → phases[] consolidation (2026-05-03) ──────────────────────────────
-- Adds phases text[] to projects and backfills from singular phase column.
-- Keeps phase column (NOT dropped per zero-data-loss rule).
-- Idempotent: safe to re-run.

-- 1. Add phases column or convert from jsonb → text[]
-- CRITICAL: ALTER TABLE ... USING cannot use subqueries, even inside a DO block.
-- Solution: create helper function at top level, call it in USING, then drop it.

CREATE OR REPLACE FUNCTION _tmp_phases_convert(j jsonb)
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN j IS NULL OR j::text = 'null' OR jsonb_array_length(j) = 0
    THEN '{}'::text[]
    ELSE ARRAY(SELECT jsonb_array_elements_text(j))
  END
$$;

-- Add column if missing; convert jsonb→text[] if it already exists as jsonb.
-- Order matters: DROP DEFAULT → ALTER TYPE → SET DEFAULT (Postgres requirement).
DO $$
DECLARE v_type text;
BEGIN
  SELECT data_type INTO v_type
  FROM information_schema.columns
  WHERE table_name = 'projects' AND column_name = 'phases';

  IF v_type IS NULL THEN
    -- Column doesn't exist — add it
    EXECUTE 'ALTER TABLE projects ADD COLUMN phases text[] DEFAULT ''{}''';

  ELSIF v_type = 'jsonb' THEN
    -- Must drop default BEFORE changing type (Postgres 42804 guard)
    EXECUTE 'ALTER TABLE projects ALTER COLUMN phases DROP DEFAULT';
    EXECUTE 'ALTER TABLE projects ALTER COLUMN phases TYPE text[] USING _tmp_phases_convert(phases)';
    EXECUTE 'ALTER TABLE projects ALTER COLUMN phases SET DEFAULT ''{}''';
  END IF;
  -- If already text[] → nothing to do
END $$;

DROP FUNCTION IF EXISTS _tmp_phases_convert(jsonb);

-- 2. Backfill: where phases is empty but phase exists
UPDATE projects
   SET phases = ARRAY[phase]
 WHERE phase IS NOT NULL
   AND (phases IS NULL OR cardinality(phases) = 0);

-- 3. Trigger: keep phase in sync with first element of phases on write
CREATE OR REPLACE FUNCTION sync_project_phase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phases IS NOT NULL AND cardinality(NEW.phases) > 0 THEN
    NEW.phase := NEW.phases[1];
  ELSIF NEW.phase IS NOT NULL AND (NEW.phases IS NULL OR cardinality(NEW.phases) = 0) THEN
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
-- SELECT count(*) FILTER (WHERE phase IS NOT NULL AND (phases IS NULL OR cardinality(phases)=0)) AS mismatched
-- FROM projects;
-- Should be 0.
