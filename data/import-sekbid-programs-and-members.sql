-- Idempotent SQL to insert sekbid programs and member responsibles
-- WARNING: Review before running on production. Backup your DB first.

-- Insert sekbid program pages as records in `sekbid_programs` (if your schema uses such table).
-- If your schema stores programs inside sekbid pages differently, adapt the INSERTs accordingly.

-- Example assumes tables:
-- sekbid (id, name, nama, color, icon)
-- sekbid_programs (id, sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
-- members (id, name, nama, role, sekbid_id, photo_url, instagram, display_order, is_active, quote)

BEGIN;

-- Find or create Sekbid entries (using names Sekbid 1..6 if not present)
DO $$
DECLARE
  s_id integer;
BEGIN
  -- Sekbid 1 (Keagamaan)
  INSERT INTO sekbid (name, nama, slug, deskripsi, icon, color)
  SELECT 'sekbid-1','Sekbid 1 - Keagamaan','sekbid-1','Keagamaan', '/icons/keagamaan.svg','#0ea5e9'
  WHERE NOT EXISTS (SELECT 1 FROM sekbid WHERE name='sekbid-1');

  -- Sekbid 2 (Kaderisasi / Kedisiplinan)
  INSERT INTO sekbid (name, nama, slug, deskripsi, icon, color)
  SELECT 'sekbid-2','Sekbid 2 - Kaderisasi','sekbid-2','Kaderisasi / Kedisiplinan', '/icons/kaderisasi.svg','#10b981'
  WHERE NOT EXISTS (SELECT 1 FROM sekbid WHERE name='sekbid-2');

  -- Sekbid 3 (Akademik Non-Akademik)
  INSERT INTO sekbid (name, nama, slug, deskripsi, icon, color)
  SELECT 'sekbid-3','Sekbid 3 - Akademik','sekbid-3','Akademik Non-Akademik', '/icons/akademik.svg','#f97316'
  WHERE NOT EXISTS (SELECT 1 FROM sekbid WHERE name='sekbid-3');

  -- Sekbid 4 (Ekonomi Kreatif)
  INSERT INTO sekbid (name, nama, slug, deskripsi, icon, color)
  SELECT 'sekbid-4','Sekbid 4 - Ekonomi Kreatif','sekbid-4','Ekonomi Kreatif', '/icons/ekonomi.svg','#f43f5e'
  WHERE NOT EXISTS (SELECT 1 FROM sekbid WHERE name='sekbid-4');

  -- Sekbid 5 (Kesehatan Lingkungan)
  INSERT INTO sekbid (name, nama, slug, deskripsi, icon, color)
  SELECT 'sekbid-5','Sekbid 5 - Kesehatan','sekbid-5','Kesehatan Lingkungan', '/icons/kesehatan.svg','#8b5cf6'
  WHERE NOT EXISTS (SELECT 1 FROM sekbid WHERE name='sekbid-5');

  -- Sekbid 6 (Kominfo / Web Dev)
  INSERT INTO sekbid (name, nama, slug, deskripsi, icon, color)
  SELECT 'sekbid-6','Sekbid 6 - Kominfo','sekbid-6','Kominfo / Web Development', '/icons/kominfo.svg','#06b6d4'
  WHERE NOT EXISTS (SELECT 1 FROM sekbid WHERE name='sekbid-6');
END$$;

-- Helper to upsert a program for a sekbid
-- Replace or adapt `sekbid_programs` table/columns if needed
COMMIT;

-- Members upsert: create or update member records for each PJ where appropriate.
-- This block avoids relying on ON CONFLICT by performing UPDATE first, then INSERT if no row was updated.
DO $$
DECLARE
  v_sekbid_id integer;
  rec record;
BEGIN
  -- Helper macro-like pattern: for each member, resolve sekbid_id, then update or insert.

  -- Muhammad Irsyad Kaamil Pasha -> Sekbid 1
  v_sekbid_id := (SELECT id FROM sekbid WHERE name='sekbid-1' LIMIT 1);
  IF v_sekbid_id IS NOT NULL THEN
    UPDATE members SET nama='Muhammad Irsyad Kaamil Pasha', role='Anggota Sekbid 1', jabatan='Anggota Sekbid 1', sekbid_id=v_sekbid_id, is_active=true WHERE name='Muhammad Irsyad Kaamil Pasha';
    IF NOT FOUND THEN
      INSERT INTO members (name, nama, role, jabatan, sekbid_id, is_active) VALUES ('Muhammad Irsyad Kaamil Pasha', 'Muhammad Irsyad Kaamil Pasha', 'Anggota Sekbid 1', 'Anggota Sekbid 1', v_sekbid_id, true);
    END IF;
  END IF;

  -- Nazmia Tsakib Hanani
  v_sekbid_id := (SELECT id FROM sekbid WHERE name='sekbid-1' LIMIT 1);
  IF v_sekbid_id IS NOT NULL THEN
    UPDATE members SET nama='Nazmia Tsakib Hanani', role='Anggota Sekbid 1', jabatan='Anggota Sekbid 1', sekbid_id=v_sekbid_id, is_active=true WHERE name='Nazmia Tsakib Hanani';
    IF NOT FOUND THEN
      INSERT INTO members (name, nama, role, jabatan, sekbid_id, is_active) VALUES ('Nazmia Tsakib Hanani', 'Nazmia Tsakib Hanani', 'Anggota Sekbid 1', 'Anggota Sekbid 1', v_sekbid_id, true);
    END IF;
  END IF;

  -- Alifah Shafina Amanda
  v_sekbid_id := (SELECT id FROM sekbid WHERE name='sekbid-1' LIMIT 1);
  IF v_sekbid_id IS NOT NULL THEN
    UPDATE members SET nama='Alifah Shafina Amanda', role='Anggota Sekbid 1', jabatan='Anggota Sekbid 1', sekbid_id=v_sekbid_id, is_active=true WHERE name='Alifah Shafina Amanda';
    IF NOT FOUND THEN
      INSERT INTO members (name, nama, role, jabatan, sekbid_id, is_active) VALUES ('Alifah Shafina Amanda', 'Alifah Shafina Amanda', 'Anggota Sekbid 1', 'Anggota Sekbid 1', v_sekbid_id, true);
    END IF;
  END IF;

  -- Sekbid 2 members
  v_sekbid_id := (SELECT id FROM sekbid WHERE name='sekbid-2' LIMIT 1);
  IF v_sekbid_id IS NOT NULL THEN
    FOR rec IN SELECT * FROM (VALUES
      ('Safa Aprilia Ansari','Safa Aprilia Ansari','Anggota Sekbid 2'),
      ('Almer Shaquille Althafurrahman Darmawan','Almer Shaquille Althafurrahman Darmawan','Anggota Sekbid 2'),
      ('Raihan Akbar Putra Jaya','Raihan Akbar Putra Jaya','Anggota Sekbid 2'),
      ('Qaulan Tsakilla','Qaulan Tsakilla','Anggota Sekbid 2')
    ) AS t(name,nama,role) LOOP
      UPDATE members SET nama=rec.nama, role=rec.role, jabatan=rec.role, sekbid_id=v_sekbid_id, is_active=true WHERE name=rec.name;
      IF NOT FOUND THEN
        INSERT INTO members (name, nama, role, jabatan, sekbid_id, is_active) VALUES (rec.name, rec.nama, rec.role, rec.role, v_sekbid_id, true);
      END IF;
    END LOOP;
  END IF;

  -- Sekbid 3 members
  v_sekbid_id := (SELECT id FROM sekbid WHERE name='sekbid-3' LIMIT 1);
  IF v_sekbid_id IS NOT NULL THEN
    FOR rec IN SELECT * FROM (VALUES
      ('Alvira Alifiah Raiq','Alvira Alifiah Raiq','Anggota Sekbid 3'),
      ('Tsurayya Naqiya Octanary','Tsurayya Naqiya Octanary','Anggota Sekbid 3'),
      ('Alfadjri alifaumi','Alfadjri alifaumi','Anggota Sekbid 3'),
      ('M. Syaddad Muallim','M. Syaddad Muallim','Anggota Sekbid 3')
    ) AS t(name,nama,role) LOOP
      UPDATE members SET nama=rec.nama, role=rec.role, jabatan=rec.role, sekbid_id=v_sekbid_id, is_active=true WHERE name=rec.name;
      IF NOT FOUND THEN
        INSERT INTO members (name, nama, role, jabatan, sekbid_id, is_active) VALUES (rec.name, rec.nama, rec.role, rec.role, v_sekbid_id, true);
      END IF;
    END LOOP;
  END IF;

  -- Sekbid 4 members
  v_sekbid_id := (SELECT id FROM sekbid WHERE name='sekbid-4' LIMIT 1);
  IF v_sekbid_id IS NOT NULL THEN
    FOR rec IN SELECT * FROM (VALUES
      ('Muhammad Shofwan Abdul Hakim','Muhammad Shofwan Abdul Hakim','Anggota Sekbid 4'),
      ('Medina Zulfanisa','Medina Zulfanisa','Anggota Sekbid 4'),
      ('Darrel Khalfan Gunadi','Darrel Khalfan Gunadi','Anggota Sekbid 4'),
      ('Resti Dewi Lestari','Resti Dewi Lestari','Anggota Sekbid 4'),
      ('Nasya Ghalia Muharti','Nasya Ghalia Muharti','Anggota Sekbid 4')
    ) AS t(name,nama,role) LOOP
      UPDATE members SET nama=rec.nama, role=rec.role, jabatan=rec.role, sekbid_id=v_sekbid_id, is_active=true WHERE name=rec.name;
      IF NOT FOUND THEN
        INSERT INTO members (name, nama, role, jabatan, sekbid_id, is_active) VALUES (rec.name, rec.nama, rec.role, rec.role, v_sekbid_id, true);
      END IF;
    END LOOP;
  END IF;

  -- Sekbid 5 members
  v_sekbid_id := (SELECT id FROM sekbid WHERE name='sekbid-5' LIMIT 1);
  IF v_sekbid_id IS NOT NULL THEN
    FOR rec IN SELECT * FROM (VALUES
      ('Annisa','Annisa','Anggota Sekbid 5'),
      ('Zahra','Zahra','Anggota Sekbid 5'),
      ('Kiki','Kiki','Anggota Sekbid 5'),
      ('Marrisa','Marrisa','Anggota Sekbid 5'),
      ('Lian','Lian','Anggota Sekbid 5')
    ) AS t(name,nama,role) LOOP
      UPDATE members SET nama=rec.nama, role=rec.role, jabatan=rec.role, sekbid_id=v_sekbid_id, is_active=true WHERE name=rec.name;
      IF NOT FOUND THEN
        INSERT INTO members (name, nama, role, jabatan, sekbid_id, is_active) VALUES (rec.name, rec.nama, rec.role, rec.role, v_sekbid_id, true);
      END IF;
    END LOOP;
  END IF;

  -- Sekbid 6 members
  v_sekbid_id := (SELECT id FROM sekbid WHERE name='sekbid-6' LIMIT 1);
  IF v_sekbid_id IS NOT NULL THEN
    FOR rec IN SELECT * FROM (VALUES
      ('Athaya Zanirah Ramadhani','Athaya Zanirah Ramadhani','Anggota Sekbid 6'),
      ('Adzrahaifa Amadea Dwi','Adzrahaifa Amadea Dwi','Anggota Sekbid 6'),
      ('Irga Andreansyah Setiawan','Irga Andreansyah Setiawan','Anggota Sekbid 6'),
      ('Najwan Azhiim Muntadzor','Najwan Azhiim Muntadzor','Anggota Sekbid 6')
    ) AS t(name,nama,role) LOOP
      UPDATE members SET nama=rec.nama, role=rec.role, jabatan=rec.role, sekbid_id=v_sekbid_id, is_active=true WHERE name=rec.name;
      IF NOT FOUND THEN
        INSERT INTO members (name, nama, role, jabatan, sekbid_id, is_active) VALUES (rec.name, rec.nama, rec.role, rec.role, v_sekbid_id, true);
      END IF;
    END LOOP;
  END IF;

END$$;

-- Done. Review inserted programs in `sekbid_programs` and members in `members` tables.
-- If your schema differs (different column names or tables), adapt this script accordingly.
DO $$
DECLARE sekbid_id integer;
BEGIN
  SELECT id INTO sekbid_id FROM sekbid WHERE name='sekbid-3' LIMIT 1;
  IF sekbid_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sekbid_programs') THEN
      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES (sekbid_id, 'mading', 'Mading Apresiasi',
        'Mading untuk menampilkan karya dan prestasi siswa agar mendapat apresiasi dan inspirasi.',
        'Meningkatkan semangat berprestasi dan apresiasi karya siswa.',
        'Menampilkan hasil karya di mading; info lomba dipajang dan hasil ditampilkan.',
        'Rutin', '-', 'Alvira Alifiah Raiq', '-')
      ON CONFLICT (sekbid_id, slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description;

      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES (sekbid_id, 'literasi-pintar', 'Literasi Pintar',
        'Program membaca berkala untuk menumbuhkan minat baca dan kemampuan berpikir kritis.',
        'Meningkatkan minat baca dan wawasan siswa.',
        'Setiap dua pekan membawa buku, membuat resume, diserahkan ke guru.',
        'Setiap 2 pekan', '-', 'Tsurayya Naqiya Octanary', '-')
      ON CONFLICT (sekbid_id, slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description;

      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES (sekbid_id, 'classmeet', 'Classmeet',
        'Kegiatan sosial untuk mempererat hubungan antar siswa melalui games dan kegiatan luar kelas.',
        'Mempererat hubungan sosial dan meningkatkan soft skills.',
        'Incidental; kegiatan sosial dan lomba antar kelas.',
        'Incidental', '-', 'Alfadjri alifaumi', '-')
      ON CONFLICT (sekbid_id, slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description;

      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES (sekbid_id, 'pameran-seni', 'Pameran Seni Karya',
        'Pameran untuk menampilkan karya seni siswa sebagai medium apresiasi dan edukasi seni.',
        'Memperkenalkan dan mengapresiasi karya seni siswa.',
        'Pameran insidental, menampilkan karya siswa.',
        'Insidental', '-', 'Alfadjri alifaumi', '-')
      ON CONFLICT (sekbid_id, slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description;

      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES (sekbid_id, '17-agustus', '17 Agustus',
        'Peringatan Hari Kemerdekaan dengan rangkaian kegiatan keakraban dan lomba.',
        'Meningkatkan cinta tanah air dan semangat berbangsa.',
        'Pembentukan panitia, penentuan tema, pelaksanaan, dan evaluasi.',
        'Insidental', '-', 'M. Syaddad Muallim', '-')
      ON CONFLICT (sekbid_id, slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description;
    END IF;
  END IF;
END$$;

-- Sekbid 4 programs
DO $$
DECLARE sekbid_id integer;
BEGIN
  SELECT id INTO sekbid_id FROM sekbid WHERE name='sekbid-4' LIMIT 1;
  IF sekbid_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sekbid_programs') THEN
      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES (sekbid_id, 'promosi-lab-produksi', 'Promosi Lab Produksi dan Business Center',
        'Mengoptimalkan lab produksi & business center untuk pengembangan kewirausahaan OSIS.',
        'Meningkatkan pengalaman wirausaha anggota OSIS dan menambah kas OSIS.',
        'Kerjasama dengan sekolah untuk mempromosikan jasa dan produksi kreatif.',
        'Fleksibel', '-', 'Muhammad Shofwan Abdul Hakim', '-')
      ON CONFLICT (sekbid_id, slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description;

      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES (sekbid_id, 'lomba-konten-promosi', 'Lomba Konten Promosi Produk',
        'Kompetisi konten promosi untuk meningkatkan kreativitas dan kemampuan pemasaran siswa.',
        'Mendorong kreativitas dan kemampuan promosi produk.',
        'Peserta mengumpulkan video ke GDrive; diunggah di akun Instagram kelas masing-masing.',
        'Insidental', '-', 'Medina Zulfanisa', '-')
      ON CONFLICT (sekbid_id, slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description;

      -- Market day, Weekly Market, Tanya Tanya Wirausahawan, Market Stand
      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES
        (sekbid_id, 'market-day', 'Market Day', 'Event penjualan produk siswa untuk mengembangkan keterampilan wirausaha.', 'Mengasah keterampilan jual-beli dan kewirausahaan.', 'Koordinasi tempat, persiapan stand, dan dokumentasi.', 'Insidental', '-', 'Darrel Khalfan Gunadi', '-'),
        (sekbid_id, 'weekly-market', 'Weekly Market', 'Pasar mingguan OSIS untuk perdagangan produk anggota OSIS.', 'Mengembangkan kewirausahaan dan pendapatan OSIS.', 'Jadwal rutin, penjualan saat istirahat.', 'Rutinan', '-', 'Resti Dewi Lestari', '-'),
        (sekbid_id, 'tanya-tanya-wirausahawan', 'Tanya Tanya Wirausahawan', 'Wawancara dengan pelaku UMKM untuk edukasi kewirausahaan.', 'Menginspirasi dan memberikan pengetahuan praktis kewirausahaan.', 'Wawancara, produksi konten, publikasi Instagram OSIS.', 'Rutinan', '-', 'Muhammad Shofwan Abdul Hakim', '-'),
        (sekbid_id, 'market-stand', 'Market Stand', 'Stand di pasar atau event untuk menjual produk siswa.', 'Memberi pengalaman berjualan dan pemasaran.', 'Cari event/tenant, siapkan produk, dan berjualan.', 'Rutinan', '-', 'Nasya Ghalia Muharti', '-');
    END IF;
  END IF;
END$$;

-- Sekbid 5 programs
DO $$
DECLARE sekbid_id integer;
BEGIN
  SELECT id INTO sekbid_id FROM sekbid WHERE name='sekbid-5' LIMIT 1;
  IF sekbid_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sekbid_programs') THEN
      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES
        (sekbid_id, 'jumat-gizi', 'Jumat Gizi, Sehat Pasti', 'Program buah setiap Jumat untuk meningkatkan asupan gizi siswa.', 'Mendorong kebiasaan konsumsi buah dan meningkatkan kesadaran gizi.', 'Broadcast WA, pengawasan ketua kelas, siswa membawa satu buah tiap Jumat.', 'Setiap Jumat', '-', 'Annisa', '-'),
        (sekbid_id, 'recycle-day', 'Recycle Day', 'Lomba daur ulang sampah untuk meningkatkan kreativitas siswa dan mengurangi sampah.', 'Mengurangi sampah dan meningkatkan kreativitas daur ulang.', 'Kegiatan insidental, dokumentasi, dan pemberian reward.', 'Insidental', '50.000', 'Zahra', '-'),
        (sekbid_id, 'fit-everyday', 'Fit Everyday', 'Senam pagi rutin untuk kebugaran siswa.', 'Meningkatkan kebugaran fisik dan pola hidup sehat.', 'Senam bersama di lapangan dipandu instruktur atau OSIS.', 'Fleksibel', '-', 'Kiki', '-'),
        (sekbid_id, 'jumsih', 'Jumsih (Jumat Bersih)', 'Program kebersihan lingkungan tiap Jumat untuk menciptakan lingkungan sehat.', 'Membangun tanggung jawab kebersihan sekolah.', 'Pembagian area, pengecekan, dan dokumentasi.', 'Dua minggu sekali pada Jumat', '-', 'Marrisa', '-'),
        (sekbid_id, 'p3k-apel', 'P3K Apel', 'Tim P3K siap siaga saat apel untuk penanganan pertolongan pertama.', 'Meningkatkan keselamatan saat apel dan mengurangi risiko kesehatan.', 'Tim P3K berjaga dan menyiapkan obat-obatan dasar.', 'Insidental', '50.000-100.000', 'Lian', '-');
    END IF;
  END IF;
END$$;

-- Sekbid 6 programs
DO $$
DECLARE sekbid_id integer;
BEGIN
  SELECT id INTO sekbid_id FROM sekbid WHERE name='sekbid-6' LIMIT 1;
  IF sekbid_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sekbid_programs') THEN
      INSERT INTO sekbid_programs (sekbid_id, slug, title, description, tujuan, teknis, waktu, anggaran, penanggung_jawab, eval)
      VALUES
        (sekbid_id, 'kelola-sosial-media', 'Mengelola Sosial Media', 'Mengelola konten Instagram OSIS untuk meningkatkan keterlibatan dan informasi.', 'Menjadi pusat informasi dan dokumentasi kegiatan OSIS.', 'Merencanakan konten, analisis, kolaborasi lintas bidang; 2x sebulan + insidental.', '2x per bulan & insidental', '-', 'Athaya Zanirah Ramadhani', '-'),
        (sekbid_id, 'jurnalistik', 'Jurnalistik', 'Mengumpulkan dan mempublikasikan informasi kegiatan sekolah secara berkala.', 'Meningkatkan literasi dan menyampaikan berita kegiatan.', 'Mencari info, menulis narasi, publikasi 1x per bulan.', '1 bulan sekali', '-', 'Adzrahaifa Amadea Dwi', '-'),
        (sekbid_id, 'web-development', 'Web Development', 'Pengelolaan website OSIS untuk pusat informasi dan branding.', 'Meningkatkan kredibilitas dan memfasilitasi publikasi program kerja.', 'Update konten web, profil anggota, dan dokumentasi program kerja.', 'On demand', '-', 'Irga Andreansyah Setiawan', '-'),
        (sekbid_id, 'mkk', 'Media Komunikasi Kreatif (MKK)', 'Mading dan media luar jaringan untuk publikasi kreatif.', 'Meningkatkan minat baca dan kreativitas siswa melalui mading.', 'Hias mading per kelas setiap bulan; rencana konten dan kolaborasi.', '1 bulan sekali', '-', 'Najwan Azhiim Muntadzor', '-');
    END IF;
  END IF;
END$$;

COMMIT;

-- Members upsert: create member records for each PJ where appropriate.
-- Adjust members table columns as needed.

-- Example: insert or update member by name and sekbid
DO $$
DECLARE m_id integer; sekbid_id integer;
BEGIN
  -- Muhammad Irsyad Kaamil Pasha -> Sekbid 1
  SELECT id INTO sekbid_id FROM sekbid WHERE name='sekbid-1' LIMIT 1;
  IF sekbid_id IS NOT NULL THEN
    INSERT INTO members (name, nama, role, sekbid_id, is_active)
    VALUES ('Muhammad Irsyad Kaamil Pasha', 'Muhammad Irsyad Kaamil Pasha', 'Anggota Sekbid 1', sekbid_id, true)
    ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, sekbid_id=EXCLUDED.sekbid_id, is_active=true;
  END IF;

  -- Nazmia Tsakib Hanani
  SELECT id INTO sekbid_id FROM sekbid WHERE name='sekbid-1' LIMIT 1;
  IF sekbid_id IS NOT NULL THEN
    INSERT INTO members (name, nama, role, sekbid_id, is_active)
    VALUES ('Nazmia Tsakib Hanani', 'Nazmia Tsakib Hanani', 'Anggota Sekbid 1', sekbid_id, true)
    ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, sekbid_id=EXCLUDED.sekbid_id, is_active=true;
  END IF;

  -- Alifah Shafina Amanda
  INSERT INTO members (name, nama, role, sekbid_id, is_active)
  VALUES ('Alifah Shafina Amanda', 'Alifah Shafina Amanda', 'Anggota Sekbid 1', (SELECT id FROM sekbid WHERE name='sekbid-1' LIMIT 1), true)
  ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, sekbid_id=EXCLUDED.sekbid_id, is_active=true;

  -- Sekbid 2 members
  INSERT INTO members (name, nama, role, sekbid_id, is_active)
  VALUES
    ('Safa Aprilia Ansari','Safa Aprilia Ansari','Anggota Sekbid 2',(SELECT id FROM sekbid WHERE name='sekbid-2' LIMIT 1), true),
    ('Almer Shaquille Althafurrahman Darmawan','Almer Shaquille Althafurrahman Darmawan','Anggota Sekbid 2',(SELECT id FROM sekbid WHERE name='sekbid-2' LIMIT 1), true),
    ('Raihan Akbar Putra Jaya','Raihan Akbar Putra Jaya','Anggota Sekbid 2',(SELECT id FROM sekbid WHERE name='sekbid-2' LIMIT 1), true),
    ('Qaulan Tsakilla','Qaulan Tsakilla','Anggota Sekbid 2',(SELECT id FROM sekbid WHERE name='sekbid-2' LIMIT 1), true)
  ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, sekbid_id=EXCLUDED.sekbid_id, is_active=true;

  -- Sekbid 3 members
  INSERT INTO members (name, nama, role, sekbid_id, is_active)
  VALUES
    ('Alvira Alifiah Raiq','Alvira Alifiah Raiq','Anggota Sekbid 3',(SELECT id FROM sekbid WHERE name='sekbid-3' LIMIT 1), true),
    ('Tsurayya Naqiya Octanary','Tsurayya Naqiya Octanary','Anggota Sekbid 3',(SELECT id FROM sekbid WHERE name='sekbid-3' LIMIT 1), true),
    ('Alfadjri alifaumi','Alfadjri alifaumi','Anggota Sekbid 3',(SELECT id FROM sekbid WHERE name='sekbid-3' LIMIT 1), true),
    ('M. Syaddad Muallim','M. Syaddad Muallim','Anggota Sekbid 3',(SELECT id FROM sekbid WHERE name='sekbid-3' LIMIT 1), true)
  ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, sekbid_id=EXCLUDED.sekbid_id, is_active=true;

  -- Sekbid 4 members
  INSERT INTO members (name, nama, role, sekbid_id, is_active)
  VALUES
    ('Muhammad Shofwan Abdul Hakim','Muhammad Shofwan Abdul Hakim','Anggota Sekbid 4',(SELECT id FROM sekbid WHERE name='sekbid-4' LIMIT 1), true),
    ('Medina Zulfanisa','Medina Zulfanisa','Anggota Sekbid 4',(SELECT id FROM sekbid WHERE name='sekbid-4' LIMIT 1), true),
    ('Darrel Khalfan Gunadi','Darrel Khalfan Gunadi','Anggota Sekbid 4',(SELECT id FROM sekbid WHERE name='sekbid-4' LIMIT 1), true),
    ('Resti Dewi Lestari','Resti Dewi Lestari','Anggota Sekbid 4',(SELECT id FROM sekbid WHERE name='sekbid-4' LIMIT 1), true),
    ('Muhammad Shofwan Abdul Hakim','Muhammad Shofwan Abdul Hakim','Anggota Sekbid 4',(SELECT id FROM sekbid WHERE name='sekbid-4' LIMIT 1), true),
    ('Nasya Ghalia Muharti','Nasya Ghalia Muharti','Anggota Sekbid 4',(SELECT id FROM sekbid WHERE name='sekbid-4' LIMIT 1), true)
  ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, sekbid_id=EXCLUDED.sekbid_id, is_active=true;

  -- Sekbid 5 members
  INSERT INTO members (name, nama, role, sekbid_id, is_active)
  VALUES
    ('Annisa','Annisa','Anggota Sekbid 5',(SELECT id FROM sekbid WHERE name='sekbid-5' LIMIT 1), true),
    ('Zahra','Zahra','Anggota Sekbid 5',(SELECT id FROM sekbid WHERE name='sekbid-5' LIMIT 1), true),
    ('Kiki','Kiki','Anggota Sekbid 5',(SELECT id FROM sekbid WHERE name='sekbid-5' LIMIT 1), true),
    ('Marrisa','Marrisa','Anggota Sekbid 5',(SELECT id FROM sekbid WHERE name='sekbid-5' LIMIT 1), true),
    ('Lian','Lian','Anggota Sekbid 5',(SELECT id FROM sekbid WHERE name='sekbid-5' LIMIT 1), true)
  ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, sekbid_id=EXCLUDED.sekbid_id, is_active=true;

  -- Sekbid 6 members
  INSERT INTO members (name, nama, role, sekbid_id, is_active)
  VALUES
    ('Athaya Zanirah Ramadhani','Athaya Zanirah Ramadhani','Anggota Sekbid 6',(SELECT id FROM sekbid WHERE name='sekbid-6' LIMIT 1), true),
    ('Adzrahaifa Amadea Dwi','Adzrahaifa Amadea Dwi','Anggota Sekbid 6',(SELECT id FROM sekbid WHERE name='sekbid-6' LIMIT 1), true),
    ('Irga Andreansyah Setiawan','Irga Andreansyah Setiawan','Anggota Sekbid 6',(SELECT id FROM sekbid WHERE name='sekbid-6' LIMIT 1), true),
    ('Najwan Azhiim Muntadzor','Najwan Azhiim Muntadzor','Anggota Sekbid 6',(SELECT id FROM sekbid WHERE name='sekbid-6' LIMIT 1), true)
  ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, sekbid_id=EXCLUDED.sekbid_id, is_active=true;

END$$;

-- Done. Review inserted programs in `sekbid_programs` and members in `members` tables.
-- If your schema differs (different column names or tables), adapt this script accordingly.
