import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { NewsItem } from '../../types'
import type { NewsImage } from '../../lib/newsImages'
import { fetchNewsImages } from '../../lib/newsImages'
import { NewsContentRenderer } from './NewsContentRenderer'

type Props = {
  newsItem: NewsItem
  onBack: () => void
}

export function NewsDetail({ newsItem, onBack }: Props): JSX.Element {
  const [images, setImages] = useState<NewsImage[]>([])
  const [loadingImages, setLoadingImages] = useState(false)

  const formattedDate = newsItem.date 
    ? new Date(newsItem.date).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  // Cargar imágenes múltiples al montar el componente
  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoadingImages(true)
        const newsImages = await fetchNewsImages(newsItem.id)
        setImages(newsImages)
      } catch (error) {
        console.error('Error loading news images:', error)
        setImages([])
      } finally {
        setLoadingImages(false)
      }
    }

    loadImages()
  }, [newsItem.id])

  // Obtener la imagen principal (ya sea de la nueva estructura o de la antigua)
  const primaryImage = images.find(img => img.is_primary)?.url || newsItem.image_url

  return (
    <article className="bg-white rounded-2xl sm:rounded-3xl shadow-card overflow-hidden">
      {/* Header con botón de volver */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-3 sm:mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs sm:text-sm font-medium">Volver a noticias</span>
        </button>
        
        {/* Título principal */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
          {newsItem.title}
        </h1>
        
        {/* Metadatos */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
          {formattedDate && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{formattedDate}</span>
            </div>
          )}
          
          {newsItem.author && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{newsItem.author}</span>
            </div>
          )}
          
          {newsItem.featured && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              <span className="text-amber-600 font-medium">Destacada</span>
            </div>
          )}
        </div>
      </div>

      {/* Imagen principal */}
      {primaryImage && (
        <div className="relative">
          <img
            src={primaryImage}
            alt={newsItem.title || 'Imagen de la noticia'}
            className="w-full h-48 sm:h-64 lg:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Extracto/Resumen */}
        {newsItem.excerpt && (
          <div className="mb-4 sm:mb-6">
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed font-medium bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border-blue-500">
              {newsItem.excerpt}
            </p>
          </div>
        )}

        {/* Contenido principal con imágenes múltiples */}
        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none news-content">
          {newsItem.content ? (
            <div className="text-gray-800 leading-relaxed">
              {loadingImages ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm sm:text-base text-gray-600">Cargando imágenes...</span>
                </div>
              ) : (
                <NewsContentRenderer content={newsItem.content} images={images} />
              )}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-gray-600 italic">
              Esta noticia no tiene contenido adicional disponible.
            </p>
          )}
        </div>

        {/* Información adicional */}
        {newsItem.cursos_objetivo && newsItem.cursos_objetivo.length > 0 && (
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
              Dirigido a:
            </h3>
            <div className="flex flex-wrap gap-2">
              {newsItem.cursos_objetivo.map((curso, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {curso}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
        <div className="border-t border-gray-100 pt-4 sm:pt-6">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a las noticias
          </button>
        </div>
      </div>
    </article>
  )
}