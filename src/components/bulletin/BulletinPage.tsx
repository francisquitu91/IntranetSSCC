import { X } from 'lucide-react'
import { useEffect, type JSX } from 'react'

type BulletinPageProps = {
  onBack: () => void
}

export function BulletinPage({ onBack }: BulletinPageProps): JSX.Element {
  // Manejar tecla ESC para cerrar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onBack])
  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header con botón cerrar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Anuario SSCC
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
          aria-label="Cerrar anuario"
        >
          <X className="w-5 h-5 text-red-600" />
        </button>
      </div>

      {/* Iframe del boletín - pantalla completa */}
      <div className="w-full h-[calc(100vh-80px)]">
        <iframe
          src="https://heyzine.com/flip-book/8275784256.html#page/1"
          className="w-full h-full border-0"
          title="Anuario SSCC"
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