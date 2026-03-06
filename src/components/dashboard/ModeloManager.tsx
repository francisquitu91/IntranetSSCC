import { useEffect, useState, type FormEvent } from 'react'
import { ImagePlus, Users, X, Plus } from 'lucide-react'
import { getModeloIslandes, uploadModeloPhoto, type ModeloIslandes } from '../../lib/modeloIslandes'

type Props = {
  profileId?: string | null
}

export function ModeloManager({ profileId }: Props): JSX.Element {
  const [modelo, setModelo] = useState<ModeloIslandes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Estados del formulario
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [newMember, setNewMember] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getModeloIslandes()
        setModelo(data)
        if (data?.team_members) {
          setTeamMembers(data.team_members)
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No pudimos cargar la configuración. Intenta nuevamente.'
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const handleAddMember = () => {
    if (newMember.trim()) {
      setTeamMembers((prev) => [...prev, newMember.trim()])
      setNewMember('')
    }
  }

  const handleRemoveMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!modelo?.id) {
      setError('No se encontró la configuración del Modelo Islandés')
      return
    }

    if (!photoFile && !modelo.main_photo_url) {
      setError('Debes subir una foto del grupo directivo')
      return
    }

    if (!profileId) {
      setError('Tu perfil no está correctamente asociado.')
      return
    }

    setSubmitting(true)
    setError(null)
    setStatusMessage(null)

    try {
      if (photoFile) {
        await uploadModeloPhoto(modelo.id, photoFile, teamMembers, profileId)
        setStatusMessage('Modelo Islandés actualizado correctamente')
        
        // Recargar datos
        const updated = await getModeloIslandes()
        setModelo(updated)
        setPhotoFile(null)
      } else {
        // Solo actualizar los miembros del equipo
        const { updateModeloIslandes } = await import('../../lib/modeloIslandes')
        await updateModeloIslandes(modelo.id, modelo.main_photo_url, teamMembers, profileId)
        setStatusMessage('Equipo actualizado correctamente')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el Modelo Islandés')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Cargando configuración...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white">
          <Users className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Modelo Islandés</h2>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {statusMessage && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto del Grupo Directivo */}
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Foto del Grupo Directivo
          </h3>

          {modelo?.main_photo_url && !photoFile && (
            <div className="mb-4 rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-xs text-slate-500 mb-2">Foto actual:</p>
              <img
                src={modelo.main_photo_url}
                alt="Grupo directivo actual"
                className="h-40 w-auto object-cover rounded-lg"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="photo-file">
              {modelo?.main_photo_url ? 'Cambiar foto' : 'Subir foto'}
            </label>
            <input
              id="photo-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-blue/90"
            />
          </div>
        </div>

        {/* Equipo / Encargados */}
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Equipo / Encargados
          </h3>

          {/* Lista de miembros */}
          <div className="mb-4 space-y-2">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm text-slate-700">{member}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(index)}
                  className="text-rose-600 hover:text-rose-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {teamMembers.length === 0 && (
              <p className="text-sm text-slate-400 italic">
                No hay miembros agregados aún
              </p>
            )}
          </div>

          {/* Agregar nuevo miembro */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddMember()
                }
              }}
              placeholder="Nombre del encargado"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <button
              type="button"
              onClick={handleAddMember}
              className="flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Botón de guardar */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-blue px-6 py-3 font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  )
}
