import { useEffect, useState, type FormEvent } from 'react'
import { ImagePlus, Trash2, Pencil, XCircle } from 'lucide-react'
import type { Course, GalleryItem } from '../../types'
import {
  createGalleryItem,
  deleteGalleryItem,
  fetchGallery,
  updateGalleryItem,
  type GalleryPayload,
} from '../../lib/gallery'
import { uploadPublicFile } from '../../lib/storage'
import { CourseSelector } from './CourseSelector'

const INITIAL_FORM = {
  id: null as string | null,
  title: '',
  description: '',
  published_at: '',
  imageFile: null as File | null,
  imageUrl: '',
  courseIds: [] as string[],
}

type Props = {
  courses: Course[]
  loadingCourses: boolean
  profileId?: string | null
}

export function GalleryManager({ courses, loadingCourses, profileId }: Props): JSX.Element {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const gallery = await fetchGallery()
        if (isMounted) {
          setItems(gallery)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'No pudimos cargar la galería. Intenta nuevamente más tarde.',
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

  const isEditing = Boolean(form.id)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Ingresa un título para la imagen o álbum.')
      return
    }

    if (!form.imageFile && !form.imageUrl && !isEditing) {
      setError('Debes subir una imagen o proporcionar una URL pública.')
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
      let imageUrl = form.imageUrl

      if (form.imageFile) {
        const { publicUrl } = await uploadPublicFile('gallery', form.imageFile, {
          directory: 'photos',
        })
        imageUrl = publicUrl
      }

      const payload: GalleryPayload = {
        title: form.title,
        description: form.description || null,
        image_url: imageUrl,
        course_ids: form.courseIds.length > 0 ? form.courseIds : null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      }

      if (isEditing && form.id) {
        const updated = await updateGalleryItem(form.id, payload)
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        setStatusMessage('Elemento de galería actualizado correctamente.')
      } else {
        payload.created_by = profileId
        const created = await createGalleryItem(payload)
        setItems((prev) => [created, ...prev])
        setStatusMessage('Elemento de galería publicado correctamente.')
      }

      setForm(INITIAL_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al guardar la galería.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(item: GalleryItem) {
    setForm({
      id: item.id,
      title: item.title,
      description: item.description ?? '',
      published_at: item.published_at ? item.published_at.slice(0, 10) : '',
      imageFile: null,
      imageUrl: item.image_url,
      courseIds: item.course_ids ?? [],
    })
    setStatusMessage(null)
    setError(null)
  }

  async function handleDelete(id: string) {
    try {
      await deleteGalleryItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setStatusMessage('Elemento de galería eliminado correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos eliminar el elemento de galería.')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Editar elemento de galería' : 'Añadir elemento a la galería'}
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={() => setForm(INITIAL_FORM)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
            >
              <XCircle className="h-4 w-4" /> Cancelar edición
            </button>
          )}
        </div>

        {!profileId && (
          <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
            Tu cuenta no tiene un perfil asociado. Solicita al administrador completar tu registro en «profiles» para
            habilitar la gestión de la galería.
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="gallery-title">
            Título
          </label>
          <input
            id="gallery-title"
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Presentación acto 18 de septiembre"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="gallery-description">
            Descripción (opcional)
          </label>
          <textarea
            id="gallery-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Fotos destacadas del acto cívico"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="gallery-file">
              Subir imagen
            </label>
            <input
              id="gallery-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] ?? null }))}
              className="w-full cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="gallery-url">
              URL externa (opcional)
            </label>
            <input
              id="gallery-url"
              type="url"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="gallery-date">
            Fecha de publicación
          </label>
          <input
            id="gallery-date"
            type="date"
            value={form.published_at}
            onChange={(event) => setForm((prev) => ({ ...prev, published_at: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Cursos destinatarios</p>
          {loadingCourses ? (
            <p className="text-sm text-slate-400">Cargando cursos…</p>
          ) : (
            <CourseSelector
              courses={courses}
              selected={new Set(form.courseIds)}
              onChange={(next) => setForm((prev) => ({ ...prev, courseIds: next }))}
            />
          )}
          <p className="text-xs text-slate-400">
            Deja en blanco para mostrarlo a todos los cursos.
          </p>
        </div>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
        {statusMessage && (
          <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{statusMessage}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !profileId}
          className="inline-flex items-center gap-2 rounded-full bg-sky-900 px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <ImagePlus className="h-4 w-4" />
          {submitting ? 'Guardando…' : isEditing ? 'Actualizar galería' : 'Publicar en la galería'}
        </button>
      </form>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Galería ({items.length})</h3>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando elementos…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No hay imágenes en la galería todavía.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="space-y-2">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-40 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  {item.description ? (
                    <p className="text-xs text-slate-500">{item.description}</p>
                  ) : null}
                  <p className="text-xs text-slate-400">
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString('es-CL')
                      : 'Sin fecha definida'}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
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
