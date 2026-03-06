import { useEffect, useState } from 'react'
import type { ContentImage } from '../lib/contentImages'
import { fetchContentImages } from '../lib/contentImages'

type Props = {
  contentId: string
  content: string
  className?: string
  showImages?: boolean // Opcional: controlar si se muestran las imágenes
}

export function ContentRenderer({ 
  contentId, 
  content, 
  className = '', 
  showImages = true 
}: Props) {
  const [images, setImages] = useState<ContentImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (showImages && contentId) {
      loadImages()
    } else {
      setLoading(false)
    }
  }, [contentId, showImages])

  const loadImages = async () => {
    try {
      setLoading(true)
      const fetchedImages = await fetchContentImages(contentId)
      setImages(fetchedImages)
      setError(null)
    } catch (err) {
      console.error('Error loading images:', err)
      setError('Error al cargar las imágenes')
    } finally {
      setLoading(false)
    }
  }

  // Si no hay contenido, mostrar placeholder
  if (!content || content.trim() === '') {
    return (
      <div className={`text-gray-400 italic ${className}`}>
        Sin contenido disponible
      </div>
    )
  }

  // Dividir el contenido en párrafos (respetando saltos de línea)
  const paragraphs = content
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)

  // Ordenar imágenes por posición
  const sortedImages = showImages 
    ? [...images].sort((a, b) => a.position_in_content - b.position_in_content)
    : []

  // Función para obtener clases de alineación
  const getAlignmentClasses = (alignment: 'left' | 'right' | 'center') => {
    switch (alignment) {
      case 'left':
        return 'float-left mr-4 mb-4 ml-0'
      case 'right':
        return 'float-right ml-4 mb-4 mr-0'
      case 'center':
        return 'mx-auto my-6 block clear-both'
      default:
        return 'mx-auto my-6 block'
    }
  }

  // Renderizar contenido con imágenes intercaladas
  const renderContentWithImages = () => {
    const elements: JSX.Element[] = []
    let imageIndex = 0

    paragraphs.forEach((paragraph, pIndex) => {
      // Añadir párrafo
      elements.push(
        <p 
          key={`p-${pIndex}`} 
          className="mb-4 text-gray-700 leading-relaxed text-justify"
        >
          {paragraph}
        </p>
      )

      // Insertar imágenes que corresponden a esta posición
      while (
        imageIndex < sortedImages.length && 
        sortedImages[imageIndex].position_in_content === pIndex + 1
      ) {
        const image = sortedImages[imageIndex]
        const alignmentClass = getAlignmentClasses(image.alignment)

        elements.push(
          <div
            key={`img-wrapper-${image.id}`}
            className={image.alignment === 'center' ? 'clear-both my-6' : ''}
          >
            <img
              key={`img-${image.id}`}
              src={image.url}
              alt={image.alt_text || ''}
              loading="lazy"
              className={`rounded-lg shadow-md ${alignmentClass}`}
              style={{
                width: image.width ? `${image.width}px` : image.alignment === 'center' ? '100%' : 'auto',
                height: image.height ? `${image.height}px` : 'auto',
                maxWidth: image.alignment === 'center' ? '100%' : '50%',
                objectFit: 'cover'
              }}
              title={image.alt_text || undefined}
            />
          </div>
        )
        imageIndex++
      }
    })

    // Añadir imágenes restantes al final (si position_in_content es mayor que el número de párrafos)
    while (imageIndex < sortedImages.length) {
      const image = sortedImages[imageIndex]
      
      elements.push(
        <div key={`img-wrapper-end-${image.id}`} className="clear-both my-6">
          <img
            key={`img-end-${image.id}`}
            src={image.url}
            alt={image.alt_text || ''}
            loading="lazy"
            className="rounded-lg shadow-md mx-auto block"
            style={{
              width: image.width ? `${image.width}px` : 'auto',
              maxWidth: '100%',
              height: 'auto'
            }}
            title={image.alt_text || undefined}
          />
        </div>
      )
      imageIndex++
    }

    return elements
  }

  // Loading state
  if (loading && showImages) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-32 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  // Error state (no bloquea el contenido, solo muestra aviso)
  if (error) {
    console.warn('ContentRenderer:', error)
  }

  // Render normal
  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      {/* Contenedor con clearfix para manejar floats */}
      <div className="overflow-hidden">
        {renderContentWithImages()}
      </div>
      
      {/* Clearfix final para asegurar que no haya problemas de layout */}
      <div className="clear-both"></div>
    </div>
  )
}

// Componente simplificado para mostrar solo texto (sin imágenes)
export function SimpleContentRenderer({ 
  content, 
  className = '' 
}: { 
  content: string
  className?: string 
}) {
  if (!content || content.trim() === '') {
    return (
      <div className={`text-gray-400 italic ${className}`}>
        Sin contenido disponible
      </div>
    )
  }

  const paragraphs = content
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)

  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p 
          key={`simple-p-${index}`} 
          className="mb-4 text-gray-700 leading-relaxed text-justify"
        >
          {paragraph}
        </p>
      ))}
    </div>
  )
}

// Hook personalizado para obtener solo la imagen principal
export function usePrimaryImage(contentId: string | null) {
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!contentId) {
      setPrimaryImageUrl(null)
      return
    }

    const loadPrimaryImage = async () => {
      try {
        setLoading(true)
        const images = await fetchContentImages(contentId)
        const primary = images.find(img => img.is_primary)
        setPrimaryImageUrl(primary?.url || images[0]?.url || null)
      } catch (error) {
        console.error('Error loading primary image:', error)
        setPrimaryImageUrl(null)
      } finally {
        setLoading(false)
      }
    }

    loadPrimaryImage()
  }, [contentId])

  return { primaryImageUrl, loading }
}
