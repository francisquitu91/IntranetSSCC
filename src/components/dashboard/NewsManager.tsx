import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PlusCircle, Trash2, Pencil, XCircle } from 'lucide-react'
import type { Course, NewsItem } from '../../types'
import { createNews, deleteNews, fetchNews, updateNews, type NewsPayload } from '../../lib/news'
import { uploadPublicFile } from '../../lib/storage'
import { CourseSelector } from './CourseSelector'
import { NewsImageManager } from './NewsImageManager'
import type { NewsImage } from '../../lib/newsImages'
import { createNewsImage, fetchNewsImages, updateNewsImage } from '../../lib/newsImages'

type Props = {
  courses: Course[]
  loadingCourses: boolean
  profileId?: string | null
}

type FormState = {
  id?: string | null
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  featured: boolean
  courseIds: string[]
}

const INITIAL_FORM: FormState = {
  id: null,
  title: '',
  excerpt: '',
  content: '',
  author: '',
  date: '',
  featured: false,
  courseIds: [],
}

export function NewsManager({ courses, loadingCourses, profileId }: Props): JSX.Element {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentImages, setCurrentImages] = useState<NewsImage[]>([])
  const [temporaryImagesRef, setTemporaryImagesRef] = useState<NewsImage[]>([])

  // Función para convertir imágenes temporales a permanentes
  async function convertTemporaryImages(newsId: string) {
    try {
      // Obtener imágenes temporales del estado
      for (const tempImage of temporaryImagesRef) {
        await createNewsImage({
          news_id: newsId,
          url: tempImage.url,
          alt_text: tempImage.alt_text || formState.title + ' - Imagen',
          alignment: tempImage.alignment,
          position_in_content: tempImage.position_in_content,
          is_primary: tempImage.is_primary,
          width: tempImage.width || undefined,
          height: tempImage.height || undefined
        })
      }
    } catch (error) {
      console.error('Error converting temporary images:', error)
      // No fallar todo el proceso si falla la conversión
    }
  }

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const news = await fetchNews()
        if (isMounted) {
          setItems(news)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'No pudimos cargar las noticias. Revisa tu conexión e intenta nuevamente.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [])

  const isEditing = useMemo(() => Boolean(formState.id), [formState.id])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!formState.title.trim()) {
      setError('Ingresa un título para la noticia.')
      return
    }

    if (!profileId) {
      setError('Tu perfil no está correctamente asociado. Pide soporte para sincronizar tu cuenta.')
      return
    }

    setSubmitting(true)
    setError(null)
    setStatusMessage(null)

    try {
      const payload: NewsPayload = {
        title: formState.title,
        excerpt: formState.excerpt || null,
        content: formState.content || null,
        author: formState.author || null,
        date: formState.date ? new Date(formState.date).toISOString() : null,
        featured: formState.featured,
        image_url: null, // Se manejará a través del sistema de imágenes múltiples
        course_ids: formState.courseIds.length > 0 ? formState.courseIds : null,
      }

      let savedNews: NewsItem
      
      if (isEditing && formState.id) {
        savedNews = await updateNews(formState.id, payload)
        setItems((prev) => prev.map((item) => (item.id === savedNews.id ? savedNews : item)))
        setStatusMessage('Noticia actualizada correctamente.')
      } else {
        payload.created_by = profileId
        savedNews = await createNews(payload)
        setItems((prev) => [savedNews, ...prev])
        setStatusMessage('Noticia creada correctamente.')
        
        // Para noticias nuevas, actualizar el formState con el ID para permitir gestión de imágenes
        setFormState(prev => ({ ...prev, id: savedNews.id }))
      }

      // Convertir imágenes temporales a permanentes
      if (!isEditing && temporaryImagesRef.length > 0) {
        await convertTemporaryImages(savedNews.id)
      }

      // Para edición, limpiar formulario. Para nueva noticia, mantener datos para seguir editando
      if (isEditing) {
        setFormState(INITIAL_FORM)
      } else {
        // Para nueva noticia, mantener el formulario pero limpiar las imágenes temporales del manager
        // Las imágenes ya se convirtieron a permanentes, así que limpiar el estado temporal
        setCurrentImages([])
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error al guardar la noticia. Intenta nuevamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(item: NewsItem) {
    setFormState({
      id: item.id,
      title: item.title ?? '',
      excerpt: item.excerpt ?? '',
      content: item.content ?? '',
      author: item.author ?? '',
      date: item.date ? item.date.slice(0, 10) : '',
      featured: Boolean(item.featured),
      courseIds: item.course_ids ?? [],
    })
    setStatusMessage(null)
    setError(null)
  }

  async function handleDelete(id: string) {
    try {
      await deleteNews(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setStatusMessage('Noticia eliminada correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos eliminar la noticia.')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Editar noticia' : 'Crear nueva noticia'}
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setFormState(INITIAL_FORM)
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
            >
              <XCircle className="h-4 w-4" /> Cancelar edición
            </button>
          )}
        </div>

        {!profileId && (
          <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
            Tu cuenta no tiene un perfil asociado. Pide al administrador que complete tu registro en la tabla
            «profiles» para habilitar la gestión de contenidos.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="news-title">
              Título
            </label>
            <input
              id="news-title"
              type="text"
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Ej. Nueva jornada deportiva"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="news-author">
              Autor/a (opcional)
            </label>
            <input
              id="news-author"
              type="text"
              value={formState.author}
              onChange={(event) => setFormState((prev) => ({ ...prev, author: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Equipo de comunicaciones"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="news-date">
              Fecha de publicación
            </label>
            <input
              id="news-date"
              type="date"
              value={formState.date}
              onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              id="news-featured"
              type="checkbox"
              checked={formState.featured}
              onChange={(event) => setFormState((prev) => ({ ...prev, featured: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-sky-900 focus:ring-sky-500"
            />
            <label htmlFor="news-featured" className="text-sm text-slate-600">
              Destacar en portada
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="news-excerpt">
            Resumen breve
          </label>
          <textarea
            id="news-excerpt"
            value={formState.excerpt}
            onChange={(event) => setFormState((prev) => ({ ...prev, excerpt: event.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Describe brevemente la noticia (máx. 300 caracteres)"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="news-content">
            Contenido completo de la noticia
          </label>
          <textarea
            id="news-content"
            value={formState.content}
            onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
            rows={8}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Escribe aquí el contenido completo de la noticia. Este será el texto que los usuarios verán al hacer clic en 'Leer más'."
          />
          <p className="text-xs text-slate-500">
            Este contenido aparecerá cuando los usuarios abran la noticia completa.
          </p>
        </div>

        {/* Gestión unificada de imágenes - Siempre visible */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Gestión de imágenes</p>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <NewsImageManager
              newsId={formState.id || null}
              onImagesChange={setCurrentImages}
              onTemporaryImagesChange={setTemporaryImagesRef}
              disabled={submitting}
              allowTemporaryMode={true}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Cursos destinatarios</p>
          {loadingCourses ? (
            <p className="text-sm text-slate-400">Cargando cursos…</p>
          ) : (
            <CourseSelector
              courses={courses}
              selected={new Set(formState.courseIds)}
              onChange={(next) => setFormState((prev) => ({ ...prev, courseIds: next }))}
            />
          )}
          <p className="text-xs text-slate-400">
            Si no seleccionas ningún curso, la noticia será visible para toda la comunidad.
          </p>
        </div>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
        {statusMessage && (
          <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{statusMessage}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !profileId}
            className="inline-flex items-center gap-2 rounded-full bg-sky-900 px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isEditing ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            {submitting ? 'Guardando…' : isEditing ? 'Actualizar noticia' : 'Publicar noticia'}
          </button>
          
          {(isEditing || formState.id) && (
            <button
              type="button"
              onClick={() => {
                setFormState(INITIAL_FORM)
                setCurrentImages([])
                setTemporaryImagesRef([])
                setStatusMessage(null)
                setError(null)
              }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <XCircle className="h-4 w-4" />
              Nueva noticia
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Últimas noticias ({items.length})</h3>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando noticias…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No hay noticias registradas todavía.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.date ? new Date(item.date).toLocaleDateString('es-CL') : 'Sin fecha definida'} •{' '}
                    {item.featured ? 'Destacada' : 'Normal'}
                  </p>
                  {item.course_ids && item.course_ids.length > 0 ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Destinada a {item.course_ids.length} curso(s)
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
