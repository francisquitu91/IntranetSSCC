-- Crear tabla para eventos del calendario académico
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('academico', 'festivo', 'reunion', 'evaluacion', 'otro')),
  description TEXT,
  course_ids TEXT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- RLS deshabilitado para desarrollo (como en las otras tablas)
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;

-- Comentarios
COMMENT ON TABLE calendar_events IS 'Eventos del calendario académico institucional';
COMMENT ON COLUMN calendar_events.event_type IS 'Tipo de evento: academico, festivo, reunion, evaluacion, otro';
COMMENT ON COLUMN calendar_events.course_ids IS 'Array de IDs de cursos a los que aplica el evento (null = todos los cursos)';
