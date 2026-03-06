# Guía de Implementación: Sistema de Imágenes Múltiples en Contenido

Esta guía te ayudará a implementar el sistema de gestión de imágenes múltiples que permite insertar y posicionar imágenes a lo largo del contenido (similar al sistema de "Últimas Noticias").

## 📋 Tabla de Contenidos
1. [Estructura de Base de Datos](#1-estructura-de-base-de-datos)
2. [Funciones de Backend (API)](#2-funciones-de-backend-api)
3. [Componente de Gestión de Imágenes](#3-componente-de-gestión-de-imágenes)
4. [Renderizador de Contenido con Imágenes](#4-renderizador-de-contenido-con-imágenes)
5. [Integración en tu Formulario](#5-integración-en-tu-formulario)
6. [Tipos TypeScript](#6-tipos-typescript)

---

## 1. Estructura de Base de Datos

### 1.1 Tabla SQL (Para Supabase/PostgreSQL)

```sql
-- Crear tabla para múltiples imágenes
CREATE TABLE IF NOT EXISTS public.content_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.your_content_table(id) ON DELETE CASCADE,
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

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_content_images_content_id ON public.content_images(content_id);
CREATE INDEX IF NOT EXISTS idx_content_images_primary ON public.content_images(content_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_content_images_position ON public.content_images(content_id, position_in_content);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_content_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_content_images_updated_at
    BEFORE UPDATE ON public.content_images
    FOR EACH ROW
    EXECUTE FUNCTION update_content_images_updated_at();

-- Función para asegurar solo una imagen principal por contenido
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE public.content_images 
        SET is_primary = false 
        WHERE content_id = NEW.content_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER ensure_single_primary_image_trigger
    BEFORE INSERT OR UPDATE ON public.content_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_image();

-- Función helper para obtener imágenes
CREATE OR REPLACE FUNCTION get_content_images(content_id_param UUID)
RETURNS SETOF public.content_images AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.content_images
    WHERE content_id = content_id_param
    ORDER BY position_in_content ASC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener URL de imagen principal
CREATE OR REPLACE FUNCTION get_primary_image_url(content_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    image_url TEXT;
BEGIN
    SELECT url INTO image_url
    FROM public.content_images
    WHERE content_id = content_id_param AND is_primary = true
    LIMIT 1;
    
    RETURN image_url;
END;
$$ LANGUAGE plpgsql;

-- Función para establecer imagen principal
CREATE OR REPLACE FUNCTION set_primary_content_image(content_id_param UUID, image_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Desmarcar todas las imágenes principales de este contenido
    UPDATE public.content_images
    SET is_primary = false
    WHERE content_id = content_id_param;
    
    -- Marcar la imagen especificada como principal
    UPDATE public.content_images
    SET is_primary = true
    WHERE id = image_id_param AND content_id = content_id_param;
END;
$$ LANGUAGE plpgsql;
```

### 1.2 Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE public.content_images ENABLE ROW LEVEL SECURITY;

-- Política de lectura (todos pueden ver)
CREATE POLICY "Content images are viewable by everyone"
  ON public.content_images FOR SELECT
  USING (true);

-- Política de inserción (solo admins/profesores)
CREATE POLICY "Content images admin teacher insert"
  ON public.content_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Política de actualización (solo admins/profesores)
CREATE POLICY "Content images admin teacher update"
  ON public.content_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Política de eliminación (solo admins/profesores)
CREATE POLICY "Content images admin teacher delete"
  ON public.content_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );
```

---

## 2. Funciones de Backend (API)

### 2.1 Archivo: `lib/contentImages.ts`

```typescript
import { assertSupabaseClient } from './supabase'

export type ContentImage = {
  id: string
  content_id: string
  url: string
  alt_text: string | null
  position_in_content: number
  alignment: 'left' | 'right' | 'center'
  is_primary: boolean
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

export type ContentImagePayload = {
  content_id: string
  url: string
  alt_text?: string
  position_in_content?: number
  alignment?: 'left' | 'right' | 'center'
  is_primary?: boolean
  width?: number
  height?: number
}

// Obtener todas las imágenes de un contenido
export async function fetchContentImages(contentId: string): Promise<ContentImage[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase.rpc('get_content_images', {
    content_id_param: contentId
  })

  if (error) {
    console.error('Error fetching content images:', error)
    throw new Error(`Error al obtener imágenes: ${error.message}`)
  }

  return data || []
}

// Obtener la URL de la imagen principal
export async function fetchPrimaryImageUrl(contentId: string): Promise<string | null> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase.rpc('get_primary_image_url', {
    content_id_param: contentId
  })

  if (error) {
    console.error('Error fetching primary image:', error)
    return null
  }

  return data
}

// Crear una nueva imagen
export async function createContentImage(payload: ContentImagePayload): Promise<ContentImage> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('content_images')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Error creating content image:', error)
    throw new Error(`Error al crear imagen: ${error.message}`)
  }

  return data
}

// Actualizar una imagen existente
export async function updateContentImage(id: string, payload: Partial<ContentImagePayload>): Promise<ContentImage> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('content_images')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating content image:', error)
    throw new Error(`Error al actualizar imagen: ${error.message}`)
  }

  return data
}

// Eliminar una imagen
export async function deleteContentImage(id: string): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase
    .from('content_images')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting content image:', error)
    throw new Error(`Error al eliminar imagen: ${error.message}`)
  }
}

