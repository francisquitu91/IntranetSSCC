import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { NewsItem, Course } from '../../types'
import type { NewsImage } from '../../lib/newsImages'
import { fetchNewsImages } from '../../lib/newsImages'
import { fetchCourses } from '../../lib/courses'
import { NewsContentRenderer } from './NewsContentRenderer'

type Props = {
  newsItem: NewsItem
  onBack: () => void
}

export function NewsDetail({ newsItem, onBack }: Props): JSX.Element {
  const [images, setImages] = useState<NewsImage[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

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

  // Cargar cursos para mostrar nombres reales
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true)
        const coursesData = await fetchCourses()
        setCourses(coursesData)
      } catch (error) {
        console.error('Error loading courses:', error)
        setCourses([])
      } finally {
        setLoadingCourses(false)
      }
    }

    if (newsItem.course_ids && newsItem.course_ids.length > 0) {
      loadCourses()
    }
  }, [newsItem.course_ids])

  // Obtener la imagen principal (ya sea de la nueva estructura o de la antigua)
  const primaryImage = images.find(img => img.is_primary)?.url || newsItem.image_url

  // Función para obtener los nombres de los cursos
  const getCourseNames = (): string[] => {
    if (!newsItem.course_ids || courses.length === 0) return []
    
    return newsItem.course_ids
      .map(courseId => courses.find(course => course.id === courseId)?.name)
      .filter(Boolean) as string[]
  }

  return (
    <article className="bg-white rounded-3xl shadow-card overflow-hidden">
      {/* Header con botón de volver */}
      <div className="p-6 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Volver a noticias</span>
        </button>
        
        {/* Título principal */}
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {newsItem.title}
        </h1>
        
        {/* Metadatos */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
          {formattedDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          )}
          
          {newsItem.author && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{newsItem.author}</span>
            </div>
          )}
          
          {newsItem.featured && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" />
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
            className="w-full h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Contenido */}
      <div className="p-6 lg:p-8">
        {/* Extracto/Resumen */}
        {newsItem.excerpt && (
          <div className="mb-6">
            <p className="text-xl text-gray-700 leading-relaxed font-medium bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
              {newsItem.excerpt}
            </p>
          </div>
        )}

        {/* Contenido principal con imágenes múltiples */}
        <div className="prose prose-lg max-w-none news-content">
          {newsItem.content ? (
            <div className="text-gray-800 leading-relaxed">
              {loadingImages ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando imágenes...</span>
                </div>
              ) : (
                <NewsContentRenderer content={newsItem.content} images={images} />
              )}
            </div>
          ) : (
            <p className="text-gray-600 italic">
              Esta noticia no tiene contenido adicional disponible.
            </p>
          )}
        </div>

        {/* Información adicional */}
        {newsItem.course_ids && newsItem.course_ids.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Dirigido a:
            </h3>
            <div className="flex flex-wrap gap-2">
              {loadingCourses ? (
                <span className="text-sm text-gray-500">Cargando cursos...</span>
              ) : (
                getCourseNames().map((courseName, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {courseName}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 lg:px-8 pb-6">
        <div className="border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a las noticias
          </button>
        </div>
      </div>
    </article>
  )
}