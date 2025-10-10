import { assertSupabaseClient } from './supabase'
import type { CalendarEvent } from '../types'

// Obtener todos los eventos del calendario
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    start: new Date(item.start_date),
    end: new Date(item.end_date),
    type: item.event_type,
    description: item.description,
    course_ids: item.course_ids,
    created_by: item.created_by,
    created_at: item.created_at,
    updated_at: item.updated_at,
  })) as CalendarEvent[]
}

// Crear un nuevo evento
export async function createCalendarEvent(
  event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
): Promise<CalendarEvent> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title: event.title,
      start_date: event.start.toISOString(),
      end_date: event.end.toISOString(),
      event_type: event.type,
      description: event.description,
      course_ids: event.course_ids,
      created_by: event.created_by,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    title: data.title,
    start: new Date(data.start_date),
    end: new Date(data.end_date),
    type: data.event_type,
    description: data.description,
    course_ids: data.course_ids,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as CalendarEvent
}

// Actualizar un evento existente
export async function updateCalendarEvent(
  id: string,
  updates: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>
): Promise<CalendarEvent> {
  const supabase = assertSupabaseClient()
  
  const updateData: Record<string, unknown> = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.start !== undefined) updateData.start_date = updates.start.toISOString()
  if (updates.end !== undefined) updateData.end_date = updates.end.toISOString()
  if (updates.type !== undefined) updateData.event_type = updates.type
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.course_ids !== undefined) updateData.course_ids = updates.course_ids

  const { data, error } = await supabase
    .from('calendar_events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    title: data.title,
    start: new Date(data.start_date),
    end: new Date(data.end_date),
    type: data.event_type,
    description: data.description,
    course_ids: data.course_ids,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as CalendarEvent
}

// Eliminar un evento
export async function deleteCalendarEvent(id: string): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}
