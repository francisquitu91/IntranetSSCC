import { useState, useCallback, useEffect, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, type EventProps } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../lib/calendar'
import type { CalendarEvent } from '../../types'
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

// Calendarios de Google por ciclo
const CALENDAR_BY_CYCLE: Record<string, string> = {
  'Primer Ciclo': 'https://calendar.google.com/calendar/u/0/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America/Santiago&src=Y2FsZW5kYXJpb3ByaW1lcmNpY2xvQHNzY2NtYW5xdWVodWUuY2w&src=Y19paHBubDI2aXY3aGYwZmNkZ2psNGUyc2xpZ0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19zZXNybm1ocm85aHA2cjI1cm85MGJ2N3JrMEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ZXMuY2wjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%23039BE5&color=%23009688&color=%238E24AA&color=%230B8043&showCalendars=0&title=Calendario+de+evidencias',
  'Segundo Ciclo': 'https://calendar.google.com/calendar/u/0/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America/Santiago&src=Y2FsZW5kYXJpb3NlZ3VuZG9jaWNsb0Bzc2NjbWFucXVlaHVlLmNs&src=Y18zMm5wMTVuYmhqMDhrcWxpdG8yMTkzdmNhY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19nMXRma3IzczJuZnE0azBoMWQ1NXFvbmk4MEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19nMHBrbGFlczhnZHVvbTl1NjB2b2ppaDgya0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19hZWpmcGF1amtqNG5tNHU2a2Zic2M0ZXUyZ0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19hcGszdjM1dmJ0dDVua29yYmZxZmYwYnU4MEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19tYjFmdTVpcXM3dHJhbWQ4YXMxcGxnZWpyNEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23039BE5&color=%237CB342&color=%23D50000&color=%23EF6C00&color=%238E24AA&color=%237CB342&color=%23B39DDB&title=Calendario+Evaluaciones',
  'Tercer Ciclo': 'https://calendar.google.com/calendar/u/0/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America/Santiago&src=Y2FsZW5kYXJpb3RlcmNlcmNpY2xvQHNzY2NtYW5xdWVodWUuY2w&src=Y19waGpwajE0dDA4a3BuMmt1b3EwMWExbmNvMEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19ydHFvYzVtb2RpMzVpZXIyaWZ2MjA2YTB2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y185cjkzamUzMm9rajQxZDE0Mm5uazJoNjI1a0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y185NWRsZWQ2djEwNW1oM3V0ZGZtYmdrNHE5a0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19hY2s4dXJhNnFlZ2o4N24waXRoampxOXI2NEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19lNWF0ZzBrYW1xc2JxbzZyaG1zc3VmYTI3b0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y18zdGcxcDFrMTV2ajJta20zMmN1ZjlnbDF0NEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23039BE5&color=%239E69AF&color=%23F4511E&color=%23C0CA33&color=%23D50000&color=%234285F4&color=%237CB342&color=%23EF6C00&title=Calendario+Evaluaciones',
  'Enseñanza Media': 'https://calendar.google.com/calendar/u/0/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America/Santiago&src=Y2FsZW5kYXJpb3RlcmNlcmNpY2xvQHNzY2NtYW5xdWVodWUuY2w&src=Y19waGpwajE0dDA4a3BuMmt1b3EwMWExbmNvMEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19ydHFvYzVtb2RpMzVpZXIyaWZ2MjA2YTB2Y0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y185cjkzamUzMm9rajQxZDE0Mm5uazJoNjI1a0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y185NWRsZWQ2djEwNW1oM3V0ZGZtYmdrNHE5a0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19hY2s4dXJhNnFlZ2o4N24waXRoampxOXI2NEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y19lNWF0ZzBrYW1xc2JxbzZyaG1zc3VmYTI3b0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y18zdGcxcDFrMTV2ajJta20zMmN1ZjlnbDF0NEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23039BE5&color=%239E69AF&color=%23F4511E&color=%23C0CA33&color=%23D50000&color=%234285F4&color=%237CB342&color=%23EF6C00&title=Calendario+Evaluaciones',
}

