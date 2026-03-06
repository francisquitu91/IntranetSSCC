-- Tabla para almacenar documentos y configuraciones del sistema (logo, menú casino, etc.)
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.system_settings is 'Configuraciones del sistema como logo, menú casino, etc.';
comment on column public.system_settings.key is 'Identificador único de la configuración (ej: logo_url, menu_casino_url)';
comment on column public.system_settings.value is 'Valor de la configuración (puede ser URL, texto, JSON, etc.)';

-- Índice para búsquedas rápidas por key
create index if not exists idx_system_settings_key on public.system_settings(key);

-- Trigger para actualizar updated_at
create or replace function public.fn_update_system_settings_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_system_settings_updated_at
  before update on public.system_settings
  for each row
  execute function public.fn_update_system_settings_timestamp();

-- Deshabilitar RLS para desarrollo (reactivar en producción)
alter table public.system_settings disable row level security;

-- Insertar configuraciones iniciales
insert into public.system_settings (key, value, description)
values
  ('logo_url', 'https://ssccmanquehue.cl/wp-content/uploads/2025/03/70SSCC_OK_transparente-4-1-1-1.png', 'URL del logo del colegio'),
  ('menu_casino_url', null, 'URL de la imagen del menú del casino')
on conflict (key) do nothing;

-- Verificar
select * from public.system_settings;
