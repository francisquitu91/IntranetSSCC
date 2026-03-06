import { Menu, Cloud, Printer, Building, Newspaper, Image, FileText, Users, Calendar, ForkKnife, LogOut, X } from 'lucide-react'
import { useState, useEffect, type JSX } from 'react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useDocumentViewer } from '../../context/DocumentViewerContext'

type PageType = 'news' | 'circulars' | 'gallery' | 'calendar' | 'departments' | 'menu' | 'bulletin' | 'modelo'

type SidebarProps = {
  currentPage: PageType
  onPageChange: (page: PageType) => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

const MENU_ITEMS = [
  { label: 'Descarga de circulares', icon: <Cloud className="h-5 w-5" />, page: 'circulars' as PageType },
  { label: 'Anuario SSCC', icon: <Printer className="h-5 w-5" />, page: 'bulletin' as PageType },
  { label: 'Departamentos', icon: <Building className="h-5 w-5" />, page: 'departments' as PageType },
  { label: 'Últimas noticias', icon: <Newspaper className="h-5 w-5" />, page: 'news' as PageType },
  { label: 'Galería fotos/videos', icon: <Image className="h-5 w-5" />, page: 'gallery' as PageType },
  { label: 'Reglamento estudiante', icon: <FileText className="h-5 w-5" />, page: null },
  { label: 'Modelo Islandés', icon: <Users className="h-5 w-5" />, page: 'modelo' as PageType },
  { label: 'Calendario Académico por ciclo', icon: <Calendar className="h-5 w-5" />, page: 'calendar' as PageType },
  { label: 'Menú casino', icon: <ForkKnife className="h-5 w-5" />, page: 'menu' as PageType },
]

export function Sidebar({ currentPage, onPageChange, isMobileOpen = false, onMobileClose }: SidebarProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const { signOut } = useAuth()
  const { openDocument } = useDocumentViewer()

  // Prevenir scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  // Manejar clicks en elementos del menú
  const handleMenuClick = (item: typeof MENU_ITEMS[0]) => {
    if (item.label === 'Reglamento estudiante') {
      openDocument(
        'https://drive.google.com/file/d/1ykHcLBgMiPX2ScHWS2jCHni4F2DAE26F/view?usp=sharing',
        'Reglamento Estudiantil - SSCC Manquehue'
      )
    } else if (item.page) {
      onPageChange(item.page)
    } else {
      console.log(`Clicked on: ${item.label}`)
    }
    // Cerrar el menú móvil después de seleccionar una opción
    onMobileClose?.()
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col bg-white shadow-card transition-all duration-300",
          // Estilos para móvil
          "fixed top-0 left-0 h-full z-50 lg:relative lg:z-auto",
          "transform lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Estilos para desktop
          "lg:rounded-3xl lg:max-h-[calc(100vh-4rem)]",
          collapsed ? 'w-64 lg:w-20 p-6 lg:px-4 lg:py-6' : 'w-64 p-6'
        )}
      >
      <div className="mb-10 flex items-center">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

  <nav className="space-y-2 flex-1 overflow-y-auto">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleMenuClick(item)}
            className={clsx(
              'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition',
              'hover:bg-slate-100 hover:text-slate-900',
              (item.page === currentPage || (item.label === 'Últimas noticias' && currentPage === 'news')) && 'bg-sky-50 text-sky-900',
            )}
          >
            {item.icon}
            {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      
      {/* Botón Cerrar Sesión */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            signOut()
            onMobileClose?.()
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-5 w-5" />
          {(!collapsed || isMobileOpen) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
    </>
  )
}
