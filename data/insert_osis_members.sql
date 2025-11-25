-- Clean insertion script for OSIS members (deduplicated)
-- Adjust table/column names to match your schema before running.
BEGIN;

-- Ensure table exists
CREATE TABLE IF NOT EXISTS osis_members (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	role TEXT NOT NULL,
	sekbid INT,
	active BOOLEAN DEFAULT true,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint if not exists (required for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'osis_members_name_role_unique'
  ) THEN
    ALTER TABLE osis_members ADD CONSTRAINT osis_members_name_role_unique UNIQUE (name, role);
  END IF;
END $$;

-- Bulk upsert (avoids duplicate insertions if run multiple times)
INSERT INTO osis_members (name, role, sekbid, active)
VALUES
('Novel Windu Fajrian','Ketua OSIS',NULL,true),
('Qaila Nusaybah Amani','Wakil Ketua',NULL,true),
('Irsyad Muthi Amrullah','Sekretaris',NULL,true),
('Fatiya Kayisah Az-Zahra','Bendahara',NULL,true),
('Nazmia Tsakib Hanani','Anggota',1,true),
('Muhammad Irsyad Kaamil Pasha','Anggota',1,true),
('Almer Shaquille Althafurrahman Darmawan','Anggota',2,true),
('Qaulan Tsakilla','Anggota',2,true),
('M. Syaddad Muallim','Anggota',3,true),
('Alfadjri Alifaumi','Koordinator Sekbid',3,true),
('Darrel Khalfan Gunadi','Anggota',4,true),
('Resti Dewi Lestari','Anggota',4,true),
('Nasya Ghalia Muharti','Anggota',4,true),
('Lian','Anggota',5,true),
('Najwan Azhiim Muntadzor','Anggota',6,true),
('Athaya Zanirah Ramadhani','Anggota',6,true),
('Irga Andreansyah Setiawan','Anggota',6,true),
('Tsurayya Naqiya Octanary','Anggota',NULL,true),
('Medina Zulfanisa','Anggota',NULL,true),
('Annisa','Anggota',NULL,true),
('Zahra','Anggota',NULL,true),
('Kiki','Anggota',NULL,true),
('Marrisa','Anggota',NULL,true),
('Adzrahaifa Amadea Dwi','Anggota',NULL,true),
('Alifah Shafina Amanda','Anggota',NULL,true),
('Safa Aprilia Ansari','Anggota',NULL,true),
('Raihan Akbar Putra Jaya','Anggota',NULL,true),
('Alvira Alifiah Raiq','Anggota',NULL,true)
ON CONFLICT (name, role) DO UPDATE SET sekbid = EXCLUDED.sekbid, active = EXCLUDED.active;

COMMIT;