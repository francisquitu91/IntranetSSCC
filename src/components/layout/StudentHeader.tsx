import { useEffect, useState } from 'react'
import type { Profile } from '../../types'
import { getSystemSetting } from '../../lib/systemSettings'

type Props = {
  profile: Profile
}

export function StudentHeader({ profile }: Props): JSX.Element {
  const [logoUrl, setLogoUrl] = useState<string>('https://ssccmanquehue.cl/wp-content/uploads/2025/03/70SSCC_OK_transparente-4-1-1-1.png')

  useEffect(() => {
    async function loadLogo() {
      const url = await getSystemSetting('logo_url')
      if (url) setLogoUrl(url)
    }
    void loadLogo()
  }, [])

  return (
    <div className="bg-white rounded-2xl lg:rounded-3xl shadow-card p-3 sm:p-4 mb-4 lg:mb-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Insignia circular del colegio */}
        <div className="flex-shrink-0">
          <img
            src={logoUrl}
            alt="Insignia Colegio SSCC"
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-contain bg-white border-2 border-gray-100 p-1"
          />
        </div>
        
        {/* Información del estudiante */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">
            {profile.full_name || profile.email}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
              Alumno
            </span>
            {profile.curso && (
              <span className="text-gray-500 text-xs sm:text-sm truncate">
                • {profile.curso}
              </span>
            )}
          </div>
          {!profile.curso && (
            <div className="text-xs sm:text-sm text-amber-600 mt-1">
              ⚠️ Sin curso asignado
            </div>
          )}
        </div>
      </div>
    </div>
  )
}