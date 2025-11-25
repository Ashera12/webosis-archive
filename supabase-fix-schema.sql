-- =============================
-- Fix Schema - Update existing tables
-- Run this to fix schema issues
-- =============================

-- Drop existing events table if exists and recreate with correct schema
drop table if exists public.event_registrations cascade;
drop table if exists public.events cascade;

-- Create or ensure sekbid has required columns even if table already exists
create table if not exists public.sekbid (
  id serial primary key,
  name text not null,
  -- slug will be ensured below for existing tables
  slug text unique,
  description text,
  vision text,
  mission text,
  icon text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- If the table existed without slug, add it now
alter table public.sekbid add column if not exists slug text;
-- If the table existed without name (legacy schemas), add it safely (nullable first)
alter table public.sekbid add column if not exists name text;
-- Ensure other default insert columns exist on legacy schemas
alter table public.sekbid add column if not exists description text;
alter table public.sekbid add column if not exists icon text;
alter table public.sekbid add column if not exists color text;

-- Handle legacy nama column and constraints
do $$
declare
  has_nama boolean;
  has_title boolean;
  has_name boolean;
begin
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sekbid' and column_name='nama'
  ) into has_nama;
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sekbid' and column_name='title'
  ) into has_title;
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sekbid' and column_name='name'
  ) into has_name;

  -- Drop NOT NULL constraint on legacy nama column if it exists
  if has_nama then
    begin
      alter table public.sekbid alter column nama drop not null;
      raise notice 'Dropped NOT NULL constraint on legacy nama column';
    exception when others then
      raise notice 'No NOT NULL constraint on nama or already dropped: %', SQLERRM;
    end;
  end if;

  -- Drop NOT NULL constraint on name column temporarily to allow migration
  if has_name then
    begin
      alter table public.sekbid alter column name drop not null;
      raise notice 'Dropped NOT NULL constraint on name column (will be restored after migration)';
    exception when others then
      raise notice 'No NOT NULL constraint on name or already dropped: %', SQLERRM;
    end;
  end if;

  -- Backfill name from legacy columns (for existing rows before insert)
  if has_nama then
    update public.sekbid set name = coalesce(name, nama) where name is null and nama is not null;
  end if;
  if has_title then
    update public.sekbid set name = coalesce(name, title) where name is null and title is not null;
  end if;
end $$;

-- Ensure an index/unique constraint for slug exists
create index if not exists sekbid_slug_idx on public.sekbid(slug);

drop trigger if exists sekbid_updated_at on public.sekbid;
create trigger sekbid_updated_at before update on public.sekbid
for each row execute function public.touch_updated_at();

-- Insert default sekbid (bidang) - handle both legacy (nama) and new (name) schemas
do $$
declare
  has_nama boolean;
  has_name boolean;
begin
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sekbid' and column_name='nama'
  ) into has_nama;
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sekbid' and column_name='name'
  ) into has_name;

  if has_name and not has_nama then
    -- New schema with 'name' column only
    insert into public.sekbid (id, name, slug, description, icon, color) values
    (1, 'Ketaqwaan', 'ketaqwaan', 'Bidang yang mengurusi kegiatan keagamaan dan spiritual', '🕌', '#10b981'),
    (2, 'Keilmuan', 'keilmuan', 'Bidang yang mengurusi kegiatan akademik dan literasi', '📚', '#3b82f6'),
    (3, 'Keterampilan', 'keterampilan', 'Bidang yang mengurusi pengembangan skill dan kreativitas', '🎨', '#f59e0b'),
    (4, 'Kewirausahaan', 'kewirausahaan', 'Bidang yang mengurusi kegiatan bisnis dan entrepreneurship', '💼', '#8b5cf6'),
    (5, 'Olahraga & Seni', 'olahraga-seni', 'Bidang yang mengurusi kegiatan olahraga dan kesenian', '⚽', '#ef4444'),
    (6, 'Sosial & Lingkungan', 'sosial-lingkungan', 'Bidang yang mengurusi kegiatan sosial dan pelestarian lingkungan', '🌱', '#14b8a6')
    on conflict (id) do nothing;
  elsif has_nama then
    -- Legacy schema with 'nama' column (insert to nama, will migrate to name below)
    insert into public.sekbid (id, nama, slug, description, icon, color) values
    (1, 'Ketaqwaan', 'ketaqwaan', 'Bidang yang mengurusi kegiatan keagamaan dan spiritual', '🕌', '#10b981'),
    (2, 'Keilmuan', 'keilmuan', 'Bidang yang mengurusi kegiatan akademik dan literasi', '📚', '#3b82f6'),
    (3, 'Keterampilan', 'keterampilan', 'Bidang yang mengurusi pengembangan skill dan kreativitas', '🎨', '#f59e0b'),
    (4, 'Kewirausahaan', 'kewirausahaan', 'Bidang yang mengurusi kegiatan bisnis dan entrepreneurship', '💼', '#8b5cf6'),
    (5, 'Olahraga & Seni', 'olahraga-seni', 'Bidang yang mengurusi kegiatan olahraga dan kesenian', '⚽', '#ef4444'),
    (6, 'Sosial & Lingkungan', 'sosial-lingkungan', 'Bidang yang mengurusi kegiatan sosial dan pelestarian lingkungan', '🌱', '#14b8a6')
    on conflict (id) do nothing;
    
    -- Migrate data from nama to name and then drop nama column
    if has_name then
      update public.sekbid set name = coalesce(name, nama) where name is null or name = '';
      raise notice 'Migrated data from nama to name column';
      
      -- Drop the legacy nama column
      begin
        alter table public.sekbid drop column nama;
        raise notice 'Dropped legacy nama column';
      exception when others then
        raise notice 'Could not drop nama column: %', SQLERRM;
      end;
    end if;
  end if;
  
  -- Enforce NOT NULL on name column after all data is migrated
  if has_name then
    begin
      alter table public.sekbid alter column name set not null;
      raise notice 'Enforced NOT NULL constraint on name column';
    exception when others then
      raise notice 'Could not enforce NOT NULL on name: %', SQLERRM;
    end;
  end if;
