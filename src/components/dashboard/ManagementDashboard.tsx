import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import type { Course } from '../../types'
import { fetchCourses } from '../../lib/courses'
import { NewsManager } from './NewsManager'
import { CircularManager } from './CircularManager'
import { GalleryManager } from './GalleryManager'
import { UserManager } from './UserManager'

const TABS = [
  { id: 'news', label: 'Noticias' },
  { id: 'circulars', label: 'Circulares' },
  { id: 'gallery', label: 'Galería' },
  { id: 'users', label: 'Usuarios' },
] as const

type TabId = (typeof TABS)[number]['id']

export function ManagementDashboard(): JSX.Element {
  const { profile, signOut, role } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('news')
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCourses() {
      try {
        const data = await fetchCourses()
        if (isMounted) {
          setCourses(data)
        }
      } catch (err) {
        if (isMounted) {
          setCoursesError(
            err instanceof Error
              ? err.message
              : 'No pudimos cargar el listado de cursos. Intenta nuevamente más tarde.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourses(false)
        }
      }
    }

    void loadCourses()

    return () => {
      isMounted = false
    }
  }, [])

  const welcomeMessage = useMemo(() => {
    const name = profile?.full_name ?? profile?.email ?? 'Usuario'
    if (role === 'admin') {
      return `Bienvenida/o ${name}. Tienes permisos completos de administración.`
    }
    if (role === 'teacher') {
      return `Bienvenida/o ${name}. Puedes gestionar noticias, circulares y galerías de tu curso.`
    }
    return `Hola ${name}. Puedes informarte con las últimas novedades.`
  }, [profile, role])

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">Gestión de contenidos</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Panel institucional</h2>
          <p className="mt-2 text-sm text-slate-500">{welcomeMessage}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void signOut()
          }}
          className="self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Cerrar sesión
        </button>
      </header>

      {(role === 'admin' || role === 'teacher') && (
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <nav className="mb-6 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-sky-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {coursesError && (
            <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">{coursesError}</p>
          )}

          {activeTab === 'news' && (
            <NewsManager
              courses={courses}
              loadingCourses={isLoadingCourses}
              profileId={profile?.id}
            />
          )}
          {activeTab === 'circulars' && (
            <CircularManager
              courses={courses}
              loadingCourses={isLoadingCourses}
              profileId={profile?.id}
            />
          )}
          {activeTab === 'gallery' && (
            <GalleryManager
              courses={courses}
              loadingCourses={isLoadingCourses}
              profileId={profile?.id}
            />
          )}
          {activeTab === 'users' && (
            <UserManager
              profileId={profile?.id}
              courses={courses}
              loadingCourses={isLoadingCourses}
            />
          )}
        </div>
      )}
    </section>
  )
}
