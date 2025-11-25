-- Create page_content table if not exists
-- Run this in Supabase SQL Editor

-- 1. Create table
CREATE TABLE IF NOT EXISTS page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'general',
  title TEXT,
  content TEXT,
  html_content TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_content_category ON page_content(category);
CREATE INDEX IF NOT EXISTS idx_page_content_page_key ON page_content(page_key);
CREATE INDEX IF NOT EXISTS idx_page_content_published ON page_content(published);

-- 3. Enable RLS
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "Public can view published content" ON page_content;
DROP POLICY IF EXISTS "Anyone can view all page content" ON page_content;

-- 5. Create public read policy
CREATE POLICY "Public read all page content"
ON page_content
FOR SELECT
TO public
USING (true);

-- 6. Create admin policies
CREATE POLICY "Authenticated users can insert page content"
ON page_content
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update page content"
ON page_content
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete page content"
ON page_content
FOR DELETE
TO authenticated
USING (true);

-- 7. Insert default home page content if empty
INSERT INTO page_content (page_key, category, title, content, published)
VALUES 
  ('site_visi', 'home', 'Visi OSIS', 'Menjadi organisasi siswa yang inovatif, kreatif, dan berprestasi', true),
  ('site_misi', 'home', 'Misi OSIS', '1. Meningkatkan kualitas kegiatan siswa\n2. Membentuk karakter siswa yang unggul\n3. Membangun solidaritas antar siswa', true),
  ('site_about', 'home', 'Tentang OSIS', 'OSIS SMK Informatika Fithrah Insani adalah organisasi siswa intra sekolah yang bertujuan untuk mengembangkan potensi siswa.', true),
  ('site_ketua', 'home', 'Ketua OSIS', 'Ahmad Fauzi', true)
ON CONFLICT (page_key) DO NOTHING;

-- 8. Verify
SELECT * FROM page_content ORDER BY page_key;