end $$;

-- Create members table (if not exists)
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

-- Ensure columns exist before creating indexes (legacy schemas may be missing them)
alter table public.members add column if not exists role text;
alter table public.members add column if not exists display_order int;

create index if not exists members_sekbid_idx on public.members(sekbid_id);
create index if not exists members_role_idx on public.members(role);
create index if not exists members_order_idx on public.members(display_order);

drop trigger if exists members_updated_at on public.members;
create trigger members_updated_at before update on public.members
for each row execute function public.touch_updated_at();

-- Recreate events table with correct schema
create table public.events (
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

create index events_status_idx on public.events(status);
create index events_start_date_idx on public.events(start_date);
create index events_sekbid_idx on public.events(sekbid_id);

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
for each row execute function public.touch_updated_at();

-- Recreate event_registrations table
create table public.event_registrations (
  id bigserial primary key,
  event_id bigint references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  class text,
  ticket_code text not null unique,
  status text not null default 'registered' check (status in ('registered','attended','cancelled')),
  registered_at timestamptz default now()
);

create index event_regs_event_idx on public.event_registrations(event_id);
create index event_regs_ticket_idx on public.event_registrations(ticket_code);

-- Update program_kerja to reference sekbid correctly
alter table public.program_kerja 
  drop constraint if exists program_kerja_sekbid_id_fkey;

alter table public.program_kerja 
  add constraint program_kerja_sekbid_id_fkey 
  foreign key (sekbid_id) references public.sekbid(id) on delete set null;

-- Update gallery to reference sekbid correctly
alter table public.gallery 
  drop constraint if exists gallery_sekbid_id_fkey;

alter table public.gallery 
  add constraint gallery_sekbid_id_fkey 
  foreign key (sekbid_id) references public.sekbid(id) on delete set null;

-- Enable RLS on new tables
alter table public.sekbid enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

-- Add policies for sekbid
drop policy if exists "Sekbid read" on public.sekbid;
drop policy if exists "Sekbid write" on public.sekbid;
create policy "Sekbid read" on public.sekbid for select using ( true );
create policy "Sekbid write" on public.sekbid for all using ( auth.role() = 'authenticated' );

-- Add policies for members
drop policy if exists "Members read" on public.members;
drop policy if exists "Members write" on public.members;
create policy "Members read" on public.members for select using ( true );
create policy "Members write" on public.members for all using ( auth.role() = 'authenticated' );

-- Add policies for events
drop policy if exists "Events read" on public.events;
drop policy if exists "Events write" on public.events;
create policy "Events read" on public.events for select using ( true );
create policy "Events write" on public.events for all using ( auth.role() = 'authenticated' );

-- Add policies for event_registrations
drop policy if exists "Event registrations read" on public.event_registrations;
drop policy if exists "Event registrations insert" on public.event_registrations;
create policy "Event registrations read" on public.event_registrations for select using ( true );
create policy "Event registrations insert" on public.event_registrations for insert with check ( true );

-- Success message
do $$
begin
  raise notice '✅ Schema fix completed successfully!';
  raise notice '📋 Tables created/updated: sekbid, members, events, event_registrations';
  raise notice '🔐 RLS policies applied';
  raise notice '🎯 Next: Insert sample data if needed';
end $$;