// Establecer imagen como principal
export async function setPrimaryImage(contentId: string, imageId: string): Promise<void> {
  const supabase = assertSupabaseClient()
  const { error } = await supabase.rpc('set_primary_content_image', {
    content_id_param: contentId,
    image_id_param: imageId
  })

  if (error) {
    console.error('Error setting primary image:', error)
    throw new Error(`Error al establecer imagen principal: ${error.message}`)
  }
}

// Obtener imágenes ordenadas por posición
export async function fetchImagesByPosition(contentId: string): Promise<ContentImage[]> {
  const supabase = assertSupabaseClient()
  const { data, error } = await supabase
    .from('content_images')
    .select('*')
    .eq('content_id', contentId)
    .order('position_in_content', { ascending: true })

  if (error) {
    console.error('Error fetching images by position:', error)
    throw new Error(`Error al obtener imágenes: ${error.message}`)
  }

  return data || []
}
```

### 2.2 Función de Upload de Archivos

Si no la tienes, necesitas una función para subir archivos:

```typescript
// lib/storage.ts
import { assertSupabaseClient } from './supabase'

export async function uploadPublicFile(
  bucket: string,
  file: File,
  options?: { directory?: string }
): Promise<{ publicUrl: string; path: string }> {
  const supabase = assertSupabaseClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = options?.directory 
    ? `${options.directory}/${fileName}` 
    : fileName

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Error al subir archivo: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return { publicUrl, path: filePath }
}
```

---

## 3. Componente de Gestión de Imágenes

### 3.1 Archivo: `components/ContentImageManager.tsx`

```typescript
import { useState, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, RotateCcw, Trash2, Star, StarOff } from 'lucide-react'
import type { ContentImage } from '../lib/contentImages'
import { 
  createContentImage, 
  deleteContentImage, 
  fetchContentImages, 
  setPrimaryImage, 
  updateContentImage 
} from '../lib/contentImages'
import { uploadPublicFile } from '../lib/storage'

type Props = {
  contentId: string | null
  onImagesChange: (images: ContentImage[]) => void
  disabled?: boolean
  allowTemporaryMode?: boolean
  onTemporaryImagesChange?: (images: ContentImage[]) => void
}

type ImageFormData = {
  url: string
  alt_text: string
  alignment: 'left' | 'right' | 'center'
  position_in_content: number
  width?: number
  height?: number
}

const INITIAL_FORM: ImageFormData = {
  url: '',
  alt_text: '',
  alignment: 'left',
  position_in_content: 1,
  width: undefined,
  height: undefined
}

