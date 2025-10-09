import { X } from 'lucide-react'
import { useEffect } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  driveUrl: string
  title: string
}

export function DocumentViewer({ isOpen, onClose, driveUrl, title }: Props) {
  // Convertir URL de Google Drive para mostrar en iframe
  const getEmbedUrl = (url: string) => {
    // Extraer el ID del archivo de la URL de Google Drive
    const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)\//)
    if (match) {
      const fileId = match[1]
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
    return url
  }

  // Manejar tecla Escape para cerrar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header con título y botón cerrar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
          aria-label="Cerrar documento"
        >
          <X className="w-5 h-5 text-red-600" />
        </button>
      </div>

      {/* Iframe del documento - pantalla completa */}
      <div className="w-full h-[calc(100vh-80px)]">
        <iframe
          src={getEmbedUrl(driveUrl)}
          className="w-full h-full border-0"
          title={title}
          loading="lazy"
          allow="autoplay"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>

      {/* Instrucciones para el usuario */}
      <div className="absolute top-20 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
        <p>Presiona <kbd className="bg-blue-800 px-2 py-1 rounded text-xs font-mono">ESC</kbd> para volver</p>
      </div>
    </div>
  )
}