-- Seed data for local development
insert into public.courses (id, name, grade_level)
values
  (gen_random_uuid(), '1° Básico A', 'Primer Ciclo'),
  (gen_random_uuid(), '4° Medio B', 'Enseñanza Media')
on conflict do nothing;

-- Perfiles iniciales para desarrollo
insert into public.profiles (id, email, password, full_name, role)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@sscc.cl', 'Admin123!', 'Administrador SSCC', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'alumno@sscc.cl', 'Alumno123!', 'Estudiante Demo', 'student')
on conflict (id) do update
  set email = excluded.email,
      password = excluded.password,
      full_name = excluded.full_name,
      role = excluded.role;
