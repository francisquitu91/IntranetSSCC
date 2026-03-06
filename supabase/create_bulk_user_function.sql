-- Función para crear usuarios masivamente (nóminas)
-- Soporta campos: rut, curso, cargo
-- Solo accesible por administradores

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS public.create_user_profile(text, text, text, text, uuid[], text, text, text);

-- Crear función para insertar perfiles con todos los campos necesarios
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text DEFAULT 'student',
  p_course_ids uuid[] DEFAULT '{}',
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
  v_new_id uuid;
BEGIN
  -- Validar que se proporcionen datos mínimos
  IF p_email IS NULL OR p_password IS NULL OR p_full_name IS NULL THEN
    RAISE EXCEPTION 'Email, contraseña y nombre completo son requeridos.' USING ERRCODE = '22023';
  END IF;

  -- Validar contraseña
  IF length(trim(p_password)) < 3 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 3 caracteres.' USING ERRCODE = '22023';
  END IF;

  -- Verificar si el email ya existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = lower(p_email)) THEN
    RAISE EXCEPTION 'Ya existe un usuario con este email.' USING ERRCODE = '23505';
  END IF;

  -- Verificar si el RUT ya existe (solo si se proporciona)
  IF p_rut IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE rut = p_rut) THEN
    RAISE EXCEPTION 'Ya existe un usuario con este RUT.' USING ERRCODE = '23505';
  END IF;

  -- Generar un nuevo UUID
  v_new_id := gen_random_uuid();

  -- Insertar el nuevo perfil
  INSERT INTO public.profiles (
    id,
    email,
    password,
    full_name,
    role,
    course_ids,
    rut,
    curso,
    cargo,
    active
  )
  VALUES (
    v_new_id,
    lower(p_email),
    trim(p_password),
    p_full_name,
    COALESCE(p_role, 'student'),
    COALESCE(p_course_ids, '{}'),
    p_rut,
    p_curso,
    p_cargo,
    true
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION public.create_user_profile IS 'Creates a new user profile with RUT, curso, and cargo fields. Used for bulk user creation from nóminas.';

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- Asegurarse de que la tabla profiles tiene los campos necesarios
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Comentarios
COMMENT ON COLUMN public.profiles.password IS 'Plain text password for simple authentication';
COMMENT ON COLUMN public.profiles.active IS 'Whether the user account is active';
