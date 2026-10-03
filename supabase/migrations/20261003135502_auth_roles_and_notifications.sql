/*
# Authentication, Roles, and Notification System

## Overview
Adds user profiles with role-based access control (student/lecturer), notification preferences,
notification log, and a trigger to auto-create profiles on signup.

## New Tables

1. **profiles**
   - `id` (uuid, PK, references auth.users) — one-to-one with auth users
   - `email` (text, unique) — copied from auth.users on signup
   - `display_name` (text) — user-chosen display name
   - `role` (text, default 'student') — 'student' or 'lecturer'
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

2. **notification_preferences**
   - `user_id` (uuid, PK, references auth.users) — one-to-one with user
   - `email_notifications_enabled` (boolean, default true)
   - `push_notifications_enabled` (boolean, default false)
   - `daily_reminder_enabled` (boolean, default false)
   - `daily_reminder_time` (text, default '19:00')
   - `weekly_report_enabled` (boolean, default false)
   - `timezone` (text, default 'Asia/Ho_Chi_Minh')
   - `theme_primary` (text, default 'black') — 'black' or 'white'
   - `theme_secondary` (text, default 'white')
   - `push_subscription` (jsonb, nullable) — Web Push subscription data
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

3. **notification_log**
   - `id` (uuid, PK)
   - `user_id` (uuid, references auth.users)
   - `type` (text) — 'daily_reminder', 'email', 'push', 'weekly_report'
   - `content` (text)
   - `sent_at` (timestamptz, default now())
   - `status` (text, default 'sent')

## Security

### profiles
- RLS enabled
- Users can read their own profile (SELECT WHERE auth.uid() = id)
- Users can update their own display_name only (column-level: REVOKE UPDATE on role, email)
- role column is NOT user-writable — only admin/lecturer promotion via SECURITY DEFINER function
- SELECT on profiles is open to authenticated users (so students can see lecturer info) but role column is visible

### notification_preferences
- RLS enabled
- Users can CRUD only their own preferences (user_id = auth.uid())
- user_id defaults to auth.uid()

### notification_log
- RLS enabled
- Users can read only their own logs
- INSERT only via edge function (service role key)

## Functions

1. **handle_new_user()** — trigger function that creates a profile row on signup
   - Copies email from auth.users
   - Sets role = 'student' by default
   - Creates notification_preferences row

2. **promote_to_lecturer(target_user uuid)** — SECURITY DEFINER function
   - Checks if caller is already a lecturer (via auth.uid())
   - If yes, promotes target_user to 'lecturer'
   - Students cannot call this to self-promote
*/

-- ===== profiles table =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'lecturer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can only change display_name, NOT role or email
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name) ON profiles TO authenticated;

-- ===== notification_preferences table =====
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  push_notifications_enabled boolean NOT NULL DEFAULT false,
  daily_reminder_enabled boolean NOT NULL DEFAULT false,
  daily_reminder_time text NOT NULL DEFAULT '19:00',
  weekly_report_enabled boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  theme_primary text NOT NULL DEFAULT 'black',
  theme_secondary text NOT NULL DEFAULT 'white',
  push_subscription jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs_select_own" ON notification_preferences;
CREATE POLICY "notif_prefs_select_own"
  ON notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_prefs_insert_own" ON notification_preferences;
CREATE POLICY "notif_prefs_insert_own"
  ON notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_prefs_update_own" ON notification_preferences;
CREATE POLICY "notif_prefs_update_own"
  ON notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== notification_log table =====
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  content text NOT NULL DEFAULT '',
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'sent'
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_log_select_own" ON notification_log;
CREATE POLICY "notif_log_select_own"
  ON notification_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notif_log_user_date ON notification_log (user_id, sent_at);

