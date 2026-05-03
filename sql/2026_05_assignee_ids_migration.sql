-- ── assignee_id → assignee_ids migration (2026-05-03) ────────────────────────
-- Adds assignee_ids[] column to tasks and backfills from assignee_id.
-- Keeps assignee_id for backward compat (NOT dropped per zero-data-loss rule).
-- Idempotent: safe to re-run.

-- 1. Add assignee_ids column if missing
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_ids uuid[] DEFAULT '{}';

-- 2. Backfill: where assignee_ids is empty but assignee_id exists
UPDATE tasks
   SET assignee_ids = ARRAY[assignee_id]
 WHERE assignee_id IS NOT NULL
   AND (assignee_ids IS NULL OR array_length(assignee_ids, 1) IS NULL OR array_length(assignee_ids, 1) = 0);

-- 3. Index for fast lookup by any assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_ids ON tasks USING GIN (assignee_ids);

-- 4. Trigger: keep assignee_id in sync with first element of assignee_ids on write
--    This prevents the antipattern from causing divergence if old code writes only assignee_id.
CREATE OR REPLACE FUNCTION sync_assignee_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If assignee_ids updated: sync assignee_id to first element
  IF NEW.assignee_ids IS NOT NULL AND array_length(NEW.assignee_ids, 1) > 0 THEN
    NEW.assignee_id := NEW.assignee_ids[1];
  -- If assignee_id updated and assignee_ids empty: sync
  ELSIF NEW.assignee_id IS NOT NULL
    AND (NEW.assignee_ids IS NULL OR array_length(NEW.assignee_ids, 1) IS NULL) THEN
    NEW.assignee_ids := ARRAY[NEW.assignee_id];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_sync_assignee ON tasks;
CREATE TRIGGER tasks_sync_assignee
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION sync_assignee_id();

-- 5. Parity check (run manually after migration):
-- SELECT
--   count(*) FILTER (WHERE assignee_id IS NOT NULL AND (assignee_ids IS NULL OR array_length(assignee_ids,1)=0)) AS mismatched,
--   count(*) FILTER (WHERE assignee_id IS NOT NULL) AS with_assignee
-- FROM tasks;
-- mismatched should be 0.
