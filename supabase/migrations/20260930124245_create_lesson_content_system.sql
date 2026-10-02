/*
# Create lesson content block system (single-tenant, no auth)

## Overview
Creates a hierarchical content system for an educational admin panel:
Subjects → Chapters → Lessons → Lesson Blocks.

Single-tenant admin app with no sign-in — data is intentionally shared.

## New Tables
1. subjects — id, name, description, color, sort_order, created_at, updated_at
2. chapters — id, subject_id (FK), name, description, sort_order, created_at, updated_at
3. lessons — id, chapter_id (FK), name, description, duration, status, sort_order, created_at, updated_at
4. lesson_blocks — id, lesson_id (FK), block_type, order_index, data (jsonb), created_at, updated_at

## Security
- RLS enabled on all tables.
- TO anon, authenticated with USING (true) / WITH CHECK (true) — single-tenant, intentionally public.
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE).
*/

-- ===== Subjects =====
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'violet',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_subjects" ON subjects;
CREATE POLICY "anon_select_subjects" ON subjects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_subjects" ON subjects;
CREATE POLICY "anon_insert_subjects" ON subjects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_subjects" ON subjects;
CREATE POLICY "anon_update_subjects" ON subjects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_subjects" ON subjects;
CREATE POLICY "anon_delete_subjects" ON subjects FOR DELETE
  TO anon, authenticated USING (true);

-- ===== Chapters =====
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chapters" ON chapters;
CREATE POLICY "anon_select_chapters" ON chapters FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chapters" ON chapters;
CREATE POLICY "anon_insert_chapters" ON chapters FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_chapters" ON chapters;
CREATE POLICY "anon_update_chapters" ON chapters FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chapters" ON chapters;
CREATE POLICY "anon_delete_chapters" ON chapters FOR DELETE
  TO anon, authenticated USING (true);

-- ===== Lessons =====
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '20 phút',
  status text NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
CREATE POLICY "anon_select_lessons" ON lessons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lessons" ON lessons;
CREATE POLICY "anon_insert_lessons" ON lessons FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lessons" ON lessons;
CREATE POLICY "anon_update_lessons" ON lessons FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lessons" ON lessons;
CREATE POLICY "anon_delete_lessons" ON lessons FOR DELETE
  TO anon, authenticated USING (true);

-- ===== Lesson Blocks =====
CREATE TABLE IF NOT EXISTS lesson_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  block_type text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lesson_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lesson_blocks" ON lesson_blocks;
CREATE POLICY "anon_select_lesson_blocks" ON lesson_blocks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lesson_blocks" ON lesson_blocks;
CREATE POLICY "anon_insert_lesson_blocks" ON lesson_blocks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lesson_blocks" ON lesson_blocks;
CREATE POLICY "anon_update_lesson_blocks" ON lesson_blocks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lesson_blocks" ON lesson_blocks;
CREATE POLICY "anon_delete_lesson_blocks" ON lesson_blocks FOR DELETE
  TO anon, authenticated USING (true);

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson_id ON lesson_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_order ON lesson_blocks(lesson_id, order_index);

-- ===== updated_at trigger function =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subjects_updated_at ON subjects;
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS chapters_updated_at ON chapters;
CREATE TRIGGER chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lessons_updated_at ON lessons;
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lesson_blocks_updated_at ON lesson_blocks;
CREATE TRIGGER lesson_blocks_updated_at BEFORE UPDATE ON lesson_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
