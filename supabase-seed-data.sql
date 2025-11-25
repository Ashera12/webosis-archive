-- =============================
-- Seed Data - Members & Sample Content
-- Run after supabase-fix-schema.sql
-- =============================

-- Sample Members (Pengurus OSIS)
insert into public.members (name, role, sekbid_id, class, quote, instagram, display_order) values
-- Ketua & Wakil
('Ahmad Rizki', 'Ketua OSIS', null, 'XI IPA 1', 'Bermanfaat bersama, bersinar selamanya', '@ahmadrizki', 1),
('Siti Nurhaliza', 'Wakil Ketua OSIS', null, 'XI IPA 2', 'Leadership is action, not position', '@sitinurhaliza', 2),

-- Sekretaris & Bendahara  
('Budi Santoso', 'Sekretaris 1', null, 'XI IPS 1', 'Menulis adalah kekuatan', '@budisantoso', 3),
('Dewi Lestari', 'Sekretaris 2', null, 'XI IPS 2', 'Organize to optimize', '@dewilestari', 4),
('Reza Pratama', 'Bendahara 1', null, 'XI IPA 3', 'Every penny counts', '@rezapratama', 5),
('Maya Putri', 'Bendahara 2', null, 'XI IPA 4', 'Integrity in finance', '@mayaputri', 6),

-- Bidang 1: Ketaqwaan
('Faris Alamsyah', 'Ketua Bidang', 1, 'XI IPA 1', 'Taqwa adalah fondasi', '@farisalam', 7),
('Zainab Azzahra', 'Anggota', 1, 'X IPA 1', 'Spiritual growth matters', '@zainabazzahra', 8),
('Hasan Basri', 'Anggota', 1, 'X IPA 2', 'Faith in action', '@hasanbasri', 9),

-- Bidang 2: Keilmuan
('Dina Mariana', 'Ketua Bidang', 2, 'XI IPS 1', 'Knowledge is power', '@dinamariana', 10),
('Aldi Wijaya', 'Anggota', 2, 'X IPS 1', 'Learn, unlearn, relearn', '@aldiwijaya', 11),
('Nisa Fadilah', 'Anggota', 2, 'X IPA 3', 'Reading opens minds', '@nisafadilah', 12),

-- Bidang 3: Keterampilan
('Eka Prasetyo', 'Ketua Bidang', 3, 'XI IPA 2', 'Creativity has no limits', '@ekaprasetyo', 13),
('Rina Safitri', 'Anggota', 3, 'X IPA 4', 'Art is expression', '@rinasafitri', 14),
('Yoga Pratama', 'Anggota', 3, 'X IPS 2', 'Skills pay the bills', '@yogapratama', 15),

-- Bidang 4: Kewirausahaan
('Fajar Maulana', 'Ketua Bidang', 4, 'XI IPS 2', 'Entrepreneur mindset', '@fajarmaulana', 16),
('Sari Indah', 'Anggota', 4, 'X IPS 3', 'Innovation drives success', '@sariindah', 17),
('Rangga Aditya', 'Anggota', 4, 'X IPA 5', 'Dream big, start small', '@ranggaaditya', 18),

-- Bidang 5: Olahraga & Seni
('Dimas Ardianto', 'Ketua Bidang', 5, 'XI IPA 3', 'Champions are made', '@dimasardianto', 19),
('Lina Maharani', 'Anggota', 5, 'X IPA 6', 'Art and sport unite', '@linamaharani', 20),
('Irfan Hakim', 'Anggota', 5, 'X IPS 4', 'Play hard, win harder', '@irfanhakim', 21),

-- Bidang 6: Sosial & Lingkungan
('Putri Ayu', 'Ketua Bidang', 6, 'XI IPS 3', 'Care for earth, care for all', '@putriayu', 22),
('Bayu Saputra', 'Anggota', 6, 'X IPS 5', 'Green is the future', '@bayusaputra', 23),
('Anisa Rahma', 'Anggota', 6, 'X IPA 7', 'Sustainability matters', '@anisarahma', 24)
on conflict do nothing;

