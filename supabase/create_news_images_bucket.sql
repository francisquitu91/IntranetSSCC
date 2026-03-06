-- Crear bucket para imágenes (si no existe)
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

-- Eliminar políticas si existen
drop policy if exists "Public can view news images" on storage.objects;
drop policy if exists "Allow file uploads to news-images" on storage.objects;
drop policy if exists "Allow file updates in news-images" on storage.objects;
drop policy if exists "Allow file deletion in news-images" on storage.objects;

-- Crear políticas para el bucket
create policy "Public can view news images" on storage.objects
  for select
  using (bucket_id = 'news-images');

create policy "Allow file uploads to news-images" on storage.objects
  for insert
  with check (bucket_id = 'news-images');

create policy "Allow file updates in news-images" on storage.objects
  for update
  using (bucket_id = 'news-images');

create policy "Allow file deletion in news-images" on storage.objects
  for delete
  using (bucket_id = 'news-images');

-- Verificar que se creó
select id, name, public from storage.buckets where id = 'news-images';
