import { useState, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, RotateCcw, Trash2, Star, StarOff } from 'lucide-react'
import type { ContentImage } from '../lib/contentImages'
import { 
  createContentImage, 
  deleteContentImage, 
  fetchContentImages, 
  setPrimaryImage, 
  updateContentImage 
} from '../lib/contentImages'
import { uploadPublicFile } from '../lib/storage'

type Props = {
  contentId: string | null
  onImagesChange: (images: ContentImage[]) => void
  disabled?: boolean
  allowTemporaryMode?: boolean
  onTemporaryImagesChange?: (images: ContentImage[]) => void
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

export function ContentImageManager({ 
  contentId, 
  onImagesChange, 
  disabled = false, 
  allowTemporaryMode = false, 
  onTemporaryImagesChange 
}: Props) {
  const [images, setImages] = useState<ContentImage[]>([])
  const [temporaryImages, setTemporaryImages] = useState<ContentImage[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<ImageFormData>(INITIAL_FORM)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar imágenes cuando cambie el contentId
  useEffect(() => {
    if (contentId) {
      loadImages()
    } else if (allowTemporaryMode) {
      setImages([])
    } else {
      setImages([])
    }
  }, [contentId, allowTemporaryMode])

  // Notificar cambios
  useEffect(() => {
    const allImages = contentId ? images : temporaryImages
    onImagesChange(allImages)
    
    if (onTemporaryImagesChange) {
      onTemporaryImagesChange(temporaryImages)
    }
  }, [images, temporaryImages, contentId, onImagesChange, onTemporaryImagesChange])

  const loadImages = async () => {
    if (!contentId) return
    
    try {
      setLoading(true)
      const fetchedImages = await fetchContentImages(contentId)
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
      
      // CAMBIA 'content-images' por el nombre de tu bucket
      const result = await uploadPublicFile('content-images', file, { directory: 'uploads' })
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

      if (contentId) {
        // Modo normal: guardar en base de datos
        const payload = {
          content_id: contentId,
          url: formData.url,
          alt_text: formData.alt_text || 'Imagen del contenido',
          alignment: formData.alignment,
          position_in_content: formData.position_in_content,
          is_primary: images.length === 0,
          width: formData.width,
          height: formData.height
        }

        await createContentImage(payload)
        await loadImages()
      } else if (allowTemporaryMode) {
        // Modo temporal: guardar en estado local
        const tempImage: ContentImage = {
          id: `temp-${Date.now()}`,
          content_id: 'temp',
          url: formData.url,
          alt_text: formData.alt_text || 'Imagen del contenido',
          alignment: formData.alignment,
          position_in_content: formData.position_in_content,
          is_primary: temporaryImages.length === 0,
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
    try {
      setLoading(true)
      setError(null)
      
      if (imageId.startsWith('temp-')) {
        // Eliminar imagen temporal
        setTemporaryImages(prev => prev.filter(img => img.id !== imageId))
      } else {
        // Eliminar imagen real
        await deleteContentImage(imageId)
        await loadImages()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar imagen')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!contentId) return

    try {
      setLoading(true)
      setError(null)
      await setPrimaryImage(contentId, imageId)
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
      await updateContentImage(imageId, { position_in_content: newPosition })
      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar posición')
    }
  }

  const handleUpdateAlignment = async (imageId: string, alignment: 'left' | 'right' | 'center') => {
    try {
      setError(null)
      await updateContentImage(imageId, { alignment })
      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar alineación')
    }
  }

  const currentImages = contentId ? images : temporaryImages
  const isTemporaryMode = !contentId && allowTemporaryMode

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Gestión de Imágenes
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={disabled || loading}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Añadir Imagen
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Formulario para añadir imagen */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h4 className="font-medium text-gray-900">Nueva Imagen</h4>
          
          {/* Upload de archivo o URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Imagen</label>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                disabled={uploadingFile}
                className="flex-1 w-full text-sm"
              />
              <span className="text-gray-500 text-sm">o</span>
              <input
                type="url"
                placeholder="URL de la imagen"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {uploadingFile && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Subiendo archivo...</span>
              </div>
            )}
          </div>

          {/* Vista previa */}
          {formData.url && (
            <div className="border border-gray-200 rounded-lg p-2 bg-white">
              <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
              <img 
                src={formData.url} 
                alt="Vista previa" 
                className="w-32 h-24 object-cover rounded"
              />
            </div>
          )}

          {/* Configuración de la imagen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto alternativo
              </label>
              <input
                type="text"
                value={formData.alt_text}
                onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción de la imagen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición en contenido
              </label>
              <input
                type="number"
                min="1"
                value={formData.position_in_content}
                onChange={(e) => setFormData(prev => ({ ...prev, position_in_content: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">Después del párrafo #</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alineación
              </label>
              <select
                value={formData.alignment}
                onChange={(e) => setFormData(prev => ({ ...prev, alignment: e.target.value as 'left' | 'right' | 'center' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ancho (px, opcional)
              </label>
              <input
                type="number"
                min="100"
                max="1200"
                value={formData.width || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Auto"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setFormData(INITIAL_FORM)
                setError(null)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!formData.url.trim() || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Añadir Imagen
            </button>
          </div>
        </div>
      )}

      {/* Lista de imágenes */}
      <div className="space-y-3">
        {/* Advertencia modo temporal */}
        {isTemporaryMode && currentImages.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                <strong>Modo temporal:</strong> Estas imágenes se guardarán permanentemente cuando guardes el contenido principal.
              </span>
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && currentImages.length === 0 && (
          <div className="text-center py-8">
            <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 text-sm">Cargando imágenes...</p>
          </div>
        )}

        {/* Empty state */}
        {currentImages.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No hay imágenes añadidas</p>
            <p className="text-sm text-gray-500 mt-1">Haz clic en "Añadir Imagen" para comenzar</p>
          </div>
        )}

        {/* Lista de imágenes */}
        {currentImages.map((image) => (
          <div key={image.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              {/* Miniatura */}
              <div className="flex-shrink-0">
                <img 
                  src={image.url} 
                  alt={image.alt_text || ''} 
                  className="w-24 h-24 object-cover rounded border border-gray-200"
                />
              </div>
              
              {/* Información y controles */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {image.alt_text || 'Sin descripción'}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                      <span>📍 Posición: {image.position_in_content}</span>
                      <span>↔️ Alineación: {
                        image.alignment === 'left' ? 'Izquierda' :
                        image.alignment === 'right' ? 'Derecha' : 'Centro'
                      }</span>
                      {image.width && <span>📏 {image.width}px</span>}
                    </div>
                  </div>
                  
                  {/* Badge de imagen principal */}
                  {image.is_primary && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Principal
                    </span>
                  )}
                </div>

                {/* Controles */}
                <div className="flex flex-wrap gap-2">
                  {/* Solo mostrar controles avanzados para imágenes no temporales */}
                  {!image.id.startsWith('temp-') && (
                    <>
                      {/* Marcar como principal */}
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={image.is_primary}
                        className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                        title={image.is_primary ? 'Ya es la imagen principal' : 'Marcar como principal'}
                      >
                        {image.is_primary ? (
                          <Star className="w-3 h-3 fill-current text-yellow-600" />
                        ) : (
                          <StarOff className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">
                          {image.is_primary ? 'Principal' : 'Marcar principal'}
                        </span>
                      </button>

                      {/* Cambiar alineación */}
                      <select
                        value={image.alignment}
                        onChange={(e) => handleUpdateAlignment(image.id, e.target.value as any)}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        title="Cambiar alineación"
                      >
                        <option value="left">⬅️ Izquierda</option>
                        <option value="center">↔️ Centro</option>
                        <option value="right">➡️ Derecha</option>
                      </select>

                      {/* Cambiar posición */}
                      <input
                        type="number"
                        min="1"
                        value={image.position_in_content}
                        onChange={(e) => handleUpdatePosition(image.id, parseInt(e.target.value) || 1)}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-md w-16 hover:bg-gray-50 transition-colors"
                        title="Posición en contenido"
                      />
                    </>
                  )}

                  {/* Botón eliminar */}
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image.id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 flex items-center gap-1 transition-colors ml-auto"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
