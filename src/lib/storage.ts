import { nanoid } from 'nanoid'
import { assertSupabaseClient } from './supabase'

export type UploadResult = {
  path: string
  publicUrl: string
}

/**
 * Uploads a file to the given Supabase Storage bucket and returns its public URL.
 * Assumes the bucket has public read access configured via Supabase dashboard.
 */
export async function uploadPublicFile(
  bucket: string,
  file: File,
  { directory = '' }: { directory?: string } = {},
): Promise<UploadResult> {
  const supabase = assertSupabaseClient()

  const safeSlug = file.name.replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()
  const uniqueName = `${Date.now()}-${nanoid(6)}-${safeSlug}`
  const path = directory ? `${directory.replace(/\/$/, '')}/${uniqueName}` : uniqueName

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw error
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return { path, publicUrl }
}
