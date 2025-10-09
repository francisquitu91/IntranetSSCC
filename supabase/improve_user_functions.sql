-- Mejoras a la función simple_upsert_profile para devolver el perfil completo
-- Ejecutar DESPUÉS de todas las migraciones y scripts anteriores

-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS public.simple_upsert_profile(uuid,text,text,text,text,uuid[]);

-- Reemplazar la función para que devuelva el perfil completo
CREATE OR REPLACE FUNCTION public.simple_upsert_profile(
  p_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_course_ids uuid[] DEFAULT NULL
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
      course_ids = COALESCE(p_course_ids, course_ids)
    WHERE id = p_id
    RETURNING * INTO v_profile;
    
    -- Si se encontró y actualizó el registro, devolverlo
    IF FOUND THEN
      RETURN v_profile;
    END IF;
  END IF;

  -- Si no se encontró para actualizar, o no se proporcionó ID, crear nuevo
  INSERT INTO public.profiles (email, password, full_name, role, course_ids)
  VALUES (
    lower(p_email), 
    trim(p_password), 
    p_full_name, 
    COALESCE(p_role, 'student'), 
    COALESCE(p_course_ids, '{}')
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION public.simple_upsert_profile IS 'Creates or updates a profile with plain text password, returns complete profile.';

-- Función para obtener todos los perfiles (para el admin)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_all_profiles IS 'Returns all profiles for admin management.';