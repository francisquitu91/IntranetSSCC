import { useMemo } from 'react'
import type { NewsImage } from '../../lib/newsImages'

type Props = {
  content: string
  images: NewsImage[]
}

export function NewsContentRenderer({ content, images }: Props) {
  const renderedContent = useMemo(() => {
    if (!images || images.length === 0) {
      return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
    }

    // Filtrar solo las imágenes que no son principales (las que van en el contenido)
    const contentImages = images.filter(img => !img.is_primary && img.position_in_content > 0)
    
    if (contentImages.length === 0) {
      return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
    }

    // Ordenar por posición
    contentImages.sort((a, b) => a.position_in_content - b.position_in_content)

    // Dividir el contenido en párrafos
    const paragraphs = content.split('\n\n').filter(p => p.trim())
    
    // Crear el contenido con imágenes insertadas
    const contentParts: JSX.Element[] = []
    let imageIndex = 0

    paragraphs.forEach((paragraph, index) => {
      // Añadir el párrafo
      contentParts.push(
        <div 
          key={`paragraph-${index}`} 
          className="mb-4" 
          dangerouslySetInnerHTML={{ __html: formatContent(paragraph) }} 
        />
      )

      // Verificar si debemos insertar una imagen después de este párrafo
      if (imageIndex < contentImages.length) {
        const nextImage = contentImages[imageIndex]
        
        // Si la posición de la imagen coincide con la posición actual del párrafo (1-indexed)
        if (nextImage.position_in_content <= index + 1) {
          contentParts.push(
            <div key={`image-${nextImage.id}`} className="my-6">
              <ImageWithText image={nextImage} />
            </div>
          )
          imageIndex++
        }
      }
    })

    // Añadir imágenes restantes al final si las hay
    while (imageIndex < contentImages.length) {
      const remainingImage = contentImages[imageIndex]
      contentParts.push(
        <div key={`image-remaining-${remainingImage.id}`} className="my-6">
          <ImageWithText image={remainingImage} />
        </div>
      )
      imageIndex++
    }

    return (
      <div className="prose max-w-none news-content">
        {contentParts}
      </div>
    )
  }, [content, images])

  return renderedContent
}

function ImageWithText({ image }: { image: NewsImage }) {
  const getAlignmentClasses = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return 'float-left'
      case 'right':
        return 'float-right'
      case 'center':
        return 'block mx-auto clear-both'
      default:
        return 'float-left'
    }
  }

  const maxWidth = image.width ? `${image.width}px` : '400px'
  const height = image.height ? `${image.height}px` : 'auto'

  return (
    <div className={`${getAlignmentClasses(image.alignment)}`} style={{ maxWidth }}>
      <img
        src={image.url}
        alt={image.alt_text || 'Imagen de la noticia'}
        className="w-full h-auto object-cover"
        style={{ 
          height: height !== 'auto' ? height : undefined
        }}
        loading="lazy"
      />
      {image.alt_text && (
        <p className="text-xs text-gray-600 mt-2 italic text-center">
          {image.alt_text}
        </p>
      )}
    </div>
  )
}

// Función auxiliar para formatear el contenido de texto
function formatContent(text: string): string {
  return text
    .replace(/\n/g, '<br />')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
}