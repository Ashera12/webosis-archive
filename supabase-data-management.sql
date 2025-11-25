-- ========== SEKBID MANAGEMENT TABLE ==========
create table if not exists public.sekbid (
  id serial primary key,
  -- machine-friendly identifier used by import scripts and API (e.g. 'sekbid-1')
  name text unique,
  -- human-friendly display name (Indonesian)
  nama text not null,
  -- longer description
  deskripsi text,
  -- optional URL to an icon (svg/png) or emoji string
  icon text,
  -- hex color for accents
  color text default '#F59E0B',
  slug text,
  order_index int default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists sekbid_updated_at on public.sekbid;
create trigger sekbid_updated_at before update on public.sekbid
for each row execute function public.touch_updated_at();

-- ========== MEMBERS MANAGEMENT TABLE ==========
create table if not exists public.members (
  id serial primary key,
  nama text not null,
  jabatan text not null, -- Ketua, Wakil, Sekretaris, Bendahara, Anggota
  sekbid_id int references public.sekbid(id) on delete cascade,
  foto_url text,
  instagram text,
  email text,
  quotes text,
  order_index int default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists members_sekbid_idx on public.members(sekbid_id);
drop trigger if exists members_updated_at on public.members;
create trigger members_updated_at before update on public.members
for each row execute function public.touch_updated_at();

-- ========== RLS POLICIES ==========
alter table public.sekbid enable row level security;
alter table public.members enable row level security;

drop policy if exists "Sekbid read" on public.sekbid;
drop policy if exists "Sekbid write" on public.sekbid;
create policy "Sekbid read" on public.sekbid for select using (true);
create policy "Sekbid write" on public.sekbid for all using (auth.role() = 'authenticated');

drop policy if exists "Members read" on public.members;
drop policy if exists "Members write" on public.members;
create policy "Members read" on public.members for select using (active = true or auth.role() = 'authenticated');
create policy "Members write" on public.members for all using (auth.role() = 'authenticated');

-- ========== SEED INITIAL DATA ==========
-- Seed canonical sekbid rows. Use `name` as canonical machine id so import scripts
-- (which look up by name like 'sekbid-1') will not create duplicates.
insert into public.sekbid (id, name, nama, deskripsi, slug, icon, color, order_index) values
  (1, 'sekbid-1', 'Sekbid 1 - Keagamaan', 'Membina keimanan dan ketakwaan siswa', 'sekbid-1', '/icons/keagamaan.svg', '#0ea5e9', 1),
  (2, 'sekbid-2', 'Sekbid 2 - Kaderisasi', 'Meningkatkan kedisiplinan, tanggung jawab, dan keteladanan', 'sekbid-2', '/icons/kaderisasi.svg', '#10b981', 2),
  (3, 'sekbid-3', 'Sekbid 3 - Akademik', 'Mengembangkan prestasi akademik dan non-akademik', 'sekbid-3', '/icons/akademik.svg', '#f97316', 3),
  (4, 'sekbid-4', 'Sekbid 4 - Ekonomi Kreatif', 'Meningkatkan keterampilan dan jiwa wirausaha', 'sekbid-4', '/icons/ekonomi.svg', '#f43f5e', 4),
  (5, 'sekbid-5', 'Sekbid 5 - Kesehatan', 'Menjaga kesehatan dan kelestarian lingkungan', 'sekbid-5', '/icons/kesehatan.svg', '#8b5cf6', 5),
  (6, 'sekbid-6', 'Sekbid 6 - Kominfo', 'Kominfo / Web Development', 'sekbid-6', '/icons/kominfo.svg', '#06b6d4', 6)
on conflict (id) do update set
  name = excluded.name,
  nama = excluded.nama,
  deskripsi = excluded.deskripsi,
  slug = excluded.slug,
  icon = excluded.icon,
  color = excluded.color,
  order_index = excluded.order_index;

-- Set sequence for auto-increment
select setval('sekbid_id_seq', (select max(id) from sekbid));

-- Sample members (bisa dihapus/edit nanti)
insert into public.members (nama, jabatan, sekbid_id, foto_url, instagram, quotes, order_index) values
  ('Ahmad Fauzi', 'Ketua OSIS', null, 'https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=3B82F6&color=fff&size=400', '@ahmadfauzi', 'Bersama kita bisa!', 1),
  ('Siti Nurhaliza', 'Wakil Ketua', null, 'https://ui-avatars.com/api/?name=Siti+Nurhaliza&background=EF4444&color=fff&size=400', '@sitinur', 'Terus berkarya!', 2),
  ('Budi Santoso', 'Sekretaris', null, 'https://ui-avatars.com/api/?name=Budi+Santoso&background=10B981&color=fff&size=400', '@budisantoso', 'Organisasi adalah keluarga', 3),
  ('Rina Wati', 'Bendahara', null, 'https://ui-avatars.com/api/?name=Rina+Wati&background=F59E0B&color=fff&size=400', '@rinawati', 'Jujur adalah kunci', 4)
on conflict do nothing;
