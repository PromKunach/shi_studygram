-- shi_studygram: document workspace tree (sections, folders, pages)
-- Unified adjacency-list model — supports future nested folders via parent_id.
-- Run in Supabase SQL editor or via MCP apply_migration.

-- ---------------------------------------------------------------------------
-- document_node_kind
--   section — top-level horizontal row on /documents (parent_id must be null)
--   folder  — container; may nest under section or another folder
--   page    — leaf document (maps to UI "document" type)
-- ---------------------------------------------------------------------------
create type public.document_node_kind as enum ('section', 'folder', 'page');

create table if not exists public.document_nodes (
  id uuid primary key default gen_random_uuid(),
  author_pbri_id text not null,
  parent_id uuid references public.document_nodes (id) on delete cascade,
  kind public.document_node_kind not null,
  title text not null,
  content text not null default '',
  drive_url text not null default '',
  icon text not null default 'file-text',
  color text not null default 'blue',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_nodes_section_is_root check (
    (kind = 'section' and parent_id is null)
    or (kind <> 'section' and parent_id is not null)
  ),
  constraint document_nodes_title_not_blank check (char_length(trim(title)) > 0)
);

-- List roots (sections) per user
create index if not exists document_nodes_author_sections_idx
  on public.document_nodes (author_pbri_id, position, created_at)
  where parent_id is null and kind = 'section';

-- List children of any node (section row items or future folder contents)
create index if not exists document_nodes_parent_position_idx
  on public.document_nodes (parent_id, position, created_at)
  where parent_id is not null;

create index if not exists document_nodes_author_idx
  on public.document_nodes (author_pbri_id);

-- ---------------------------------------------------------------------------
-- Prevent pages from having children; only sections/folders may be parents
-- ---------------------------------------------------------------------------
create or replace function public.document_nodes_validate_parent()
returns trigger
language plpgsql
as $$
declare
  parent_kind public.document_node_kind;
begin
  if new.kind = 'section' then
    return new;
  end if;

  select kind
  into parent_kind
  from public.document_nodes
  where id = new.parent_id;

  if parent_kind is null then
    raise exception 'document_nodes parent % not found', new.parent_id;
  end if;

  if parent_kind = 'page' then
    raise exception 'pages cannot contain child nodes';
  end if;

  return new;
end;
$$;

drop trigger if exists document_nodes_validate_parent on public.document_nodes;
create trigger document_nodes_validate_parent
  before insert or update of parent_id, kind on public.document_nodes
  for each row execute function public.document_nodes_validate_parent();

drop trigger if exists document_nodes_set_updated_at on public.document_nodes;
create trigger document_nodes_set_updated_at
  before update on public.document_nodes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.document_nodes enable row level security;

-- Authenticated: shared workspace — read/edit all documents; insert still own rows
create policy "document_nodes_select_public"
  on public.document_nodes for select
  to authenticated
  using (true);

create policy "document_nodes_insert_own"
  on public.document_nodes for insert
  to authenticated
  with check (author_pbri_id = split_part(auth.jwt() ->> 'email', '@', 1));

create policy "document_nodes_update_public"
  on public.document_nodes for update
  to authenticated
  using (true)
  with check (true);

create policy "document_nodes_delete_public"
  on public.document_nodes for delete
  to authenticated
  using (true);

-- DEV ONLY: guest/demo access without login — remove before production
create policy "document_nodes_select_anon"
  on public.document_nodes for select
  to anon
  using (true);

create policy "document_nodes_insert_anon"
  on public.document_nodes for insert
  to anon
  with check (true);

create policy "document_nodes_update_anon"
  on public.document_nodes for update
  to anon
  using (true)
  with check (true);

create policy "document_nodes_delete_anon"
  on public.document_nodes for delete
  to anon
  using (true);
