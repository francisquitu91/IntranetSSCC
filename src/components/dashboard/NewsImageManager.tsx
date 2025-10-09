import { useState, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, RotateCcw, Eye, Trash2, Star, StarOff } from 'lucide-react'
import type { NewsImage } from '../../lib/newsImages'
import { createNewsImage, deleteNewsImage, fetchNewsImages, setPrimaryImage, updateNewsImage } from '../../lib/newsImages'
import { uploadPublicFile } from '../../lib/storage'

type Props = {
  newsId: string | null
  onImagesChange: (images: NewsImage[]) => void
  disabled?: boolean
  allowTemporaryMode?: boolean // Permite gestionar imágenes temporalmente antes de tener newsId
  onTemporaryImagesChange?: (images: NewsImage[]) => void // Para exponer imágenes temporales
}

type ImageFormData = {
  url: string
  alt_text: string
  alignment: 'left' | 'right' | 'center'
  position_in_content: number
  width?: number
  height?: number
}

const INITIAL_FORM: ImageFormData = {
  url: '',
  alt_text: '',
  alignment: 'left',
  position_in_content: 1,
  width: undefined,
  height: undefined
}

export function NewsImageManager({ newsId, onImagesChange, disabled = false, allowTemporaryMode = false, onTemporaryImagesChange }: Props) {
  const [images, setImages] = useState<NewsImage[]>([])
  const [temporaryImages, setTemporaryImages] = useState<NewsImage[]>([]) // Para imágenes antes de tener newsId
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<ImageFormData>(INITIAL_FORM)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar imágenes cuando cambie el newsId
  useEffect(() => {
    if (newsId) {
      loadImages()
    } else if (allowTemporaryMode) {
      // En modo temporal, usar las imágenes temporales
      setImages([])
    } else {
      setImages([])
    }
  }, [newsId, allowTemporaryMode])

  // Notificar cambios combinando imágenes reales y temporales
  useEffect(() => {
    const allImages = newsId ? images : temporaryImages
    onImagesChange(allImages)
    
    // También notificar las imágenes temporales por separado si se proporciona el callback
    if (onTemporaryImagesChange) {
      onTemporaryImagesChange(temporaryImages)
    }
  }, [images, temporaryImages, newsId, onImagesChange, onTemporaryImagesChange])

  // Función para limpiar imágenes temporales (para ser llamada desde el componente padre)
  const clearTemporaryImages = () => {
    setTemporaryImages([])
  }

  // Exponer función para limpiar temporales
  useEffect(() => {
    if (onTemporaryImagesChange) {
      // @ts-ignore - Añadir función de limpieza al callback
      onTemporaryImagesChange.clearTemporary = clearTemporaryImages
    }
  }, [onTemporaryImagesChange])

  const loadImages = async () => {
    if (!newsId) return
    
    try {
      setLoading(true)
      const fetchedImages = await fetchNewsImages(newsId)
      setImages(fetchedImages)
      onImagesChange(fetchedImages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar imágenes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true)
      setError(null)
      
      const result = await uploadPublicFile('news-images', file, { directory: 'uploads' })
      
      setFormData(prev => ({ ...prev, url: result.publicUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleAddImage = async () => {
    if (!formData.url.trim()) return

    try {
      setLoading(true)
      setError(null)

      if (newsId) {
        // Modo normal: guardar en base de datos
        const payload = {
          news_id: newsId,
          url: formData.url,
          alt_text: formData.alt_text || 'Imagen de la noticia',
          alignment: formData.alignment,
          position_in_content: formData.position_in_content,
          is_primary: images.length === 0, // Primera imagen es principal automáticamente
          width: formData.width,
          height: formData.height
        }

        await createNewsImage(payload)
        await loadImages()
      } else if (allowTemporaryMode) {
        // Modo temporal: guardar en estado local
        const tempImage: NewsImage = {
          id: `temp-${Date.now()}`, // ID temporal
          news_id: 'temp',
          url: formData.url,
          alt_text: formData.alt_text || 'Imagen de la noticia',
          alignment: formData.alignment,
          position_in_content: formData.position_in_content,
          is_primary: temporaryImages.length === 0, // Primera imagen es principal
          width: formData.width || null,
          height: formData.height || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        setTemporaryImages(prev => [...prev, tempImage])
      }
      
      setFormData(INITIAL_FORM)
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir imagen')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta imagen?')) return

    try {
      setLoading(true)
      setError(null)
      
      if (imageId.startsWith('temp-')) {
        // Eliminar imagen temporal
        setTemporaryImages(prev => prev.filter(img => img.id !== imageId))
      } else {
        // Eliminar imagen real
        await deleteNewsImage(imageId)
        await loadImages()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar imagen')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!newsId) return

    try {
      setLoading(true)
      setError(null)
      await setPrimaryImage(newsId, imageId)
      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al establecer imagen principal')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePosition = async (imageId: string, newPosition: number) => {
    try {
      setError(null)
      await updateNewsImage(imageId, { position_in_content: newPosition })
      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar posición')
    }
  }

  const handleUpdateAlignment = async (imageId: string, alignment: 'left' | 'right' | 'center') => {
    try {
      setError(null)
      await updateNewsImage(imageId, { alignment })
      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar alineación')
    }
  }

  // Determinar qué imágenes mostrar
  const currentImages = newsId ? images : temporaryImages
  const isTemporaryMode = !newsId && allowTemporaryMode

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Gestión de Imágenes
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={disabled || loading}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Añadir Imagen
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulario para añadir imagen */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
          <h4 className="font-medium">Nueva Imagen</h4>
          
          {/* Subir archivo o URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Imagen</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                disabled={uploadingFile}
                className="flex-1"
              />
              <span className="text-gray-500 px-2 py-1">o</span>
              <input
                type="url"
                placeholder="URL de la imagen"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
            {uploadingFile && <p className="text-blue-600 text-sm">Subiendo archivo...</p>}
          </div>

          {/* Vista previa */}
          {formData.url && (
            <div className="border rounded-lg p-2">
              <img 
                src={formData.url} 
                alt="Vista previa" 
                className="w-32 h-24 object-cover rounded"
              />
            </div>
          )}

          {/* Configuración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Texto alternativo</label>
              <input
                type="text"
                value={formData.alt_text}
                onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Descripción de la imagen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Posición en contenido</label>
              <input
                type="number"
                min="1"
                value={formData.position_in_content}
                onChange={(e) => setFormData(prev => ({ ...prev, position_in_content: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Alineación</label>
              <select
                value={formData.alignment}
                onChange={(e) => setFormData(prev => ({ ...prev, alignment: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
                <option value="center">Centro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ancho máximo (px)</label>
              <input
                type="number"
                min="100"
                max="800"
                value={formData.width || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="400"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setFormData(INITIAL_FORM)
                setError(null)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!formData.url.trim() || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Añadir Imagen
            </button>
          </div>
        </div>
      )}

      {/* Lista de imágenes */}
      <div className="space-y-3">
        {isTemporaryMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              💡 <strong>Modo temporal:</strong> Las imágenes se guardarán cuando publiques la noticia.
            </p>
          </div>
        )}

        {loading && currentImages.length === 0 && (
          <div className="text-center py-8">
            <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Cargando imágenes...</p>
          </div>
        )}

        {currentImages.length === 0 && !loading && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No hay imágenes añadidas</p>
            <p className="text-gray-400 text-sm">Haz clic en "Añadir Imagen" para comenzar</p>
          </div>
        )}

        {currentImages.map((image) => (
          <div key={image.id} className="border rounded-lg p-4 bg-white">
            <div className="flex gap-4">
              {/* Vista previa */}
              <div className="flex-shrink-0">
                <img 
                  src={image.url} 
                  alt={image.alt_text || 'Imagen'} 
                  className="w-24 h-18 object-cover rounded border"
                />
              </div>

              {/* Información */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {image.is_primary && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Principal
                        </span>
                      )}
                      {image.alt_text || 'Sin descripción'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Posición: {image.position_in_content === 0 ? 'Principal' : image.position_in_content} • 
                      Alineación: {image.alignment === 'left' ? 'Izquierda' : image.alignment === 'right' ? 'Derecha' : 'Centro'}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    {!image.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={loading}
                        className="p-1 text-yellow-600 hover:text-yellow-800 disabled:opacity-50"
                        title="Establecer como principal"
                      >
                        <StarOff className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => window.open(image.url, '_blank')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Ver imagen completa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={loading}
                      className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Controles rápidos */}
                {!image.is_primary && (
                  <div className="flex gap-2 text-sm">
                    <label className="flex items-center gap-1">
                      Posición:
                      <input
                        type="number"
                        min="1"
                        value={image.position_in_content}
                        onChange={(e) => handleUpdatePosition(image.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border rounded text-xs"
                      />
                    </label>
                    <label className="flex items-center gap-1">
                      Alineación:
                      <select
                        value={image.alignment}
                        onChange={(e) => handleUpdateAlignment(image.id, e.target.value as any)}
                        className="px-2 py-1 border rounded text-xs"
                      >
                        <option value="left">Izq</option>
                        <option value="right">Der</option>
                        <option value="center">Centro</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}