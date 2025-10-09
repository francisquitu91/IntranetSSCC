import { useEffect, useState, type FormEvent } from 'react'
import { CloudUpload, Download, Trash2, Pencil, XCircle } from 'lucide-react'
import type { Circular, Course } from '../../types'
import {
  createCircular,
  deleteCircular,
  fetchCirculars,
  updateCircular,
  type CircularPayload,
} from '../../lib/circulars'
import { uploadPublicFile } from '../../lib/storage'
import { CourseSelector } from './CourseSelector'

const INITIAL_FORM = {
  id: null as string | null,
  title: '',
  description: '',
  published_at: '',
  courseIds: [] as string[],
  file: null as File | null,
  fileUrl: '',
  fileName: '',
}

type Props = {
  courses: Course[]
  loadingCourses: boolean
  profileId?: string | null
}

export function CircularManager({ courses, loadingCourses, profileId }: Props): JSX.Element {
  const [items, setItems] = useState<Circular[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const circulars = await fetchCirculars()
        if (isMounted) {
          setItems(circulars)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'No pudimos cargar las circulares. Intenta nuevamente más tarde.',
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
      setError('Ingresa un título para la circular.')
      return
    }

    if (!form.file && !form.fileUrl && !isEditing) {
      setError('Debe adjuntar un archivo PDF, Word o imagen para la circular.')
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
      let fileUrl = form.fileUrl
      let fileName = form.fileName

      if (form.file) {
        const { publicUrl, path } = await uploadPublicFile('circulars', form.file, {
          directory: 'documents',
        })
        fileUrl = publicUrl
        fileName = form.file.name
        // Guardamos la ruta interna como referencia adicional en la descripción si se requiere
        if (!fileName) {
          fileName = path.split('/').pop() ?? 'documento.pdf'
        }
      }

      const payload: CircularPayload = {
        title: form.title,
        description: form.description || null,
        file_url: fileUrl,
        file_name: fileName || null,
        course_ids: form.courseIds.length > 0 ? form.courseIds : null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      }

      if (isEditing && form.id) {
        const updated = await updateCircular(form.id, payload)
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        setStatusMessage('Circular actualizada correctamente.')
      } else {
        payload.created_by = profileId
        const created = await createCircular(payload)
        setItems((prev) => [created, ...prev])
        setStatusMessage('Circular publicada correctamente.')
      }

      setForm(INITIAL_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al guardar la circular.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(item: Circular) {
    setForm({
      id: item.id,
      title: item.title,
      description: item.description ?? '',
      published_at: item.published_at ? item.published_at.slice(0, 10) : '',
      courseIds: item.course_ids ?? [],
      file: null,
      fileUrl: item.file_url,
      fileName: item.file_name ?? '',
    })
    setStatusMessage(null)
    setError(null)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Seguro que deseas eliminar esta circular?')) {
      return
    }

    try {
      await deleteCircular(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setStatusMessage('Circular eliminada correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos eliminar la circular.')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Editar circular' : 'Subir nueva circular'}
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
            Tu cuenta no tiene un perfil asociado. Solicita al administrador que complete tu registro en «profiles» para
            habilitar la gestión de circulares.
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="circular-title">
            Título
          </label>
          <input
            id="circular-title"
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Circular de apoderados curso 3°A"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600" htmlFor="circular-description">
            Descripción breve (opcional)
          </label>
          <textarea
            id="circular-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Información extra para apoderados"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="circular-file">
              Archivo de la circular
            </label>
            <input
              id="circular-file"
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
              onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] ?? null }))}
              className="w-full cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            <p className="text-xs text-slate-400">
              Se almacenará en el bucket público «circulars». Peso máx. 10 MB.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="circular-date">
              Fecha de publicación
            </label>
            <input
              id="circular-date"
              type="date"
              value={form.published_at}
              onChange={(event) => setForm((prev) => ({ ...prev, published_at: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
              selected={new Set(form.courseIds)}
              onChange={(next) => setForm((prev) => ({ ...prev, courseIds: next }))}
            />
          )}
          <p className="text-xs text-slate-400">
            Si no seleccionas ningún curso, la circular estará visible para todos los usuarios.
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
          <CloudUpload className="h-4 w-4" />
          {submitting ? 'Guardando…' : isEditing ? 'Actualizar circular' : 'Publicar circular'}
        </button>
      </form>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Circulares publicadas ({items.length})</h3>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando circulares…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No hay circulares disponibles.</p>
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
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString('es-CL')
                      : 'Sin fecha definida'}
                  </p>
                  {item.course_ids && item.course_ids.length > 0 ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Dirigida a {item.course_ids.length} curso(s)
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:text-sky-900"
                  >
                    <Download className="h-3.5 w-3.5" /> Descargar
                  </a>
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
