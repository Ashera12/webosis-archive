

-- =============================
-- OSIS SMK Informatika - Seed Data Sinkron
-- Jalankan SETELAH schema fix & cms schema
-- =============================

-- 1. Sekbid (Divisi)
INSERT INTO public.sekbid (id, name, slug, description, icon, color) VALUES
  (1, 'Ketaqwaan', 'ketaqwaan', 'Bidang yang mengurusi kegiatan keagamaan dan spiritual', '🕌', '#10b981'),
  (2, 'Keilmuan', 'keilmuan', 'Bidang yang mengurusi kegiatan akademik dan literasi', '📚', '#3b82f6'),
  (3, 'Keterampilan', 'keterampilan', 'Bidang yang mengurusi pengembangan skill dan kreativitas', '🎨', '#f59e0b'),
  (4, 'Kewirausahaan', 'kewirausahaan', 'Bidang yang mengurusi kegiatan bisnis dan entrepreneurship', '💼', '#8b5cf6'),
  (5, 'Olahraga & Seni', 'olahraga-seni', 'Bidang yang mengurusi kegiatan olahraga dan kesenian', '⚽', '#ef4444'),
  (6, 'Sosial & Lingkungan', 'sosial-lingkungan', 'Bidang yang mengurusi kegiatan sosial dan pelestarian lingkungan', '🌱', '#14b8a6')
ON CONFLICT (id) DO NOTHING;

-- 2. Members (Anggota)
INSERT INTO public.members (name, role, sekbid_id, class, quote, instagram, display_order, is_active) VALUES
('Ahmad Rizki', 'Ketua OSIS', null, 'XI IPA 1', 'Bermanfaat bersama, bersinar selamanya', '@ahmadrizki', 1, true),
('Siti Nurhaliza', 'Wakil Ketua OSIS', null, 'XI IPA 2', 'Leadership is action, not position', '@sitinurhaliza', 2, true),
('Budi Santoso', 'Sekretaris 1', null, 'XI IPS 1', 'Menulis adalah kekuatan', '@budisantoso', 3, true),
('Dewi Lestari', 'Sekretaris 2', null, 'XI IPS 2', 'Organize to optimize', '@dewilestari', 4, true),
('Reza Pratama', 'Bendahara 1', null, 'XI IPA 3', 'Every penny counts', '@rezapratama', 5, true),
('Maya Putri', 'Bendahara 2', null, 'XI IPA 4', 'Integrity in finance', '@mayaputri', 6, true),
('Faris Alamsyah', 'Ketua Bidang', 1, 'XI IPA 1', 'Taqwa adalah fondasi', '@farisalam', 7, true),
('Zainab Azzahra', 'Anggota', 1, 'X IPA 1', 'Spiritual growth matters', '@zainabazzahra', 8, true),
('Hasan Basri', 'Anggota', 1, 'X IPA 2', 'Faith in action', '@hasanbasri', 9, true),
('Dina Mariana', 'Ketua Bidang', 2, 'XI IPS 1', 'Knowledge is power', '@dinamariana', 10, true),
('Aldi Wijaya', 'Anggota', 2, 'X IPS 1', 'Learn, unlearn, relearn', '@aldiwijaya', 11, true),
('Nisa Fadilah', 'Anggota', 2, 'X IPA 3', 'Reading opens minds', '@nisafadilah', 12, true),
('Eka Prasetyo', 'Ketua Bidang', 3, 'XI IPA 2', 'Creativity has no limits', '@ekaprasetyo', 13, true),
('Rina Safitri', 'Anggota', 3, 'X IPA 4', 'Art is expression', '@rinasafitri', 14, true),
('Yoga Pratama', 'Anggota', 3, 'X IPS 2', 'Skills pay the bills', '@yogapratama', 15, true),
('Fajar Maulana', 'Ketua Bidang', 4, 'XI IPS 2', 'Entrepreneur mindset', '@fajarmaulana', 16, true),
('Sari Indah', 'Anggota', 4, 'X IPS 3', 'Innovation drives success', '@sariindah', 17, true),
('Rangga Aditya', 'Anggota', 4, 'X IPA 5', 'Dream big, start small', '@ranggaaditya', 18, true),
('Dimas Ardianto', 'Ketua Bidang', 5, 'XI IPA 3', 'Champions are made', '@dimasardianto', 19, true),
('Lina Maharani', 'Anggota', 5, 'X IPA 6', 'Art and sport unite', '@linamaharani', 20, true),
('Irfan Hakim', 'Anggota', 5, 'X IPS 4', 'Play hard, win harder', '@irfanhakim', 21, true),
('Putri Ayu', 'Ketua Bidang', 6, 'XI IPS 3', 'Care for earth, care for all', '@putriayu', 22, true),
('Bayu Saputra', 'Anggota', 6, 'X IPS 5', 'Green is the future', '@bayusaputra', 23, true),
('Anisa Rahma', 'Anggota', 6, 'X IPA 7', 'Sustainability matters', '@anisarahma', 24, true)
ON CONFLICT DO NOTHING;

