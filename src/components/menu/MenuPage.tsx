import { useEffect, useState } from 'react'
import { UtensilsCrossed, AlertCircle } from 'lucide-react'
import { getSystemSetting } from '../../lib/systemSettings'

export function MenuPage(): JSX.Element {
  const [menuUrl, setMenuUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMenu() {
      try {
        const url = await getSystemSetting('menu_casino_url')
        setMenuUrl(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el menú')
      } finally {
        setLoading(false)
      }
    }

    void loadMenu()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-600">Cargando menú del casino...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl sm:rounded-3xl bg-rose-50 p-4 sm:p-8 text-center max-w-md mx-4">
          <AlertCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-rose-500 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-rose-900 mb-2">Error al cargar</h3>
          <p className="text-xs sm:text-sm text-rose-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!menuUrl) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl sm:rounded-3xl bg-amber-50 p-4 sm:p-8 text-center max-w-md mx-4">
          <UtensilsCrossed className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-amber-500 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-amber-900 mb-2">Menú no disponible</h3>
          <p className="text-xs sm:text-sm text-amber-700">
            El menú del casino aún no ha sido publicado. Por favor revisa más tarde.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-4 sm:mb-6 flex items-center gap-3">
          <div className="rounded-full bg-emerald-100 p-2 sm:p-3">
            <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Menú del Casino</h2>
            <p className="text-xs sm:text-sm text-slate-600">Revisa el menú semanal del casino escolar</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
          <img
            src={menuUrl}
            alt="Menú del Casino"
            className="w-full h-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              setError('No se pudo cargar la imagen del menú')
            }}
          />
        </div>

        <div className="mt-4 rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Nota:</strong> El menú puede estar sujeto a cambios. Para consultas específicas sobre alergias o 
            restricciones alimentarias, por favor contacta directamente con el casino.
          </p>
        </div>
      </div>
    </div>
  )
}
