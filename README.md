# Intranet Noticias + Gestión de Contenidos

Aplicación React + TypeScript para la intranet del Colegio SS.CC. Permite a administrativos y profesores gestionar noticias, circulares y galería de fotos con control de acceso por perfiles usando Supabase como backend.

## 🧱 Características principales

- **React + Vite + TypeScript** con TailwindCSS para un UI moderno.
- **Gestión por perfiles (admin, teacher, student)** con autenticación 100 % SQL (tabla `profiles` + sesiones en `profile_sessions`).
- Panel de contenidos con CRUD para **noticias**, **circulares (archivos)** y **galería de fotos**.
- Selección de cursos destinatarios para preparar el envío de boletines internos por curso.
- Integración con **Supabase Storage** para subir imágenes y documentos.
- Pruebas unitarias de componentes con Vitest y Testing Library.

## 🚀 Puesta en marcha

```powershell
npm install
npm run dev
```

La aplicación se abrirá en `http://localhost:5173`.

### Ejecutar pruebas

```powershell
npm test
```

### Revisar linting

```powershell
npm run lint
```

### Supabase CLI

La CLI ya está configurada en `package.json`. Antes de ejecutar comandos que interactúan con tu proyecto remoto:

1. Obtén tu [token de acceso de Supabase](https://supabase.com/dashboard/account/tokens) y ejecuta:

   ```powershell
   npx supabase login
   ```

2. Enlaza el proyecto remoto (usa la clave **service_role** desde la sección API del dashboard, nunca la subas al repositorio):

   ```powershell
   npx supabase link --project-ref kqeokhalxqgsywhjnmxu --password YOUR_SERVICE_ROLE_KEY
   ```

3. Con el proyecto vinculado puedes ejecutar migraciones, seeds o desplegar funciones:

   ```powershell
   npx supabase db push
   npx supabase db reset
   ```

> **Nota:** Guarda la service key en un gestor seguro o en un archivo `.env.local` (por ejemplo `SUPABASE_SERVICE_ROLE`) y utiliza variables de entorno en los comandos (`--password %SUPABASE_SERVICE_ROLE%` en PowerShell).

## 🔄 Integración con Supabase

### 1. Variables de entorno

Copia `.env.example` a `.env.local` y reemplaza las credenciales si es necesario:

```env
VITE_SUPABASE_URL=https://kqeokhalxqgsywhjnmxu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZW9raGFseHFnc3l3aGpubXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTMzMzUsImV4cCI6MjA3NTUyOTMzNX0.dYxawfCc_YzqpjgOZs9kMly4PfWajoHQPHIBYEB6etA
```

Reinicia Vite después de actualizar el archivo.

### 2. Esquema de base de datos

Ejecuta el siguiente script SQL en el editor de consultas de Supabase para crear tablas y relaciones básicas:

```sql
create table if not exists courses (
   id uuid primary key default gen_random_uuid(),
   name text not null,
   grade_level text,
   created_at timestamp with time zone default now()
);

create table if not exists profiles (
   id uuid primary key references auth.users on delete cascade,
   full_name text,
   email text,
   role text not null check (role in ('admin', 'teacher', 'student')) default 'student',
   course_ids uuid[] default '{}',
   created_at timestamp with time zone default now()
);

create table if not exists news (
   id uuid primary key default gen_random_uuid(),
   title text not null,
   excerpt text,
   content text,
   author text,
   image_url text,
   date timestamp with time zone,
   featured boolean default false,
   course_ids uuid[] default '{}',
   created_by uuid references profiles(id),
   created_at timestamp with time zone default now(),
   updated_at timestamp with time zone default now()
);

create table if not exists circulars (
   id uuid primary key default gen_random_uuid(),
   title text not null,
   description text,
   file_url text not null,
   file_name text,
   course_ids uuid[] default '{}',
   published_at timestamp with time zone,
   created_by uuid references profiles(id),
   created_at timestamp with time zone default now()
);

create table if not exists gallery_items (
   id uuid primary key default gen_random_uuid(),
   title text not null,
   description text,
   image_url text not null,
   course_ids uuid[] default '{}',
   published_at timestamp with time zone,
   created_by uuid references profiles(id),
   created_at timestamp with time zone default now()
);
```

### 3. Buckets de Storage

Desde el panel de Supabase crea tres buckets públicos:

- `news-images`
- `circulars`
- `gallery`

Activa la opción **Public bucket** para facilitar la entrega de archivos. Si prefieres un acceso privado, ajusta las reglas RLS usando `storage.objects` y la función `auth.uid()`.

### 4. Políticas de seguridad (RLS)

Activa RLS en las tablas `news`, `circulars` y `gallery_items` y agrega políticas de ejemplo:

```sql
create policy "lectura pública noticias" on news
   for select using (true);

create policy "admin y profesores gestionan noticias" on news
   for all
   using (auth.uid() = created_by or (select role from profiles where id = auth.uid()) in ('admin', 'teacher'))
   with check ((select role from profiles where id = auth.uid()) in ('admin', 'teacher'));

create policy "lectura pública circulares" on circulars
   for select using (true);

create policy "gestion circulares admin/prof" on circulars
   for all
   using ((select role from profiles where id = auth.uid()) in ('admin', 'teacher'))
   with check ((select role from profiles where id = auth.uid()) in ('admin', 'teacher'));

create policy "lectura pública galería" on gallery_items
   for select using (true);

create policy "gestion galería admin/prof" on gallery_items
   for all
   using ((select role from profiles where id = auth.uid()) in ('admin', 'teacher'))
   with check ((select role from profiles where id = auth.uid()) in ('admin', 'teacher'));
```

### 5. Vínculo Auth ↔ Profiles

- Configura **Email/password** como proveedor de autenticación.
- Después de crear cada usuario, inserta su perfil en la tabla `profiles` definiendo `role` (`admin`, `teacher`, `student`) y, si corresponde, los `course_ids` asociados.
- Los estudiantes verán solo las noticias/circulares/galería asignadas a sus cursos; los administrativos y profesores verán todo y tendrán acceso al panel de gestión.

## 🗂️ Estructura relevante

- `src/App.tsx`: Orquestación de autenticación, panel y feed público.
- `src/context/AuthContext.tsx`: Contexto global de sesión + perfil Supabase.
- `src/components/dashboard/*`: Panel de gestión para noticias, circulares y galería.
- `src/components/news/NewsFeed.tsx`: Feed público de noticias con filtro por curso.
- `src/lib/*`: Servicios para Supabase (datos y storage).
- `src/types.ts`: Tipos compartidos para roles, cursos y entidades.

## ✅ Próximos pasos sugeridos

- Añadir vista detallada de cada noticia y comentarios.
- Implementar notificaciones push/email cuando se publique nuevo contenido.
- Crear tablero para reportar métricas de lectura por curso.
