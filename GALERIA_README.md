# Implementación de Galería de Fotos/Videos

## ✅ Cambios Implementados

Se ha implementado exitosamente la funcionalidad de Galería de Fotos/Videos con las siguientes características:

### 1. **Componente GalleryPage.tsx** 
- Vista de galería para estudiantes con filtrado automático por curso
- Soporte para fotos y videos (incluyendo YouTube y Vimeo)
- Modal para ver contenido en pantalla completa
- Diseño responsive con grid adaptativo

### 2. **Actualización de gallery.ts**
- Nueva función `fetchGalleryByCourse()` para filtrar contenido por curso
- Lógica: Si un item no tiene `course_ids`, se muestra a todos
- Si tiene `course_ids`, solo se muestra a estudiantes de esos cursos

### 3. **Actualización de App.tsx**
- Agregado el caso 'gallery' en el renderizado de páginas
- Filtro automático por curso para estudiantes
- Los administradores y profesores ven todo el contenido

### 4. **Política SQL para Estudiantes**
- Archivo: `supabase/add_gallery_read_policy.sql`
- Función auxiliar `can_view_gallery_item()` que verifica permisos
- Política RLS que permite a estudiantes ver solo contenido de su curso

## 🔧 Cómo Aplicar la Migración SQL

Tienes 3 opciones para aplicar la migración:

### Opción 1: Desde Supabase Dashboard (Recomendado)
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Abre el archivo `supabase/add_gallery_read_policy.sql`
5. Copia y pega el contenido completo
6. Haz clic en "Run"

### Opción 2: Usando Supabase CLI
```powershell
# Asegúrate de estar en el directorio del proyecto
cd "C:\Users\franc\SSCC manquehue"

# Ejecuta el script SQL
supabase db execute --file supabase/add_gallery_read_policy.sql

# O si prefieres usar psql directamente:
Get-Content supabase\add_gallery_read_policy.sql | supabase db query
```

### Opción 3: Usando psql directamente
```powershell
psql "postgresql://postgres:[TU_PASSWORD]@db.kqeokhalxqgsywhjnmxu.supabase.co:5432/postgres" -f supabase/add_gallery_read_policy.sql
```

## 📋 Funcionalidades

### Para Estudiantes:
- ✅ Ver fotos y videos de su curso automáticamente
- ✅ Ver contenido sin curso asignado (público para todos)
- ✅ Modal de visualización en pantalla completa
- ✅ Soporte para videos de YouTube, Vimeo y archivos directos
- ✅ Información de fecha de publicación
- ✅ Descripción de cada elemento

### Para Administradores:
- ✅ Gestión completa desde **Panel Institucional** (junto a Noticias, Calendario, Circulares, Usuarios)
- ✅ Subir fotos/videos (archivos o URLs)
- ✅ Asignar a cursos específicos o dejar público para todos
- ✅ Editar y eliminar elementos
- ✅ Ver todos los elementos sin restricciones
- ✅ Preview de imágenes en el listado

## 🎯 Flujo de Uso

1. **Admin/Profesor** sube contenido:
   - Ingresa al sistema con credenciales de admin/profesor
   - En el **Panel Institucional**, hace clic en la pestaña "**Galería**"
   - Completa el formulario:
     - Título y descripción
     - Imagen/video (archivo local o URL de YouTube/Vimeo)
     - Fecha de publicación
     - Selecciona cursos destinatarios (o deja en blanco para todos)
   - Hace clic en "Publicar en la galería"

2. **Estudiante** visualiza el contenido:
   - Ingresa con sus credenciales
   - En el menú lateral hace clic en "**Galería fotos/videos**"
   - Ve automáticamente solo contenido de su(s) curso(s)
   - Hace clic en cualquier elemento para verlo en pantalla completa
   - Puede ver videos de YouTube/Vimeo integrados

## 🔒 Seguridad

La política SQL implementada asegura que:
- Los estudiantes solo pueden **leer** contenido
- Solo ven contenido de sus cursos asignados
- Los admins y profesores pueden ver y gestionar todo
- El contenido sin curso asignado es visible para todos

## ✨ Próximos Pasos

Después de aplicar la migración SQL, la funcionalidad estará completamente operativa. Puedes probar:

1. Iniciar el servidor: `npm run dev`
2. Ingresar como estudiante
3. Navegar a "Galería fotos/videos"
4. Verificar que solo ves contenido de tu curso

## 🐛 Solución de Problemas

Si los estudiantes no pueden ver la galería:
- Verifica que la migración SQL se aplicó correctamente
- Verifica que los estudiantes tengan `course_ids` asignados en su perfil
- Revisa la consola del navegador para errores
- Verifica que los items de galería tengan `course_ids` correctos

---

**Nota**: La migración SQL es necesaria para que los estudiantes puedan ver el contenido. Sin ella, solo administradores y profesores podrán acceder a la galería.
