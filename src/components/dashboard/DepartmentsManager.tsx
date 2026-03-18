import { useEffect, useState } from 'react'
import { Building2, Save, Upload } from 'lucide-react'
import { getDepartments, saveDepartments, type DepartmentItem } from '../../lib/departments'
import { uploadPublicFile } from '../../lib/storage'

type Props = {
  profileId?: string | null
}

export function DepartmentsManager({ profileId }: Props): JSX.Element {
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getDepartments()
        setDepartments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No pudimos cargar departamentos.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const updateDepartment = (id: string, patch: Partial<DepartmentItem>) => {
    setDepartments((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const handleUpload = async (departmentId: string, file: File | null) => {
    if (!file) {
      return
    }

    setError(null)
    setStatusMessage(null)
    setUploadingId(departmentId)

    try {
      const { publicUrl } = await uploadPublicFile('gallery', file, {
        directory: `departments/${departmentId}`,
      })
      updateDepartment(departmentId, { cover_url: publicUrl })
      setStatusMessage('Portada cargada. Recuerda guardar cambios.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la portada.')
    } finally {
      setUploadingId(null)
    }
  }

  const handleSave = async () => {
    if (!profileId) {
      setError('Tu perfil no esta correctamente asociado.')
      return
    }

    setSaving(true)
    setError(null)
    setStatusMessage(null)

    try {
      await saveDepartments(departments, profileId)
      setStatusMessage('Departamentos actualizados correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la configuracion.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando departamentos...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Departamentos</h3>
          <p className="text-sm text-slate-500">Gestiona portada y texto para cada departamento.</p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {statusMessage && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</p>}

      <div className="space-y-4">
        {departments.map((department) => (
          <article key={department.id} className="rounded-2xl border border-slate-200 p-5">
            <h4 className="mb-4 text-base font-semibold text-slate-900">{department.name}</h4>

            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div className="space-y-3">
                <div className="h-32 overflow-hidden rounded-xl bg-slate-100">
                  {department.cover_url ? (
                    <img
                      src={department.cover_url}
                      alt={`Portada ${department.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Sin portada
                    </div>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-500">Cambiar portada</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => void handleUpload(department.id, event.target.files?.[0] ?? null)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </label>

                {uploadingId === department.id && (
                  <p className="text-xs text-sky-700">Subiendo portada...</p>
                )}
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">Texto descriptivo</span>
                <textarea
                  value={department.description ?? ''}
                  onChange={(event) => updateDepartment(department.id, { description: event.target.value })}
                  rows={5}
                  placeholder="Escribe aqui el texto que se mostrara debajo de la portada"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </label>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving || !profileId}
        className="inline-flex items-center gap-2 rounded-full bg-sky-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {uploadingId ? <Upload className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}
