import { assertSupabaseClient } from './supabase'
import type { GalleryItem } from '../types'

export type GalleryPayload = {
  title: string
  description?: string | null
  image_url: string
  cursos_objetivo?: string[] | null
  published_at?: string | null
  created_by?: string | null
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => ({ ...item, id: String(item.id) })) as GalleryItem[]
}

export async function fetchGalleryByCourse(cursos: string[]): Promise<GalleryItem[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) {
    throw error
  }

  const allItems = (data ?? []).map((item) => ({ ...item, id: String(item.id) })) as GalleryItem[]
  
  // Filtrar por curso: mostrar si no tiene cursos_objetivo o si hay coincidencia
  return allItems.filter((item) => {
    if (!item.cursos_objetivo || item.cursos_objetivo.length === 0) {
      return true // Mostrar a todos si no tiene cursos asignados
    }
    return item.cursos_objetivo.some((curso) => cursos.includes(curso))
  })
}

export async function createGalleryItem(payload: GalleryPayload): Promise<GalleryItem> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .insert({ ...payload })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return { ...data, id: String(data.id) } as GalleryItem
}

export async function updateGalleryItem(
  id: string,
  payload: Partial<GalleryPayload>,
): Promise<GalleryItem> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .update({ ...payload })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return { ...data, id: String(data.id) } as GalleryItem
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase.from('gallery_items').delete().eq('id', id)

  if (error) {
    throw error
  }
}
