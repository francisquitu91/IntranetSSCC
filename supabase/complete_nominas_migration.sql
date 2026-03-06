-- ============================================
-- MIGRACIONES COMPLETAS PARA SISTEMA DE NÓMINAS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Agregar campos RUT, curso y cargo a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS curso TEXT,
ADD COLUMN IF NOT EXISTS cargo TEXT;

-- 2. Crear índice para búsqueda rápida por RUT
CREATE INDEX IF NOT EXISTS idx_profiles_rut ON public.profiles(rut);

-- 3. Agregar constraint único para RUT (no puede haber duplicados)
-- Primero eliminar el constraint si existe
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS unique_rut;

-- Luego agregarlo
ALTER TABLE public.profiles
ADD CONSTRAINT unique_rut UNIQUE (rut);

-- 4. Comentarios
COMMENT ON COLUMN public.profiles.rut IS 'RUT del usuario (formato: 12345678-9)';
COMMENT ON COLUMN public.profiles.curso IS 'Curso del estudiante (ej: I-A, 8-B, IV-C)';
COMMENT ON COLUMN public.profiles.cargo IS 'Cargo del trabajador (ej: Profesor, Director)';

-- 5. Actualizar función simple_login para soportar login con RUT o Email
-- Si el p_email contiene un @, busca por email
-- Si no, asume que es un RUT y busca por RUT

DROP FUNCTION IF EXISTS public.simple_login(text, text);

CREATE OR REPLACE FUNCTION public.simple_login(
  p_email text,
  p_password text
)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  course_ids uuid[],
  rut text,
  curso text
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
    -- Es RUT, buscar por campo RUT
    SELECT p.*
    INTO v_profile
    FROM public.profiles p
    WHERE p.rut = p_email
      AND p.password = p_password
      AND p.active = true
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credenciales inválidas.' USING errcode = '28000';
  END IF;

  RETURN QUERY
    SELECT v_profile.id,
           v_profile.full_name,
           v_profile.email,
           v_profile.role,
           v_profile.course_ids,
           v_profile.rut,
           v_profile.curso;
END;
$$;

COMMENT ON FUNCTION public.simple_login IS 'Simple authentication with email or RUT and plain text password comparison.';

-- 6. Verificar los cambios
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('rut', 'curso', 'cargo')
ORDER BY ordinal_position;

-- Mostrar un mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✓ Migraciones completadas exitosamente!';
  RAISE NOTICE '✓ Campos rut, curso y cargo agregados a profiles';
  RAISE NOTICE '✓ Índice creado para búsqueda por RUT';
  RAISE NOTICE '✓ Función simple_login actualizada para soportar RUT';
  RAISE NOTICE '✓ Ahora puedes cargar nóminas desde el panel de administración';
END $$;
