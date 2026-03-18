import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './components/layout/Sidebar'
import { StudentHeader } from './components/layout/StudentHeader'
import { TeacherHeader } from './components/layout/TeacherHeader'
import { LoginForm } from './components/auth/LoginForm'
import { useAuth } from './context/AuthContext'
import { ManagementDashboard } from './components/dashboard/ManagementDashboard'
import { NewsFeed } from './components/news/NewsFeed'
import { DocumentViewer } from './components/common/DocumentViewer'
import { CircularsPage } from './components/circulars/CircularsPage'
import { BulletinPage } from './components/bulletin/BulletinPage'
import { CalendarPage } from './components/calendar/CalendarPage'
import { GalleryPage } from './components/gallery/GalleryPage'
import { MenuPage } from './components/menu/MenuPage'
import { ModeloPage } from './components/modelo/ModeloPage'
import { DepartmentsPage } from './components/departments/DepartmentsPage'
import { useDocumentViewer } from './context/DocumentViewerContext'

type PageType = 'news' | 'circulars' | 'gallery' | 'calendar' | 'departments' | 'menu' | 'bulletin' | 'modelo'

export default function App(): JSX.Element {
  const { token, loading, error, role, profile } = useAuth()
  const { isViewerOpen, currentDocument, closeDocument } = useDocumentViewer()
  const [currentPage, setCurrentPage] = useState<PageType>('news')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Función para renderizar el contenido de la página actual
  const renderPageContent = () => {
    switch (currentPage) {
      case 'circulars':
        return <CircularsPage />
      case 'calendar':
        return <CalendarPage />
      case 'gallery':
        return (
          <GalleryPage
            courseFilter={role === 'student' ? profile?.curso ?? null : undefined}
          />
        )
      case 'menu':
        return <MenuPage />
      case 'departments':
        return <DepartmentsPage />
      case 'modelo':
        return <ModeloPage />
      case 'news':
      default:
        return (
          <NewsFeed
            courseFilter={role === 'student' ? profile?.curso ?? null : undefined}
            canManage={role === 'teacher'}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light text-slate-600">
        Cargando intranet…
      </div>
    )
  }

  if (!token || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light px-4 py-8">
        <LoginForm />
      </div>
    )
  }

  // Si el visor de documentos está abierto, mostrar solo eso
  if (isViewerOpen && currentDocument) {
    return (
      <DocumentViewer
        isOpen={isViewerOpen}
        onClose={closeDocument}
        driveUrl={currentDocument.url}
        title={currentDocument.title}
      />
    )
  }

  // Si está en la página del boletín, mostrar en pantalla completa
  if (currentPage === 'bulletin') {
    return <BulletinPage onBack={() => setCurrentPage('news')} />
  }

  return (
    <div className="min-h-screen bg-brand-light text-slate-800">
      {/* Botón hamburguesa para móvil (solo estudiantes) */}
      {role === 'student' && (
        <div className="lg:hidden fixed top-4 left-4 z-30">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="rounded-full bg-white shadow-lg p-3 text-slate-700 hover:bg-slate-50 transition"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      )}

      <div className={`mx-auto flex max-w-7xl flex-col gap-4 sm:gap-6 py-4 sm:py-8 px-4 sm:px-6 ${role === 'student' ? 'lg:flex-row' : ''}`}>
        {/* Sidebar solo para estudiantes */}
        {role === 'student' && (
          <div className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
            <Sidebar 
              currentPage={currentPage} 
              onPageChange={setCurrentPage}
              isMobileOpen={isMobileSidebarOpen}
              onMobileClose={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        )}

        <main className="flex-1 space-y-4 sm:space-y-8">
          {error && (
            <p className="rounded-2xl lg:rounded-3xl bg-rose-50 px-4 sm:px-6 py-3 sm:py-4 text-sm text-rose-700">
              {error}
            </p>
          )}

          {/* Header personalizado para profesores */}
          {role === 'teacher' && (
            <TeacherHeader profile={profile} />
          )}

          {/* Header personalizado para estudiantes */}
          {role === 'student' && (
            <StudentHeader profile={profile} />
          )}

          {/* Panel de gestión para admin y teacher */}
          {(role === 'admin' || role === 'teacher') && <ManagementDashboard />}

          {/* Contenido de la página actual solo para students */}
          {role === 'student' && renderPageContent()}
        </main>
      </div>
    </div>
  )
}
