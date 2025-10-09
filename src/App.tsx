import { useEffect, useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { StudentHeader } from './components/layout/StudentHeader'
import { LoginForm } from './components/auth/LoginForm'
import { useAuth } from './context/AuthContext'
import { ManagementDashboard } from './components/dashboard/ManagementDashboard'
import { NewsFeed } from './components/news/NewsFeed'
import { DocumentViewer } from './components/common/DocumentViewer'
import { CircularsPage } from './components/circulars/CircularsPage'
import { BulletinPage } from './components/bulletin/BulletinPage'
import { useDocumentViewer } from './context/DocumentViewerContext'
import { fetchCourses } from './lib/courses'
import type { Course } from './types'

type PageType = 'news' | 'circulars' | 'gallery' | 'calendar' | 'departments' | 'menu' | 'bulletin' | 'modelo'

export default function App(): JSX.Element {
  const { token, loading, error, role, profile } = useAuth()
  const { isViewerOpen, currentDocument, closeDocument } = useDocumentViewer()
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<PageType>('news')

  // Cargar cursos cuando el usuario esté autenticado
  useEffect(() => {
    if (!token || !profile) return

    async function loadCourses() {
      try {
        const data = await fetchCourses()
        setCourses(data)
      } catch (err) {
        console.error('Error loading courses:', err)
      } finally {
        setCoursesLoading(false)
      }
    }

    void loadCourses()
  }, [token, profile])

  // Función para renderizar el contenido de la página actual
  const renderPageContent = () => {
    switch (currentPage) {
      case 'circulars':
        return <CircularsPage />
      case 'news':
      default:
        return (
          <NewsFeed
            courseFilter={role === 'student' ? profile?.course_ids ?? null : undefined}
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
      <div className={`mx-auto flex max-w-7xl flex-col gap-6 py-8 px-6 ${role !== 'admin' ? 'lg:flex-row' : ''}`}>
        {/* Solo mostrar sidebar si NO es admin */}
        {role !== 'admin' && (
          <div className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
            <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
          </div>
        )}

        <main className="flex-1 space-y-8">
          {error && (
            <p className="rounded-3xl bg-rose-50 px-6 py-4 text-sm text-rose-700">
              {error}
            </p>
          )}

          {/* Header personalizado para estudiantes */}
          {role === 'student' && !coursesLoading && (
            <StudentHeader profile={profile} courses={courses} />
          )}

          {/* Solo mostrar ManagementDashboard si es admin o teacher */}
          {(role === 'admin' || role === 'teacher') && <ManagementDashboard />}

          {/* Contenido de la página actual para usuarios no admin */}
          {role !== 'admin' && renderPageContent()}
        </main>
      </div>
    </div>
  )
}