export function ContentImageManager({ 
  contentId, 
  onImagesChange, 
  disabled = false, 
  allowTemporaryMode = false, 
  onTemporaryImagesChange 
}: Props) {
  const [images, setImages] = useState<ContentImage[]>([])
  const [temporaryImages, setTemporaryImages] = useState<ContentImage[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<ImageFormData>(INITIAL_FORM)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar imágenes cuando cambie el contentId
  useEffect(() => {
    if (contentId) {
      loadImages()
    } else if (allowTemporaryMode) {
      setImages([])
    } else {
      setImages([])
    }
  }, [contentId, allowTemporaryMode])

  // Notificar cambios
  useEffect(() => {
    const allImages = contentId ? images : temporaryImages
    onImagesChange(allImages)
    
    if (onTemporaryImagesChange) {
      onTemporaryImagesChange(temporaryImages)
    }
  }, [images, temporaryImages, contentId, onImagesChange, onTemporaryImagesChange])

  const loadImages = async () => {
    if (!contentId) return
    
    try {
      setLoading(true)
      const fetchedImages = await fetchContentImages(contentId)
      setImages(fetchedImages)
      onImagesChange(fetchedImages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar imágenes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true)
      setError(null)
      
      const result = await uploadPublicFile('content-images', file, { directory: 'uploads' })
      setFormData(prev => ({ ...prev, url: result.publicUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleAddImage = async () => {
    if (!formData.url.trim()) return

    try {
      setLoading(true)
      setError(null)

      if (contentId) {
        // Modo normal: guardar en base de datos
        const payload = {
          content_id: contentId,
          url: formData.url,
          alt_text: formData.alt_text || 'Imagen del contenido',
          alignment: formData.alignment,
          position_in_content: formData.position_in_content,
          is_primary: images.length === 0,
          width: formData.width,
          height: formData.height
        }

        await createContentImage(payload)
        await loadImages()
      } else if (allowTemporaryMode) {
        // Modo temporal
        const tempImage: ContentImage = {
          id: `temp-${Date.now()}`,
          content_id: 'temp',
          url: formData.url,
          alt_text: formData.alt_text || 'Imagen del contenido',
          alignment: formData.alignment,
          position_in_content: formData.position_in_content,
          is_primary: temporaryImages.length === 0,
          width: formData.width || null,
          height: formData.height || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        setTemporaryImages(prev => [...prev, tempImage])
      }
      
      setFormData(INITIAL_FORM)
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir imagen')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      if (imageId.startsWith('temp-')) {
        setTemporaryImages(prev => prev.filter(img => img.id !== imageId))
      } else {
        await deleteContentImage(imageId)
        await loadImages()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar imagen')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!contentId) return

    try {
      setLoading(true)
      setError(null)
      await setPrimaryImage(contentId, imageId)
      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al establecer imagen principal')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAlignment = async (imageId: string, alignment: 'left' | 'right' | 'center') => {
    try {
      setError(null)
      await updateContentImage(imageId, { alignment })
      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar alineación')
    }
  }

  const currentImages = contentId ? images : temporaryImages
  const isTemporaryMode = !contentId && allowTemporaryMode

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Gestión de Imágenes
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={disabled || loading}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Añadir Imagen
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Formulario para añadir imagen */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
          <h4 className="font-medium">Nueva Imagen</h4>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Imagen</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                disabled={uploadingFile}
                className="flex-1"
              />
              <span className="text-gray-500 px-2 py-1">o</span>
              <input
                type="url"
                placeholder="URL de la imagen"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
            {uploadingFile && <p className="text-blue-600 text-sm">Subiendo archivo...</p>}
          </div>

          {formData.url && (
            <div className="border rounded-lg p-2">
              <img 
                src={formData.url} 
                alt="Vista previa" 
                className="w-32 h-24 object-cover rounded"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Texto alternativo</label>
              <input
                type="text"
                value={formData.alt_text}
                onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Descripción de la imagen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Posición en contenido</label>
              <input
                type="number"
                min="1"
                value={formData.position_in_content}
                onChange={(e) => setFormData(prev => ({ ...prev, position_in_content: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Alineación</label>
              <select
                value={formData.alignment}
                onChange={(e) => setFormData(prev => ({ ...prev, alignment: e.target.value as 'left' | 'right' | 'center' }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ancho (px, opcional)</label>
              <input
                type="number"
                min="100"
                max="800"
                value={formData.width || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="400"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setFormData(INITIAL_FORM)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!formData.url.trim() || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Añadir Imagen
            </button>
          </div>
        </div>
      )}

      {/* Lista de imágenes */}
      <div className="space-y-3">
        {isTemporaryMode && currentImages.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              ⚠️ Modo temporal: Guarda el contenido primero para que las imágenes se almacenen permanentemente
            </p>
          </div>
        )}

        {loading && currentImages.length === 0 && (
          <div className="text-center py-8">
            <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Cargando imágenes...</p>
          </div>
        )}

        {currentImages.length === 0 && !loading && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No hay imágenes añadidas</p>
            <p className="text-sm text-gray-400">Haz clic en "Añadir Imagen" para comenzar</p>
          </div>
        )}

        {currentImages.map((image) => (
          <div key={image.id} className="border rounded-lg p-4 bg-white">
            <div className="flex gap-4">
              <img 
                src={image.url} 
                alt={image.alt_text || ''} 
                className="w-24 h-24 object-cover rounded"
              />
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{image.alt_text || 'Sin descripción'}</p>
                    <p className="text-xs text-gray-500">
                      Posición: {image.position_in_content} | Alineación: {image.alignment}
                    </p>
                  </div>
                  
                  {image.is_primary && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      Principal
                    </span>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!image.id.startsWith('temp-') && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={image.is_primary}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                      >
                        {image.is_primary ? <Star className="w-3 h-3 fill-current" /> : <StarOff className="w-3 h-3" />}
                        {image.is_primary ? 'Principal' : 'Marcar principal'}
                      </button>

                      <select
                        value={image.alignment}
                        onChange={(e) => handleUpdateAlignment(image.id, e.target.value as any)}
                        className="text-xs px-2 py-1 border rounded"
                      >
                        <option value="left">Izquierda</option>
                        <option value="center">Centro</option>
                        <option value="right">Derecha</option>
                      </select>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image.id)}
                    className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 4. Renderizador de Contenido con Imágenes

### 4.1 Archivo: `components/ContentRenderer.tsx`

```typescript
import { useEffect, useState } from 'react'
import type { ContentImage } from '../lib/contentImages'
import { fetchContentImages } from '../lib/contentImages'

type Props = {
  contentId: string
  content: string
  className?: string
}

export function ContentRenderer({ contentId, content, className = '' }: Props) {
  const [images, setImages] = useState<ContentImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadImages()
  }, [contentId])

  const loadImages = async () => {
    try {
      const fetchedImages = await fetchContentImages(contentId)
      setImages(fetchedImages)
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dividir el contenido en párrafos
  const paragraphs = content.split('\n').filter(p => p.trim())
  
  // Ordenar imágenes por posición
  const sortedImages = [...images].sort((a, b) => a.position_in_content - b.position_in_content)
  
  // Renderizar contenido con imágenes intercaladas
  const renderContentWithImages = () => {
    const elements: JSX.Element[] = []
    let imageIndex = 0

    paragraphs.forEach((paragraph, pIndex) => {
      // Añadir párrafo
      elements.push(
        <p key={`p-${pIndex}`} className="mb-4 text-gray-700 leading-relaxed">
          {paragraph}
        </p>
      )

      // Insertar imagen si corresponde a esta posición
      const image = sortedImages[imageIndex]
      if (image && image.position_in_content === pIndex + 1) {
        const alignmentClass = {
          left: 'float-left mr-4 mb-4',
          right: 'float-right ml-4 mb-4',
          center: 'mx-auto my-6 block'
        }[image.alignment]

        elements.push(
          <img
            key={`img-${image.id}`}
            src={image.url}
            alt={image.alt_text || ''}
            className={`rounded-lg shadow-md ${alignmentClass}`}
            style={{
              width: image.width ? `${image.width}px` : 'auto',
              height: image.height ? `${image.height}px` : 'auto',
              maxWidth: '100%'
            }}
          />
        )
        imageIndex++
      }
    })

    // Añadir imágenes restantes al final
    while (imageIndex < sortedImages.length) {
      const image = sortedImages[imageIndex]
      elements.push(
        <img
          key={`img-${image.id}`}
          src={image.url}
          alt={image.alt_text || ''}
          className="rounded-lg shadow-md mx-auto my-6 block"
          style={{
            width: image.width ? `${image.width}px` : 'auto',
            maxWidth: '100%'
          }}
        />
      )
      imageIndex++
    }

    return elements
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
  }

  return (
    <div className={`prose max-w-none ${className}`}>
      {renderContentWithImages()}
    </div>
  )
}
```

---

## 5. Integración en tu Formulario

### 5.1 Ejemplo de uso en un formulario de contenido

```typescript
import { useState } from 'react'
import { ContentImageManager } from './ContentImageManager'
import type { ContentImage } from '../lib/contentImages'

export function ContentForm() {
  const [formData, setFormData] = useState({
    id: null as string | null,
    title: '',
    content: '',
    // ... otros campos
  })
  const [images, setImages] = useState<ContentImage[]>([])
  const [temporaryImages, setTemporaryImages] = useState<ContentImage[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Guardar el contenido primero
    const savedContent = await createContent({
      title: formData.title,
      content: formData.content,
      // ... otros campos
    })

    // 2. Convertir imágenes temporales a permanentes
    if (temporaryImages.length > 0) {
      for (const tempImage of temporaryImages) {
        await createContentImage({
          content_id: savedContent.id,
          url: tempImage.url,
          alt_text: tempImage.alt_text || formData.title,
          alignment: tempImage.alignment,
          position_in_content: tempImage.position_in_content,
          is_primary: tempImage.is_primary,
          width: tempImage.width || undefined,
          height: tempImage.height || undefined
        })
      }
    }

    // 3. Actualizar estado
    setFormData(prev => ({ ...prev, id: savedContent.id }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campos del formulario */}
      <div>
        <label>Título</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <label>Contenido</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={10}
        />
      </div>

      {/* Gestor de imágenes */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <ContentImageManager
          contentId={formData.id}
          onImagesChange={setImages}
          onTemporaryImagesChange={setTemporaryImages}
          allowTemporaryMode={true}
        />
      </div>

      <button type="submit">
        Guardar
      </button>
    </form>
  )
}
```

---

## 6. Tipos TypeScript

### 6.1 Archivo: `types.ts`

```typescript
export type ContentImage = {
  id: string
  content_id: string
  url: string
  alt_text: string | null
  position_in_content: number
  alignment: 'left' | 'right' | 'center'
  is_primary: boolean
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

export type ContentImagePayload = {
  content_id: string
  url: string
  alt_text?: string
  position_in_content?: number
  alignment?: 'left' | 'right' | 'center'
  is_primary?: boolean
  width?: number
  height?: number
}
```

---

## 🚀 Pasos de Implementación

### Paso 1: Base de Datos
1. Ejecuta el script SQL en tu base de datos
2. Verifica que la tabla `content_images` se creó correctamente
3. Verifica las políticas RLS

### Paso 2: Backend
1. Crea el archivo `lib/contentImages.ts` con las funciones API
2. Asegúrate de tener la función `uploadPublicFile` en `lib/storage.ts`
3. Crea el bucket en Supabase Storage llamado `content-images` (público)

### Paso 3: Componentes
1. Crea `ContentImageManager.tsx` para gestión de imágenes
2. Crea `ContentRenderer.tsx` para renderizar contenido con imágenes
3. Integra ambos componentes en tu formulario

### Paso 4: Pruebas
1. Prueba añadir imágenes en modo temporal (sin guardar contenido)
2. Prueba guardar contenido con imágenes
3. Prueba editar imágenes existentes
4. Prueba marcar imagen como principal
5. Prueba el renderizado del contenido con imágenes

---

## 📝 Notas Importantes

1. **Modo Temporal**: Permite añadir imágenes antes de guardar el contenido
2. **Imagen Principal**: La primera imagen se marca automáticamente como principal
3. **Posiciones**: Las imágenes se insertan según su `position_in_content`
4. **Alineación**: Soporta izquierda, centro y derecha
5. **Ancho/Alto**: Opcional, permite controlar dimensiones

## 🎨 Personalización

Puedes personalizar:
- Estilos CSS de las imágenes
- Límite de imágenes por contenido
- Tamaño máximo de archivo
- Formatos permitidos
- Comportamiento de alineación

---

¡Con esta guía completa puedes implementar el sistema de imágenes múltiples en cualquier proyecto! 🎉
