-- Simplify authentication to use plain text passwords
-- Remove bcrypt hashing and session tokens, use basic SQL table authentication

-- 1. Update profiles schema to use plain password
alter table public.profiles
  drop column if exists password_hash;

alter table public.profiles
  add column if not exists password text;

update public.profiles 
  set password = 'Admin123!'
  where password is null;

alter table public.profiles
  alter column password set not null;

-- 2. Remove session registry (not needed for simple approach)
drop table if exists public.profile_sessions cascade;

-- 3. First drop all policies that depend on functions
drop policy if exists "Profiles read self" on public.profiles;
drop policy if exists "Profiles admin manage" on public.profiles;
drop policy if exists "News admin teacher insert" on public.news;
drop policy if exists "News admin teacher update" on public.news;
drop policy if exists "News admin teacher delete" on public.news;
drop policy if exists "Circulars admin teacher insert" on public.circulars;
drop policy if exists "Circulars admin teacher update" on public.circulars;
drop policy if exists "Circulars admin teacher delete" on public.circulars;
drop policy if exists "Gallery admin teacher insert" on public.gallery_items;
drop policy if exists "Gallery admin teacher update" on public.gallery_items;
drop policy if exists "Gallery admin teacher delete" on public.gallery_items;
drop policy if exists "Storage objects admin teacher write" on storage.objects;
drop policy if exists "Storage objects admin teacher update" on storage.objects;
drop policy if exists "Storage objects admin teacher delete" on storage.objects;

-- Now remove complex auth functions
drop function if exists public.get_request_header(text);
drop function if exists public.current_profile_token();
drop function if exists public.current_profile_id();
drop function if exists public.current_profile_role();
drop function if exists public.require_role(text[]);
drop function if exists public.hash_password(text);
drop function if exists public.verify_password(text, text);
drop function if exists public.login_profile(text, text);
drop function if exists public.profile_from_token(uuid);
drop function if exists public.logout_session(uuid);
drop function if exists public.purge_expired_sessions();

-- 4. Create simple login function
create or replace function public.simple_login(
  p_email text,
  p_password text
)
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
  from public.profiles p
  where lower(p.email) = lower(p_email)
    and p.password = p_password
    and p.active = true
  limit 1;

  if not found then
    raise exception 'Credenciales inválidas.' using errcode = '28000';
  end if;

  return query
    select v_profile.id,
           v_profile.full_name,
           v_profile.email,
           v_profile.role,
           v_profile.course_ids;
end;
$$;

comment on function public.simple_login is 'Simple authentication with plain text password comparison.';

-- 5. Create simple profile management function
create or replace function public.simple_upsert_profile(
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
  v_id uuid;
begin
  if p_password is null or length(trim(p_password)) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres.' using errcode = '22023';
  end if;

  if p_id is not null then
    update public.profiles
    set email = lower(p_email),
        password = trim(p_password),
        full_name = p_full_name,
        role = coalesce(p_role, role),
        course_ids = coalesce(p_course_ids, course_ids),
        active = true
    where id = p_id
    returning id into v_id;
  end if;

  if v_id is null then
    insert into public.profiles (email, password, full_name, role, course_ids)
    values (lower(p_email), trim(p_password), p_full_name, coalesce(p_role, 'student'), coalesce(p_course_ids, '{}'))
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

comment on function public.simple_upsert_profile is 'Creates or updates a profile with plain text password.';

-- 6. Remove remaining RLS policies (the ones that depend on functions were already dropped above)
drop policy if exists "Public read news" on public.news;
drop policy if exists "Public read circulars" on public.circulars;
drop policy if exists "Public read gallery" on public.gallery_items;
drop policy if exists "Allow read courses to authenticated users" on public.courses;

drop policy if exists "Storage objects public read" on storage.objects;

-- 7. Disable RLS for simpler access
alter table public.profiles disable row level security;
alter table public.news disable row level security;
alter table public.circulars disable row level security;
alter table public.gallery_items disable row level security;
alter table public.courses disable row level security;

-- 8. Create simple read policies for public access
create policy "Allow all read" on public.news for select using (true);
create policy "Allow all read" on public.circulars for select using (true);
create policy "Allow all read" on public.gallery_items for select using (true);
create policy "Allow all read" on public.courses for select using (true);
create policy "Allow all read" on public.profiles for select using (true);

-- Re-enable RLS with simple policies
alter table public.profiles enable row level security;
alter table public.news enable row level security;
alter table public.circulars enable row level security;
alter table public.gallery_items enable row level security;
alter table public.courses enable row level security;