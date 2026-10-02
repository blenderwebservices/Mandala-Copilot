# Plan de Implementación: Opción "Guardar como ..." con Nombre Personalizado

**Fecha y Hora:** 2026-10-02 15:25 (Zona horaria local)  
**Proyecto:** Mandala Copilot AI  
**Referencia:** Cumplimiento de directivas de [`AGENTS.md`](file:///Users/francisco/Herd/Mandala-Copilot/AGENTS.md)

---

## 🎯 Requerimiento del Usuario

> *"Tambien da una opcion para "Guardar como ..." para poder guardar con otro nombre el archivo actual"*

Añadir una opción explícita y completa de **"Guardar como ..."** que permita al usuario:
1. Asignar un nuevo nombre/título al documento actual.
2. Guardarlo como un nuevo documento independiente en la biblioteca local y establecerlo como el documento activo en la matriz.
3. Descargar el nuevo archivo `.mandala` con el nombre recién especificado.
4. Tener acceso directo tanto desde la barra de navegación principal ([`components/Navbar.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/Navbar.tsx)), como desde una pestaña dedicada en el gestor de documentos ([`components/DocumentManagerModal.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/DocumentManagerModal.tsx)) y atajo de teclado (`Cmd+Shift+S` / `Ctrl+Shift+S`).

---

## 🏗️ Cambios Arquitectónicos y Componentes

### 1. Extensión del Tipo de Pestaña ([`components/DocumentManagerModal.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/DocumentManagerModal.tsx))
- Actualizar `DocumentModalTab` para soportar `"open" | "save" | "saveAs"`.
- Añadir la pestaña **"Guardar como ..."** en el selector superior con icono `Copy` y estilo visual consistente.

### 2. Pestaña y Flujo de "Guardar como ..." en [`DocumentManagerModal.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/DocumentManagerModal.tsx)
- **Formulario de Nuevo Nombre**:
  - Campo de entrada destacado: *Nuevo nombre del documento / meta* (prellenado por sugerencia con el título actual + " (Copia)" pero editable libremente).
  - Campo de descripción/contexto estratégico.
  - Resumen métrico del documento que se va a duplicar (8 pilares, 64 acciones).
- **Acciones Disponibles**:
  - **"Guardar como Nuevo Documento"** (Acción Principal): Clona la estructura completa con nuevo ID y el nombre especificado, lo añade a la biblioteca y lo abre en la matriz.
  - **"Guardar como y Descargar Archivo (.mandala)"**: Guarda el nuevo documento y genera inmediatamente la descarga local en formato `.mandala` con el nuevo nombre sanitizado.
- **Acceso Cruzado**:
  - En la pestaña "Guardar" habitual, enlace rápido para conmutar a "Guardar como ...".

### 3. Integración en [`Navbar.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/Navbar.tsx)
- Añadir el enlace con icono y título:
  `<button onClick={() => onOpenDocumentModal("saveAs")}> <Copy /> Guardar como... </button>`
  en la barra principal de navegación.

### 4. Integración en [`App.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/App.tsx)
- Atajo de teclado estándar: `Cmd+Shift+S` / `Ctrl+Shift+S` para abrir directamente la pestaña "Guardar como ...".
- Handler para duplicar/guardar con nombre personalizado: `handleSaveGoalAs(customTitle, customContext, downloadFile?)`.

---

## 🔍 Plan de Pruebas y Validación
1. `npx tsc --noEmit` para verificar tipos.
2. `npm run build` para asegurar compilación limpia en Vite y esbuild.
3. Probar la apertura desde Navbar, desde el atajo y desde el selector de pestañas.
4. Generar el reporte de entrega en `docs/2026-10-02_15-25_walkthrough.md`.
