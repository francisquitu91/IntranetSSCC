import { assertSupabaseClient } from './supabase'

export type NewsImage = {
  id: string
  news_id: string
  url: string
  alt_text: string | null
  position_in_content: number
  alignment: 'left' | 'right' | 'center'
  is_primary: boolean
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

export type NewsImagePayload = {
  news_id: string
  url: string
  alt_text?: string
  position_in_content?: number
  alignment?: 'left' | 'right' | 'center'
  is_primary?: boolean
  width?: number
  height?: number
}

// Obtener todas las imágenes de una noticia
export async function fetchNewsImages(newsId: string): Promise<NewsImage[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase.rpc('get_news_images', {
    news_id_param: newsId
  })

  if (error) {
    console.error('Error fetching news images:', error)
    throw new Error(`Error al obtener imágenes: ${error.message}`)
  }

  return data || []
}

// Obtener la URL de la imagen principal
export async function fetchPrimaryImageUrl(newsId: string): Promise<string | null> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase.rpc('get_primary_image_url', {
    news_id_param: newsId
  })

  if (error) {
    console.error('Error fetching primary image:', error)
    return null
  }

  return data
}

// Crear una nueva imagen
export async function createNewsImage(payload: NewsImagePayload): Promise<NewsImage> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('news_images')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Error creating news image:', error)
    throw new Error(`Error al crear imagen: ${error.message}`)
  }

  return data
}

// Actualizar una imagen existente
export async function updateNewsImage(id: string, payload: Partial<NewsImagePayload>): Promise<NewsImage> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('news_images')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating news image:', error)
    throw new Error(`Error al actualizar imagen: ${error.message}`)
  }

  return data
}

// Eliminar una imagen
export async function deleteNewsImage(id: string): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase
    .from('news_images')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting news image:', error)
    throw new Error(`Error al eliminar imagen: ${error.message}`)
  }
}

// Marcar una imagen como principal
export async function setPrimaryImage(newsId: string, imageId: string): Promise<void> {
  const supabase = assertSupabaseClient()
  // Primero desmarcar todas las imágenes principales de esta noticia
  await supabase
    .from('news_images')
    .update({ is_primary: false })
    .eq('news_id', newsId)

  // Luego marcar la nueva imagen como principal
  const { error } = await supabase
    .from('news_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  if (error) {
    console.error('Error setting primary image:', error)
    throw new Error(`Error al establecer imagen principal: ${error.message}`)
  }
}

// Reordenar imágenes en el contenido
export async function reorderNewsImages(newsId: string, imageOrders: { id: string; position: number }[]): Promise<void> {
  const supabase = assertSupabaseClient()
  const updates = imageOrders.map(({ id, position }) =>
    supabase
      .from('news_images')
      .update({ position_in_content: position })
      .eq('id', id)
      .eq('news_id', newsId)
  )

  const results = await Promise.all(updates)
  
  const errors = results.filter((result: any) => result.error)
  if (errors.length > 0) {
    console.error('Error reordering images:', errors)
    throw new Error('Error al reordenar imágenes')
  }
}

// Función auxiliar para procesar contenido con imágenes embebidas
export function processContentWithImages(content: string, images: NewsImage[]): string {
  if (!images || images.length === 0) return content

  // Filtrar solo las imágenes que no son principales (las que van en el contenido)
  const contentImages = images.filter(img => !img.is_primary && img.position_in_content > 0)
  
  // Ordenar por posición
  contentImages.sort((a, b) => a.position_in_content - b.position_in_content)

  let processedContent = content
  
  // Insertar cada imagen en su posición correspondiente
  contentImages.forEach((image, index) => {
    const imageHtml = generateImageHtml(image)
    
    // Buscar puntos de inserción (después de párrafos)
    const paragraphs = processedContent.split('\n\n')
    
    // Calcular la posición basada en el índice de la imagen
    const insertPosition = Math.min(image.position_in_content, paragraphs.length - 1)
    
    if (insertPosition >= 0 && insertPosition < paragraphs.length) {
      paragraphs[insertPosition] += '\n\n' + imageHtml
    } else {
      // Si no se puede insertar en la posición específica, añadir al final
      paragraphs.push(imageHtml)
    }
    
    processedContent = paragraphs.join('\n\n')
  })

  return processedContent
}

// Generar HTML para una imagen con estilos apropiados
function generateImageHtml(image: NewsImage): string {
  const alignment = image.alignment || 'left'
  const altText = image.alt_text || 'Imagen de la noticia'
  
  // Estilos CSS para el ajuste de texto
  const alignmentStyles = {
    left: 'float: left; margin: 0 16px 16px 0;',
    right: 'float: right; margin: 0 0 16px 16px;',
    center: 'display: block; margin: 16px auto; clear: both;'
  }

  const style = alignmentStyles[alignment]
  const maxWidth = image.width ? `max-width: ${image.width}px;` : 'max-width: 400px;'
  const height = image.height ? `height: ${image.height}px;` : 'height: auto;'

  return `<img 
    src="${image.url}" 
    alt="${altText}" 
    style="${style} ${maxWidth} ${height} border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
    loading="lazy"
  />`
}