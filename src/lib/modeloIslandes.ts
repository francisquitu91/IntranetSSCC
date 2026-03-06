import { assertSupabaseClient } from './supabase'
import { uploadPublicFile } from './storage'

export type ModeloIslandes = {
  id: string
  main_photo_url: string
  team_members: string[]
  updated_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Get the Modelo Islandés configuration
 */
export async function getModeloIslandes(): Promise<ModeloIslandes | null> {
  const supabase = assertSupabaseClient()

  const { data, error } = await supabase
    .from('modelo_islandes')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching modelo islandes:', error)
    return null
  }

  return data ? { ...data, id: String(data.id) } : null
}

/**
 * Update the Modelo Islandés configuration
 */
export async function updateModeloIslandes(
  id: string,
  mainPhotoUrl: string,
  teamMembers: string[],
  updatedBy: string,
): Promise<void> {
  const supabase = assertSupabaseClient()

  const { error } = await supabase
    .from('modelo_islandes')
    .update({
      main_photo_url: mainPhotoUrl,
      team_members: teamMembers,
      updated_by: updatedBy,
    })
    .eq('id', id)

  if (error) {
    throw error
  }
}

/**
 * Upload photo and update Modelo Islandés
 */
export async function uploadModeloPhoto(
  id: string,
  file: File,
  teamMembers: string[],
  updatedBy: string,
): Promise<string> {
  // Upload file to gallery bucket
  const { publicUrl } = await uploadPublicFile('gallery', file, { directory: 'modelo-islandes' })

  // Update the configuration
  await updateModeloIslandes(id, publicUrl, teamMembers, updatedBy)

  return publicUrl
}
