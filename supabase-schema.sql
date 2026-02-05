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

-- Library apps table
CREATE TABLE IF NOT EXISTS library_apps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT NOT NULL DEFAULT '',
  description_en TEXT,
  icon_url TEXT,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
ALTER TABLE library_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Policies: library_apps is readable by everyone, writable by authenticated users
CREATE POLICY "Library apps are publicly readable"
  ON library_apps FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Library apps are writable by authenticated users"
  ON library_apps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

-- Storage bucket for library app HTML files
-- Note: Create a bucket named "library-apps" in Supabase Dashboard > Storage
-- Set it as PUBLIC for the files to be accessible via iframe
-- Allowed MIME types: text/html, image/png, image/jpeg, image/svg+xml, image/webp
