-- Create program_kerja table for OSIS work programs
-- Run this in Supabase SQL Editor if table doesn't exist

CREATE TABLE IF NOT EXISTS program_kerja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sekbid_id INTEGER REFERENCES sekbid(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_program_kerja_sekbid ON program_kerja(sekbid_id);
CREATE INDEX IF NOT EXISTS idx_program_kerja_status ON program_kerja(status);
CREATE INDEX IF NOT EXISTS idx_program_kerja_dates ON program_kerja(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE program_kerja ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view all program kerja
CREATE POLICY "Public can view program_kerja"
  ON program_kerja FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert
CREATE POLICY "Authenticated users can insert program_kerja"
  ON program_kerja FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users (admins) can update
CREATE POLICY "Authenticated users can update program_kerja"
  ON program_kerja FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only authenticated users (admins) can delete
CREATE POLICY "Authenticated users can delete program_kerja"
  ON program_kerja FOR DELETE
  USING (auth.role() = 'authenticated');

-- Add some sample data (optional)
INSERT INTO program_kerja (title, description, sekbid_id, start_date, end_date, status)
VALUES 
  ('Pesantren Kilat Ramadhan', 'Program pesantren kilat selama bulan Ramadhan untuk siswa', 1, '2025-03-01', '2025-03-15', 'planned'),
  ('Pelatihan Kepemimpinan', 'Program pelatihan kepemimpinan untuk calon pengurus OSIS', 2, '2025-02-10', '2025-02-12', 'planned'),
  ('Olimpiade Sains Sekolah', 'Kompetisi sains tingkat sekolah', 3, '2025-04-01', '2025-04-05', 'planned'),
  ('Bakti Sosial', 'Program bakti sosial ke panti asuhan', 4, '2025-05-01', '2025-05-02', 'planned'),
  ('Kreativitas Seni', 'Lomba seni dan kreativitas siswa', 5, '2025-06-01', '2025-06-10', 'planned'),
  ('Dokumentasi Kegiatan', 'Program dokumentasi semua kegiatan sekolah', 6, '2025-01-01', '2025-12-31', 'ongoing')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE program_kerja IS 'Tabel untuk menyimpan program kerja OSIS per sekbid';
COMMENT ON COLUMN program_kerja.status IS 'Status: planned, ongoing, completed, cancelled';
