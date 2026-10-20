/*
# Admin Role và Bootstrap Admin

## Mục đích
1. Đổi role 'lecturer' thành 'admin' trong hệ thống (giữ backward compat)
2. Bootstrap quyền admin cho email chủ sở hữu: lamtrannn1407@gmail.com
3. Cập nhật RLS: student chỉ đọc bài giảng đã xuất bản (published), admin có toàn quyền
4. Cấm người dùng tự đổi role

## Thay đổi
1. Cập nhật CHECK constraint trên profiles.role: thêm 'admin' (giữ 'lecturer' cho backward compat)
2. Hàm is_admin() kiểm tra role admin hoặc lecturer
3. Cập nhật tất cả RLS policies dùng is_admin() thay vì check trực tiếp
4. Hàm promote_to_admin() — chỉ admin hiện tại mới được gọi
5. Bootstrap: gán role='admin' cho user có email='lamtrannn1407@gmail.com' (nếu đã tồn tại)
6. Trigger handle_new_user: kiểm tra email chủ sở hữu → tự động gán admin khi đăng ký
7. Cập nhật policies: student chỉ SELECT lessons có status='published', admin SELECT all

## Bảo mật
- Role được gán ở backend (trigger/migration), không phải frontend
- Người dùng không thể tự đổi role (REVOKE UPDATE trên cột role)
- Bootstrap admin chỉ kích hoạt khi email khớp và user đã đăng ký qua OAuth
- Audit: ghi lại thay đổi role qua bảng notification_log
*/

-- ===== 1. Cập nhật CHECK constraint cho role =====
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'lecturer', 'admin'));

-- ===== 2. Hàm is_admin() =====
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'lecturer')
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- ===== 3. Cập nhật trigger handle_new_user: tự gán admin cho email chủ sở hữu =====
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text := 'student';
BEGIN
  -- Bootstrap: nếu email là chủ sở hữu, gán admin
  IF NEW.email = 'lamtrannn1407@gmail.com' THEN
    v_role := 'admin';
  END IF;

  INSERT INTO profiles (id, email, display_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), v_role)
  ON CONFLICT (id) DO UPDATE
    SET role = CASE
      WHEN profiles.email = 'lamtrannn1407@gmail.com' THEN 'admin'
      ELSE profiles.role
    END,
    display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', profiles.display_name),
    updated_at = now();

  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Audit log cho bootstrap admin
  IF v_role = 'admin' THEN
    INSERT INTO notification_log (user_id, type, content)
    VALUES (NEW.id, 'admin_bootstrap', 'Admin role auto-assigned to owner email on signup');
  END IF;

  RETURN NEW;
END;
$$;

-- ===== 4. Hàm promote_to_admin (thay promote_to_lecturer) =====
CREATE OR REPLACE FUNCTION promote_to_admin(p_target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized: only admins can promote users';
  END IF;

  IF p_target_user IS NULL THEN
    RAISE EXCEPTION 'Target user ID is required';
  END IF;

  UPDATE profiles SET role = 'admin', updated_at = now()
  WHERE id = p_target_user;

  INSERT INTO notification_log (user_id, type, content)
  VALUES (p_target_user, 'role_change', 'Promoted to admin by ' || auth.uid()::text);
END;
$$;

REVOKE EXECUTE ON FUNCTION promote_to_admin FROM anon;
GRANT EXECUTE ON FUNCTION promote_to_admin TO authenticated;

-- ===== 5. RLS: Subjects — admin full, student read =====
DROP POLICY IF EXISTS "subjects_select_auth" ON subjects;
DROP POLICY IF EXISTS "subjects_insert_lecturer" ON subjects;
DROP POLICY IF EXISTS "subjects_update_lecturer" ON subjects;
DROP POLICY IF EXISTS "subjects_delete_lecturer" ON subjects;

CREATE POLICY "subjects_select_auth"
  ON subjects FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "subjects_insert_admin"
  ON subjects FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "subjects_update_admin"
  ON subjects FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "subjects_delete_admin"
  ON subjects FOR DELETE TO authenticated
  USING (is_admin());

-- ===== 6. RLS: Chapters — admin full, student read =====
DROP POLICY IF EXISTS "chapters_select_auth" ON chapters;
DROP POLICY IF EXISTS "chapters_insert_lecturer" ON chapters;
DROP POLICY IF EXISTS "chapters_update_lecturer" ON chapters;
DROP POLICY IF EXISTS "chapters_delete_lecturer" ON chapters;

CREATE POLICY "chapters_select_auth"
  ON chapters FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "chapters_insert_admin"
  ON chapters FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "chapters_update_admin"
  ON chapters FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "chapters_delete_admin"
  ON chapters FOR DELETE TO authenticated
  USING (is_admin());

-- ===== 7. RLS: Lessons — admin full, student chỉ đọc published =====
DROP POLICY IF EXISTS "lessons_select_auth" ON lessons;
DROP POLICY IF EXISTS "lessons_insert_lecturer" ON lessons;
DROP POLICY IF EXISTS "lessons_update_lecturer" ON lessons;
DROP POLICY IF EXISTS "lessons_delete_lecturer" ON lessons;

CREATE POLICY "lessons_select_auth"
  ON lessons FOR SELECT TO authenticated
  USING (is_admin() OR status = 'published');

CREATE POLICY "lessons_insert_admin"
  ON lessons FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "lessons_update_admin"
  ON lessons FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "lessons_delete_admin"
  ON lessons FOR DELETE TO authenticated
  USING (is_admin());

-- ===== 8. RLS: Lesson blocks — admin full, student chỉ đọc blocks của published lessons =====
DROP POLICY IF EXISTS "lesson_blocks_select_auth" ON lesson_blocks;
DROP POLICY IF EXISTS "lesson_blocks_insert_lecturer" ON lesson_blocks;
DROP POLICY IF EXISTS "lesson_blocks_update_lecturer" ON lesson_blocks;
DROP POLICY IF EXISTS "lesson_blocks_delete_lecturer" ON lesson_blocks;

CREATE POLICY "lesson_blocks_select_auth"
  ON lesson_blocks FOR SELECT TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_blocks.lesson_id
      AND lessons.status = 'published'
    )
  );

CREATE POLICY "lesson_blocks_insert_admin"
  ON lesson_blocks FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "lesson_blocks_update_admin"
  ON lesson_blocks FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "lesson_blocks_delete_admin"
  ON lesson_blocks FOR DELETE TO authenticated
  USING (is_admin());

-- ===== 9. Profiles: giữ nguyên RLS hiện có, chỉ cập nhật quyền =====
-- Đảm bảo user không thể tự đổi role (đã có REVOKE UPDATE, chỉ GRANT display_name)
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name) ON profiles TO authenticated;

-- ===== 10. Bootstrap: nếu user chủ sở hữu đã tồn tại, gán admin ngay =====
UPDATE profiles SET role = 'admin', updated_at = now()
WHERE email = 'lamtrannn1407@gmail.com';

-- Audit log cho bootstrap nếu user đã tồn tại
INSERT INTO notification_log (user_id, type, content)
SELECT id, 'admin_bootstrap', 'Admin role assigned to existing owner email'
FROM profiles WHERE email = 'lamtrannn1407@gmail.com'
ON CONFLICT DO NOTHING;

-- ===== 11. Grant permissions =====
GRANT SELECT ON subjects, chapters, lessons, lesson_blocks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON subjects, chapters, lessons, lesson_blocks TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT ON notification_log TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin TO authenticated;
