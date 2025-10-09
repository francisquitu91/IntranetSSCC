import { assertSupabaseClient } from './supabase'
import type { Profile, Role } from '../types'

export async function fetchUsers(): Promise<Profile[]> {
  const supabase = assertSupabaseClient()

  const { data, error } = await supabase.rpc('get_all_profiles')

  if (error) {
    throw error
  }

  return (data ?? []).map((item: any) => ({
    ...item,
    id: String(item.id),
  })) as Profile[]
}

export type UserPayload = {
  email: string
  password: string
  full_name: string
  role: Role
  course_ids?: string[]
}

export async function createUser(payload: UserPayload): Promise<Profile> {
  const supabase = assertSupabaseClient()
  
  const { data, error } = await supabase.rpc('simple_upsert_profile', {
    p_email: payload.email,
    p_password: payload.password,
    p_full_name: payload.full_name,
    p_role: payload.role,
    p_course_ids: payload.course_ids || [],
  })

  if (error) {
    throw error
  }

  return { ...data, id: String(data.id) } as Profile
}

export async function updateUser(id: string, payload: Partial<UserPayload>): Promise<Profile> {
  const supabase = assertSupabaseClient()
  
  const { data, error } = await supabase.rpc('simple_upsert_profile', {
    p_id: id,
    p_email: payload.email,
    p_password: payload.password,
    p_full_name: payload.full_name,
    p_role: payload.role,
    p_course_ids: payload.course_ids || [],
  })

  if (error) {
    throw error
  }

  return { ...data, id: String(data.id) } as Profile
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = assertSupabaseClient()
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}