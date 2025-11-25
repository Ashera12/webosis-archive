-- =============================
-- Supabase Schema for OSIS Admin CMS
-- Run this inside Supabase SQL editor (Dashboard > SQL)
-- =============================

-- EXTENSIONS (ensure enabled in Supabase: uuid-ossp, pgcrypto)

-- ========== USERS TABLE ==========
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text, -- nullable if using only OAuth
  role text not null default 'siswa' check (role in ('super_admin','admin','moderator','osis','siswa','other')),
  sekbid_id int, -- 1..6 referencing internal mapping
  photo_url text,
  email_verified boolean not null default false,
  approved boolean not null default false, -- set true manually by super_admin
  verification_token text, -- one-time token for email verification
  verification_expires timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists users_role_idx on public.users(role);
create index if not exists users_sekbid_idx on public.users(sekbid_id);

-- Trigger for updated_at
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;$$ language plpgsql;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at before update on public.users
for each row execute function public.touch_updated_at();

-- ========== POSTS TABLE ==========
create table if not exists public.posts (
  id bigserial primary key,
  title text not null,
  slug text unique not null,
  content text not null,
  excerpt text,
  featured_image text,
  author_id uuid references public.users(id) on delete set null,
  sekbid_id int,
  category text,
  tags text[] default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  views int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists posts_status_idx on public.posts(status);
create index if not exists posts_sekbid_idx on public.posts(sekbid_id);
create index if not exists posts_author_idx on public.posts(author_id);
create index if not exists posts_published_at_idx on public.posts(published_at);

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts
for each row execute function public.touch_updated_at();

-- ========== SEKBID (BIDANG) TABLE ==========
create table if not exists public.sekbid (
  id serial primary key,
  name text not null,
  slug text unique not null,
  description text,
  vision text,
  mission text,
  icon text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists sekbid_slug_idx on public.sekbid(slug);

drop trigger if exists sekbid_updated_at on public.sekbid;
create trigger sekbid_updated_at before update on public.sekbid
for each row execute function public.touch_updated_at();

-- Insert default sekbid (bidang)
insert into public.sekbid (id, name, slug, description, icon, color) values
(1, 'Ketaqwaan', 'ketaqwaan', 'Bidang yang mengurusi kegiatan keagamaan dan spiritual', '🕌', '#10b981'),
(2, 'Keilmuan', 'keilmuan', 'Bidang yang mengurusi kegiatan akademik dan literasi', '📚', '#3b82f6'),
(3, 'Keterampilan', 'keterampilan', 'Bidang yang mengurusi pengembangan skill dan kreativitas', '🎨', '#f59e0b'),
(4, 'Kewirausahaan', 'kewirausahaan', 'Bidang yang mengurusi kegiatan bisnis dan entrepreneurship', '💼', '#8b5cf6'),
(5, 'Olahraga & Seni', 'olahraga-seni', 'Bidang yang mengurusi kegiatan olahraga dan kesenian', '⚽', '#ef4444'),
(6, 'Sosial & Lingkungan', 'sosial-lingkungan', 'Bidang yang mengurusi kegiatan sosial dan pelestarian lingkungan', '🌱', '#14b8a6')
on conflict (id) do nothing;

-- ========== MEMBERS TABLE ==========
create table if not exists public.members (
  id bigserial primary key,
  name text not null,
  role text not null, -- ketua, wakil, sekretaris, bendahara, anggota
  sekbid_id int references public.sekbid(id) on delete set null,
  photo_url text,
  quote text,
  instagram text,
  class text,
  achievements text[] default '{}',
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists members_sekbid_idx on public.members(sekbid_id);
create index if not exists members_role_idx on public.members(role);
create index if not exists members_order_idx on public.members(display_order);

drop trigger if exists members_updated_at on public.members;
create trigger members_updated_at before update on public.members
for each row execute function public.touch_updated_at();

-- ========== EVENTS TABLE ==========
create table if not exists public.events (
  id bigserial primary key,
  title text not null,
  slug text unique,
  description text,
  sekbid_id int references public.sekbid(id) on delete set null,
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  image_url text,
  poster_url text,
  max_participants int,
  registration_deadline timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming','ongoing','completed','cancelled')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists events_status_idx on public.events(status);
create index if not exists events_start_date_idx on public.events(start_date);
create index if not exists events_sekbid_idx on public.events(sekbid_id);

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
for each row execute function public.touch_updated_at();

-- ========== EVENT REGISTRATIONS ==========
create table if not exists public.event_registrations (
  id bigserial primary key,
  event_id bigint references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  class text,
  ticket_code text not null,
  status text not null default 'registered' check (status in ('registered','attended','cancelled')),
  registered_at timestamptz default now()
);

create index if not exists event_regs_event_idx on public.event_registrations(event_id);
create index if not exists event_regs_ticket_idx on public.event_registrations(ticket_code);

-- ========== PROGRAM KERJA ==========
create table if not exists public.program_kerja (
  id bigserial primary key,
  sekbid_id int not null,
  nama text not null,
  penanggung_jawab text,
  dasar_pemikiran text,
  tujuan text,
  waktu text,
  teknis text,
  anggaran text,
  evaluasi text,
  status text not null default 'planned' check (status in ('planned','ongoing','completed')),
  progress int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists program_kerja_sekbid_idx on public.program_kerja(sekbid_id);
create index if not exists program_kerja_status_idx on public.program_kerja(status);

drop trigger if exists program_kerja_updated_at on public.program_kerja;
create trigger program_kerja_updated_at before update on public.program_kerja
for each row execute function public.touch_updated_at();

-- ========== GALLERY ==========
create table if not exists public.gallery (
  id bigserial primary key,
  title text not null,
  description text,
  image_url text not null,
  event_id bigint references public.events(id) on delete set null,
  sekbid_id int,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists gallery_event_idx on public.gallery(event_id);
create index if not exists gallery_sekbid_idx on public.gallery(sekbid_id);

-- ========== ANNOUNCEMENTS ==========
create table if not exists public.announcements (
  id bigserial primary key,
  title text not null,
  content text not null,
  image_url text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  target_audience text,
  published boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists announcements_priority_idx on public.announcements(priority);
create index if not exists announcements_expires_idx on public.announcements(expires_at);

-- ========== POLLS ==========
create table if not exists public.polls (
  id bigserial primary key,
  question text not null,
  description text,
  options jsonb not null default '[]', -- [{id, text, votes}]
  multiple_choice boolean not null default false,
  sekbid_id int,
  active boolean not null default true,
  ends_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists polls_active_idx on public.polls(active);
create index if not exists polls_ends_idx on public.polls(ends_at);

-- ================= RLS POLICIES =================
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.sekbid enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.program_kerja enable row level security;
alter table public.gallery enable row level security;
alter table public.announcements enable row level security;
alter table public.polls enable row level security;

-- Basic policies (adjust later for stricter rules)
drop policy if exists "Users read" on public.users;
drop policy if exists "Users self update" on public.users;
create policy "Users read" on public.users for select using ( true );
create policy "Users self update" on public.users for update using ( auth.uid() = id );

drop policy if exists "Posts read" on public.posts;
drop policy if exists "Posts insert" on public.posts;
drop policy if exists "Posts update" on public.posts;
create policy "Posts read" on public.posts for select using ( status = 'published' or auth.role() = 'authenticated' );
create policy "Posts insert" on public.posts for insert with check ( auth.role() = 'authenticated' );
create policy "Posts update" on public.posts for update using ( auth.role() = 'authenticated' );

drop policy if exists "Sekbid read" on public.sekbid;
drop policy if exists "Sekbid write" on public.sekbid;
create policy "Sekbid read" on public.sekbid for select using ( true );
create policy "Sekbid write" on public.sekbid for all using ( auth.role() = 'authenticated' );

drop policy if exists "Members read" on public.members;
drop policy if exists "Members write" on public.members;
create policy "Members read" on public.members for select using ( true );
create policy "Members write" on public.members for all using ( auth.role() = 'authenticated' );

drop policy if exists "Events read" on public.events;
drop policy if exists "Events write" on public.events;
create policy "Events read" on public.events for select using ( true );
create policy "Events write" on public.events for all using ( auth.role() = 'authenticated' );

drop policy if exists "Event registrations read" on public.event_registrations;
drop policy if exists "Event registrations insert" on public.event_registrations;
create policy "Event registrations read" on public.event_registrations for select using ( true );
create policy "Event registrations insert" on public.event_registrations for insert with check ( true );

drop policy if exists "Program Kerja read" on public.program_kerja;
drop policy if exists "Program Kerja write" on public.program_kerja;
create policy "Program Kerja read" on public.program_kerja for select using ( true );
create policy "Program Kerja write" on public.program_kerja for all using ( auth.role() = 'authenticated' );

drop policy if exists "Gallery read" on public.gallery;
drop policy if exists "Gallery write" on public.gallery;
create policy "Gallery read" on public.gallery for select using ( true );
create policy "Gallery write" on public.gallery for all using ( auth.role() = 'authenticated' );

drop policy if exists "Announcements read" on public.announcements;
drop policy if exists "Announcements write" on public.announcements;
create policy "Announcements read" on public.announcements for select using ( true );
create policy "Announcements write" on public.announcements for all using ( auth.role() = 'authenticated' );

drop policy if exists "Polls read" on public.polls;
drop policy if exists "Polls write" on public.polls;
create policy "Polls read" on public.polls for select using ( true );
create policy "Polls write" on public.polls for all using ( auth.role() = 'authenticated' );

-- ================= NOTES =================
-- 1. Replace policies with granular role checks later.
-- 2. For production: add row ownership checks (created_by = auth.uid()).
-- 3. Consider separating auth schema for password hashes if needed.
-- 4. Add storage bucket in Supabase UI for images: 'gallery', 'posts', 'avatars'.
