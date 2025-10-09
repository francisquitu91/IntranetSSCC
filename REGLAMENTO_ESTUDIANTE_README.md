# 📄 Visor de Documentos - Reglamento Estudiantil

## ✅ **Funcionalidad Implementada**

### **🎯 Objetivo**
Permitir a los estudiantes ver el reglamento estudiantil en un iframe que ocupe **toda la pantalla** de manera cómoda y accesible.

### **📍 Ubicación**
- **Sidebar** → **"Reglamento estudiante"**
- Al hacer clic se abre el visor en pantalla completa

### **🔧 Componentes Creados**

#### **1. DocumentViewer.tsx**
Componente modal que maneja la visualización de documentos:

**✅ Características:**
- **Pantalla completa** con overlay semi-transparente
- **Header** con título del documento y botón cerrar
- **Iframe optimizado** para Google Drive
- **Conversión automática** de URL de Google Drive a formato embebido
- **Controles de teclado** (ESC para cerrar)
- **Click fuera** para cerrar
- **Prevención de scroll** del body cuando está abierto

#### **2. Sidebar.tsx (Modificado)**
Añadidas funcionalidades:

**✅ Nuevas características:**
- **Estado para visor** de documentos
- **Función handleMenuClick()** para manejar clicks en elementos del menú
- **Configuración específica** para "Reglamento estudiante"
- **Integración** del componente DocumentViewer

### **🚀 Funcionamiento**

#### **Flujo de Usuario:**
1. **Hacer clic** en "Reglamento estudiante" en el sidebar
2. **Se abre** el visor en pantalla completa
3. **Ver documento** en iframe de Google Drive
4. **Cerrar** con ESC, botón X, o click fuera

#### **URL de Google Drive:**
- **Original**: `https://drive.google.com/file/d/1ykHcLBgMiPX2ScHWS2jCHni4F2DAE26F/view?usp=sharing`
- **Convertida**: `https://drive.google.com/file/d/1ykHcLBgMiPX2ScHWS2jCHni4F2DAE26F/preview`

### **💡 Características Técnicas**

#### **✅ Conversión de URL**
- **Extrae automáticamente** el ID del archivo de la URL original
- **Convierte** a formato `/preview` para mejor visualización en iframe
- **Funciona** con cualquier documento público de Google Drive

#### **✅ UX/UI Optimizada**
- **Overlay con blur** para mejor enfoque
- **Instrucciones visuales** (tecla ESC)
- **Responsive** y accesible
- **Loading lazy** para mejor rendimiento

#### **✅ Controles de Accesibilidad**
- **aria-label** en botones
- **keyboard navigation** (ESC)
- **focus management** al abrir/cerrar
- **scroll prevention** en body

### **🎨 Estilos CSS Añadidos**

```css
/* Overlay con efecto blur */
.document-viewer-overlay {
  backdrop-filter: blur(4px);
}

/* Iframe sin bordes */
.document-viewer-iframe {
  border: none;
  width: 100%;
  height: 100%;
}

/* Estilos para teclas del teclado */
kbd {
  display: inline-block;
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  background-color: #374151;
  color: #f9fafb;
  border-radius: 0.25rem;
  border: 1px solid #6b7280;
}
```

### **🔧 Extensibilidad**

#### **Fácil Añadir Más Documentos**
En `handleMenuClick()` del Sidebar:

```typescript
case 'Otro Documento':
  setCurrentDocument({
    url: 'https://drive.google.com/file/d/OTRO_ID/view?usp=sharing',
    title: 'Título del Documento'
  })
  setShowDocumentViewer(true)
  break
```

### **🚀 Para Probar**

1. **Servidor corriendo**: http://localhost:5173/
2. **Login**: `administrador@ssccmanquehue.cl` / `MISTERIO2002` 
   o `fsotomayor@ssccmanquehue.cl` / `misterio2002`
3. **Hacer clic** en "Reglamento estudiante" en el sidebar
4. **¡Ver documento en pantalla completa!**

### **✅ Resultado**
- ✅ **Iframe de pantalla completa** funcionando
- ✅ **Google Drive** documento integrado
- ✅ **UX optimizada** con controles intuitivos
- ✅ **Código reutilizable** para otros documentos
- ✅ **Accesible** y responsive

## 🎉 **¡Reglamento estudiantil disponible en pantalla completa!**