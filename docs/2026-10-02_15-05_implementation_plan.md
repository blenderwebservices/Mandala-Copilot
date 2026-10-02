# Plan de Implementación: Limpieza de Enlaces en Navbar y Guardado Inteligente con Detección de Cambios

**Fecha y Hora:** 2026-10-02 15:05 (Zona horaria local)  
**Proyecto:** Mandala Copilot AI  
**Referencia:** Cumplimiento de directivas de [`AGENTS.md`](file:///Users/francisco/Herd/Mandala-Copilot/AGENTS.md)

---

## 🎯 Requerimientos del Usuario

1. **Eliminar Enlaces Duplicados a "Abrir" y "Guardar"**:
   - Eliminar los enlaces que son solo iconos en la barra de navegación ([`components/Navbar.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/Navbar.tsx)).
   - Conservar exclusivamente los enlaces que incluyen tanto icono como texto/título (*"Abrir"* y *"Guardar"* en la navegación principal).

2. **Guardado con Sobrescritura por Defecto y Detección de Cambios**:
   - Al guardar un documento, la opción predeterminada debe ser **sobrescribir sobre el documento que se había abierto**, guardando los cambios recién hechos en la matriz.
   - **Detección de cambios recientes**:
     - Comparar el estado actual del documento con su instantánea de referencia (línea base al abrir o último guardado).
     - Si **no ha habido cambios recientes**: notificar con claridad al usuario (*"No se han detectado cambios recientes" / "El documento está al día"*), deshabilitando o señalando que no se requiere guardar, pero permitiendo forzar guardado o descarga si lo desea.
     - Si **hay cambios recientes**: destacar como acción principal y por defecto *"Guardar cambios en este documento (Sobrescribir)"*, actualizando la fecha de modificación y la instantánea base.

---

## 🏗️ Cambios Arquitectónicos y Componentes

### 1. [`components/Navbar.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/Navbar.tsx)
- Retirar el bloque de botones rápidos de solo icono de la Zona 3 (`FolderOpen` y `Save` sin etiqueta).
- Mantener los botones con icono y título en el `<nav>` principal:
  - `<FolderOpen /> Abrir`
  - `<Save /> Guardar`

### 2. Detección de Cambios y Línea Base de Guardado ([`App.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/App.tsx) y [`components/DocumentManagerModal.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/DocumentManagerModal.tsx))
- **Mecanismo de Detección**:
  - Mantener un snapshot de referencia (`lastSavedSnapshot` o hash representativo del documento abierto: título, contexto, 8 pilares con sus títulos, acciones, estados de completado y hábitos).
  - Al abrir un documento (o cargar inicialmente la matriz), se establece el snapshot base.
  - Al abrir el modal de guardado (`DocumentManagerModal`), calcular `hasChanges = currentSnapshot !== baselineSnapshot`.
- **Experiencia de Usuario en la pestaña "Guardar"**:
  - **Estado Con Cambios**:
    - Badge visible: `● Cambios pendientes detectados`.
    - Botón primario por defecto: **"Guardar Cambios (Sobrescribir documento abierto)"** con icono `Save` y estilo destacado.
    - Opciones secundarias: *"Guardar y Descargar (.mandala)"* y *"Guardar como Copia"*.
  - **Estado Sin Cambios Recientes**:
    - Banner informativo: `✓ No hay cambios recientes que guardar. Este documento ya se encuentra sincronizado con su última versión guardada (HH:MM).`
    - Botón primario ajustado a *"Documento al día"* con posibilidad de re-guardar o descargar archivo.

---

## 🔍 Verificación y Pruebas
1. `npx tsc --noEmit` para verificar tipado.
2. `npm run build` para asegurar compilación limpia en Vite y esbuild.
3. Validación en el navegador y con pruebas automáticas.
4. Generación del reporte de entrega en `docs/2026-10-02_15-05_walkthrough.md`.
