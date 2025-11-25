-- Create gallery table
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  sekbid_id INTEGER REFERENCES public.sekbid(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_event_id ON public.gallery(event_id);
CREATE INDEX IF NOT EXISTS idx_gallery_sekbid_id ON public.gallery(sekbid_id);
CREATE INDEX IF NOT EXISTS idx_gallery_created_by ON public.gallery(created_by);

-- Enable RLS
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view gallery" ON public.gallery;
DROP POLICY IF EXISTS "Authenticated users can insert gallery" ON public.gallery;
DROP POLICY IF EXISTS "Users can update own gallery" ON public.gallery;
DROP POLICY IF EXISTS "Users can delete own gallery" ON public.gallery;
DROP POLICY IF EXISTS "Service role full access" ON public.gallery;

-- Public can view all gallery items
CREATE POLICY "Public can view gallery"
  ON public.gallery FOR SELECT
  USING (true);

-- Authenticated users can insert gallery items
CREATE POLICY "Authenticated users can insert gallery"
  ON public.gallery FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update gallery items
CREATE POLICY "Authenticated can update gallery"
  ON public.gallery FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete gallery items
CREATE POLICY "Authenticated can delete gallery"
  ON public.gallery FOR DELETE
  TO authenticated
  USING (true);

-- Sample data
INSERT INTO public.gallery (title, description, image_url, sekbid_id) VALUES
('Kegiatan Jumat Berkah', 'Kegiatan rutin setiap hari Jumat', 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=800', 1),
('Pelatihan Leadership', 'Workshop kepemimpinan untuk pengurus OSIS', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', 2),
('Lomba Cerdas Cermat', 'Kompetisi antar kelas tingkat sekolah', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', 3),
('Bakti Sosial', 'Kegiatan sosial di panti asuhan', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800', 4),
('Pentas Seni', 'Pertunjukan seni dan budaya', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', 5),
('Dokumentasi Kegiatan', 'Foto bersama pengurus OSIS', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', 6),
('Upacara Bendera', 'Upacara rutin setiap Senin pagi', 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800', 1),
('Workshop IT', 'Pelatihan teknologi informasi', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800', 3)
ON CONFLICT DO NOTHING;