// Colores para los tipos de eventos
const eventTypeColors: Record<string, string> = {
  academico: 'bg-blue-600',
  evaluacion: 'bg-red-600',
  actividad: 'bg-purple-600',
  feriado: 'bg-green-600',
}

// Función para determinar el ciclo según el nombre del curso
const getCycleFromCourso = (curso: string | null | undefined): string | null => {
  if (!curso) return null
  
  const upperCurso = curso.toUpperCase().trim()
  
  // Primer Ciclo: PK (Pre-Kínder) y K (Kínder)
  if (upperCurso.startsWith('PK') || upperCurso.startsWith('K')) {
    return 'Primer Ciclo'
  }
  
  // Segundo Ciclo: 1° hasta 4° básico (I, II, III, IV o 1, 2, 3, 4)
  if (
    upperCurso.match(/^I\b/) ||
    upperCurso.match(/^II\b/) ||
    upperCurso.match(/^III\b/) ||
    upperCurso.match(/^IV\b/) ||
    upperCurso.match(/^[1-4]/)
  ) {
    return 'Segundo Ciclo'
  }
  
  // Tercer Ciclo: 5° hasta 8° básico (V, VI, VII, VIII o 5, 6, 7, 8)
  if (
    upperCurso.match(/^V\b/) ||
    upperCurso.match(/^VI\b/) ||
    upperCurso.match(/^VII\b/) ||
    upperCurso.match(/^VIII\b/) ||
    upperCurso.match(/^[5-8]/)
  ) {
    return 'Tercer Ciclo'
  }
  
  // Enseñanza Media: I°M, II°M, III°M, IV°M
  if (upperCurso.match(/^I.*M\b/) || upperCurso.match(/^1.*M\b/)) {
    return 'Enseñanza Media'
  }
  
  return null
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
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentEventData, setCurrentEventData] = useState<Partial<CalendarEvent>>({})
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewEventData, setViewEventData] = useState<CalendarEvent | null>(null)

  const isAdmin = profile?.role === 'admin'
  const isTeacher = profile?.role === 'teacher'

  // Determinar el ciclo del estudiante desde el campo curso (texto)
  const studentCycle = useMemo(() => {
    if (isAdmin || isTeacher) return null
    return getCycleFromCurso(profile?.curso)
  }, [profile?.curso, isAdmin, isTeacher])

  // Obtener Calendar URL según el ciclo
  const calendarUrl = useMemo(() => {
    if (!studentCycle) return null
    
    // Buscar coincidencia exacta o parcial
    for (const [key, url] of Object.entries(CALENDAR_BY_CYCLE)) {
      if (studentCycle.includes(key) || key.includes(studentCycle)) {
        return url
      }
    }
    
    return null
  }, [studentCycle])

  // Cargar eventos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const eventsData = await fetchCalendarEvents()
        setEvents(eventsData)
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

  // Vista de estudiante con Google Calendar
  if (!isAdmin && !isTeacher && calendarUrl) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Calendario Académico</h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
            Calendario de {studentCycle || 'tu ciclo'}
          </p>
          
          <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
            <iframe
              src={calendarUrl}
              style={{ border: 0 }}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              title="Calendario Académico"
            />
          </div>
        </div>
      </div>
    )
  }

  // Vista sin calendario para estudiantes sin ciclo asignado
  if (!isAdmin && !isTeacher && !calendarUrl) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="rounded-2xl sm:rounded-3xl bg-amber-50 p-4 sm:p-8 text-center max-w-md mx-4">
          <h3 className="text-base sm:text-lg font-semibold text-amber-900 mb-2">Calendario no disponible</h3>
          <p className="text-xs sm:text-sm text-amber-700">
            No se pudo determinar tu ciclo académico. Por favor contacta al administrador para que te asigne a un curso.
          </p>
        </div>
      </div>
    )
  }

  // Vista de admin/teacher con calendario editable
  return (
    <div className="h-full min-h-[80vh] p-6 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Gestión de Calendario Académico</h2>
        {isAdmin && (
          <p className="text-sm text-gray-600 mt-2">
            Haz clic en cualquier día para crear un nuevo evento
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