-- 3. Program Kerja (Proker)
INSERT INTO public.program_kerja (sekbid_id, nama, penanggung_jawab, tujuan, waktu, status, progress) VALUES
(1, 'Kajian Rutin Jumat Pagi', 'Faris Alamsyah', 'Meningkatkan pemahaman agama siswa', 'Setiap Jumat pagi', 'ongoing', 75),
(1, 'Pesantren Kilat Ramadhan', 'Faris Alamsyah', 'Membiasakan ibadah di bulan suci', 'Bulan Ramadhan', 'completed', 100),
(2, 'Lomba Cerdas Cermat', 'Dina Mariana', 'Meningkatkan minat belajar siswa', 'September 2025', 'completed', 100),
(2, 'Bedah Buku Bulanan', 'Dina Mariana', 'Menumbuhkan budaya literasi', 'Setiap bulan', 'ongoing', 60),
(3, 'Workshop Desain Grafis', 'Eka Prasetyo', 'Mengembangkan keterampilan desain', 'Oktober 2025', 'completed', 100),
(3, 'Pelatihan Fotografi', 'Eka Prasetyo', 'Meningkatkan skill fotografi', 'November 2025', 'planned', 0),
(4, 'Bazar Kewirausahaan', 'Fajar Maulana', 'Melatih jiwa entrepreneurship', 'November 2025', 'completed', 100),
(4, 'Business Plan Competition', 'Fajar Maulana', 'Kompetisi rencana bisnis', 'Desember 2025', 'planned', 0),
(5, 'Turnamen Futsal', 'Dimas Ardianto', 'Kompetisi olahraga antar kelas', 'Desember 2025', 'ongoing', 30),
(5, 'Pentas Seni Tahunan', 'Dimas Ardianto', 'Showcase bakat seni siswa', 'Januari 2026', 'planned', 0),
(6, 'Aksi Bersih Pantai', 'Putri Ayu', 'Peduli lingkungan dan kebersihan', 'Desember 2025', 'planned', 0),
(6, 'Penanaman Pohon', 'Putri Ayu', 'Penghijauan area sekolah', 'Februari 2026', 'planned', 0)
ON CONFLICT DO NOTHING;

-- 4. Events (Acara)
INSERT INTO public.events (title, slug, description, sekbid_id, start_date, end_date, location, max_participants, status) VALUES
('MPLS 2025', 'mpls-2025', 'Masa Pengenalan Lingkungan Sekolah untuk siswa baru tahun ajaran 2025/2026', null, '2025-07-15 08:00:00+07', '2025-07-17 16:00:00+07', 'Aula Utama', 300, 'completed'),
('Pesantren Kilat Ramadhan', 'pesantren-kilat-ramadhan-2025', 'Kegiatan pesantren kilat selama bulan Ramadhan', 1, '2025-03-10 06:00:00+07', '2025-03-20 18:00:00+07', 'Masjid Sekolah', 200, 'completed'),
('Lomba Cerdas Cermat', 'lomba-cerdas-cermat-2025', 'Kompetisi cerdas cermat antar kelas', 2, '2025-09-15 08:00:00+07', '2025-09-15 15:00:00+07', 'Aula', 50, 'completed'),
('Workshop Desain Grafis', 'workshop-desain-grafis', 'Belajar desain grafis dengan Adobe Photoshop', 3, '2025-10-20 13:00:00+07', '2025-10-20 16:00:00+07', 'Lab Komputer', 30, 'completed'),
('Bazar Kewirausahaan', 'bazar-kewirausahaan-2025', 'Pameran dan penjualan produk hasil karya siswa', 4, '2025-11-05 08:00:00+07', '2025-11-06 17:00:00+07', 'Lapangan Sekolah', 100, 'completed'),
('Turnamen Futsal Antar Kelas', 'turnamen-futsal-2025', 'Kompetisi futsal championship antar kelas', 5, '2025-12-01 08:00:00+07', '2025-12-10 17:00:00+07', 'Lapangan Futsal', 150, 'upcoming'),
('Aksi Bersih Pantai', 'aksi-bersih-pantai', 'Kegiatan membersihkan pantai dan sosialisasi lingkungan', 6, '2025-12-15 06:00:00+07', '2025-12-15 12:00:00+07', 'Pantai Ancol', 80, 'upcoming'),
('Peringatan Hari Pahlawan', 'peringatan-hari-pahlawan-2025', 'Upacara dan lomba dalam rangka Hari Pahlawan', null, '2025-11-10 07:00:00+07', '2025-11-10 12:00:00+07', 'Lapangan Upacara', 400, 'upcoming'),
('Tahun Baru Islam 1447 H', 'tahun-baru-islam-1447', 'Peringatan tahun baru Islam dengan kajian dan doa bersama', 1, '2025-12-25 08:00:00+07', '2025-12-25 11:00:00+07', 'Masjid Sekolah', 250, 'upcoming')
ON CONFLICT DO NOTHING;

