-- Política para permitir a los estudiantes ver elementos de la galería
-- Los estudiantes pueden ver elementos que:
-- 1. No tienen course_ids asignados (públicos para todos)
-- 2. Tienen al menos uno de los course_ids del estudiante

-- Primero, eliminar la política si existe
drop policy if exists "Students can view their course gallery" on public.gallery_items;
drop policy if exists "Gallery students read" on public.gallery_items;
drop policy if exists "Gallery public read" on public.gallery_items;

-- Crear función auxiliar para verificar si un estudiante puede ver un item de galería
create or replace function public.can_view_gallery_item(item_course_ids uuid[])
returns boolean as $$
declare
  user_profile record;
begin
  -- Obtener el perfil del usuario actual
  select * into user_profile
  from public.profiles
  where id = public.current_profile_id();

  -- Si no hay perfil, no permitir acceso
  if user_profile is null then
    return false;
  end if;

  -- Los admins y teachers pueden ver todo
  if user_profile.role in ('admin', 'teacher') then
    return true;
  end if;

  -- Si el item no tiene course_ids o está vacío, todos pueden verlo
  if item_course_ids is null or array_length(item_course_ids, 1) is null then
    return true;
  end if;

  -- Si es estudiante, verificar que al menos uno de sus cursos coincida
  if user_profile.role = 'student' and user_profile.course_ids is not null then
    return item_course_ids && user_profile.course_ids; -- Operador de intersección de arrays
  end if;

  -- Por defecto, no permitir acceso
  return false;
end;
$$ language plpgsql security definer stable;

-- Crear política de lectura para todos los usuarios autenticados
create policy "Gallery authenticated read" on public.gallery_items
  for select
  using (public.can_view_gallery_item(course_ids));

-- Comentario en la función
comment on function public.can_view_gallery_item(uuid[]) is 
  'Determina si el usuario actual puede ver un item de galería basado en sus cursos asignados';
