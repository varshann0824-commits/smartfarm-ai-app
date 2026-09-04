/*
# Create farm_tasks and crop_analyses tables (single-tenant, no auth)

1. New Tables
- `farm_tasks`: stores farmer-created tasks like irrigation, fertilizer, inspection, harvest
  - id (uuid PK)
  - task_type (text: irrigation, fertilizer, inspection, pest_monitoring, harvest, other)
  - title (text, not null)
  - task_date (date, not null)
  - task_time (text, nullable)
  - repeat_type (text: none, daily, weekly, monthly)
  - notes (text, nullable)
  - status (text: pending, completed)
  - created_at (timestamptz)
- `crop_analyses`: stores crop health analysis history
  - id (uuid PK)
  - crop (text, not null)
  - problem (text, not null)
  - confidence (text, nullable)
  - symptoms (text, nullable)
  - causes (text, nullable)
  - recommendations (text, nullable)
  - created_at (timestamptz)

2. Security
- Both tables use single-tenant RLS (no auth, anon + authenticated CRUD)
- Data is intentionally shared/public for this no-auth app
*/

CREATE TABLE IF NOT EXISTS farm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  task_date date NOT NULL,
  task_time text,
  repeat_type text NOT NULL DEFAULT 'none',
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE farm_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_farm_tasks" ON farm_tasks;
CREATE POLICY "anon_select_farm_tasks" ON farm_tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_farm_tasks" ON farm_tasks;
CREATE POLICY "anon_insert_farm_tasks" ON farm_tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_farm_tasks" ON farm_tasks;
CREATE POLICY "anon_update_farm_tasks" ON farm_tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_farm_tasks" ON farm_tasks;
CREATE POLICY "anon_delete_farm_tasks" ON farm_tasks FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS crop_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop text NOT NULL,
  problem text NOT NULL,
  confidence text,
  symptoms text,
  causes text,
  recommendations text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crop_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_crop_analyses" ON crop_analyses;
CREATE POLICY "anon_select_crop_analyses" ON crop_analyses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_crop_analyses" ON crop_analyses;
CREATE POLICY "anon_insert_crop_analyses" ON crop_analyses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_crop_analyses" ON crop_analyses;
CREATE POLICY "anon_delete_crop_analyses" ON crop_analyses FOR DELETE
  TO anon, authenticated USING (true);
