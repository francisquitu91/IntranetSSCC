import { Calendar, ChevronRight } from 'lucide-react'
import type { JSX } from 'react'
import type { NewsItem } from '../../types'

type HeroNewsProps = {
  item: NewsItem
  onClick?: () => void
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

export function HeroNews({ item, onClick }: HeroNewsProps): JSX.Element {
  const formattedDate = item.date ? dateFormatter.format(new Date(item.date)) : null

  return (
    <article className="grid gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 lg:p-8 shadow-card lg:grid-cols-[1.3fr,1fr] cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <div className="space-y-3 sm:space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold uppercase tracking-wide text-sky-900">
          Destacada
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-slate-900">{item.title}</h2>
        {item.excerpt && <p className="text-sm sm:text-base text-slate-600 line-clamp-3">{item.excerpt}</p>}

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 sm:gap-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {formattedDate}
            </span>
          )}
          {item.author && <span>Por {item.author}</span>}
        </div>

        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-2 rounded-full bg-sky-900 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-sky-950 hover:scale-105"
        >
          Leer noticia completa
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl h-48 sm:h-64 lg:h-auto">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title || 'Imagen de la noticia'}
            className="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-6xl mb-4">📰</div>
              <div className="text-lg font-medium">Noticia destacada</div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 to-transparent" aria-hidden="true" />
      </div>
    </article>
  )
}
