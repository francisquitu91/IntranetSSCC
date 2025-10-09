-- Script para limpiar noticias existentes y verificar funcionalidad de edición
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar todas las noticias existentes
DELETE FROM public.news;

-- 2. Verificar que las tablas estén limpias
SELECT 'Noticias restantes:' as info, count(*) as cantidad FROM public.news;

-- 3. Verificar que los perfiles de admin existan para poder crear noticias
SELECT 'Administradores disponibles:' as info, count(*) as cantidad 
FROM public.profiles 
WHERE role = 'admin';

-- 4. Mostrar los administradores existentes
SELECT 'ID: ' || id || ' - Email: ' || email || ' - Nombre: ' || COALESCE(full_name, 'Sin nombre') as admin_info
FROM public.profiles 
WHERE role = 'admin';

-- 5. Verificar que los cursos existan para asignar a noticias
SELECT 'Cursos disponibles:' as info, count(*) as cantidad FROM public.courses;

-- 6. Mostrar los cursos existentes
SELECT 'ID: ' || id || ' - Nombre: ' || name || ' - Nivel: ' || COALESCE(grade_level, 'Sin nivel') as course_info
FROM public.courses 
ORDER BY name;