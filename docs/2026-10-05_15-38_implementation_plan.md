# Plan de Implementación: Búsqueda y Filtro Global Persistente en Todas las Vistas

**Fecha y Hora**: 2026-10-05 15:38  
**Módulo**: Filtro y Búsqueda Global (`GlobalFilterBar.tsx`, `App.tsx`, `MandalaGrid9x9.tsx`, `MandalaHierarchyView.tsx`, `MandalaGanttView.tsx`, `GoalsLibraryView.tsx`)  
**Contexto**: Búsqueda por palabras clave y filtro por estado de actividades que persista al cambiar entre las vistas (Matriz 9x9, Jerárquica, Gantt, Metas).

---

## 1. Objetivos

1. **Estado Centralizado y Persistente en `App.tsx`**:
   - Crear un estado compartido `searchQuery: string` y `statusFilter: GlobalFilterStatus` en `App.tsx`.
   - Garantizar que al cambiar de vista (`activeView === 'grid'`, `'hierarchy'`, `'gantt'`, `'goals'`), los términos de búsqueda y los filtros permanezcan activos sin reiniciarse.

2. **Componente de Barra de Búsqueda y Filtros (`components/GlobalFilterBar.tsx`)**:
   - Cuadro de búsqueda por texto con icono, limpieza rápida y atajo de teclado (`⌘K` / `Esc`).
   - Filtros de estado:
     - `Todos` (todas las 64 acciones).
     - `Pendientes` (acciones no completadas).
     - `Completadas` (acciones finalizadas con check verde).
     - `En Progreso` (acciones con avance > 0 o estado `in_progress`).
     - `Bloqueadas` (acciones con `isStuck` o estado `blocked`).
     - `Hábitos / Recurrentes` (acciones tipo `recurring` con seguimiento de racha).
     - `Tareas Únicas` (acciones de una sola vez).
   - Contador de coincidencias en tiempo real (ejemplo: *"4 actividades encontradas: 3 completadas, 1 pendiente"*).
   - Botón de "Limpiar filtros" cuando haya criterios activos.

3. **Adaptación de las Vistas para Reflejar el Filtro y Estado**:
   - **Matriz 9x9 (`MandalaGrid9x9.tsx`)**:
     - Resaltado visual de celdas coincidentes con anillo de brillo e insignia de estado.
     - Atenuación (`opacity-25`) de las celdas que no coincidan para destacar instantáneamente las actividades buscadas en la matriz espacial.
     - Indicador en el centro de cada bloque 3x3 con el número de coincidencias del pilar.
   - **Vista Jerárquica (`MandalaHierarchyView.tsx`)**:
     - Sincronización con el estado global de búsqueda y estado.
     - Auto-expansión automática de los pilares que contienen actividades coincidentes.
   - **Vista de Gantt (`MandalaGanttView.tsx`)**:
     - Sincronización con el estado global.
     - Filtrado sincronizado tanto en la tabla WBS como en las barras temporales del Gantt.
   - **Biblioteca de Metas (`GoalsLibraryView.tsx`)**:
     - Filtro por título y descripción de documentos cuando se navega en la biblioteca.

---

## 2. Fases de Ejecución

- [ ] **Fase 1: Componente `components/GlobalFilterBar.tsx`**
  - Implementar la barra con campo de texto reactivo, badges de estado con conteos dinámicos, botón de limpiar y soporte responsive.
- [ ] **Fase 2: Conexión del Estado en `App.tsx`**
  - Declarar `searchQuery` y `statusFilter`.
  - Renderizar `<GlobalFilterBar>` de forma persistente.
  - Pasar los props de búsqueda y filtro a `MandalaGrid9x9`, `MandalaHierarchyView`, `MandalaGanttView` y `GoalsLibraryView`.
- [ ] **Fase 3: Integración en `MandalaGrid9x9.tsx`**
  - Agregar lógica de coincidencia (búsqueda + estado).
  - Aplicar resaltado / opacidad en celdas y badges de estado.
- [ ] **Fase 4: Integración en `MandalaHierarchyView.tsx` y `MandalaGanttView.tsx`**
  - Conectar los filtros externos controlados.
- [ ] **Fase 5: Pruebas, Compilación y Walkthrough**
  - Verificar con `npm run lint`.
  - Compilar con `npm run build`.
  - Reiniciar servidor y verificar respuesta.
  - Generar el reporte `docs/YYYY-MM-DD_HH-mm_walkthrough.md`.