-- 5. Announcements (Pengumuman)
INSERT INTO public.announcements (title, content, priority, published) VALUES
('Pendaftaran MPLS 2026', 'Pendaftaran MPLS untuk siswa baru tahun ajaran 2026 telah dibuka. Silakan daftar melalui website sekolah.', 'high', true),
('Jadwal UAS Semester Ganjil', 'Ujian Akhir Semester ganjil akan dilaksanakan pada tanggal 15-20 Desember 2025. Persiapkan diri dengan baik!', 'urgent', true),
('Pengumuman Pemenang Lomba', 'Selamat kepada kelas XI IPA 2 yang menjadi juara umum dalam lomba cerdas cermat. Hadiah dapat diambil di ruang OSIS.', 'medium', true),
('Libur Semester', 'Libur semester akan dimulai tanggal 22 Desember 2025 - 5 Januari 2026. Selamat berlibur!', 'low', true),
('募集: Volunteer Event Sosial', 'Kami membutuhkan 20 volunteer untuk kegiatan bakti sosial. Daftar ke sekretariat OSIS.', 'medium', true)
ON CONFLICT DO NOTHING;

-- 6. Page Content (Visi, Misi, About, dsb)
INSERT INTO public.page_content (page_key, content_type, content_value, category) VALUES
('visi', 'text', 'Menjadi organisasi siswa yang unggul, inspiratif, dan berakhlak mulia.', 'home'),
('misi', 'richtext', '1. Meningkatkan keimanan dan ketakwaan\n2. Mengembangkan potensi dan kreativitas siswa\n3. Menumbuhkan jiwa kepemimpinan dan tanggung jawab', 'home'),
('about_description', 'richtext', 'OSIS SMK Informatika Fithrah Insani adalah organisasi siswa yang aktif, kreatif, dan berprestasi.', 'about'),
('home_hero_title', 'text', 'OSIS SMK Informatika', 'home'),
('home_hero_subtitle', 'text', 'Dirgantara 2025', 'home'),
('home_hero_description', 'richtext', 'Organisasi Siswa Intra Sekolah yang berdedikasi untuk kemajuan siswa dan sekolah', 'home'),
('home_vision_title', 'text', 'Visi Kami', 'home'),
('home_mission_title', 'text', 'Misi Kami', 'home'),
('about_title', 'text', 'Tentang OSIS', 'about'),
('navbar_brand_name', 'text', 'OSIS SMK', 'navbar'),
('navbar_logo', 'image', '/images/logo-2.png', 'navbar')
ON CONFLICT (page_key) DO NOTHING;

-- 7. Gallery (Galeri Foto)
INSERT INTO public.gallery (title, description, image_url, sekbid_id) VALUES
('MPLS 2025 - Day 1', 'Pembukaan MPLS dengan penuh semangat', 'https://via.placeholder.com/800x600.png?text=MPLS+Day+1', null),
('Pesantren Kilat', 'Kegiatan kajian di masjid sekolah', 'https://via.placeholder.com/800x600.png?text=Pesantren+Kilat', 1),
('Lomba Cerdas Cermat', 'Tim juara lomba cerdas cermat', 'https://via.placeholder.com/800x600.png?text=Cerdas+Cermat', 2),
('Workshop Desain', 'Siswa belajar desain grafis', 'https://via.placeholder.com/800x600.png?text=Workshop+Desain', 3),
('Bazar Kewirausahaan', 'Stand penjualan produk siswa', 'https://via.placeholder.com/800x600.png?text=Bazar', 4),
('Turnamen Futsal', 'Pertandingan seru antar kelas', 'https://via.placeholder.com/800x600.png?text=Futsal', 5),
('Aksi Lingkungan', 'Siswa menanam pohon di sekolah', 'https://via.placeholder.com/800x600.png?text=Green+Action', 6)
ON CONFLICT DO NOTHING;

