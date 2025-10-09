-- Custom authentication via profiles table and session tokens
set check_function_bodies = off;

create extension if not exists "pgcrypto";

-- 1. Update profiles schema to store credentials directly
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

update public.profiles
  set email = lower(email)
  where email is not null;

alter table public.profiles
  alter column email set not null;

alter table public.profiles
  drop constraint if exists profiles_email_key;

alter table public.profiles
  add constraint profiles_email_key unique (email);

alter table public.profiles
  add column if not exists password_hash text;

update public.profiles
  set password_hash = crypt('Cambiar123!', gen_salt('bf'))
  where password_hash is null;

alter table public.profiles
  alter column password_hash set not null;

alter table public.profiles
  add column if not exists active boolean not null default true;

-- 2. Session registry
create table if not exists public.profile_sessions (
  token uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);

create index if not exists idx_profile_sessions_profile on public.profile_sessions(profile_id);
create index if not exists idx_profile_sessions_expires_at on public.profile_sessions(expires_at);

alter table public.profile_sessions enable row level security;

create or replace function public.get_request_header(header_name text)
returns text
language sql
stable
as $$
  select coalesce((coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb)->>lower(header_name), '');
$$;

comment on function public.get_request_header is 'Returns the value of a request header when invoked from PostgREST context.';

create or replace function public.current_profile_token()
returns text
language sql
stable
as $$
  select nullif(public.get_request_header('sb-profile-token'), '');
$$;

comment on function public.current_profile_token is 'Reads the sb-profile-token header and returns its value.';

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ps.profile_id
  from public.profile_sessions ps
  where ps.token::text = public.current_profile_token()
    and ps.expires_at > now()
  order by ps.expires_at desc
  limit 1;
$$;

comment on function public.current_profile_id is 'Returns the authenticated profile id based on the session token header.';

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = public.current_profile_id()
  limit 1;
$$;

comment on function public.current_profile_role is 'Resolves the active role associated with the current session token.';

create or replace function public.require_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role(), 'guest') = any(required_roles);
$$;

comment on function public.require_role is 'Checks whether the current session role is included in the provided array.';

create or replace function public.hash_password(p_password text)
returns text
language sql
immutable
as $$
  select crypt(p_password, gen_salt('bf'));
$$;

comment on function public.hash_password is 'Generates a bcrypt hash for the provided password.';

create or replace function public.verify_password(p_password text, p_hash text)
returns boolean
language sql
stable
as $$
  select p_hash = crypt(p_password, p_hash);
$$;

comment on function public.verify_password is 'Validates a password against its bcrypt hash.';

