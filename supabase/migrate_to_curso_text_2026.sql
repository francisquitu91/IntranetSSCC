-- MIGRACIÓN: Eliminar sistema de course_ids y usar solo campo "curso" (texto)
-- Este script elimina la tabla courses y reemplaza course_ids con campos de texto

-- ============================================
-- PARTE 1: AGREGAR CAMPOS DE TEXTO PARA CURSOS
-- ============================================

-- Agregar campo "cursos_objetivo" a las tablas que necesitan filtrar por curso
-- (es un array de texto para múltiples cursos, ej: ['1-C', 'PK-B'])

-- Tabla news
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS cursos_objetivo text[] DEFAULT '{}';

-- Tabla circulars
ALTER TABLE public.circulars 
ADD COLUMN IF NOT EXISTS cursos_objetivo text[] DEFAULT '{}';

-- Tabla calendar_events
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS cursos_objetivo text[] DEFAULT '{}';

-- Tabla gallery_items
ALTER TABLE public.gallery_items 
ADD COLUMN IF NOT EXISTS cursos_objetivo text[] DEFAULT '{}';

-- ============================================
-- PARTE 2: ELIMINAR CAMPOS Y TABLAS ANTIGUOS
-- ============================================

-- Eliminar columnas course_ids de todas las tablas
ALTER TABLE public.profiles DROP COLUMN IF EXISTS course_ids CASCADE;
ALTER TABLE public.news DROP COLUMN IF EXISTS course_ids CASCADE;
ALTER TABLE public.circulars DROP COLUMN IF EXISTS course_ids CASCADE;
ALTER TABLE public.calendar_events DROP COLUMN IF EXISTS course_ids CASCADE;
ALTER TABLE public.gallery_items DROP COLUMN IF EXISTS course_ids CASCADE;

-- Eliminar la tabla courses (ya no la necesitamos)
DROP TABLE IF EXISTS public.courses CASCADE;

-- ============================================
-- PARTE 3: ACTUALIZAR FUNCIÓN simple_upsert_profile
-- ============================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS public.simple_upsert_profile CASCADE;

-- Crear función SIN course_ids, solo con rut y curso (texto)
CREATE OR REPLACE FUNCTION public.simple_upsert_profile(
  p_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_rut text DEFAULT NULL,
  p_curso text DEFAULT NULL,
  p_cargo text DEFAULT NULL
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
      rut = COALESCE(p_rut, rut),
      curso = COALESCE(p_curso, curso),
      cargo = COALESCE(p_cargo, cargo)
    WHERE id = p_id
    RETURNING * INTO v_profile;
    
    IF FOUND THEN
      RETURN v_profile;
    END IF;
  END IF;

  -- Crear nuevo perfil
  INSERT INTO public.profiles (email, password, full_name, role, rut, curso, cargo)
  VALUES (
    lower(p_email), 
    trim(p_password), 
    p_full_name, 
    COALESCE(p_role, 'student'),
    p_rut,
    p_curso,
    p_cargo
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION public.simple_upsert_profile IS 'Creates or updates a profile with plain text password, rut, curso and cargo.';

-- ============================================
-- PARTE 4: ACTUALIZAR FUNCIÓN DE LOGIN
-- ============================================

-- Actualizar función simple_login para NO devolver course_ids
DROP FUNCTION IF EXISTS public.simple_login(text, text);

CREATE OR REPLACE FUNCTION public.simple_login(
  p_email text,
  p_password text
)
RETURNS table (
  id uuid,
  full_name text,
  email text,
  role text,
  rut text,
  curso text,
  cargo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
  v_is_email boolean;
BEGIN
  -- Detectar si es email (contiene @) o RUT
  v_is_email := position('@' in p_email) > 0;

  -- Buscar por email o RUT según corresponda
  IF v_is_email THEN
    SELECT p.*
    INTO v_profile
    FROM public.profiles p
    WHERE lower(p.email) = lower(p_email)
      AND p.password = p_password
      AND p.active = true
    LIMIT 1;
  ELSE
    -- Es RUT, limpiar formato y buscar
    SELECT p.*
    INTO v_profile
    FROM public.profiles p
    WHERE p.rut = p_email
      AND p.password = p_password
      AND p.active = true
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credenciales inválidas.' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
    SELECT v_profile.id,
           v_profile.full_name,
           v_profile.email,
           v_profile.role,
           v_profile.rut,
           v_profile.curso,
           v_profile.cargo;
END;
$$;

COMMENT ON FUNCTION public.simple_login IS 'Simple authentication with email or RUT and plain text password comparison.';

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT '✓ Migración completada' as status;
SELECT '✓ Sistema ahora usa campos de texto para cursos' as info;
SELECT '✓ Tabla courses eliminada' as info;
SELECT '✓ course_ids reemplazado por cursos_objetivo (text[])' as info;
SELECT '✓ Usuarios tienen campo "curso" (texto libre)' as info;

-- Mostrar estructura de profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
