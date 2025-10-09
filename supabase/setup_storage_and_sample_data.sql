-- Create storage buckets for media uploads
-- Run this in Supabase SQL Editor after migrations

-- 1. Create buckets for news images, circulars, and gallery
insert into storage.buckets (id, name, public)
values 
  ('news-images', 'news-images', true),
  ('circulars', 'circulars', true),
  ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- 2. Create simple storage policies for public read access
create policy "Public can view news images" on storage.objects
  for select
  using (bucket_id = 'news-images');

create policy "Public can view circulars" on storage.objects
  for select
  using (bucket_id = 'circulars');

create policy "Public can view gallery" on storage.objects
  for select
  using (bucket_id = 'gallery');

-- 3. Allow admins/teachers to upload files (simplified - no role checking for now)
create policy "Allow file uploads to news-images" on storage.objects
  for insert
  with check (bucket_id = 'news-images');

create policy "Allow file uploads to circulars" on storage.objects
  for insert
  with check (bucket_id = 'circulars');

create policy "Allow file uploads to gallery" on storage.objects
  for insert
  with check (bucket_id = 'gallery');

-- 4. Allow admins/teachers to update/delete files
create policy "Allow file updates in news-images" on storage.objects
  for update
  using (bucket_id = 'news-images');

create policy "Allow file updates in circulars" on storage.objects
  for update
  using (bucket_id = 'circulars');

create policy "Allow file updates in gallery" on storage.objects
  for update
  using (bucket_id = 'gallery');

create policy "Allow file deletion in news-images" on storage.objects
  for delete
  using (bucket_id = 'news-images');

create policy "Allow file deletion in circulars" on storage.objects
  for delete
  using (bucket_id = 'circulars');

create policy "Allow file deletion in gallery" on storage.objects
  for delete
  using (bucket_id = 'gallery');

-- 5. Insert some sample news for testing
insert into public.news (id, title, excerpt, content, author, image_url, date, featured, course_ids, created_by)
values
  (gen_random_uuid(), 'Bienvenidos al nuevo año escolar 2025', 'Iniciamos un nuevo período lleno de desafíos y oportunidades para toda la comunidad educativa.', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', 'Dirección Académica', null, now(), true, '{}', '00000000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'Actividades deportivas de octubre', 'Conoce las competencias y torneos programados para este mes.', 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 'Coordinación Deportiva', null, now() - interval '2 days', false, '{}', '00000000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'Reunión de apoderados 4° Medio', 'Importante información sobre el proceso de graduación y PSU.', 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.', 'Coordinación Académica', null, now() - interval '1 day', false, (select array_agg(id) from public.courses where name like '%4° Medio%'), '00000000-0000-0000-0000-000000000001')
on conflict do nothing;