-- 4. RPC helpers for profile management and authentication
create or replace function public.upsert_profile(
  p_id uuid,
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_course_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_password_hash text;
  v_id uuid;
begin
  if p_password is null or length(trim(p_password)) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres.' using errcode = '22023';
  end if;

  v_password_hash := public.hash_password(trim(p_password));

  if p_id is not null then
    update public.profiles p
    set email = lower(p_email),
        password_hash = v_password_hash,
        full_name = p_full_name,
        role = coalesce(p_role, p.role),
        course_ids = coalesce(p_course_ids, p.course_ids),
        active = true
    where p.id = p_id
    returning p.id into v_id;
  end if;

  if v_id is null then
    insert into public.profiles (email, password_hash, full_name, role, course_ids)
    values (lower(p_email), v_password_hash, p_full_name, coalesce(p_role, 'student'), coalesce(p_course_ids, '{}'))
    returning public.profiles.id into v_id;
  end if;

  return v_id;
end;
$$;

comment on function public.upsert_profile is 'Creates or updates a profile storing the password hash. Intended for administrative usage.';

create or replace function public.login_profile(
  p_email text,
  p_password text
)
returns table (
  token uuid,
  id uuid,
  full_name text,
  email text,
  role text,
  course_ids uuid[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_token uuid;
begin
  select p.*
  into v_profile
  from public.profiles p
  where lower(p.email) = lower(p_email)
    and p.active = true
  limit 1;

  if not found then
    raise exception 'Credenciales inválidas.' using errcode = '28000';
  end if;

  if not public.verify_password(p_password, v_profile.password_hash) then
    raise exception 'Credenciales inválidas.' using errcode = '28000';
  end if;

  delete from public.profile_sessions
  where profile_id = v_profile.id
    and expires_at <= now();

  insert into public.profile_sessions (profile_id)
  values (v_profile.id)
  returning token into v_token;

  return query
    select v_token,
           v_profile.id,
           v_profile.full_name,
           v_profile.email,
           v_profile.role,
           v_profile.course_ids;
end;
$$;

comment on function public.login_profile is 'Validates credentials and issues a session token valid for 12 hours.';

create or replace function public.profile_from_token(p_token uuid)
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  course_ids uuid[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  select p.*
  into v_profile
  from public.profile_sessions s
  join public.profiles p on p.id = s.profile_id
  where s.token = p_token
    and s.expires_at > now()
  limit 1;

  if not found then
    raise exception 'Sesión inválida o expirada.' using errcode = '28000';
  end if;

  return query
    select v_profile.id,
           v_profile.full_name,
           v_profile.email,
           v_profile.role,
           v_profile.course_ids;
end;
$$;

comment on function public.profile_from_token is 'Obtains profile metadata for an existing session token.';

create or replace function public.logout_session(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profile_sessions where token = p_token;
end;
$$;

comment on function public.logout_session is 'Destroys a previously issued session token.';

-- 5. RLS policies aligned with the new token-based auth
drop policy if exists "User can read own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
drop policy if exists "Profiles read self" on public.profiles;
drop policy if exists "Profiles admin manage" on public.profiles;

create policy "Profiles read self" on public.profiles
  for select
  using (id = public.current_profile_id());

create policy "Profiles admin manage" on public.profiles
  for all
  using (public.require_role(array['admin']))
  with check (public.require_role(array['admin']));

drop policy if exists "Admin teacher insert news" on public.news;
drop policy if exists "Admin teacher update news" on public.news;
drop policy if exists "Admin teacher delete news" on public.news;
drop policy if exists "News admin teacher insert" on public.news;
drop policy if exists "News admin teacher update" on public.news;
drop policy if exists "News admin teacher delete" on public.news;

create policy "News admin teacher insert" on public.news
  for insert
  with check (public.require_role(array['admin','teacher']));

create policy "News admin teacher update" on public.news
  for update
  using (public.require_role(array['admin','teacher']))
  with check (public.require_role(array['admin','teacher']));

create policy "News admin teacher delete" on public.news
  for delete
  using (public.require_role(array['admin','teacher']));

drop policy if exists "Admin teacher insert circulars" on public.circulars;
drop policy if exists "Admin teacher update circulars" on public.circulars;
drop policy if exists "Admin teacher delete circulars" on public.circulars;
drop policy if exists "Circulars admin teacher insert" on public.circulars;
drop policy if exists "Circulars admin teacher update" on public.circulars;
drop policy if exists "Circulars admin teacher delete" on public.circulars;

create policy "Circulars admin teacher insert" on public.circulars
  for insert
  with check (public.require_role(array['admin','teacher']));

create policy "Circulars admin teacher update" on public.circulars
  for update
  using (public.require_role(array['admin','teacher']))
  with check (public.require_role(array['admin','teacher']));

create policy "Circulars admin teacher delete" on public.circulars
  for delete
  using (public.require_role(array['admin','teacher']));

drop policy if exists "Admin teacher insert gallery" on public.gallery_items;
drop policy if exists "Admin teacher update gallery" on public.gallery_items;
drop policy if exists "Admin teacher delete gallery" on public.gallery_items;
drop policy if exists "Gallery admin teacher insert" on public.gallery_items;
drop policy if exists "Gallery admin teacher update" on public.gallery_items;
drop policy if exists "Gallery admin teacher delete" on public.gallery_items;

drop function if exists public.has_role(text[]);

create policy "Gallery admin teacher insert" on public.gallery_items
  for insert
  with check (public.require_role(array['admin','teacher']));

create policy "Gallery admin teacher update" on public.gallery_items
  for update
  using (public.require_role(array['admin','teacher']))
  with check (public.require_role(array['admin','teacher']));

create policy "Gallery admin teacher delete" on public.gallery_items
  for delete
  using (public.require_role(array['admin','teacher']));

-- Profile sessions policies (self management)
drop policy if exists "Profile sessions self manage" on public.profile_sessions;

create policy "Profile sessions self manage" on public.profile_sessions
  for all
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- 6. Ensure tables with authenticated access keep RLS enabled
alter table public.profiles enable row level security;
alter table public.news enable row level security;
alter table public.circulars enable row level security;
alter table public.gallery_items enable row level security;

-- Storage bucket policies aligned with custom auth
drop policy if exists "Storage objects public" on storage.objects;
drop policy if exists "Storage objects admin" on storage.objects;
drop policy if exists "Storage objects public read" on storage.objects;
drop policy if exists "Storage objects admin teacher write" on storage.objects;
drop policy if exists "Storage objects admin teacher update" on storage.objects;
drop policy if exists "Storage objects admin teacher delete" on storage.objects;

create policy "Storage objects public read" on storage.objects
  for select
  using (true);

create policy "Storage objects admin teacher write" on storage.objects
  for insert
  with check (public.require_role(array['admin','teacher']));

create policy "Storage objects admin teacher update" on storage.objects
  for update
  using (public.require_role(array['admin','teacher']))
  with check (public.require_role(array['admin','teacher']));

create policy "Storage objects admin teacher delete" on storage.objects
  for delete
  using (public.require_role(array['admin','teacher']));

-- 7. Cleanup expired sessions periodically (optional helper)
create or replace function public.purge_expired_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.profile_sessions
  where expires_at <= now();

  get diagnostics v_deleted = row_count;

  return coalesce(v_deleted, 0);
end;
$$;

comment on function public.purge_expired_sessions is 'Utility to remove expired profile sessions.';
