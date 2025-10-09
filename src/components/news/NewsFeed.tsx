import { useEffect, useMemo, useState } from 'react'
import { HeroNews } from './HeroNews'
import { NewsCard } from './NewsCard'
import { NewsDetail } from './NewsDetail'
import type { NewsItem } from '../../types'
import { fetchNews } from '../../lib/news'

const PAGE_SIZE = 6

const PLACEHOLDER_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Estudiantes inauguran el nuevo patio de juegos inclusivo',
    image_url:
      'https://images.unsplash.com/photo-1522651278875-85d93f8ea223?auto=format&fit=crop&w=1200&q=80',
    date: '2025-01-12',
    featured: true,
    excerpt: 'Una emotiva ceremonia marcó la apertura de un espacio diseñado para fomentar la inclusión y el juego colaborativo.',
    author: 'Equipo Comunicaciones',
  },
  {
    id: '2',
    title: 'Nuestra bibliotecaria Lorena Rodríguez lanza su libro',
    image_url: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'La comunidad educativa se reunió para celebrar el lanzamiento del nuevo libro de literatura infantil escrito por nuestra bibliotecaria.',
  },
  {
    id: '3',
    title: '¡Nuestro colegio destaca en la First Lego League 2024!',
    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'El equipo de robótica obtuvo el primer lugar regional gracias a su innovación y trabajo colaborativo.',
  },
  {
    id: '4',
    title: 'Ceremonia graduación 2024',
    image_url: 'https://images.unsplash.com/photo-1466303907239-30752c9ab28b?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Una noche llena de emociones y reconocimientos para despedir a nuestros estudiantes de cuarto medio.',
  },
  {
    id: '5',
    title: 'Estudiantes finalistas concurso “Colorearte 2024”',
    image_url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Las obras fueron seleccionadas entre más de 500 colegios a nivel nacional.',
  },
  {
    id: '6',
    title: '¡Manquehuino 2023 ya salió al aire!',
    image_url: 'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Revive en nuestra intranet cada una de las ediciones del histórico magazine escolar.',
  },
  {
    id: '7',
    title: 'Homenaje al matrimonio de artistas Barrios Balmes',
    image_url: 'https://images.unsplash.com/photo-1485811661309-ab85183a729c?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Una exposición abierta a toda la comunidad conmemoró la trayectoria artística de los destacados pintores.',
  },
]

type FetchState = {
  news: NewsItem[]
  featured?: NewsItem
  status: 'idle' | 'loading' | 'error' | 'success'
  page: number
  selectedNews?: NewsItem | null
}

type Props = {
  courseFilter?: string[] | null
  canManage?: boolean
}

export function NewsFeed({ courseFilter, canManage = false }: Props): JSX.Element {
  const [{ news, featured, status, page, selectedNews }, setState] = useState<FetchState>({
    news: [],
    featured: undefined,
    status: 'idle',
    page: 1,
    selectedNews: null,
  })

  useEffect(() => {
    let isMounted = true

    async function loadNews() {
      setState((prev) => ({ ...prev, status: 'loading' }))

      try {
        const data = await fetchNews()
        if (!isMounted) return

        const filtered = filterByCourse(data, courseFilter)
        setState({
          news: filtered,
          featured: filtered.find((item) => item.featured) ?? filtered[0],
          status: 'success',
          page: 1,
          selectedNews: null,
        })
      } catch (error) {
        console.error('[news-feed] fetch failed', error)
        if (!isMounted) return

        const filtered = filterByCourse(PLACEHOLDER_NEWS, courseFilter)
        setState({
          news: filtered,
          featured: filtered.find((item) => item.featured) ?? filtered[0],
          status: 'error',
          page: 1,
          selectedNews: null,
        })
      }
    }

    void loadNews()

    return () => {
      isMounted = false
    }
  }, [courseFilter?.join(',')])

  const visibleNews = useMemo(() => {
    const start = 0
    const end = page * PAGE_SIZE
    return news.filter((item) => !item.featured).slice(start, end)
  }, [news, page])

  const hasMore = useMemo(
    () => news.filter((item) => !item.featured).length > visibleNews.length,
    [news, visibleNews],
  )

  function handleLoadMore() {
    setState((prev) => ({ ...prev, page: prev.page + 1 }))
  }

  function handleNewsClick(newsItem: NewsItem) {
    setState((prev) => ({ ...prev, selectedNews: newsItem }))
  }

  function handleBackToList() {
    setState((prev) => ({ ...prev, selectedNews: null }))
  }

  const isLoading = status === 'loading' && news.length === 0

  // Si hay una noticia seleccionada, mostrar la vista detallada
  if (selectedNews) {
    return <NewsDetail newsItem={selectedNews} onBack={handleBackToList} />
  }

  return (
    <section className="space-y-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-sky-900">Últimas noticias</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mantente al día con los anuncios e hitos más importantes de nuestra comunidad educativa.
        </p>
      </header>

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-3xl bg-white" />
      ) : (
        featured && <HeroNews item={featured} onClick={() => handleNewsClick(featured)} />
      )}

      <div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleNews.map((item) => (
            <NewsCard key={item.id} item={item} onClick={() => handleNewsClick(item)} />
          ))}
        </div>

        {status === 'error' && (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No pudimos conectar con la base de datos. Mostramos noticias de ejemplo mientras solucionamos el problema.
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={!hasMore}
          className="rounded-full bg-sky-900 px-6 py-2 text-sm font-semibold text-white transition enabled:hover:bg-sky-950 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {hasMore ? 'Cargar más' : 'No hay más noticias'}
        </button>
      </div>

      {canManage && (
        <p className="text-xs text-slate-400">
          Puedes gestionar el contenido en la sección superior del panel si cuentas con permisos de administración.
        </p>
      )}
    </section>
  )
}

function filterByCourse(news: NewsItem[], courseFilter?: string[] | null): NewsItem[] {
  if (!courseFilter || courseFilter.length === 0) {
    return news
  }

  const courseSet = new Set(courseFilter)
  return news.filter((item) => {
    if (!item.course_ids || item.course_ids.length === 0) {
      return true
    }
    return item.course_ids.some((courseId) => courseSet.has(courseId))
  })
}
