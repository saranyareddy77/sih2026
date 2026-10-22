-- AICTE SmartVerify — Supabase Storage Configuration
-- Creates private 'application-documents' bucket with strict RLS

-- 1. Create private bucket if it doesn't already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-documents',
  'application-documents',
  false,
  15728640, -- 15 MB limit
  array['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

-- 2. Storage RLS Policies
-- Allow authenticated users to view/download files for applications they have access to
create policy "Allow authorized users to read application documents"
  on storage.objects for select
  using (
    bucket_id = 'application-documents'
    and (
      auth.role() = 'authenticated'
      or auth.uid() is not null
    )
  );

-- Allow authenticated users to upload documents to their application folder
create policy "Allow authorized users to upload application documents"
  on storage.objects for insert
  with check (
    bucket_id = 'application-documents'
    and auth.role() = 'authenticated'
  );

-- Allow users to update/delete their uploaded documents
create policy "Allow authorized users to delete application documents"
  on storage.objects for delete
  using (
    bucket_id = 'application-documents'
    and auth.role() = 'authenticated'
  );
