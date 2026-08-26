-- shi_studygram: news feed posts and images
-- Run in Supabase SQL editor or via MCP apply_migration.

-- ---------------------------------------------------------------------------
-- feed_posts + feed_post_images
-- ---------------------------------------------------------------------------
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_pbri_id text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_posts_created_at_idx
  on public.feed_posts (created_at desc, id desc);

create index if not exists feed_posts_author_idx
  on public.feed_posts (author_pbri_id);

create table if not exists public.feed_post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists feed_post_images_post_position_idx
  on public.feed_post_images (post_id, position, created_at);

drop trigger if exists feed_posts_set_updated_at on public.feed_posts;
create trigger feed_posts_set_updated_at
  before update on public.feed_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.feed_posts enable row level security;
alter table public.feed_post_images enable row level security;

create policy "feed_posts_select_authenticated"
  on public.feed_posts for select
  to authenticated
  using (true);

create policy "feed_posts_insert_own"
  on public.feed_posts for insert
  to authenticated
  with check (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

create policy "feed_posts_update_own"
  on public.feed_posts for update
  to authenticated
  using (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1))
  with check (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

create policy "feed_posts_delete_own"
  on public.feed_posts for delete
  to authenticated
  using (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

-- DEV ONLY: guest/demo access without login
create policy "feed_posts_select_anon"
  on public.feed_posts for select
  to anon
  using (true);

create policy "feed_posts_insert_anon"
  on public.feed_posts for insert
  to anon
  with check (true);

create policy "feed_posts_update_anon"
  on public.feed_posts for update
  to anon
  using (true)
  with check (true);

create policy "feed_posts_delete_anon"
  on public.feed_posts for delete
  to anon
  using (true);

create policy "feed_post_images_select_authenticated"
  on public.feed_post_images for select
  to authenticated
  using (true);

create policy "feed_post_images_insert_authenticated"
  on public.feed_post_images for insert
  to authenticated
  with check (true);

create policy "feed_post_images_update_authenticated"
  on public.feed_post_images for update
  to authenticated
  using (true)
  with check (true);

create policy "feed_post_images_delete_authenticated"
  on public.feed_post_images for delete
  to authenticated
  using (true);

create policy "feed_post_images_select_anon"
  on public.feed_post_images for select
  to anon
  using (true);

create policy "feed_post_images_insert_anon"
  on public.feed_post_images for insert
  to anon
  with check (true);

create policy "feed_post_images_update_anon"
  on public.feed_post_images for update
  to anon
  using (true)
  with check (true);

create policy "feed_post_images_delete_anon"
  on public.feed_post_images for delete
  to anon
  using (true);

-- Allow anon profile reads so feed author names resolve in demo mode
drop policy if exists "profiles_select_anon" on public.profiles;
create policy "profiles_select_anon"
  on public.profiles for select
  to anon
  using (true);

-- ---------------------------------------------------------------------------
-- Storage policies for feed images in the existing "images" bucket
-- Paths: images/feed/{post_id}/{image_id}.{ext}
-- ---------------------------------------------------------------------------
drop policy if exists "images_feed_select_public" on storage.objects;
create policy "images_feed_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'images' and name like 'images/feed/%');

drop policy if exists "images_feed_insert_authenticated" on storage.objects;
create policy "images_feed_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and name like 'images/feed/%');

drop policy if exists "images_feed_insert_anon" on storage.objects;
create policy "images_feed_insert_anon"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'images' and name like 'images/feed/%');

drop policy if exists "images_feed_update_authenticated" on storage.objects;
create policy "images_feed_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and name like 'images/feed/%')
  with check (bucket_id = 'images' and name like 'images/feed/%');

drop policy if exists "images_feed_update_anon" on storage.objects;
create policy "images_feed_update_anon"
  on storage.objects for update
  to anon
  using (bucket_id = 'images' and name like 'images/feed/%')
  with check (bucket_id = 'images' and name like 'images/feed/%');

drop policy if exists "images_feed_delete_authenticated" on storage.objects;
create policy "images_feed_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and name like 'images/feed/%');

drop policy if exists "images_feed_delete_anon" on storage.objects;
create policy "images_feed_delete_anon"
  on storage.objects for delete
  to anon
  using (bucket_id = 'images' and name like 'images/feed/%');
