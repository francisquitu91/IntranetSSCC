import type { Course } from '../../types'

type Props = {
  courses: Course[]
  selected: Set<string>
  onChange: (next: string[]) => void
  allowAllOption?: boolean
}

export function CourseSelector({ courses, selected, onChange, allowAllOption = true }: Props): JSX.Element {
  function toggle(courseId: string) {
    const next = new Set(selected)
    if (next.has(courseId)) {
      next.delete(courseId)
    } else {
      next.add(courseId)
    }
    onChange(Array.from(next))
  }

  function handleSelectAll() {
    if (selected.size === 0) {
      onChange(courses.map((course) => course.id))
    } else {
      onChange([])
    }
  }

  return (
    <div className="space-y-2">
      {allowAllOption && (
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          {selected.size === 0 ? 'Asignar a todos los cursos' : 'Limpiar selección'}
        </button>
      )}

      <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
        {courses.map((course) => (
          <label key={course.id} className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={selected.has(course.id)}
              onChange={() => toggle(course.id)}
              className="h-4 w-4 rounded border-slate-300 text-sky-900 focus:ring-sky-500"
            />
            <span>
              {course.name}
              {course.grade_level ? <span className="ml-1 text-xs text-slate-400">({course.grade_level})</span> : null}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
