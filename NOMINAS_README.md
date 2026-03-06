# Sistema de Carga Masiva de Nóminas

## ✨ Funcionalidades Implementadas

### 1. **Login Mejorado**
- ✅ El texto ahora muestra "Acceso como Profesor" cuando se selecciona la opción de profesores
- ✅ Los campos de login aceptan tanto RUT como correo electrónico
- ✅ Los estudiantes pueden ingresar con su RUT (formato: 12345678-9)
- ✅ La contraseña son los últimos 4 dígitos antes del dígito verificador

### 2. **Carga Masiva de Nóminas**
Se agregó una nueva sección en el panel de administración para cargar nóminas Excel:

#### **Nómina de Estudiantes**
Formato esperado del Excel:
- **Curso**: Ej: "I-A", "8-B", "IV-C"
- **Alumnos**: Nombre completo del estudiante
- **Genero**: M o F
- **Rut**: Con o sin puntos, con guión (ej: "12345678-9" o "24155919K")
- **Email Alumno**: Correo institucional

#### **Nómina de Trabajadores**
Formato esperado del Excel:
- **Rut**: Con o sin formato (ej: "16211999-0")
- **Nombre**: Nombre completo del trabajador
- **Correo electrónico**: Email institucional
- **Cargo**: Puesto del trabajador
- **Estamentos**: Docentes, Paradocentes, Auxiliares, Administrativos

### 3. **Procesamiento Automático**
El sistema procesa automáticamente cada fila del Excel:
- Extrae y formatea el RUT (12345678-9)
- Genera la contraseña: **últimos 4 dígitos** antes del verificador
- Crea el usuario en Supabase Auth
- Crea el perfil del usuario
- Valida duplicados (no permite RUTs repetidos)
- Reporta errores detallados por fila

## 📋 Instrucciones de Configuración

### Paso 1: Ejecutar Migraciones en Supabase

1. Abre el **SQL Editor** en tu dashboard de Supabase
2. Copia todo el contenido del archivo `supabase/complete_nominas_migration.sql`
3. Pega y ejecuta el SQL
4. Verifica que no haya errores

### Paso 2: Verificar Instalación

El sistema ya está funcionando. Solo asegúrate de que:
- ✅ El servidor de desarrollo está corriendo (`npm run dev`)
- ✅ Las migraciones se ejecutaron correctamente
- ✅ Tienes permisos de administrador

## 🎯 Cómo Usar

### Para Administradores:

1. **Acceder al Panel de Admin**
   - Inicia sesión como administrador
   - Ve a la sección "Nóminas" en el dashboard

2. **Subir Nómina de Estudiantes**
   - Haz clic en "Nómina de Estudiantes"
   - Selecciona o arrastra tu archivo Excel
   - Espera el procesamiento
   - Revisa el reporte de éxitos y errores

3. **Subir Nómina de Trabajadores**
   - Haz clic en "Nómina de Trabajadores"
   - Selecciona o arrastra tu archivo Excel
   - Espera el procesamiento
   - Revisa el reporte de éxitos y errores

### Para Estudiantes/Trabajadores:

1. **Iniciar Sesión con RUT**
   - En la pantalla de login, selecciona tu tipo de usuario
   - En el campo "RUT o Correo electrónico", ingresa tu RUT: `12345678-9`
   - En el campo "Contraseña", ingresa los últimos 4 dígitos antes del guión
   - Ejemplo: Si tu RUT es `24155919-K`, tu contraseña es `5919`

2. **Iniciar Sesión con Email**
   - También puedes usar tu correo institucional
   - La contraseña será la misma (últimos 4 dígitos del RUT)

## 🔑 Ejemplos de Credenciales

### Ejemplo Estudiante:
- **RUT**: `24155919-K`
- **Username**: `24155919-K` o `lucas.abogabir@e.ssccmanquehue.cl`
- **Password**: `5919` (últimos 4 dígitos: 5-9-1-9)

### Ejemplo Trabajador:
- **RUT**: `16211999-0`
- **Username**: `16211999-0` o `german.aburto@ssccmanquehue.cl`
- **Password**: `1999` (últimos 4 dígitos: 1-9-9-9)

## ⚠️ Notas Importantes

1. **RUTs Duplicados**: El sistema no permite crear usuarios con RUTs ya existentes
2. **Formato Excel**: Asegúrate de que las columnas tengan los nombres exactos especificados
3. **Validación**: Cada fila se procesa individualmente, si una falla, las demás continúan
4. **Reportes**: Siempre revisa el reporte después de la carga para identificar problemas

## 🛠️ Estructura de Archivos Creados

```
src/
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx          # ✅ Actualizado para RUT
│   └── dashboard/
│       └── NominaUploader.tsx     # ✨ Nuevo componente
├── lib/
│   └── bulkUsers.ts               # ✨ Nuevo - Lógica de procesamiento
└── context/
    └── AuthContext.tsx            # ✅ Soporta login con RUT

supabase/
├── complete_nominas_migration.sql  # ✨ Migración consolidada
├── add_rut_and_curso_fields.sql   # Agregar campos RUT y curso
└── update_login_for_rut.sql       # Actualizar función login
```

## 🎨 Interfaz Responsive

Todo el sistema es completamente responsive:
- ✅ Sidebar con menú hamburguesa en móvil
- ✅ Formularios adaptables
- ✅ Tablas responsivas
- ✅ Feedback visual durante la carga

## 📞 Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador (F12)
2. Verifica que las migraciones se ejecutaron correctamente
3. Asegúrate de que el Excel tiene el formato correcto
4. Revisa el reporte de errores después de la carga
