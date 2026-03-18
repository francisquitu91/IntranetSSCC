import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { NewsManager } from './NewsManager'
import { CircularManager } from './CircularManager'
import { GalleryManager } from './GalleryManager'
import { ModeloManager } from './ModeloManager'
import { UserManager } from './UserManager'
import { SystemSettingsManager } from './SystemSettingsManager'
import { NominaUploader } from './NominaUploader'
import { DepartmentsManager } from './DepartmentsManager'

const TABS = [
  { id: 'news', label: 'Noticias' },
  { id: 'circulars', label: 'Circulares' },
  { id: 'gallery', label: 'Galería' },
  { id: 'departments', label: 'Departamentos' },
  { id: 'modelo', label: 'Modelo Islandés' },
  { id: 'users', label: 'Usuarios' },
  { id: 'nominas', label: 'Nóminas' },
  { id: 'settings', label: 'Configuración' },
] as const

const TEACHER_TABS = [
  { id: 'news', label: 'Noticias' },
  { id: 'gallery', label: 'Galería' },
] as const

type TabId = (typeof TABS)[number]['id']

export function ManagementDashboard(): JSX.Element {
  const { profile, signOut, role } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('news')

  const welcomeMessage = useMemo(() => {
    const name = profile?.full_name ?? profile?.email ?? 'Usuario'
    if (role === 'admin') {
      return `Bienvenida/o ${name}. Tienes permisos completos de administración.`
    }
    if (role === 'teacher') {
      return `Bienvenida/o ${name}. Puedes gestionar noticias y galerías de fotos/videos.`
    }
    return `Hola ${name}. Puedes informarte con las últimas novedades.`
  }, [profile, role])

  const availableTabs = useMemo(() => {
    return role === 'teacher' ? TEACHER_TABS : TABS
  }, [role])

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
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? role === 'teacher' 
                      ? 'bg-amber-700 text-white'
                      : 'bg-sky-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'news' && (
            <NewsManager
              profileId={profile?.id}
            />
          )}
          {activeTab === 'circulars' && role === 'admin' && (
            <CircularManager
              profileId={profile?.id}
            />
          )}
          {activeTab === 'gallery' && (
            <GalleryManager
              profileId={profile?.id}
            />
          )}
          {activeTab === 'departments' && role === 'admin' && (
            <DepartmentsManager profileId={profile?.id} />
          )}
          {activeTab === 'modelo' && role === 'admin' && (
            <ModeloManager profileId={profile?.id} />
          )}
          {activeTab === 'users' && role === 'admin' && (
            <UserManager
              profileId={profile?.id}
            />
          )}
          {activeTab === 'nominas' && role === 'admin' && (
            <NominaUploader />
          )}
          {activeTab === 'settings' && role === 'admin' && (
            <SystemSettingsManager profileId={profile?.id} />
          )}
        </div>
      )}
    </section>
  )
}
