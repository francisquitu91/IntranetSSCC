import { Download, Search, Instagram, Calendar, FileText } from 'lucide-react'
import { useState, useEffect, type JSX } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchCirculars } from '../../lib/circulars'
import type { Circular as DatabaseCircular } from '../../types'

type StaticCircular = {
  id: string
  title: string
  driveUrl: string
  year: number
}

// Datos de las circulares para 2025
const CIRCULARS_2025: StaticCircular[] = [
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

// Función para obtener URL de visualización de Google Drive
const getViewUrl = (driveUrl: string): string => {
  const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`
  }
  return driveUrl
}

export function CircularsPage(): JSX.Element {
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [databaseCirculars, setDatabaseCirculars] = useState<DatabaseCircular[]>([])
  const [loadingDatabase, setLoadingDatabase] = useState(true)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedCircular, setSelectedCircular] = useState<StaticCircular | null>(null)

  // Cargar circulares de la base de datos
  useEffect(() => {
    const loadDatabaseCirculars = async () => {
      try {
        const data = await fetchCirculars()
        setDatabaseCirculars(data)
      } catch (error) {
        console.error('Error loading circulars:', error)
        setDatabaseCirculars([])
      } finally {
        setLoadingDatabase(false)
      }
    }

    loadDatabaseCirculars()
  }, [])

  const handleDownload = (circular: StaticCircular) => {
    setSelectedCircular(circular)
    setViewModalOpen(true)
  }

  const handleActualDownload = (circular: StaticCircular) => {
    const downloadUrl = getDownloadUrl(circular.driveUrl)
    window.open(downloadUrl, '_blank')
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setSelectedCircular(null)
  }

  const handleDatabaseDownload = (circular: DatabaseCircular) => {
    window.open(circular.file_url, '_blank')
  }

  // Filtrar circulares según búsqueda
  const filteredStaticCirculars = CIRCULARS_2025.filter(circular => 
    circular.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    circular.year.toString().includes(searchTerm)
  )

  const filteredDatabaseCirculars = databaseCirculars.filter(circular =>
    circular.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (circular.description && circular.description.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* Circulares subidas por administradores */}
      {(loadingDatabase || filteredDatabaseCirculars.length > 0) && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5" style={{ color: '#012A5A' }} />
            <h3 className="text-xl font-semibold" style={{ color: '#012A5A' }}>
              Circulares Institucionales
            </h3>
          </div>
          
          {loadingDatabase ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Cargando circulares...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredDatabaseCirculars.map((circular) => (
                <div
                  key={`db-${circular.id}`}
                  className="bg-white rounded-[20px] p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{
                    boxShadow: '0px 2px 12px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Título de la circular */}
                  <h3 
                    className="text-lg font-bold mb-2 leading-tight"
                    style={{ color: '#012A5A' }}
                  >
                    {circular.title}
                  </h3>

                  {/* Descripción si existe */}
                  {circular.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {circular.description}
                    </p>
                  )}

                  {/* Fecha de publicación */}
                  {circular.published_at && (
                    <div className="flex items-center justify-center gap-1 mb-3 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(circular.published_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Botón de descarga */}
                  <button
                    onClick={() => handleDatabaseDownload(circular)}
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
          )}
        </div>
      )}

      {/* Circulares estáticas del archivo */}
      {filteredStaticCirculars.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pb-12">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5" style={{ color: '#012A5A' }} />
            <h3 className="text-xl font-semibold" style={{ color: '#012A5A' }}>
              Archivo {CURRENT_YEAR}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaticCirculars.map((circular) => (
              <div
                key={`static-${circular.id}`}
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

                {/* Botón de visualización */}
                <button
                  onClick={() => handleDownload(circular)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-md hover:brightness-110"
                  style={{
                    backgroundColor: '#D9F0FF',
                    color: '#012A5A'
                  }}
                >
                  <FileText className="w-4 h-4" />
                  Ver Circular
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay resultados */}
      {!loadingDatabase && filteredStaticCirculars.length === 0 && filteredDatabaseCirculars.length === 0 && (
        <div className="max-w-4xl mx-auto px-6 pb-12">
          <div className="text-center py-12">
            <p className="text-gray-500">
              No se encontraron circulares que coincidan con tu búsqueda.
            </p>
          </div>
        </div>
      )}

      {/* Modal de visualización de circular */}
      {viewModalOpen && selectedCircular && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 pr-4">
                {selectedCircular.title}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleActualDownload(selectedCircular)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={closeViewModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenido del iframe */}
            <div className="flex-1 p-6">
              <iframe
                src={getViewUrl(selectedCircular.driveUrl)}
                className="w-full h-full rounded-lg border"
                title={selectedCircular.title}
                frameBorder="0"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}