-- ========== CONTENT MANAGEMENT TABLE ==========
-- Tabel untuk menyimpan semua text dan media yang bisa diedit admin

create table if not exists public.page_content (
  id bigserial primary key,
  page_key text unique not null, -- e.g., 'home_hero_title', 'about_description'
  content_type text not null check (content_type in ('text', 'richtext', 'image', 'video')),
  content_value text not null, -- text content or URL for media
  content_value_id text, -- for translation (id/en)
  metadata jsonb default '{}', -- extra data like alt text, dimensions, etc.
  category text, -- group related content: 'home', 'about', 'navbar', etc.
  editable_by text[] default '{super_admin,admin}', -- roles that can edit
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists page_content_category_idx on public.page_content(category);
create index if not exists page_content_key_idx on public.page_content(page_key);

create trigger page_content_updated_at before update on public.page_content
for each row execute function public.touch_updated_at();

-- ========== MEDIA UPLOADS TABLE ==========
create table if not exists public.media (
  id bigserial primary key,
  filename text not null,
  original_name text not null,
  url text not null,
  file_type text not null, -- image/jpeg, video/mp4, etc.
  file_size bigint, -- in bytes
  uploaded_by uuid references public.users(id) on delete set null,
  category text, -- 'posts', 'gallery', 'pages', 'events'
  created_at timestamptz default now()
);

create index if not exists media_category_idx on public.media(category);
create index if not exists media_uploaded_by_idx on public.media(uploaded_by);

-- ========== RLS POLICIES ==========
alter table public.page_content enable row level security;
alter table public.media enable row level security;

create policy "Page content read" on public.page_content for select using (true);
create policy "Page content write" on public.page_content for all using (auth.role() = 'authenticated');

create policy "Media read" on public.media for select using (true);
create policy "Media write" on public.media for all using (auth.role() = 'authenticated');

-- ========== SEED INITIAL CONTENT ==========
-- Home page content
insert into public.page_content (page_key, content_type, content_value, content_value_id, category, editable_by) values
  ('home_hero_title', 'text', 'OSIS SMK Informatika', null, 'home', '{super_admin,admin}'),
  ('home_hero_subtitle', 'text', 'Dirgantara 2025', null, 'home', '{super_admin,admin}'),
  ('home_hero_description', 'richtext', 'Organisasi Siswa Intra Sekolah yang berdedikasi untuk kemajuan siswa dan sekolah', null, 'home', '{super_admin,admin}'),
  ('home_vision_title', 'text', 'Visi Kami', null, 'home', '{super_admin,admin}'),
  ('home_mission_title', 'text', 'Misi Kami', null, 'home', '{super_admin,admin}')
on conflict (page_key) do nothing;

-- About page content  
insert into public.page_content (page_key, content_type, content_value, category, editable_by) values
  ('about_title', 'text', 'Tentang OSIS', 'about', '{super_admin,admin}'),
  ('about_description', 'richtext', 'OSIS adalah wadah organisasi siswa yang ada di sekolah...', 'about', '{super_admin,admin}')
on conflict (page_key) do nothing;

-- Navbar content
insert into public.page_content (page_key, content_type, content_value, category, editable_by) values
  ('navbar_brand_name', 'text', 'OSIS SMK', 'navbar', '{super_admin,admin}'),
  ('navbar_logo', 'image', '/images/logo-2.png', 'navbar', '{super_admin,admin}')
on conflict (page_key) do nothing;