-- ===== Trigger: auto-create profile + preferences on signup =====
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), 'student')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===== SECURITY DEFINER: promote_to_lecturer =====
-- Only existing lecturers can promote others to lecturer
CREATE OR REPLACE FUNCTION promote_to_lecturer(p_target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check that the CALLER is a lecturer
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'
  ) THEN
    RAISE EXCEPTION 'Not authorized: only lecturers can promote users';
  END IF;

  IF p_target_user IS NULL THEN
    RAISE EXCEPTION 'Target user ID is required';
  END IF;

  UPDATE profiles SET role = 'lecturer', updated_at = now()
  WHERE id = p_target_user;
END;
$$;

REVOKE EXECUTE ON FUNCTION promote_to_lecturer FROM anon;
GRANT EXECUTE ON FUNCTION promote_to_lecturer TO authenticated;

-- ===== Update existing content tables: restrict writes to lecturers =====
-- Students can READ all content but cannot write
-- Lecturers can read and write all content

-- Drop old anon policies on subjects
DROP POLICY IF EXISTS "anon_select_subjects" ON subjects;
DROP POLICY IF EXISTS "anon_insert_subjects" ON subjects;
DROP POLICY IF EXISTS "anon_update_subjects" ON subjects;
DROP POLICY IF EXISTS "anon_delete_subjects" ON subjects;

-- Subjects: authenticated can read, only lecturers can write
CREATE POLICY "subjects_select_auth"
  ON subjects FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "subjects_insert_lecturer"
  ON subjects FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer')
  );

CREATE POLICY "subjects_update_lecturer"
  ON subjects FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'));

CREATE POLICY "subjects_delete_lecturer"
  ON subjects FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'));

-- Chapters
DROP POLICY IF EXISTS "anon_select_chapters" ON chapters;
DROP POLICY IF EXISTS "anon_insert_chapters" ON chapters;
DROP POLICY IF EXISTS "anon_update_chapters" ON chapters;
DROP POLICY IF EXISTS "anon_delete_chapters" ON chapters;

CREATE POLICY "chapters_select_auth"
  ON chapters FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "chapters_insert_lecturer"
  ON chapters FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer')
  );

CREATE POLICY "chapters_update_lecturer"
  ON chapters FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'));

CREATE POLICY "chapters_delete_lecturer"
  ON chapters FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'));

-- Lessons
DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_insert_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_update_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_delete_lessons" ON lessons;

CREATE POLICY "lessons_select_auth"
  ON lessons FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "lessons_insert_lecturer"
  ON lessons FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer')
  );

CREATE POLICY "lessons_update_lecturer"
  ON lessons FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'));

CREATE POLICY "lessons_delete_lecturer"
  ON lessons FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'));

-- Lesson blocks
DROP POLICY IF EXISTS "anon_select_lesson_blocks" ON lesson_blocks;
DROP POLICY IF EXISTS "anon_insert_lesson_blocks" ON lesson_blocks;
DROP POLICY IF EXISTS "anon_update_lesson_blocks" ON lesson_blocks;
DROP POLICY IF EXISTS "anon_delete_lesson_blocks" ON lesson_blocks;

CREATE POLICY "lesson_blocks_select_auth"
  ON lesson_blocks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "lesson_blocks_insert_lecturer"
  ON lesson_blocks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer')
  );

CREATE POLICY "lesson_blocks_update_lecturer"
  ON lesson_blocks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'));

CREATE POLICY "lesson_blocks_delete_lecturer"
  ON lesson_blocks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer'));

-- Revoke anon access on all content tables (auth required now)
REVOKE ALL ON subjects FROM anon;
REVOKE ALL ON chapters FROM anon;
REVOKE ALL ON lessons FROM anon;
REVOKE ALL ON lesson_blocks FROM anon;

GRANT SELECT ON subjects TO authenticated;
GRANT SELECT ON chapters TO authenticated;
GRANT SELECT ON lessons TO authenticated;
GRANT SELECT ON lesson_blocks TO authenticated;

GRANT INSERT, UPDATE, DELETE ON subjects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON chapters TO authenticated;
GRANT INSERT, UPDATE, DELETE ON lessons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON lesson_blocks TO authenticated;

-- Grant on profiles and notification tables
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT ON notification_log TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_lecturer TO authenticated;
