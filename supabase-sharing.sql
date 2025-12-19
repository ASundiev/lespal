-- ============================================
-- Student-Teacher Sharing Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 0. Create user_profiles table for roles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 0a. Isolated Secrets table for sensitive API keys
CREATE TABLE IF NOT EXISTS user_secrets (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_secrets ENABLE ROW LEVEL SECURITY;

-- user_profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Teachers can view student profiles" ON user_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM teacher_students WHERE teacher_id = auth.uid() AND student_id = user_profiles.id));

-- user_secrets Policies
CREATE POLICY "Users can manage own secrets" ON user_secrets FOR ALL USING (auth.uid() = id);

-- Teachers can view their students' secrets (to run AI on student data)
CREATE POLICY "Teachers can view student secrets" ON user_secrets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_students 
      WHERE teacher_id = auth.uid() AND student_id = user_secrets.id
    )
  );

-- Students can view their teacher's secrets (to use teacher's API key)
CREATE POLICY "Students can view teacher secrets" ON user_secrets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_students 
      WHERE student_id = auth.uid() AND teacher_id = user_secrets.id
    )
  );

-- ============================================

-- 1. Create teacher_students relationship table
CREATE TABLE IF NOT EXISTS teacher_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- 2. Create invite_codes table for linking
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 3. Enable RLS on new tables
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- 4. RLS for teacher_students
CREATE POLICY "Teachers can view their students" ON teacher_students
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view their teachers" ON teacher_students
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create relationships via invite" ON teacher_students
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 5. RLS for invite_codes
CREATE POLICY "Teachers can manage their codes" ON invite_codes
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Anyone can view unused codes to redeem" ON invite_codes
  FOR SELECT USING (used_by IS NULL AND expires_at > NOW());

CREATE POLICY "Students can mark codes as used" ON invite_codes
  FOR UPDATE USING (used_by IS NULL) 
  WITH CHECK (auth.uid() = used_by);

-- ============================================
-- 6. Update songs RLS to allow teacher access
-- ============================================

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view their own songs" ON songs;

-- Create new policy: owner OR their teacher
CREATE POLICY "Owner or teacher can view songs" ON songs
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM teacher_students 
      WHERE teacher_id = auth.uid() AND student_id = songs.user_id
    )
  );

-- Teachers can also update student songs
CREATE POLICY "Teachers can update student songs" ON songs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teacher_students 
      WHERE teacher_id = auth.uid() AND student_id = songs.user_id
    )
  );

-- Teachers can insert songs for students
CREATE POLICY "Teachers can insert student songs" ON songs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM teacher_students 
      WHERE teacher_id = auth.uid() AND student_id = songs.user_id
    )
  );

-- ============================================
-- 7. Update lessons RLS to allow teacher access
-- ============================================

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view their own lessons" ON lessons;

-- Create new policy: owner OR their teacher
CREATE POLICY "Owner or teacher can view lessons" ON lessons
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM teacher_students 
      WHERE teacher_id = auth.uid() AND student_id = lessons.user_id
    )
  );

-- Teachers can also update student lessons
CREATE POLICY "Teachers can update student lessons" ON lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teacher_students 
      WHERE teacher_id = auth.uid() AND student_id = lessons.user_id
    )
  );

-- Teachers can insert lessons for students
CREATE POLICY "Teachers can insert student lessons" ON lessons
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM teacher_students 
      WHERE teacher_id = auth.uid() AND student_id = lessons.user_id
    )
  );

-- ============================================
-- Done with schema! 
-- ============================================

-- ============================================
-- BOOTSTRAP: Set first teacher role
-- Run this AFTER molodov.guitarschool@gmail.com signs up
-- ============================================
-- UPDATE user_profiles 
-- SET role = 'teacher' 
-- WHERE email = 'molodov.guitarschool@gmail.com';
-- ============================================
