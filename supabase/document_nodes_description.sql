-- Add optional description for AI document search context.
-- Run in Supabase SQL editor or via MCP apply_migration.

alter table public.document_nodes
  add column if not exists description text not null default '';
