import React, { useState, useCallback, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { CalendarEvent } from '../../types'
import { 
  fetchCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from '../../lib/calendar'
import { X, Calendar as CalendarIcon, Clock, Tag, FileText } from 'lucide-react'

// Configuración del localizer
const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

// Componente personalizado para eventos
const CustomEvent: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  const eventColors: Record<string, string> = {
    academico: 'bg-blue-500',
    evaluacion: 'bg-red-500',
    actividad: 'bg-green-500',
    feriado: 'bg-purple-500',
  }

  return (
    <div className={`${eventColors[event.event_type]} p-1 text-white rounded text-xs`}>
      <strong className="block truncate">{event.title}</strong>
      {event.related && <em className="block opacity-80 truncate">({event.related})</em>}
    </div>
  )
}

type CalendarManagerProps = {
  profileId?: string
}

export function CalendarManager({ profileId }: CalendarManagerProps): JSX.Element {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Partial<CalendarEvent>>({})
  const [saving, setSaving] = useState(false)

  // Cargar eventos
  const loadEvents = useCallback(async () => {
    if (!profileId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCalendarEvents()
      setEvents(data)
    } catch (err) {
      console.error('Error loading calendar events:', err)
      setError('Error al cargar los eventos del calendario')
    } finally {
      setLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Manejar selección de slot vacío (crear evento)
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setCurrentEvent({ 
      start, 
      end, 
      event_type: 'academico',
      title: '',
      description: '',
      related: ''
    })
    setIsModalOpen(true)
  }, [])

  // Manejar selección de evento existente (editar)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setCurrentEvent(event)
    setIsModalOpen(true)
  }, [])

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentEvent(prev => ({
      ...prev,
      [name]: name === 'start' || name === 'end' ? new Date(value) : value,
    }))
  }

  // Guardar evento
  const handleSave = async () => {
    if (!currentEvent.title || !currentEvent.start || !profileId) return

    try {
      setSaving(true)
      
      const eventData = {
        title: currentEvent.title,
        start: currentEvent.start,
        end: currentEvent.end || currentEvent.start,
        event_type: currentEvent.event_type || 'academico',
        description: currentEvent.description || null,
        related: currentEvent.related || null,
        profile_id: profileId
      }

      if (currentEvent.id) {
        await updateCalendarEvent(currentEvent.id, eventData)
      } else {
        await createCalendarEvent(eventData)
      }

      await loadEvents()
      closeModal()
    } catch (err) {
      console.error('Error saving event:', err)
      setError('Error al guardar el evento')
    } finally {
      setSaving(false)
    }
  }

  // Eliminar evento
  const handleDelete = async () => {
    if (!currentEvent.id) return

    try {
      setSaving(true)
      await deleteCalendarEvent(currentEvent.id)
      await loadEvents()
      closeModal()
    } catch (err) {
      console.error('Error deleting event:', err)
      setError('Error al eliminar el evento')
    } finally {
      setSaving(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentEvent({})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Gestión del Calendario Académico</h2>
          <p className="text-sm text-slate-600">
            Gestiona eventos, evaluaciones, actividades y feriados institucionales
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Leyenda de colores */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tipos de eventos:</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Académico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Evaluación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Actividad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Feriado</span>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay eventos en este rango',
            showMore: (total: number) => `+ Ver más (${total})`,
          }}
          culture="es"
          components={{
            event: CustomEvent,
          }}
        />
      </div>

      {/* Modal para crear/editar eventos */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentEvent.id ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Título del evento
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Ej: Inicio de clases, Prueba de matemáticas..."
                  value={currentEvent.title || ''}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Inicio
                  </label>
                  <input
                    type="datetime-local"
                    name="start"
                    value={currentEvent.start ? format(currentEvent.start, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Fin
                  </label>
                  <input
                    type="datetime-local"
                    name="end"
                    value={currentEvent.end ? format(currentEvent.end, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de evento
                </label>
                <select
                  name="event_type"
                  value={currentEvent.event_type || 'academico'}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="academico">Académico</option>
                  <option value="evaluacion">Evaluación</option>
                  <option value="actividad">Actividad</option>
                  <option value="feriado">Feriado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relacionado con (opcional)
                </label>
                <input
                  type="text"
                  name="related"
                  placeholder="Ej: 3° Básico A, Profesores, Apoderados..."
                  value={currentEvent.related || ''}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Descripción (opcional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Detalles adicionales del evento..."
                  value={currentEvent.description || ''}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !currentEvent.title || !currentEvent.start}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
              
              {currentEvent.id && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}