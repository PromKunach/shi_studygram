-- Profile read access + profile image storage policies
-- Run in Supabase SQL editor or via MCP apply_migration.

-- ---------------------------------------------------------------------------
-- profiles: RLS was enabled but policies were missing on remote
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_select_anon" on public.profiles;
create policy "profiles_select_anon"
  on public.profiles for select
  to anon
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (pbri_id::text = split_part(auth.jwt() ->> 'email', '@', 1))
  with check (pbri_id::text = split_part(auth.jwt() ->> 'email', '@', 1));

-- ---------------------------------------------------------------------------
-- Storage: profile avatars in images/profile_images/pfp_{id}.JPG
-- ---------------------------------------------------------------------------
drop policy if exists "images_profile_select_public" on storage.objects;
create policy "images_profile_select_public"
  on storage.objects for select
  to public
  using (
    bucket_id = 'images'
    and name like 'profile_images/%'
  );
