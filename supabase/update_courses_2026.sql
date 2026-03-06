-- Actualizar los cursos con la nueva lista 2026
-- Este script elimina los cursos de demostración y agrega los cursos reales

-- 1. Limpiar todos los cursos antiguos/demo
-- Primero debemos eliminar las referencias de course_ids en perfiles, noticias, circulares, etc.
UPDATE public.profiles SET course_ids = '{}' WHERE course_ids IS NOT NULL;
UPDATE public.news SET course_ids = '{}' WHERE course_ids IS NOT NULL;
UPDATE public.circulars SET course_ids = '{}' WHERE course_ids IS NOT NULL;
UPDATE public.calendar_events SET course_ids = '{}' WHERE course_ids IS NOT NULL;
UPDATE public.gallery_items SET course_ids = '{}' WHERE course_ids IS NOT NULL;

-- 2. Eliminar todos los cursos existentes
DELETE FROM public.courses;

-- 3. Insertar los nuevos cursos 2026
-- Basado en la imagen adjunta con los cursos actualizados
INSERT INTO public.courses (id, name, grade_level)
VALUES
  ('c1000000-0000-0000-0000-000000000001', '1-C', 'Primer Ciclo'),
  ('c1000000-0000-0000-0000-000000000002', 'I-B', 'Primer Ciclo'),
  ('c1000000-0000-0000-0000-000000000003', 'I-D', 'Primer Ciclo'),
  ('c1000000-0000-0000-0000-000000000004', '2-A', 'Primer Ciclo'),
  ('c1000000-0000-0000-0000-000000000005', '2-C', 'Primer Ciclo'),
  ('c1000000-0000-0000-0000-000000000006', 'II-D', 'Primer Ciclo'),
  ('c1000000-0000-0000-0000-000000000007', 'III-A', 'Segundo Ciclo'),
  ('c1000000-0000-0000-0000-000000000008', 'III-D', 'Segundo Ciclo'),
  ('c1000000-0000-0000-0000-000000000009', '6-A', 'Segundo Ciclo'),
  ('c1000000-0000-0000-0000-000000000010', 'PK-B', 'Pre Kinder'),
  ('c1000000-0000-0000-0000-000000000011', 'PK-C', 'Pre Kinder')
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar los cursos insertados
SELECT 
  'Cursos actualizados:' as info, 
  count(*) as cantidad 
FROM public.courses;

-- 5. Mostrar todos los cursos
SELECT id, name, grade_level, created_at 
FROM public.courses 
ORDER BY grade_level, name;

-- Notas:
-- - Los cursos antiguos de demostración han sido eliminados
-- - Se insertaron 11 cursos nuevos basados en la estructura 2026
-- - Todos los course_ids en otras tablas fueron limpiados
-- - Los administradores deben reasignar cursos a estudiantes y contenidos
