import { Calendar, Star } from 'lucide-react'
import type { JSX } from 'react'
import type { NewsItem } from '../../types'

export type NewsCardProps = {
  item: NewsItem
  onClick?: () => void
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export function NewsCard({ item, onClick }: NewsCardProps): JSX.Element {
  const formattedDate = item.date ? dateFormatter.format(new Date(item.date)) : null
  
  // Usar primary_image_url si está disponible, si no, usar image_url tradicional
  const imageUrl = item.primary_image_url || item.image_url

  return (
    <article 
      className="group flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={item.title || 'Imagen de la noticia'} 
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">📰</div>
              <div className="text-sm font-medium">Sin imagen</div>
            </div>
          </div>
        )}
        
        {/* Overlay con información */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Fecha */}
        {formattedDate && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </div>
        )}
        
        {/* Badge de destacada */}
        {item.featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current" />
            <span>Destacada</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 sm:gap-3 px-4 sm:px-5 pb-4 sm:pb-6 pt-3 sm:pt-5">
        <h3 className="line-clamp-2 text-base sm:text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        
        {item.excerpt && (
          <p className="line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {item.excerpt}
          </p>
        )}

        {item.author && (
          <div className="text-xs text-slate-500">
            Por {item.author}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-xs sm:text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
          <span>Leer noticia completa</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </article>
  )
}
