-- Migración para actualizar la tabla calendar_events
-- Primero eliminamos la tabla existente si tiene estructura incorrecta
DROP TABLE IF EXISTS calendar_events CASCADE;

-- Crear tabla para eventos del calendario académico con la estructura correcta
CREATE TABLE calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('academico', 'evaluacion', 'actividad', 'feriado')),
  description TEXT,
  related TEXT,
  profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX idx_calendar_events_profile_id ON calendar_events(profile_id);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS calendar_events_updated_at ON calendar_events;
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- RLS deshabilitado para desarrollo (como en las otras tablas)
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;

-- Comentarios
COMMENT ON TABLE calendar_events IS 'Eventos del calendario académico institucional';
COMMENT ON COLUMN calendar_events.event_type IS 'Tipo de evento: academico, evaluacion, actividad, feriado';
COMMENT ON COLUMN calendar_events.related IS 'Información relacionada (curso, grupo, etc.)';
COMMENT ON COLUMN calendar_events.profile_id IS 'ID del usuario que creó el evento';