import { supabase } from './supabase'

// Función para limpiar y formatear RUT
export function cleanRut(rut: string): string {
  // Remover puntos, guiones y espacios
  return rut.toString().replace(/\./g, '').replace(/-/g, '').replace(/\s/g, '').toUpperCase()
}

// Función para separar RUT del dígito verificador
export function parseRut(rut: string): { rutNumber: string; verifier: string } {
  const clean = cleanRut(rut)
  // El último carácter es el verificador, el resto es el número
  const verifier = clean.slice(-1)
  const rutNumber = clean.slice(0, -1)
  return { rutNumber, verifier }
}

// Función para generar contraseña (últimos 4 dígitos antes del verificador)
export function generatePassword(rut: string): string {
  const { rutNumber } = parseRut(rut)
  // Tomar los últimos 4 dígitos del número de RUT
  return rutNumber.slice(-4)
}

// Función para formatear RUT con guión (ej: 12345678-9)
export function formatRut(rut: string): string {
  const { rutNumber, verifier } = parseRut(rut)
  return `${rutNumber}-${verifier}`
}

type StudentRow = {
  Curso?: string
  curso?: string
  Alumnos?: string
  alumnos?: string
  ALUMNOS?: string
  Genero?: string
  Rut?: string | number
  rut?: string | number
  RUT?: string | number
  'Email Alumno'?: string
  email?: string
}

type WorkerRow = {
  Rut?: string | number
  rut?: string | number  
  RUT?: string | number
  Nombre?: string
  nombre?: string
  NOMBRE?: string
  'Correo electrónico'?: string
  'Correo electronico'?: string
  correo?: string
  Cargo?: string
  cargo?: string
  Estamentos?: string
  estamentos?: string
}

type ProcessResult = {
  success: number
  failed: number
  errors: string[]
}

// Crear usuarios desde nómina de estudiantes
async function createStudentUsers(data: StudentRow[]): Promise<ProcessResult> {
  const result: ProcessResult = {
    success: 0,
    failed: 0,
    errors: []
  }

  if (!supabase) {
    result.failed = data.length
    result.errors.push('Supabase no está configurado correctamente')
    return result
  }

  const client = supabase

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNumber = i + 2 // +2 porque Excel empieza en 1 y tiene header

    try {
      // Debug: mostrar las claves del objeto
      if (i === 0) {
        console.log('Claves disponibles en la fila:', Object.keys(row))
        console.log('Primera fila completa:', row)
      }

      // Obtener valores de forma más flexible
      const rut = row.Rut || row.rut || row.RUT
      const alumnos = row.Alumnos || row.alumnos || row.ALUMNOS

      // Validar que tenga los campos necesarios
      if (!rut || !alumnos) {
        result.failed++
        result.errors.push(`Fila ${rowNumber}: Falta RUT o nombre del alumno (RUT: ${rut}, Alumnos: ${alumnos})`)
        continue
      }

      const formattedRut = formatRut(rut.toString())
      const password = generatePassword(rut.toString())
      const email = row['Email Alumno'] || row['email'] || `estudiante.${cleanRut(rut.toString())}@ssccmanquehue.cl`
      const fullName = alumnos.toString()
      const curso = (row.Curso || row.curso || '').toString()

      // Crear usuario usando la función RPC de Supabase
      const { data: profile, error: createError } = await client
        .rpc('create_user_profile', {
          p_email: email,
          p_password: password,
          p_full_name: fullName,
          p_role: 'student',
          p_course_ids: [],
          p_rut: formattedRut,
          p_curso: curso,
          p_cargo: null
        })

      if (createError) {
        result.failed++
        if (createError.message.includes('Ya existe un usuario')) {
          result.errors.push(`Fila ${rowNumber}: Usuario con RUT ${formattedRut} ya existe`)
        } else {
          result.errors.push(`Fila ${rowNumber}: ${createError.message}`)
        }
        continue
      }

      if (!profile) {
        result.failed++
        result.errors.push(`Fila ${rowNumber}: No se pudo crear el usuario`)
        continue
      }

      result.success++
      console.log(`✓ Usuario creado: ${fullName} (RUT: ${formattedRut}, Pass: ${password})`)

    } catch (error) {
      result.failed++
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      result.errors.push(`Fila ${rowNumber}: ${errorMsg}`)
    }
  }

  return result
}

