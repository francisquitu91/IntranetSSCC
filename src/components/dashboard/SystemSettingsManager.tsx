import { useEffect, useState, type FormEvent } from 'react'
import { ImagePlus, Upload } from 'lucide-react'
import { getAllSystemSettings, updateSystemSetting, type SystemSetting } from '../../lib/systemSettings'
import { uploadPublicFile } from '../../lib/storage'

type Props = {
  profileId?: string | null
}

export function SystemSettingsManager({ profileId }: Props): JSX.Element {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Estados para los formularios
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [menuFile, setMenuFile] = useState<File | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllSystemSettings()
        setSettings(data)
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

  const getSetting = (key: string): SystemSetting | undefined => {
    return settings.find(s => s.key === key)
  }

  async function handleLogoUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!logoFile) {
      setError('Selecciona un archivo de logo')
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
      const { publicUrl } = await uploadPublicFile('gallery', logoFile, {
        directory: 'system',
      })

      await updateSystemSetting('logo_url', publicUrl, profileId)

      setSettings(prev =>
        prev.map(s => (s.key === 'logo_url' ? { ...s, value: publicUrl } : s))
      )

      setStatusMessage('Logo actualizado correctamente')
      setLogoFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el logo')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMenuUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!menuFile) {
      setError('Selecciona una imagen del menú')
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
      const { publicUrl } = await uploadPublicFile('gallery', menuFile, {
        directory: 'system',
      })

      await updateSystemSetting('menu_casino_url', publicUrl, profileId)

      setSettings(prev =>
        prev.map(s => (s.key === 'menu_casino_url' ? { ...s, value: publicUrl } : s))
      )

      setStatusMessage('Menú del casino actualizado correctamente')
      setMenuFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el menú')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Cargando configuración...</p>
  }

  const logoSetting = getSetting('logo_url')
  const menuSetting = getSetting('menu_casino_url')

  return (
    <div className="space-y-6">
      {/* Logo del Colegio */}
      <div className="rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Logo del Colegio</h3>

        {logoSetting?.value && (
          <div className="mb-4 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-xs text-slate-500 mb-2">Logo actual:</p>
            <img
              src={logoSetting.value}
              alt="Logo actual"
              className="h-20 w-auto object-contain"
            />
          </div>
        )}

        <form onSubmit={handleLogoUpload} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="logo-file">
              Cargar nuevo logo
            </label>
            <input
              id="logo-file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            <p className="text-xs text-slate-400">
              Formatos: PNG, JPG, WebP, SVG. Recomendado: fondo transparente
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !logoFile || !profileId}
            className="inline-flex items-center gap-2 rounded-full bg-sky-900 px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Upload className="h-4 w-4" />
            {submitting ? 'Subiendo...' : 'Actualizar logo'}
          </button>
        </form>
      </div>

      {/* Menú del Casino */}
      <div className="rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Menú del Casino</h3>

        {menuSetting?.value && (
          <div className="mb-4 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-xs text-slate-500 mb-2">Menú actual:</p>
            <img
              src={menuSetting.value}
              alt="Menú actual"
              className="max-w-full h-auto max-h-60 object-contain"
            />
          </div>
        )}

        <form onSubmit={handleMenuUpload} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="menu-file">
              Cargar nuevo menú
            </label>
            <input
              id="menu-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setMenuFile(e.target.files?.[0] ?? null)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            <p className="text-xs text-slate-400">
              Sube una imagen del menú semanal del casino
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !menuFile || !profileId}
            className="inline-flex items-center gap-2 rounded-full bg-sky-900 px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <ImagePlus className="h-4 w-4" />
            {submitting ? 'Subiendo...' : 'Actualizar menú'}
          </button>
        </form>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
      {statusMessage && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{statusMessage}</p>
      )}
    </div>
  )
}
