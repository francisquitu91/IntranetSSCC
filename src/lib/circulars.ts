import { assertSupabaseClient } from './supabase'
import type { Circular } from '../types'

export type CircularPayload = {
  title: string
  description?: string | null
  file_url: string
  file_name?: string | null
  cursos_objetivo?: string[] | null
  published_at?: string | null
  created_by?: string | null
}

export async function fetchCirculars(): Promise<Circular[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('circulars')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => ({ ...item, id: String(item.id) })) as Circular[]
}

export async function createCircular(payload: CircularPayload): Promise<Circular> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('circulars')
    .insert({ ...payload })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return { ...data, id: String(data.id) } as Circular
}

export async function updateCircular(id: string, payload: Partial<CircularPayload>): Promise<Circular> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('circulars')
    .update({ ...payload })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return { ...data, id: String(data.id) } as Circular
}

export async function deleteCircular(id: string): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase.from('circulars').delete().eq('id', id)

  if (error) {
    throw error
  }
}