-- 8. SITE_KETUA (untuk AI snapshot)
INSERT INTO public.admin_settings (key, value) VALUES ('SITE_KETUA', 'Ahmad Rizki')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Selesai. Data sudah sinkron dan siap pakai untuk AI & web.

-- 2. Members (Anggota)
INSERT INTO members (id, name, role, jabatan, nama, foto_url, sekbid_id, active) VALUES
  (1, 'Ahmad Fauzan', 'ketua', 'Ketua OSIS', 'Ahmad Fauzan', 'https://your-project.supabase.co/storage/v1/object/public/members/ahmad.jpg', 1, true),
  (2, 'Budi Santoso', 'wakil', 'Wakil Ketua', 'Budi Santoso', 'https://your-project.supabase.co/storage/v1/object/public/members/budi.jpg', 1, true),
  (3, 'Citra Dewi', 'sekretaris', 'Sekretaris', 'Citra Dewi', 'https://your-project.supabase.co/storage/v1/object/public/members/citra.jpg', 2, true),
  (4, 'Dewi Lestari', 'bendahara', 'Bendahara', 'Dewi Lestari', 'https://your-project.supabase.co/storage/v1/object/public/members/dewi.jpg', 2, true),
  (5, 'Eka Putra', 'anggota', 'Anggota Sekbid 1', 'Eka Putra', 'https://your-project.supabase.co/storage/v1/object/public/members/eka.jpg', 1, true),
  (6, 'Fajar Hidayat', 'anggota', 'Anggota Sekbid 2', 'Fajar Hidayat', 'https://your-project.supabase.co/storage/v1/object/public/members/fajar.jpg', 2, true);

-- 3. Proker (Program Kerja)
INSERT INTO proker (id, title, description) VALUES
  (1, 'Pesantren Kilat', 'Kegiatan keagamaan selama bulan Ramadhan'),
  (2, 'Bazar OSIS', 'Bazar kewirausahaan tahunan'),
  (3, 'Lomba Futsal', 'Kompetisi olahraga antar kelas'),
  (4, 'Pentas Seni', 'Ajang unjuk bakat seni siswa'),
  (5, 'Pelatihan Coding', 'Workshop teknologi dan pemrograman'),
  (6, 'Aksi Bersih Sekolah', 'Kegiatan peduli lingkungan hidup di sekolah');

-- 4. Announcements (Pengumuman)
INSERT INTO announcements (title, content) VALUES
  ('Pendaftaran Anggota Baru', 'OSIS membuka pendaftaran anggota baru tahun 2025/2026!'),
  ('Lomba Futsal', 'Segera daftarkan tim kelasmu untuk lomba futsal antar kelas!'),
  ('Bazar OSIS', 'Bazar kewirausahaan akan diadakan bulan depan.');

-- 5. Events (Acara)
INSERT INTO events (title, event_date, description) VALUES
  ('Pesantren Kilat', '2025-03-15', 'Kegiatan keagamaan selama Ramadhan'),
  ('Bazar OSIS', '2025-04-10', 'Bazar kewirausahaan tahunan'),
  ('Pentas Seni', '2025-05-20', 'Ajang unjuk bakat seni siswa');

-- 6. Page Content (Visi, Misi, About)
INSERT INTO page_content (page_key, content_value) VALUES
  ('visi', 'Menjadi organisasi siswa yang unggul, inspiratif, dan berakhlak mulia.'),
  ('misi', '1. Meningkatkan keimanan dan ketakwaan
2. Mengembangkan potensi dan kreativitas siswa
3. Menumbuhkan jiwa kepemimpinan dan tanggung jawab'),
  ('about_description', 'OSIS SMK Informatika Fithrah Insani adalah organisasi siswa yang aktif, kreatif, dan berprestasi.');

-- 7. SITE_KETUA (untuk AI snapshot)
INSERT INTO admin_settings (key, value) VALUES ('SITE_KETUA', 'Ahmad Fauzan')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Pastikan semua tabel sudah ada dan struktur kolom sesuai sebelum menjalankan seed ini.
-- Jika ada kolom tambahan, sesuaikan sesuai kebutuhan.
