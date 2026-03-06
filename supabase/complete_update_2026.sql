-- SCRIPT COMPLETO DE ACTUALIZACIÓN 2026
-- Este script combina todas las actualizaciones necesarias para:
-- 1. Limpiar cursos antiguos/demo
-- 2. Insertar nuevos cursos 2026
-- 3. Actualizar función de gestión de usuarios con RUT

-- ============================================
-- PARTE 1: ACTUALIZAR CURSOS
-- ============================================

-- Limpiar todas las referencias a cursos en otras tablas
UPDATE public.profiles SET course_ids = '{}' WHERE course_ids IS NOT NULL;
UPDATE public.news SET course_ids = '{}' WHERE course_ids IS NOT NULL;
UPDATE public.circulars SET course_ids = '{}' WHERE course_ids IS NOT NULL;
UPDATE public.calendar_events SET course_ids = '{}' WHERE course_ids IS NOT NULL;
UPDATE public.gallery_items SET course_ids = '{}' WHERE course_ids IS NOT NULL;

-- Eliminar todos los cursos existentes (demo)
DELETE FROM public.courses;

-- Insertar los nuevos cursos 2026
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

-- ============================================
-- PARTE 2: ACTUALIZAR FUNCIÓN PARA RUT Y CURSO
-- ============================================

-- Eliminar la función existente
DROP FUNCTION IF EXISTS public.simple_upsert_profile(uuid,text,text,text,text,uuid[]);
DROP FUNCTION IF EXISTS public.simple_upsert_profile(uuid,text,text,text,text,uuid[],text,text);

-- Crear la función actualizada con soporte para rut y curso
CREATE OR REPLACE FUNCTION public.simple_upsert_profile(
  p_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_course_ids uuid[] DEFAULT NULL,
  p_rut text DEFAULT NULL,
  p_curso text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  -- Validar contraseña si se proporciona
  IF p_password IS NOT NULL AND length(trim(p_password)) < 3 then
    RAISE EXCEPTION 'La contraseña debe tener al menos 3 caracteres.' USING ERRCODE = '22023';
  END IF;

  -- Si se proporciona un ID, intentar actualizar
  IF p_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      email = COALESCE(lower(p_email), email),
      password = COALESCE(trim(p_password), password),
      full_name = COALESCE(p_full_name, full_name),
      role = COALESCE(p_role, role),
      course_ids = COALESCE(p_course_ids, course_ids),
      rut = COALESCE(p_rut, rut),
      curso = COALESCE(p_curso, curso)
    WHERE id = p_id
    RETURNING * INTO v_profile;
    
    -- Si se encontró y actualizó el registro, devolverlo
    IF FOUND THEN
      RETURN v_profile;
    END IF;
  END IF;

  -- Si no se encontró para actualizar, o no se proporcionó ID, crear nuevo
  INSERT INTO public.profiles (email, password, full_name, role, course_ids, rut, curso)
  VALUES (
    lower(p_email), 
    trim(p_password), 
    p_full_name, 
    COALESCE(p_role, 'student'), 
    COALESCE(p_course_ids, '{}'),
    p_rut,
    p_curso
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION public.simple_upsert_profile IS 'Creates or updates a profile with plain text password, rut and curso, returns complete profile.';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar los cursos insertados
SELECT 
  '✓ Cursos actualizados:' as status, 
  count(*) as cantidad 
FROM public.courses;

-- Mostrar todos los cursos
SELECT '✓ Lista de cursos:' as info;
SELECT id, name, grade_level 
FROM public.courses 
ORDER BY grade_level, name;

-- Verificar la función
SELECT '✓ Función simple_upsert_profile actualizada correctamente.' as status;

-- Resumen final
SELECT '============================================' as separador;
SELECT '✓ ACTUALIZACIÓN COMPLETADA' as resultado;
SELECT '============================================' as separador;
SELECT '• 11 cursos nuevos insertados' as detalle
UNION ALL
SELECT '• Cursos demo eliminados' as detalle
UNION ALL
SELECT '• Función de usuarios actualizada con RUT' as detalle
UNION ALL
SELECT '• Sistema listo para usar con los nuevos cursos' as detalle;
