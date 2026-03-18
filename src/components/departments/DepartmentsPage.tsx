import { useEffect, useState } from 'react'
import { Building2, ImageOff, X } from 'lucide-react'
import { getDepartments, type DepartmentItem } from '../../lib/departments'

export function DepartmentsPage(): JSX.Element {
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDepartments() {
      try {
        const data = await getDepartments()
        setDepartments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No pudimos cargar los departamentos.')
      } finally {
        setLoading(false)
      }
    }

    void loadDepartments()
  }, [])

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <p className="text-sm text-slate-500">Cargando departamentos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-rose-50 p-6 text-rose-700 shadow-card">
        {error}
      </div>
    )
  }

  const selectedDepartment =
    departments.find((department) => department.id === selectedDepartmentId) ?? null

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Departamentos</h1>
            <p className="text-sm text-slate-500">Selecciona un departamento para ver su portada y contenido completo.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {departments.map((department) => (
          <button
            key={department.id}
            type="button"
            onClick={() => setSelectedDepartmentId(department.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedDepartment?.id === department.id
                ? 'border-sky-300 bg-sky-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-slate-900">{department.name}</span>
            </div>
          </button>
        ))}
      </div>

      {selectedDepartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedDepartmentId(null)}
        >
          <article
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{selectedDepartment.name}</h2>
              <button
                type="button"
                onClick={() => setSelectedDepartmentId(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-72px)] overflow-y-auto">
              {selectedDepartment.cover_url ? (
                <img
                  src={selectedDepartment.cover_url}
                  alt={`Portada ${selectedDepartment.name}`}
                  className="h-[260px] w-full object-cover sm:h-[380px] lg:h-[500px]"
                />
              ) : (
                <div className="flex h-[260px] items-center justify-center bg-slate-100 text-slate-400 sm:h-[380px] lg:h-[500px]">
                  <div className="flex flex-col items-center gap-2">
                    <ImageOff className="h-10 w-10" />
                    <p className="text-sm">Este departamento aun no tiene portada.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 p-6 sm:p-8">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 sm:text-lg">
                  {selectedDepartment.description || 'Este departamento aun no tiene descripcion publicada.'}
                </p>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
