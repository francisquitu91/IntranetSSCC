import { assertSupabaseClient } from './supabase'
import type { NewsItem } from '../types'

export async function fetchNews(limit?: number): Promise<NewsItem[]> {
  const supabase = assertSupabaseClient()

  let query = supabase.from('news').select(`
    *,
    news_images(
      id,
      url,
      alt_text,
      position_in_content,
      alignment,
      is_primary,
      width,
      height
    )
  `).order('date', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    // Si falla la consulta con imágenes múltiples, intentar la consulta básica
    console.warn('Failed to fetch news with images, falling back to basic query:', error)
    
    let basicQuery = supabase.from('news').select('*').order('date', { ascending: false })
    if (limit) {
      basicQuery = basicQuery.limit(limit)
    }
    
    const { data: basicData, error: basicError } = await basicQuery
    
    if (basicError) {
      throw basicError
    }
    
    return (basicData ?? []).map((item) => ({
      ...item,
      id: String(item.id),
      images: [],
      primary_image_url: item.image_url
    })) as NewsItem[]
  }

  return (data ?? []).map((item) => {
    const images = Array.isArray(item.news_images) ? item.news_images : []
    const primaryImage = images.find((img: any) => img.is_primary)
    
    return {
      ...item,
      id: String(item.id),
      images,
      primary_image_url: primaryImage?.url || item.image_url,
      // Mantener image_url por compatibilidad
      image_url: primaryImage?.url || item.image_url
    }
  }) as NewsItem[]
}

export type NewsPayload = {
  title: string
  excerpt?: string | null
  content?: string | null
  image_url?: string | null
  date?: string | null
  author?: string | null
  featured?: boolean | null
  cursos_objetivo?: string[] | null
  created_by?: string | null
}

export async function createNews(payload: NewsPayload): Promise<NewsItem> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('news')
    .insert({ ...payload })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return { ...data, id: String(data.id) } as NewsItem
}

export async function updateNews(id: string, payload: Partial<NewsPayload>): Promise<NewsItem> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('news')
    .update({ ...payload })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return { ...data, id: String(data.id) } as NewsItem
}

export async function deleteNews(id: string): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase.from('news').delete().eq('id', id)

  if (error) {
    throw error
  }
}
