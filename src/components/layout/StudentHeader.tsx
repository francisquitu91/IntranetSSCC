import type { Profile, Course } from '../../types'

type Props = {
  profile: Profile
  courses: Course[]
}

export function StudentHeader({ profile, courses }: Props): JSX.Element {
  // Obtener los nombres de los cursos del estudiante
  const studentCourses = courses.filter(course => 
    profile.course_ids?.includes(course.id)
  )

  const courseNames = studentCourses.map(course => 
    `${course.name}${course.grade_level ? ` (${course.grade_level})` : ''}`
  ).join(', ')

  return (
    <div className="bg-white rounded-3xl shadow-card p-4 mb-6">
      <div className="flex items-center gap-4">
        {/* Insignia circular del colegio */}
        <div className="flex-shrink-0">
          <img
            src="https://ssccmanquehue.cl/wp-content/uploads/2025/03/70SSCC_OK_transparente-4-1-1-1.png"
            alt="Insignia Colegio SSCC"
            className="w-16 h-16 rounded-full object-contain bg-white border-2 border-gray-100 p-1"
          />
        </div>
        
        {/* Información del estudiante */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">
            {profile.full_name || profile.email}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Alumno{studentCourses.length > 1 ? 's' : ''}
            </span>
            {courseNames && (
              <span className="text-gray-500">
                • {courseNames}
              </span>
            )}
          </div>
          {!courseNames && (
            <div className="text-sm text-amber-600 mt-1">
              ⚠️ Sin cursos asignados - Contacta a tu administrador
            </div>
          )}
        </div>
      </div>
    </div>
  )
}