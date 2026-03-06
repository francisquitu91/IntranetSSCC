# Solución: Error de reproducción de videos de YouTube

## 🐛 Problema
Al subir URLs de YouTube, los videos mostraban el error: 
"Se produjo un error. Vuelve a intentarlo más tarde (ID de reproducción: ...)"

## ✅ Solución Implementada

### Causa del problema:
La conversión simple `.replace('watch?v=', 'embed/')` no manejaba correctamente todos los formatos de URL de YouTube ni extraía correctamente el ID del video.

### Mejoras realizadas:

#### 1. **Función robusta para YouTube** ([GalleryPage.tsx](../src/components/gallery/GalleryPage.tsx))
```typescript
const getYouTubeEmbedUrl = (url: string): string | null => {
  // Soporta múltiples formatos:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - URLs con parámetros adicionales
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/,
    /youtube\.com\/embed\/([^&\?\/]+)/,
    /youtube\.com\/v\/([^&\?\/]+)/,
  ]
  
  // Extrae el ID y construye URL embed correcta
  return `https://www.youtube.com/embed/${videoId}`
}
```

#### 2. **Función para Vimeo**
Similar para videos de Vimeo, extrae el ID numérico correctamente.

#### 3. **Atributos correctos del iframe**
Agregados permisos necesarios:
```html
<iframe
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

#### 4. **Mensaje de ayuda en el formulario** ([GalleryManager.tsx](../src/components/dashboard/GalleryManager.tsx))
Agregado texto de ayuda para que los admins sepan qué formatos son válidos:
- ✅ YouTube: `youtube.com/watch?v=...` o `youtu.be/...`
- ✅ Vimeo: `vimeo.com/123456`
- ✅ Videos directos: `.mp4`, `.webm`, `.ogg`

## 🧪 Formatos de URL Soportados

### YouTube:
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s`
- `https://www.youtube.com/embed/dQw4w9WgXcQ`

### Vimeo:
- `https://vimeo.com/123456789`
- `https://player.vimeo.com/video/123456789`

### Videos directos:
- Cualquier URL que termine en `.mp4`, `.webm`, `.ogg`, `.mov`

## 🎯 Cómo probar:

1. **Como Admin:**
   - Ve al Panel Institucional → Galería
   - Pega una URL de YouTube (por ejemplo: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
   - Asigna a un curso
   - Publica

2. **Como Estudiante:**
   - Ve a "Galería fotos/videos" 
   - Haz clic en el video
   - El video debería reproducirse sin errores

## 🔧 Si persiste el problema:

1. **Verifica la URL:** Copia la URL directamente desde la barra de direcciones del navegador al ver el video en YouTube
2. **Restricciones del video:** Algunos videos de YouTube tienen restricciones de incrustación y no se pueden mostrar en iframes
3. **Videos privados:** Los videos privados o no listados pueden no funcionar

## 💡 Tip:
Si un video específico no funciona por restricciones de YouTube, prueba descargar el video y subirlo directamente como archivo, o usa un video diferente.
