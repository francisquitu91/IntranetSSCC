import { Download, Search, Instagram } from 'lucide-react'
import { useState, type JSX } from 'react'
import { useAuth } from '../../context/AuthContext'

type Circular = {
  id: string
  title: string
  driveUrl: string
  year: number
}

// Datos de las circulares para 2025
const CIRCULARS_2025: Circular[] = [
  {
    id: '1',
    title: 'Circular N° 153 – Encuentro con Cristo KB',
    driveUrl: 'https://drive.google.com/file/d/18WlaDMzBxrr8RsTs_cHGgTYaN1yBstPJ/view?usp=drive_link',
    year: 2025
  },
  {
    id: '2',
    title: 'Circular N° 154 – Visita Planta Carozzi',
    driveUrl: 'https://drive.google.com/file/d/1QEpoG4TuOzjPbNo4cZACcZvgByjafkKu/view?usp=drive_link',
    year: 2025
  },
  {
    id: '3',
    title: 'Circular N° 155 – Visita Tottus 3° básicos',
    driveUrl: 'https://drive.google.com/file/d/1FT_YNYe41LoQuJe44zrhZJ1vJRBSEjg-/view?usp=drive_link',
    year: 2025
  }
]

// Solo mostrar circulares de 2025
const CURRENT_YEAR = 2025

// Función para convertir URL de Google Drive a enlace de descarga
const getDownloadUrl = (driveUrl: string): string => {
  const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`
  }
  return driveUrl
}

export function CircularsPage(): JSX.Element {
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  const handleDownload = (circular: Circular) => {
    const downloadUrl = getDownloadUrl(circular.driveUrl)
    window.open(downloadUrl, '_blank')
  }

  // Filtrar circulares según búsqueda
  const filteredCirculars = CIRCULARS_2025.filter(circular => 
    circular.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    circular.year.toString().includes(searchTerm)
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F6FAFF' }}>
      {/* Header principal con estilo institucional */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Título principal */}
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-bold" style={{ color: '#012A5A' }}>
                Descarga de circulares
              </h1>
            </div>

            {/* Iconos */}
            <div className="flex items-center gap-6">
              <Search className="w-6 h-6" style={{ color: '#012A5A' }} />
              <Instagram className="w-6 h-6" style={{ color: '#012A5A' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar circulares..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Título de la sección */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <h2 
          className="text-3xl font-bold text-center"
          style={{ color: '#012A5A' }}
        >
          Circular {CURRENT_YEAR}
        </h2>
      </div>

      {/* Lista de circulares individuales */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCirculars.map((circular) => (
            <div
              key={circular.id}
              className="bg-white rounded-[20px] p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                boxShadow: '0px 2px 12px rgba(0,0,0,0.08)'
              }}
            >
              {/* Título de la circular */}
              <h3 
                className="text-lg font-bold mb-4 leading-tight"
                style={{ color: '#012A5A' }}
              >
                {circular.title}
              </h3>

              {/* Botón de descarga */}
              <button
                onClick={() => handleDownload(circular)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-md hover:brightness-110"
                style={{
                  backgroundColor: '#D9F0FF',
                  color: '#012A5A'
                }}
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay resultados */}
        {filteredCirculars.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No se encontraron circulares que coincidan con tu búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}