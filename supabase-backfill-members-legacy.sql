-- Migration: Backfill legacy member and sekbid columns
-- Purpose: Ensure legacy columns (nama, foto_url, order_index, active)
-- exist and are populated from current columns so old code continues
-- to work. Safe to run multiple times (idempotent).

-- 1) Sekbid: ensure legacy `nama` exists and backfill from `name`
alter table if exists public.sekbid add column if not exists nama text;
update public.sekbid
set nama = name
where (nama is null or nama = '') and name is not null;
create index if not exists sekbid_nama_idx on public.sekbid (nama);

-- 2) Members: ensure current + legacy columns exist
-- Ensure legacy columns exist on members so updates referencing them don't fail
alter table if exists public.members add column if not exists nama text;
alter table if exists public.members add column if not exists foto_url text;
alter table if exists public.members add column if not exists order_index integer;
alter table if exists public.members add column if not exists active boolean;

-- Now ensure modern columns exist as well
alter table if exists public.members add column if not exists name text;
alter table if exists public.members add column if not exists photo_url text;
alter table if exists public.members add column if not exists display_order integer;
alter table if exists public.members add column if not exists is_active boolean default true;

-- Backfill members from legacy -> current or vice versa where appropriate
-- If 'name' empty but 'nama' exists, copy nama -> name
update public.members
set name = nama
where (name is null or name = '') and (nama is not null and nama <> '');

-- If 'foto_url' empty but old 'foto_url' exists, copy
update public.members
set photo_url = foto_url
where (photo_url is null or photo_url = '') and (foto_url is not null and foto_url <> '');

-- If display_order empty but order_index exists, copy
update public.members
set display_order = order_index
where display_order is null and order_index is not null;

-- If is_active is null but active exists, copy
update public.members
set is_active = active
where is_active is null and active is not null;

-- Optional: create indexes that may speed up lookups
create index if not exists members_name_idx on public.members (name);
create index if not exists members_is_active_idx on public.members (is_active);

-- Finished. Use a harmless SELECT as a completion notice (RAISE is PL/pgSQL-only).
SELECT 'Completed backfill and legacy column additions for sekbid and members.' as message;

-- 3) Add triggers to keep legacy and modern columns in sync on future INSERT/UPDATE
-- Members: mirror name <-> nama, photo_url <-> foto_url, display_order <-> order_index, is_active <-> active
drop function if exists public.mirror_members_legacy() cascade;
create function public.mirror_members_legacy()
returns trigger
language plpgsql
as $$
begin
	-- prefer modern columns when present; fill legacy if missing
	if (new.name is not null and (new.nama is null or new.nama = '')) then
		new.nama := new.name;
	elsif (new.nama is not null and (new.name is null or new.name = '')) then
		new.name := new.nama;
	end if;

	if (new.photo_url is not null and (new.foto_url is null or new.foto_url = '')) then
		new.foto_url := new.photo_url;
	elsif (new.foto_url is not null and (new.photo_url is null or new.photo_url = '')) then
		new.photo_url := new.foto_url;
	end if;

	if (new.display_order is not null and new.order_index is null) then
		new.order_index := new.display_order;
	elsif (new.order_index is not null and new.display_order is null) then
		new.display_order := new.order_index;
	end if;

	if (new.is_active is not null and new.active is null) then
		new.active := new.is_active;
	elsif (new.active is not null and new.is_active is null) then
		new.is_active := new.active;
	end if;

	return new;
end;
$$;

drop trigger if exists trg_mirror_members_legacy on public.members;
create trigger trg_mirror_members_legacy
before insert or update on public.members
for each row
execute function public.mirror_members_legacy();

-- Sekbid: mirror name <-> nama
drop function if exists public.mirror_sekbid_legacy() cascade;
create function public.mirror_sekbid_legacy()
returns trigger
language plpgsql
as $$
begin
	if (new.name is not null and (new.nama is null or new.nama = '')) then
		new.nama := new.name;
	elsif (new.nama is not null and (new.name is null or new.name = '')) then
		new.name := new.nama;
	end if;
	return new;
end;
$$;

drop trigger if exists trg_mirror_sekbid_legacy on public.sekbid;
create trigger trg_mirror_sekbid_legacy
before insert or update on public.sekbid
for each row
execute function public.mirror_sekbid_legacy();

-- End of sync triggers
