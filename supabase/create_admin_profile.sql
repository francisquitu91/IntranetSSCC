-- Script para añadir un perfil administrador de prueba si no existe
-- Ejecutar DESPUÉS de clear_news_and_verify.sql

-- 1. Verificar y crear el perfil administrador si no existe
INSERT INTO public.profiles (id, email, password, full_name, role, course_ids) VALUES
  (
    '99999999-9999-9999-9999-999999999999',
    'administrador@ssccmanquehue.cl',
    'MISTERIO2002',
    'Administrador SSCC',
    'admin',
    '{}'
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  course_ids = EXCLUDED.course_ids;

-- 2. Verificar que el administrador existe
SELECT 'Administrador creado/actualizado:' as info, 
       email, full_name, role 
FROM public.profiles 
WHERE email = 'administrador@ssccmanquehue.cl';

-- 3. Mostrar todos los administradores disponibles
SELECT 'Todos los administradores:' as info, 
       email, full_name, role 
FROM public.profiles 
WHERE role = 'admin';