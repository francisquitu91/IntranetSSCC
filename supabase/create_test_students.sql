-- Script para crear datos de prueba con estudiantes por curso
-- Ejecutar DESPUÉS de todos los scripts anteriores

-- 1. Crear algunos estudiantes de prueba con cursos asignados
INSERT INTO public.profiles (id, email, password, full_name, role, course_ids) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'juan.perez@sscc.cl',
    'Alumno123!',
    'Juan Pérez González',
    'student',
    (SELECT ARRAY[id] FROM public.courses WHERE name = '1° Básico A' LIMIT 1)
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'maria.rodriguez@sscc.cl',
    'Alumno123!',
    'María Rodríguez Silva',
    'student',
    (SELECT ARRAY[id] FROM public.courses WHERE name = '4° Medio B' LIMIT 1)
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'carlos.gonzalez@sscc.cl',
    'Alumno123!',
    'Carlos González López',
    'student',
    (SELECT ARRAY[id] FROM public.courses WHERE name = '1° Básico A' LIMIT 1)
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  course_ids = EXCLUDED.course_ids;

-- 2. Crear algunas noticias específicas por curso para pruebas
INSERT INTO public.news (id, title, excerpt, content, author, image_url, date, featured, course_ids, created_by) VALUES
  (
    gen_random_uuid(),
    'Actividades de 1° Básico A - Semana del Arte',
    'Los estudiantes de 1° Básico A participarán en actividades especiales de arte.',
    'Durante esta semana, los estudiantes de 1° Básico A tendrán la oportunidad de participar en diversas actividades artísticas. Incluye pintura, manualidades y presentaciones teatrales. Se requiere que traigan sus materiales de arte el día lunes. Las actividades comenzarán a las 9:00 AM en el aula de arte. Los padres pueden venir a ver las presentaciones el viernes a las 15:00.',
    'Profesora Ana García',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&q=80',
    now() - interval '1 day',
    false,
    (SELECT ARRAY[id] FROM public.courses WHERE name = '1° Básico A' LIMIT 1),
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    gen_random_uuid(),
    'Graduación 4° Medio B - Ceremonia Especial',
    'Los estudiantes de 4° Medio B se preparan para su ceremonia de graduación.',
    'Queridos estudiantes y familias de 4° Medio B, nos complace invitarlos a la ceremonia de graduación que se realizará el próximo viernes 15 de noviembre a las 19:00 horas en el gimnasio principal del colegio. Esta será una noche muy especial donde celebraremos los logros de nuestros queridos estudiantes. Por favor, confirmen su asistencia antes del miércoles. Se solicita vestimenta formal para la ocasión. Habrá un cóctel después de la ceremonia para compartir en familia.',
    'Coordinación Académica',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
    now() - interval '2 days',
    true,
    (SELECT ARRAY[id] FROM public.courses WHERE name = '4° Medio B' LIMIT 1),
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    gen_random_uuid(),
    'Noticia General - Nuevo Horario de Biblioteca',
    'La biblioteca ampliará sus horarios de atención para todos los estudiantes.',
    'Estimada comunidad educativa, nos complace informar que a partir del próximo lunes, la biblioteca del colegio ampliará sus horarios de atención. Los nuevos horarios serán de lunes a viernes de 7:30 a 18:00 horas. Los estudiantes podrán acceder a todos los recursos bibliográficos, computadores y espacios de estudio durante estos horarios. También se implementará un nuevo sistema de reserva de salas de estudio grupal. Para más información, contactar a la bibliotecaria Lorena Rodríguez.',
    'Dirección Académica',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
    now(),
    false,
    '{}',
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT DO NOTHING;

-- 3. Verificar los datos creados
SELECT 'Perfiles creados:' as info, count(*) as cantidad FROM public.profiles
UNION ALL
SELECT 'Estudiantes con cursos:' as info, count(*) as cantidad FROM public.profiles WHERE role = 'student' AND array_length(course_ids, 1) > 0
UNION ALL
SELECT 'Noticias por curso:' as info, count(*) as cantidad FROM public.news WHERE array_length(course_ids, 1) > 0;