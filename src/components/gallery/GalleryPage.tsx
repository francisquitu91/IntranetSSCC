import { useEffect, useState } from 'react'
import { Image, Video, Calendar } from 'lucide-react'
import type { GalleryItem } from '../../types'
import { fetchGallery } from '../../lib/gallery'

type Props = {
  /**
   * Curso del estudiante (texto simple, ej: "1-C")
   * Si es null/undefined, muestra todos los items
   */
  courseFilter?: string | null
}

export function GalleryPage({ courseFilter }: Props): JSX.Element {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const allItems = await fetchGallery()
        
        // Filtrar por curso si el usuario es estudiante
        const filteredItems = courseFilter
          ? allItems.filter((item) => {
              // Si el item no tiene cursos_objetivo o está vacío, se muestra a todos
              if (!item.cursos_objetivo || item.cursos_objetivo.length === 0) {
                return true
              }
              // Si tiene cursos_objetivo, verificar si el curso del estudiante está en la lista
              return item.cursos_objetivo.includes(courseFilter)
            })
          : allItems

        if (isMounted) {
          setItems(filteredItems)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'No pudimos cargar la galería. Intenta nuevamente más tarde.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [courseFilter])

  // Determinar si es un video basado en la URL
  const isVideo = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov']
    const videoHosts = ['youtube.com', 'youtu.be', 'vimeo.com']
    
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ||
           videoHosts.some(host => url.toLowerCase().includes(host))
  }

  // Convertir URL de YouTube a formato embed
  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      // Patrones de URL de YouTube
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/,
        /youtube\.com\/embed\/([^&\?\/]+)/,
        /youtube\.com\/v\/([^&\?\/]+)/,
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return `https://www.youtube.com/embed/${match[1]}`
        }
      }
      return null
    } catch {
      return null
    }
  }

  // Convertir URL de Vimeo a formato embed
  const getVimeoEmbedUrl = (url: string): string | null => {
    try {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`
      }
      return null
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 text-center shadow-sm">
        <p className="text-slate-600">Cargando galería...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-rose-50 p-4 sm:p-8 text-center shadow-sm">
        <p className="text-rose-700">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-slate-100">
          <Image className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
        </div>
        <h3 className="mb-2 text-base sm:text-lg font-semibold text-slate-900">No hay contenido disponible</h3>
        <p className="text-xs sm:text-sm text-slate-500">
          Aún no hay fotos o videos en la galería para tu curso.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Galería de Fotos y Videos</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Contenido multimedia de tu curso
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-sky-50 px-3 sm:px-4 py-1.5 sm:py-2">
              <span className="text-xs sm:text-sm font-semibold text-sky-900">{items.length}</span>
              <span className="text-xs sm:text-sm text-sky-700">elementos</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const isVideoItem = isVideo(item.image_url)
              
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-sky-300 hover:shadow-lg"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {isVideoItem ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="rounded-full bg-slate-900/70 p-4">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    
                    {/* Badge de tipo de contenido */}
                    <div className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-3 py-1">
                      <div className="flex items-center gap-1.5">
                        {isVideoItem ? (
                          <>
                            <Video className="h-3.5 w-3.5 text-white" />
                            <span className="text-xs font-medium text-white">Video</span>
                          </>
                        ) : (
                          <>
                            <Image className="h-3.5 w-3.5 text-white" />
                            <span className="text-xs font-medium text-white">Foto</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 text-left">
                    <h3 className="mb-2 font-semibold text-slate-900 line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mb-3 text-sm text-slate-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.published_at && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(item.published_at).toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal para ver contenido en grande */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/70 p-2 text-white transition hover:bg-slate-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Contenido del modal */}
            <div className="p-6">
              {isVideo(selectedItem.image_url) ? (
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
                  {(() => {
                    const youtubeUrl = getYouTubeEmbedUrl(selectedItem.image_url)
                    const vimeoUrl = getVimeoEmbedUrl(selectedItem.image_url)
                    
                    if (youtubeUrl) {
                      return (
                        <iframe
                          src={youtubeUrl}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={selectedItem.title}
                        />
                      )
                    } else if (vimeoUrl) {
                      return (
                        <iframe
                          src={vimeoUrl}
                          className="h-full w-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          title={selectedItem.title}
                        />
                      )
                    } else {
                      // Video directo (MP4, WebM, etc.)
                      return (
                        <video
                          src={selectedItem.image_url}
                          controls
                          className="h-full w-full"
                        >
                          Tu navegador no soporta videos.
                        </video>
                      )
                    }
                  })()}
                </div>
              ) : (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="w-full rounded-2xl"
                />
              )}

              <div className="mt-6">
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                  {selectedItem.title}
                </h2>
                {selectedItem.description && (
                  <p className="mb-4 text-slate-700">
                    {selectedItem.description}
                  </p>
                )}
                {selectedItem.published_at && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(selectedItem.published_at).toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
