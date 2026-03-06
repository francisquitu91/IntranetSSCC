-- Crear perfil de profesor de prueba
-- Este usuario tendrá acceso a la gestión de contenidos con interfaz tipo estudiante

-- Verificar si el usuario ya existe
DO $$
DECLARE
  v_profile_id uuid;
  v_course_id uuid;
BEGIN
  -- Obtener un curso existente para asignar al profesor
  SELECT id INTO v_course_id
  FROM public.courses
  LIMIT 1;

  -- Crear o actualizar el perfil del profesor
  INSERT INTO public.profiles (id, email, password, full_name, role, course_ids)
  VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-000000000001'::uuid,
    'profesor@ssccmanquehue.cl',
    'PROFESOR2024',
    'Profesor Demo',
    'teacher',
    CASE WHEN v_course_id IS NOT NULL THEN ARRAY[v_course_id] ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    course_ids = EXCLUDED.course_ids;

  RAISE NOTICE 'Perfil de profesor creado/actualizado exitosamente';
  RAISE NOTICE 'Email: profesor@ssccmanquehue.cl';
  RAISE NOTICE 'Password: PROFESOR2024';
END $$;

-- Verificar que el perfil se creó correctamente
SELECT 
  id,
  email,
  full_name,
  role,
  course_ids,
  created_at
FROM public.profiles
WHERE email = 'profesor@ssccmanquehue.cl';
