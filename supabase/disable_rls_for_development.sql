-- Simplificar políticas RLS para permitir operaciones CRUD básicas
-- Ejecutar DESPUÉS de cleanup_and_fix.sql

-- 1. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Allow all read" ON public.news;
DROP POLICY IF EXISTS "Allow all read" ON public.circulars;
DROP POLICY IF EXISTS "Allow all read" ON public.gallery_items;
DROP POLICY IF EXISTS "Allow all read" ON public.courses;
DROP POLICY IF EXISTS "Allow all read" ON public.profiles;

-- Políticas para storage
DROP POLICY IF EXISTS "Public can view news images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view circulars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow file uploads to news-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow file uploads to circulars" ON storage.objects;
DROP POLICY IF EXISTS "Allow file uploads to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow file updates in news-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow file updates in circulars" ON storage.objects;
DROP POLICY IF EXISTS "Allow file updates in gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow file deletion in news-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow file deletion in circulars" ON storage.objects;
DROP POLICY IF EXISTS "Allow file deletion in gallery" ON storage.objects;

-- 2. Desactivar RLS temporalmente para permitir operaciones
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;

-- 3. Para storage, crear políticas muy permisivas
CREATE POLICY "Allow all operations" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- 4. Si quieres mantener algo de seguridad básica, reactivar RLS con políticas simples
-- (Descomenta las siguientes líneas si quieres seguridad básica)

/*
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Políticas muy permisivas para desarrollo
CREATE POLICY "Allow all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.circulars FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.gallery_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.courses FOR ALL USING (true) WITH CHECK (true);
*/

-- 5. Verificar que todo funciona
SELECT 'TEST: Can select from courses' as test, count(*) as result FROM public.courses;
SELECT 'TEST: Can select from profiles' as test, count(*) as result FROM public.profiles;