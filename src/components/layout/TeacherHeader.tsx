import type { Profile } from '../../types'
import { BookOpen } from 'lucide-react'

type Props = {
  profile: Profile
}

export function TeacherHeader({ profile }: Props): JSX.Element {

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl shadow-sm p-6 border border-amber-100">
      <div className="flex items-center gap-4">
        {/* Icono de profesor */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center border-2 border-amber-300">
            <BookOpen className="w-8 h-8 text-amber-700" />
          </div>
        </div>
        
        {/* Información del profesor */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">
            {profile.full_name || profile.email}
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-700 mt-1">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-200 text-amber-900">
              Profesor
            </span>
            {profile.cargo && (
              <span className="text-slate-600">
                • {profile.cargo}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