// Crear usuarios desde nómina de trabajadores
async function createWorkerUsers(data: WorkerRow[]): Promise<ProcessResult> {
  const result: ProcessResult = {
    success: 0,
    failed: 0,
    errors: []
  }

  if (!supabase) {
    result.failed = data.length
    result.errors.push('Supabase no está configurado correctamente')
    return result
  }

  const client = supabase

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNumber = i + 2

    try {
      // Debug: mostrar las claves del objeto
      if (i === 0) {
        console.log('Claves disponibles en la fila:', Object.keys(row))
        console.log('Primera fila completa:', row)
      }

      // Obtener valores de forma más flexible (con trim y búsqueda insensitiva)
      const rut = row.Rut || row.rut || row.RUT
      const nombre = row.Nombre || row.nombre || row.NOMBRE

      if (!rut || !nombre) {
        result.failed++
        result.errors.push(`Fila ${rowNumber}: Falta RUT o nombre del trabajador (RUT: ${rut}, Nombre: ${nombre})`)
        continue
      }

      const formattedRut = formatRut(rut.toString())
      const password = generatePassword(rut.toString())
      const email = row['Correo electrónico'] || row['Correo electronico'] || row['correo'] || `trabajador.${cleanRut(rut.toString())}@ssccmanquehue.cl`
      const fullName = nombre.toString()
      const cargo = row.Cargo || row.cargo || ''
      const estamento = row.Estamentos || row.estamentos || ''

      // Determinar el rol basado en el estamento
      let role: 'teacher' | 'admin' = 'teacher'
      if (estamento.toString().toLowerCase().includes('docente')) {
        role = 'teacher'
      } else if (estamento.toString().toLowerCase().includes('administrativo')) {
        role = 'teacher' // Por ahora, todos los trabajadores son profesores
      }

      // Crear usuario usando la función RPC de Supabase
      const { data: profile, error: createError } = await client
        .rpc('create_user_profile', {
          p_email: email,
          p_password: password,
          p_full_name: fullName,
          p_role: role,
          p_course_ids: [],
          p_rut: formattedRut,
          p_curso: null,
          p_cargo: cargo
        })

      if (createError) {
        result.failed++
        if (createError.message.includes('Ya existe un usuario')) {
          result.errors.push(`Fila ${rowNumber}: Usuario con RUT ${formattedRut} ya existe`)
        } else {
          result.errors.push(`Fila ${rowNumber}: ${createError.message}`)
        }
        continue
      }

      if (!profile) {
        result.failed++
        result.errors.push(`Fila ${rowNumber}: No se pudo crear el usuario`)
        continue
      }

      result.success++
      console.log(`✓ Usuario creado: ${fullName} (RUT: ${formattedRut}, Pass: ${password}, Role: ${role})`)

    } catch (error) {
      result.failed++
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      result.errors.push(`Fila ${rowNumber}: ${errorMsg}`)
    }
  }

  return result
}

// Función principal que determina qué tipo de nómina procesar
export async function createBulkUsers(
  data: any[], 
  type: 'students' | 'workers'
): Promise<ProcessResult> {
  if (data.length === 0) {
    return {
      success: 0,
      failed: 0,
      errors: ['El archivo está vacío o no tiene datos']
    }
  }

  console.log(`Procesando ${data.length} filas del tipo: ${type}`)

  if (type === 'students') {
    return await createStudentUsers(data as StudentRow[])
  } else {
    return await createWorkerUsers(data as WorkerRow[])
  }
}
