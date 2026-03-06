-- Tabla para Modelo Islandés (foto del grupo y equipo)
create table if not exists public.modelo_islandes (
  id uuid primary key default gen_random_uuid(),
  main_photo_url text not null,
  team_members text[] not null default '{}',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.modelo_islandes is 'Configuración de la sección Modelo Islandés (foto del grupo directivo y nombres del equipo)';
comment on column public.modelo_islandes.main_photo_url is 'URL de la foto principal del grupo directivo';
comment on column public.modelo_islandes.team_members is 'Array de nombres de los miembros del equipo';

-- Trigger para actualizar updated_at
create or replace function public.fn_update_modelo_islandes_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_modelo_islandes_updated_at on public.modelo_islandes;

create trigger trg_modelo_islandes_updated_at
  before update on public.modelo_islandes
  for each row
  execute function public.fn_update_modelo_islandes_timestamp();

-- Deshabilitar RLS (el control de acceso se maneja desde la aplicación)
alter table public.modelo_islandes disable row level security;

-- Insertar configuración inicial (vacía, para que admin la complete)
insert into public.modelo_islandes (main_photo_url, team_members)
values (
  '',
  ARRAY[]::text[]
)
on conflict do nothing;

-- Verificar
select * from public.modelo_islandes;
