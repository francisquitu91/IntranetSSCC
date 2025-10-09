-- Ensure required extensions are available
create extension if not exists "pgcrypto";

-- Courses catalog
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level text,
  created_at timestamptz not null default now()
);

comment on table public.courses is 'Catalog of courses/grades available in the intranet';
comment on column public.courses.grade_level is 'Optional descriptor such as ciclo, nivel o tramo';

-- Profiles synchronized with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'student' check (role in ('admin', 'teacher', 'student')),
  course_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

comment on table public.profiles is 'Application roles mapped to Supabase Auth users';
comment on column public.profiles.course_ids is 'Courses this profile belongs to (for teachers/students)';

-- News management
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  content text,
  author text,
  image_url text,
  date timestamptz,
  featured boolean not null default false,
  course_ids uuid[] not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_news_date on public.news(date desc nulls last);
create index if not exists idx_news_featured on public.news(featured);

comment on table public.news is 'Noticias institucionales expuestas en la intranet';
comment on column public.news.course_ids is 'Audience target. Empty array means visible to everyone';

-- Circulares (documents)
create table if not exists public.circulars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text not null,
  file_name text,
  course_ids uuid[] not null default '{}',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_circulars_published_at on public.circulars(published_at desc nulls last);

comment on table public.circulars is 'Circular documents shared with the community';

-- Gallery items
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  course_ids uuid[] not null default '{}',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_published_at on public.gallery_items(published_at desc nulls last);

comment on table public.gallery_items is 'Galería de fotos y videos internos';

-- Trigger to keep updated_at current on news
create or replace function public.fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_news_set_updated_at
  before update on public.news
  for each row
  execute function public.fn_set_updated_at();

-- Enable Row Level Security
alter table public.courses enable row level security;
alter table public.profiles enable row level security;
alter table public.news enable row level security;
alter table public.circulars enable row level security;
alter table public.gallery_items enable row level security;

-- Helper predicates
create or replace function public.has_role(required_roles text[])
returns boolean
language sql
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'student') = any(required_roles);
$$;

-- Policies for courses
create policy "Allow read courses to authenticated users" on public.courses
for select
using (auth.role() = 'authenticated');

-- Policies for profiles
create policy "User can read own profile" on public.profiles
for select
using (id = auth.uid());

create policy "Admins can read all profiles" on public.profiles
for select
using (has_role(array['admin']));

create policy "Admins manage profiles" on public.profiles
for all
using (has_role(array['admin']))
with check (has_role(array['admin']));

-- Policies for news
create policy "Public read news" on public.news
for select
using (true);

create policy "Admin teacher insert news" on public.news
for insert
with check (has_role(array['admin','teacher']) and (created_by = auth.uid()));

create policy "Admin teacher update news" on public.news
for update
using (has_role(array['admin','teacher']))
with check (has_role(array['admin','teacher']));

create policy "Admin teacher delete news" on public.news
for delete
using (has_role(array['admin','teacher']));

-- Policies for circulars
create policy "Public read circulars" on public.circulars
for select
using (true);

create policy "Admin teacher insert circulars" on public.circulars
for insert
with check (has_role(array['admin','teacher']) and (created_by = auth.uid()));

create policy "Admin teacher update circulars" on public.circulars
for update
using (has_role(array['admin','teacher']))
with check (has_role(array['admin','teacher']));

create policy "Admin teacher delete circulars" on public.circulars
for delete
using (has_role(array['admin','teacher']));

-- Policies for gallery
create policy "Public read gallery" on public.gallery_items
for select
using (true);

create policy "Admin teacher insert gallery" on public.gallery_items
for insert
with check (has_role(array['admin','teacher']) and (created_by = auth.uid()));

create policy "Admin teacher update gallery" on public.gallery_items
for update
using (has_role(array['admin','teacher']))
with check (has_role(array['admin','teacher']));

create policy "Admin teacher delete gallery" on public.gallery_items
for delete
using (has_role(array['admin','teacher']));
