-- Make document_nodes readable (and editable) by all authenticated users.
-- Guest-created rows use author_pbri_id = 'demo'; they were hidden after login
-- because select_own only matched the signed-in user's pbri_id.

create policy "document_nodes_select_public"
  on public.document_nodes for select
  to authenticated
  using (true);

create policy "document_nodes_update_public"
  on public.document_nodes for update
  to authenticated
  using (true)
  with check (true);

create policy "document_nodes_delete_public"
  on public.document_nodes for delete
  to authenticated
  using (true);