-- Sample Events
insert into public.events (title, slug, description, sekbid_id, start_date, end_date, location, max_participants, status) values
('MPLS 2025', 'mpls-2025', 'Masa Pengenalan Lingkungan Sekolah untuk siswa baru tahun ajaran 2025/2026', null, '2025-07-15 08:00:00+07', '2025-07-17 16:00:00+07', 'Aula Utama', 300, 'completed'),
('Pesantren Kilat Ramadhan', 'pesantren-kilat-ramadhan-2025', 'Kegiatan pesantren kilat selama bulan Ramadhan', 1, '2025-03-10 06:00:00+07', '2025-03-20 18:00:00+07', 'Masjid Sekolah', 200, 'completed'),
('Lomba Cerdas Cermat', 'lomba-cerdas-cermat-2025', 'Kompetisi cerdas cermat antar kelas', 2, '2025-09-15 08:00:00+07', '2025-09-15 15:00:00+07', 'Aula', 50, 'completed'),
('Workshop Desain Grafis', 'workshop-desain-grafis', 'Belajar desain grafis dengan Adobe Photoshop', 3, '2025-10-20 13:00:00+07', '2025-10-20 16:00:00+07', 'Lab Komputer', 30, 'completed'),
('Bazar Kewirausahaan', 'bazar-kewirausahaan-2025', 'Pameran dan penjualan produk hasil karya siswa', 4, '2025-11-05 08:00:00+07', '2025-11-06 17:00:00+07', 'Lapangan Sekolah', 100, 'completed'),
('Turnamen Futsal Antar Kelas', 'turnamen-futsal-2025', 'Kompetisi futsal championship antar kelas', 5, '2025-12-01 08:00:00+07', '2025-12-10 17:00:00+07', 'Lapangan Futsal', 150, 'upcoming'),
('Aksi Bersih Pantai', 'aksi-bersih-pantai', 'Kegiatan membersihkan pantai dan sosialisasi lingkungan', 6, '2025-12-15 06:00:00+07', '2025-12-15 12:00:00+07', 'Pantai Ancol', 80, 'upcoming'),
('Peringatan Hari Pahlawan', 'peringatan-hari-pahlawan-2025', 'Upacara dan lomba dalam rangka Hari Pahlawan', null, '2025-11-10 07:00:00+07', '2025-11-10 12:00:00+07', 'Lapangan Upacara', 400, 'upcoming'),
('Tahun Baru Islam 1447 H', 'tahun-baru-islam-1447', 'Peringatan tahun baru Islam dengan kajian dan doa bersama', 1, '2025-12-25 08:00:00+07', '2025-12-25 11:00:00+07', 'Masjid Sekolah', 250, 'upcoming')
on conflict do nothing;

-- Sample Announcements
insert into public.announcements (title, content, priority, published) values
('Pendaftaran MPLS 2026', 'Pendaftaran MPLS untuk siswa baru tahun ajaran 2026 telah dibuka. Silakan daftar melalui website sekolah.', 'high', true),
('Jadwal UAS Semester Ganjil', 'Ujian Akhir Semester ganjil akan dilaksanakan pada tanggal 15-20 Desember 2025. Persiapkan diri dengan baik!', 'urgent', true),
('Pengumuman Pemenang Lomba', 'Selamat kepada kelas XI IPA 2 yang menjadi juara umum dalam lomba cerdas cermat. Hadiah dapat diambil di ruang OSIS.', 'medium', true),
('Libur Semester', 'Libur semester akan dimulai tanggal 22 Desember 2025 - 5 Januari 2026. Selamat berlibur!', 'low', true),
('募集: Volunteer Event Sosial', 'Kami membutuhkan 20 volunteer untuk kegiatan bakti sosial. Daftar ke sekretariat OSIS.', 'medium', true)
on conflict do nothing;

-- Sample Program Kerja
insert into public.program_kerja (sekbid_id, nama, penanggung_jawab, tujuan, waktu, status, progress) values
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
on conflict do nothing;

-- Sample Gallery
insert into public.gallery (title, description, image_url, sekbid_id) values
('MPLS 2025 - Day 1', 'Pembukaan MPLS dengan penuh semangat', 'https://via.placeholder.com/800x600.png?text=MPLS+Day+1', null),
('Pesantren Kilat', 'Kegiatan kajian di masjid sekolah', 'https://via.placeholder.com/800x600.png?text=Pesantren+Kilat', 1),
('Lomba Cerdas Cermat', 'Tim juara lomba cerdas cermat', 'https://via.placeholder.com/800x600.png?text=Cerdas+Cermat', 2),
('Workshop Desain', 'Siswa belajar desain grafis', 'https://via.placeholder.com/800x600.png?text=Workshop+Desain', 3),
('Bazar Kewirausahaan', 'Stand penjualan produk siswa', 'https://via.placeholder.com/800x600.png?text=Bazar', 4),
('Turnamen Futsal', 'Pertandingan seru antar kelas', 'https://via.placeholder.com/800x600.png?text=Futsal', 5),
('Aksi Lingkungan', 'Siswa menanam pohon di sekolah', 'https://via.placeholder.com/800x600.png?text=Green+Action', 6)
on conflict do nothing;

-- Success message
do $$
begin
  raise notice '✅ Sample data seeded successfully!';
  raise notice '👥 Members: 24 pengurus OSIS';
  raise notice '📅 Events: 9 events';
  raise notice '📢 Announcements: 5 announcements';
  raise notice '📋 Program Kerja: 12 programs';
  raise notice '📸 Gallery: 7 photos';
  raise notice '🎯 Ready to use!';
end $$;
