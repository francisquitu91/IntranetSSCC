import { createOrUpdateSystemSetting, getSystemSetting } from './systemSettings'

const DEPARTMENTS_SETTING_KEY = 'departments_config_json'

export type DepartmentItem = {
  id: string
  name: string
  cover_url: string | null
  description: string | null
  order: number
}

const DEFAULT_DEPARTMENT_NAMES = [
  'Acompañamiento e inclusión',
  'Administración',
  'Arte y Música',
  'Auxiliares',
  'Biblioteca',
  'C. Escolar',
  'Ciencias',
  'Consejo Académico',
  'Consejo Ejecutivo',
  'Coordinación Académica',
  'Ed. Física',
  'Enfermería',
  'Equipo Coprogramático',
  'Equipo de Trabajos Voluntarios',
  'Equipo Directivo',
  'Equipo Rectoría',
  'EVA',
  'Historia',
  'Inglés',
  'Lenguaje',
  'Matemáticas',
  'Religión',
  'Secretarias',
  'TIC',
]

const LEGACY_ID_MAP: Record<string, string> = {
  'administracion-ok': 'administracion',
  'arte-y-musica-ok': 'arte-y-musica',
  'biblioteca-ok': 'biblioteca',
  'ciencias-ok': 'ciencias',
  'consejo-academico-ok': 'consejo-academico',
  'consejo-ejecutivo-ok': 'consejo-ejecutivo',
  'coordinacion-academica-ok': 'coordinacion-academica',
  'ed-fisica-ok': 'ed-fisica',
  'enfermeria-ok': 'enfermeria',
  'equipo-coprogramatico-ok': 'equipo-coprogramatico',
  'equipo-rectoria-ok': 'equipo-rectoria',
  'historia-ok': 'historia',
  'lenguaje-ok': 'lenguaje',
  'matematicas-ok': 'matematicas',
  'religion-ok': 'religion',
}

const cleanDepartmentName = (value: string): string => value.replace(/\s+ok$/i, '').trim()

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const DEFAULT_DEPARTMENTS: DepartmentItem[] = DEFAULT_DEPARTMENT_NAMES.map((name, index) => ({
  id: slugify(name),
  name: cleanDepartmentName(name),
  cover_url: null,
  description: null,
  order: index,
}))

function sanitizeDepartments(raw: unknown): DepartmentItem[] {
  if (!Array.isArray(raw)) {
    return DEFAULT_DEPARTMENTS
  }

  const byId = new Map<string, DepartmentItem>()

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const candidate = item as Partial<DepartmentItem>
    if (!candidate.id || typeof candidate.id !== 'string') {
      continue
    }

    const normalizedId = LEGACY_ID_MAP[candidate.id] ?? candidate.id

    byId.set(normalizedId, {
      id: normalizedId,
      name:
        typeof candidate.name === 'string' && candidate.name.trim()
          ? cleanDepartmentName(candidate.name)
          : normalizedId,
      cover_url: typeof candidate.cover_url === 'string' && candidate.cover_url.trim() ? candidate.cover_url : null,
      description: typeof candidate.description === 'string' && candidate.description.trim() ? candidate.description.trim() : null,
      order: typeof candidate.order === 'number' ? candidate.order : Number.MAX_SAFE_INTEGER,
    })
  }

  const merged = DEFAULT_DEPARTMENTS.map((defaultItem) => {
    const stored = byId.get(defaultItem.id)
    return stored
      ? {
          ...defaultItem,
          ...stored,
          order: Number.isFinite(stored.order) ? stored.order : defaultItem.order,
        }
      : defaultItem
  })

  return merged.sort((a, b) => a.order - b.order)
}

export async function getDepartments(): Promise<DepartmentItem[]> {
  const settingValue = await getSystemSetting(DEPARTMENTS_SETTING_KEY)
  if (!settingValue) {
    return DEFAULT_DEPARTMENTS
  }

  try {
    const parsed = JSON.parse(settingValue) as unknown
    return sanitizeDepartments(parsed)
  } catch (error) {
    console.error('Invalid departments setting JSON:', error)
    return DEFAULT_DEPARTMENTS
  }
}

export async function saveDepartments(departments: DepartmentItem[], updatedBy: string): Promise<void> {
  const normalized = sanitizeDepartments(departments).map((item, index) => ({
    ...item,
    order: index,
  }))

  await createOrUpdateSystemSetting(
    DEPARTMENTS_SETTING_KEY,
    JSON.stringify(normalized),
    'Configuracion de la seccion Departamentos (portada y descripcion por departamento)',
    updatedBy,
  )
}
