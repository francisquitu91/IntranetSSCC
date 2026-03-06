import { assertSupabaseClient } from './supabase'
import { uploadPublicFile } from './storage'

export type SystemSetting = {
  id: string
  key: string
  value: string | null
  description: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export async function getSystemSetting(key: string): Promise<string | null> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    console.error('Error fetching system setting:', error)
    return null
  }

  return data?.value || null
}

export async function getAllSystemSettings(): Promise<SystemSetting[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key')

  if (error) {
    throw error
  }

  return (data ?? []) as SystemSetting[]
}

export async function updateSystemSetting(
  key: string,
  value: string | null,
  updatedBy: string
): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase
    .from('system_settings')
    .update({ value, updated_by: updatedBy })
    .eq('key', key)

  if (error) {
    throw error
  }
}

export async function createOrUpdateSystemSetting(
  key: string,
  value: string | null,
  description: string | null,
  updatedBy: string
): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      description,
      updated_by: updatedBy,
    })

  if (error) {
    throw error
  }
}

/**
 * Upload a file for system settings (logo, menu, etc) and update the setting
 * Uses the existing 'gallery' bucket for simplicity
 */
export async function uploadSystemFile(
  settingKey: string,
  file: File,
  updatedBy: string,
): Promise<string> {
  // Upload file to gallery bucket (reusing existing bucket)
  const { publicUrl } = await uploadPublicFile('gallery', file, { directory: 'system' })

  // Update the setting with the new URL
  await updateSystemSetting(settingKey, publicUrl, updatedBy)

  return publicUrl
}
