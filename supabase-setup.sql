-- ============================================
-- Supabase Schema Setup for Lespal
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  status TEXT CHECK (status IN ('rehearsing', 'want', 'studied', 'recorded')),
  tabs_link TEXT,
  video_link TEXT,
  recording_link TEXT,
  artwork_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE,
  notes TEXT,
  topics TEXT,  -- Comma-separated song IDs (for compatibility)
  link TEXT,
  audio_url TEXT,
  remaining_lessons TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for songs
CREATE POLICY "Users can view their own songs" ON songs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own songs" ON songs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own songs" ON songs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own songs" ON songs
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create RLS Policies for lessons
CREATE POLICY "Users can view their own lessons" ON lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lessons" ON lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lessons" ON lessons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lessons" ON lessons
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Done! You can now use the app.
-- ============================================
