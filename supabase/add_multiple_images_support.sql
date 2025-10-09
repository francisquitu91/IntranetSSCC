-- Script para añadir soporte de múltiples imágenes a las noticias
-- Ejecutar después de los scripts anteriores

-- 1. Crear tabla para múltiples imágenes de noticias
CREATE TABLE IF NOT EXISTS public.news_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position_in_content INTEGER DEFAULT 0, -- 0 = imagen principal, 1+ = posición en contenido
  alignment TEXT DEFAULT 'left' CHECK (alignment IN ('left', 'right', 'center')),
  is_primary BOOLEAN DEFAULT false, -- true para la imagen principal/miniatura
  width INTEGER, -- ancho en pixels (opcional)
  height INTEGER, -- alto en pixels (opcional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_news_images_news_id ON public.news_images(news_id);
CREATE INDEX IF NOT EXISTS idx_news_images_primary ON public.news_images(news_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_news_images_position ON public.news_images(news_id, position_in_content);

-- 3. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_news_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_news_images_updated_at
    BEFORE UPDATE ON public.news_images
    FOR EACH ROW
    EXECUTE FUNCTION update_news_images_updated_at();

-- 4. Función para asegurar que solo haya una imagen principal por noticia
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    -- Si estamos marcando esta imagen como principal
    IF NEW.is_primary = true THEN
        -- Desmarcar todas las otras imágenes principales de esta noticia
        UPDATE public.news_images 
        SET is_primary = false 
        WHERE news_id = NEW.news_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER ensure_single_primary_image_trigger
    BEFORE INSERT OR UPDATE ON public.news_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_image();

-- 5. Migrar imágenes existentes de la tabla news a news_images
INSERT INTO public.news_images (news_id, url, alt_text, is_primary, position_in_content)
SELECT 
    id as news_id,
    image_url as url,
    title || ' - Imagen principal' as alt_text,
    true as is_primary,
    0 as position_in_content
FROM public.news 
WHERE image_url IS NOT NULL AND image_url != '';

-- 6. Función para obtener la imagen principal de una noticia
CREATE OR REPLACE FUNCTION get_primary_image_url(news_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    primary_url TEXT;
BEGIN
    SELECT url INTO primary_url
    FROM public.news_images
    WHERE news_id = news_id_param AND is_primary = true
    LIMIT 1;
    
    RETURN primary_url;
END;
$$ language plpgsql;

-- 7. Función para obtener todas las imágenes de una noticia ordenadas
CREATE OR REPLACE FUNCTION get_news_images(news_id_param UUID)
RETURNS TABLE (
    id UUID,
    url TEXT,
    alt_text TEXT,
    position_in_content INTEGER,
    alignment TEXT,
    is_primary BOOLEAN,
    width INTEGER,
    height INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ni.id,
        ni.url,
        ni.alt_text,
        ni.position_in_content,
        ni.alignment,
        ni.is_primary,
        ni.width,
        ni.height
    FROM public.news_images ni
    WHERE ni.news_id = news_id_param
    ORDER BY 
        CASE WHEN ni.is_primary THEN 0 ELSE 1 END, -- Primaria primero
        ni.position_in_content ASC;
END;
$$ language plpgsql;

-- 8. Verificar la estructura creada
SELECT 'Tabla news_images creada:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'news_images' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Mostrar imágenes migradas
SELECT 'Imágenes migradas:' as info, count(*) as cantidad
FROM public.news_images;

-- 10. Mostrar ejemplo de imágenes por noticia
SELECT 
    n.title as noticia,
    ni.url,
    ni.is_primary,
    ni.position_in_content
FROM public.news n
LEFT JOIN public.news_images ni ON n.id = ni.news_id
ORDER BY n.title, ni.is_primary DESC, ni.position_in_content;