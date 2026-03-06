-- Actualizar función simple_login para soportar login con RUT o Email
-- Si el p_email contiene un @, busca por email
-- Si no, asume que es un RUT y busca por RUT

-- Primero agregar las columnas RUT y curso si no existen
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS curso TEXT,
ADD COLUMN IF NOT EXISTS cargo TEXT;

-- Crear índice para búsqueda rápida por RUT
CREATE INDEX IF NOT EXISTS idx_profiles_rut ON public.profiles(rut);

-- Agregar constraint único para RUT (no puede haber duplicados) - eliminando el anterior si existe
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS unique_rut;

ALTER TABLE public.profiles
ADD CONSTRAINT unique_rut UNIQUE (rut);

-- Eliminar la función existente primero para permitir cambios en el tipo de retorno
drop function if exists public.simple_login(text, text);

create or replace function public.simple_login(
  p_email text,
  p_password text
)
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  course_ids uuid[],
  rut text,
  curso text,
  cargo text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_is_email boolean;
begin
  -- Detectar si es email (contiene @) o RUT
  v_is_email := position('@' in p_email) > 0;

  -- Buscar por email o RUT según corresponda
  if v_is_email then
    select p.*
    into v_profile
    from public.profiles p
    where lower(p.email) = lower(p_email)
      and p.password = p_password
      and p.active = true
    limit 1;
  else
    -- Es RUT, limpiar formato y buscar
    select p.*
    into v_profile
    from public.profiles p
    where p.rut = p_email
      and p.password = p_password
      and p.active = true
    limit 1;
  end if;

  if not found then
    raise exception 'Credenciales inválidas.' using errcode = '28000';
  end if;

  return query
    select v_profile.id,
           v_profile.full_name,
           v_profile.email,
           v_profile.role,
           v_profile.course_ids,
           v_profile.rut,
           v_profile.curso,
           v_profile.cargo;
end;
$$;

comment on function public.simple_login is 'Simple authentication with email or RUT and plain text password comparison.';
