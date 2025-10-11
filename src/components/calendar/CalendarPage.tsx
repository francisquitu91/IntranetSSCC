import { useState, useCallback, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, type EventProps } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../lib/calendar'
import { fetchCourses } from '../../lib/courses'
import type { CalendarEvent, Course } from '../../types'
import { useAuth } from '../../context/AuthContext'

// Configuración del Localizer para date-fns en español
const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Lunes como inicio
  getDay,
  locales,
})

// Colores para los tipos de eventos
const eventTypeColors: Record<string, string> = {
  academico: 'bg-blue-600',
  evaluacion: 'bg-red-600',
  actividad: 'bg-purple-600',
  feriado: 'bg-green-600',
}

// Componente personalizado para mostrar eventos
const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
  return (
    <div className={`${eventTypeColors[event.event_type]} p-1 text-white rounded-md text-xs truncate`}>
      <strong className="block truncate">{event.title}</strong>
    </div>
  )
}

export function CalendarPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentEventData, setCurrentEventData] = useState<Partial<CalendarEvent>>({})
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewEventData, setViewEventData] = useState<CalendarEvent | null>(null)

  const isAdmin = profile?.role === 'admin'

  // Cargar eventos y cursos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [eventsData, coursesData] = await Promise.all([
          fetchCalendarEvents(),
          fetchCourses()
        ])
        setEvents(eventsData)
        setCourses(coursesData)
      } catch (error) {
        console.error('Error loading calendar data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Manejar selección de slot (crear evento nuevo)
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    if (!isAdmin) return
    setCurrentEventData({ 
      start, 
      end, 
      event_type: 'academico',
      profile_id: profile?.id 
    })
    setIsModalOpen(true)
  }, [isAdmin, profile?.id])

  // Manejar selección de evento (editar para admin, ver para estudiantes)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (isAdmin) {
      setCurrentEventData(event)
      setIsModalOpen(true)
    } else {
      setViewEventData(event)
      setIsViewModalOpen(true)
    }
  }, [isAdmin])

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentEventData(prev => ({
      ...prev,
      [name]: name === 'start' || name === 'end' ? new Date(value) : value,
    }))
  }

  // Manejar selección múltiple de cursos
  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
    setCurrentEventData(prev => ({
      ...prev,
      // course_ids: selectedOptions.length > 0 ? selectedOptions : null, // Comentado temporalmente
    }))
  }

  // Guardar evento
  const handleSave = async () => {
    try {
      if (!currentEventData.title || !currentEventData.start) return

      if (currentEventData.id) {
        // Actualizar
        await updateCalendarEvent(currentEventData.id, currentEventData)
      } else {
        // Crear
        await createCalendarEvent({
          ...currentEventData,
          end: currentEventData.end || currentEventData.start,
          created_by: profile?.id,
        } as Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>)
      }

      // Recargar eventos
      const updatedEvents = await fetchCalendarEvents()
      setEvents(updatedEvents)
      closeModal()
    } catch (error) {
      console.error('Error saving calendar event:', error)
      alert('Error al guardar el evento. Por favor intenta de nuevo.')
    }
  }

  // Eliminar evento
  const handleDelete = async () => {
    if (!currentEventData.id) return
    
    try {
      await deleteCalendarEvent(currentEventData.id)
      const updatedEvents = await fetchCalendarEvents()
      setEvents(updatedEvents)
      closeModal()
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      alert('Error al eliminar el evento. Por favor intenta de nuevo.')
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentEventData({})
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setViewEventData(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-gray-600">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-[80vh] p-6 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Calendario Académico por Ciclo</h2>
        {isAdmin && (
          <p className="text-sm text-gray-600 mt-2">
            Haz clic en cualquier día para crear un nuevo evento
          </p>
        )}
        {!isAdmin && (
          <p className="text-sm text-gray-600 mt-2">
            Haz clic en cualquier evento para ver más información
          </p>
        )}

        {/* Leyenda de colores */}
        <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipos de eventos:</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm text-gray-700">Académico</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-sm text-gray-700">Evaluación</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 rounded"></div>
              <span className="text-sm text-gray-700">Actividad</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-sm text-gray-700">Feriado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          selectable={isAdmin}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
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

      {/* Modal para Añadir/Editar Eventos */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900">
              {currentEventData.id ? 'Editar Evento' : 'Añadir Nuevo Evento'}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título del evento *
              </label>
              <input
                type="text"
                name="title"
                placeholder="Ej: Inicio del año escolar"
                value={currentEventData.title || ''}
                onChange={handleFormChange}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y hora de inicio *
                </label>
                <input
                  type="datetime-local"
                  name="start"
                  value={currentEventData.start ? format(currentEventData.start, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y hora de fin *
                </label>
                <input
                  type="datetime-local"
                  name="end"
                  value={currentEventData.end ? format(currentEventData.end, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de evento *
              </label>
              <select
                name="event_type"
                value={currentEventData.event_type || 'academico'}
                onChange={handleFormChange}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="academico">Académico</option>
                <option value="evaluacion">Evaluación</option>
                <option value="actividad">Actividad</option>
                <option value="feriado">Feriado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cursos (opcional)
              </label>
              <select
                multiple
                onChange={handleCourseChange}
                value={[] /* currentEventData.course_ids || [] */}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size={5}
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples cursos. Si no seleccionas ninguno, el evento será visible para todos.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                name="description"
                placeholder="Descripción del evento..."
                value={currentEventData.description || ''}
                onChange={handleFormChange}
                rows={3}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
              {currentEventData.id && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista para Estudiantes */}
      {isViewModalOpen && viewEventData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-2xl font-bold text-gray-900">{viewEventData.title}</h3>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 ${eventTypeColors[viewEventData.event_type]} rounded`}></div>
                <span className="capitalize font-medium text-gray-700">
                  {viewEventData.event_type === 'academico' ? 'Académico' :
                   viewEventData.event_type === 'evaluacion' ? 'Evaluación' :
                   viewEventData.event_type === 'actividad' ? 'Actividad' :
                   viewEventData.event_type === 'feriado' ? 'Feriado' :
                   viewEventData.event_type}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-500">Fecha de inicio</span>
                  <span className="text-gray-900">{format(viewEventData.start, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Fecha de fin</span>
                  <span className="text-gray-900">{format(viewEventData.end, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</span>
                </div>
                {viewEventData.description && (
                  <div>
                    <span className="block text-sm font-medium text-gray-500 mb-1">Descripción</span>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{viewEventData.description}</p>
                  </div>
                )}
                {viewEventData.related && (
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Relacionado</span>
                    <span className="text-gray-900">{viewEventData.related}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={closeViewModal}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
