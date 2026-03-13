-- Supabase Schema for Shaykh Abdelrahman Website
-- Run this in your Supabase SQL Editor

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotations table (Mushaf annotations per student)
CREATE TABLE IF NOT EXISTS annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  verse_key TEXT,
  start_offset INTEGER DEFAULT 0,
  end_offset INTEGER DEFAULT 0,
  comment TEXT,
  color TEXT DEFAULT '#ef4444',
  is_temporary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading progress table (single user)
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  last_page INTEGER DEFAULT 1,
  last_surah INTEGER DEFAULT 1,
  last_ayah INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_annotations_student ON annotations(student_id);
CREATE INDEX IF NOT EXISTS idx_annotations_page ON annotations(student_id, page_number);

-- Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Policies: students and annotations writable by authenticated users only
CREATE POLICY "Students are manageable by authenticated users"
  ON students FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Annotations are manageable by authenticated users"
  ON annotations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies: reading_progress writable by authenticated users only
CREATE POLICY "Reading progress is manageable by authenticated users"
  ON reading_progress FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- User bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_key TEXT NOT NULL,
  chapter_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_key)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_verse ON user_bookmarks(user_id, verse_key);

ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bookmarks"
  ON user_bookmarks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
