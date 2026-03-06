-- Agregar campos RUT y curso a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS curso TEXT,
ADD COLUMN IF NOT EXISTS cargo TEXT;

-- Crear índice para búsqueda rápida por RUT
CREATE INDEX IF NOT EXISTS idx_profiles_rut ON public.profiles(rut);

-- Agregar constraint único para RUT (no puede haber duplicados)
ALTER TABLE public.profiles
ADD CONSTRAINT unique_rut UNIQUE (rut);

-- Comentarios
COMMENT ON COLUMN public.profiles.rut IS 'RUT del usuario (formato: 12345678-9)';
COMMENT ON COLUMN public.profiles.curso IS 'Curso del estudiante (ej: I-A, 8-B, IV-C)';
COMMENT ON COLUMN public.profiles.cargo IS 'Cargo del trabajador (ej: Profesor, Director)';
