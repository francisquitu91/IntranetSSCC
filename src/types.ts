export type Role = 'admin' | 'teacher' | 'student'

export type NewsItem = {
  id: string
  title: string
  image_url: string // Mantenemos por compatibilidad - será la imagen principal
  date?: string | null
  featured?: boolean | null
  excerpt?: string | null
  author?: string | null
  content?: string | null
  cursos_objetivo?: string[] | null
  created_at?: string
  updated_at?: string
  created_by?: string | null
  // Nuevos campos para múltiples imágenes
  images?: Array<{
    id: string
    url: string
    alt_text: string | null
    position_in_content: number
    alignment: 'left' | 'right' | 'center'
    is_primary: boolean
    width?: number | null
    height?: number | null
  }>
  primary_image_url?: string | null
}

export type Circular = {
  id: string
  title: string
  description?: string | null
  file_url: string
  file_name?: string | null
  cursos_objetivo?: string[] | null
  published_at?: string | null
  created_by?: string | null
}

export type GalleryItem = {
  id: string
  title: string
  description?: string | null
  image_url: string
  cursos_objetivo?: string[] | null
  published_at?: string | null
  created_by?: string | null
}

export type Profile = {
  id: string
  full_name?: string | null
  role: Role
  email?: string
  created_at?: string
  rut?: string | null
  curso?: string | null
  cargo?: string | null
}

export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  event_type: 'academico' | 'evaluacion' | 'actividad' | 'feriado'
  description?: string | null
  related?: string | null
  profile_id?: string | null
  created_at?: string
  updated_at?: string
}
