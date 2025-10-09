import { assertSupabaseClient } from './supabase'
import type { Course } from '../types'

export async function fetchCourses(): Promise<Course[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase.from('courses').select('*').order('name')

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => ({ ...item, id: String(item.id) })) as Course[]
}
