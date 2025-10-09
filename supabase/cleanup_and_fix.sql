-- Script para limpiar datos duplicados y corregir problemas
-- Ejecutar en Supabase SQL Editor DESPUÉS de todas las migraciones

-- 1. Limpiar cursos duplicados
WITH duplicate_courses AS (
  SELECT id, name, grade_level,
         ROW_NUMBER() OVER (PARTITION BY name, grade_level ORDER BY created_at) as rn
  FROM public.courses
)
DELETE FROM public.courses 
WHERE id IN (
  SELECT id FROM duplicate_courses WHERE rn > 1
);

-- 2. Verificar que tenemos solo los cursos únicos
-- Si no hay cursos, los insertamos
INSERT INTO public.courses (id, name, grade_level)
VALUES
  ('11111111-1111-1111-1111-111111111111', '1° Básico A', 'Primer Ciclo'),
  ('22222222-2222-2222-2222-222222222222', '2° Básico A', 'Primer Ciclo'),
  ('33333333-3333-3333-3333-333333333333', '3° Básico A', 'Primer Ciclo'),
  ('44444444-4444-4444-4444-444444444444', '4° Básico A', 'Segundo Ciclo'),
  ('55555555-5555-5555-5555-555555555555', '5° Básico A', 'Segundo Ciclo'),
  ('66666666-6666-6666-6666-666666666666', '6° Básico A', 'Segundo Ciclo'),
  ('77777777-7777-7777-7777-777777777777', '1° Medio A', 'Enseñanza Media'),
  ('88888888-8888-8888-8888-888888888888', '2° Medio A', 'Enseñanza Media'),
  ('99999999-9999-9999-9999-999999999999', '3° Medio A', 'Enseñanza Media'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4° Medio A', 'Enseñanza Media'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '4° Medio B', 'Enseñanza Media')
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar y corregir perfiles
-- Asegurar que los perfiles de prueba existen
INSERT INTO public.profiles (id, email, password, full_name, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@sscc.cl', 'Admin123!', 'Administrador SSCC', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'alumno@sscc.cl', 'Alumno123!', 'Estudiante Demo', 'student')
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      password = EXCLUDED.password,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;

-- 4. Limpiar noticias existentes (opcional, solo si hay problemas)
-- DELETE FROM public.news WHERE title LIKE 'Bienvenidos%' OR title LIKE 'Actividades%' OR title LIKE 'Reunión%';

-- 5. Mostrar estado actual
SELECT 'Cursos encontrados:' as info, count(*) as cantidad FROM public.courses
UNION ALL
SELECT 'Perfiles encontrados:' as info, count(*) as cantidad FROM public.profiles
UNION ALL
SELECT 'Noticias encontradas:' as info, count(*) as cantidad FROM public.news;