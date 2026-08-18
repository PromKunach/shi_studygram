-- shi_studygram schema: appointments, saved tags, profiles, announcement boards
-- Run in Supabase SQL editor or via: supabase db push

-- ---------------------------------------------------------------------------
-- profiles (used by userProfile.ts)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id bigint generated always as identity primary key,
  pbri_id text not null unique,
  full_name_th text,
  nickname_th text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_pbri_id_idx on public.profiles (pbri_id);

-- ---------------------------------------------------------------------------
-- appointments (used by appointments.ts)
-- ---------------------------------------------------------------------------
create type public.appointment_tone as enum ('red', 'blue', 'neutral');

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  scheduled_date date not null,
  tone public.appointment_tone not null default 'neutral',
  tag_label text,
  tag_color text,
  series_id uuid,
  author_pbri_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_tag_color_requires_label
    check (tag_label is null or tag_color is not null)
);

create index if not exists appointments_scheduled_date_idx
  on public.appointments (scheduled_date);

create index if not exists appointments_author_pbri_id_idx
  on public.appointments (author_pbri_id);

create index if not exists appointments_series_id_idx
  on public.appointments (series_id)
  where series_id is not null;

-- ---------------------------------------------------------------------------
-- appointment_saved_tags (used by appointmentTags.ts)
-- ---------------------------------------------------------------------------
create table if not exists public.appointment_saved_tags (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  color text not null,
  author_pbri_id text not null,
  created_at timestamptz not null default now(),
  unique (author_pbri_id, label)
);

create index if not exists appointment_saved_tags_author_idx
  on public.appointment_saved_tags (author_pbri_id);

-- ---------------------------------------------------------------------------
-- announcement_boards (used by announcementBoard.ts)
-- ---------------------------------------------------------------------------
create table if not exists public.announcement_boards (
  announcement_id uuid primary key,
  blocks jsonb not null default '[]'::jsonb,
  connections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists announcement_boards_set_updated_at on public.announcement_boards;
create trigger announcement_boards_set_updated_at
  before update on public.announcement_boards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (basic: authenticated users)
-- Adjust policies to match your auth model (pbri_id from JWT email prefix).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_saved_tags enable row level security;
alter table public.announcement_boards enable row level security;

-- Profiles: read all authenticated, update own row by pbri_id
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (pbri_id = split_part(auth.jwt() ->> 'email', '@', 1))
  with check (pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

-- Appointments: authenticated users can read all; anon can read (dev/demo)
create policy "appointments_select_authenticated"
  on public.appointments for select
  to authenticated
  using (true);

create policy "appointments_select_anon"
  on public.appointments for select
  to anon
  using (true);

create policy "appointments_insert_own"
  on public.appointments for insert
  to authenticated
  with check (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

create policy "appointments_update_own"
  on public.appointments for update
  to authenticated
  using (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1))
  with check (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

create policy "appointments_delete_own"
  on public.appointments for delete
  to authenticated
  using (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

-- DEV ONLY: remove before production — anon can write without login
create policy "appointments_insert_anon"
  on public.appointments for insert
  to anon
  with check (true);

create policy "appointments_update_anon"
  on public.appointments for update
  to anon
  using (true)
  with check (true);

create policy "appointments_delete_anon"
  on public.appointments for delete
  to anon
  using (true);

-- Saved tags: per-user
create policy "appointment_saved_tags_select_own"
  on public.appointment_saved_tags for select
  to authenticated
  using (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

create policy "appointment_saved_tags_insert_own"
  on public.appointment_saved_tags for insert
  to authenticated
  with check (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

create policy "appointment_saved_tags_update_own"
  on public.appointment_saved_tags for update
  to authenticated
  using (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1))
  with check (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

create policy "appointment_saved_tags_delete_own"
  on public.appointment_saved_tags for delete
  to authenticated
  using (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

-- DEV ONLY: anon saved-tag access
create policy "appointment_saved_tags_select_anon"
  on public.appointment_saved_tags for select
  to anon
  using (true);

create policy "appointment_saved_tags_insert_anon"
  on public.appointment_saved_tags for insert
  to anon
  with check (true);

create policy "appointment_saved_tags_update_anon"
  on public.appointment_saved_tags for update
  to anon
  using (true)
  with check (true);

create policy "appointment_saved_tags_delete_anon"
  on public.appointment_saved_tags for delete
  to anon
  using (true);

-- Announcement boards: authenticated read/write (tighten per announcement later)
create policy "announcement_boards_select_authenticated"
  on public.announcement_boards for select
  to authenticated
  using (true);

create policy "announcement_boards_select_anon"
  on public.announcement_boards for select
  to anon
  using (true);

create policy "announcement_boards_insert_authenticated"
  on public.announcement_boards for insert
  to authenticated
  with check (true);

create policy "announcement_boards_update_authenticated"
  on public.announcement_boards for update
  to authenticated
  using (true)
  with check (true);

create policy "announcement_boards_delete_authenticated"
  on public.announcement_boards for delete
  to authenticated
  using (true);
