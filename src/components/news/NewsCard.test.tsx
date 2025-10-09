import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NewsCard } from './NewsCard'
import type { NewsItem } from '../../types'

describe('NewsCard', () => {
  const mockItem: NewsItem = {
    id: '1',
    title: 'Título de noticia',
    image_url: 'https://example.com/image.jpg',
    date: '2025-10-01T00:00:00.000Z',
    excerpt: 'Resumen de la noticia',
  }

  it('renders title and excerpt', () => {
    render(<NewsCard item={mockItem} />)

    expect(screen.getByText(mockItem.title)).toBeInTheDocument()
    expect(screen.getByText(mockItem.excerpt as string)).toBeInTheDocument()
  })

  it('shows date badge when date provided', () => {
    render(<NewsCard item={mockItem} />)

    expect(screen.getByText('01-10-2025')).toBeInTheDocument()
  })
})
