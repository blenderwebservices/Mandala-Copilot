# Plan de Implementación: Vista de Gráfico de Gantt y Modo Proyecto

**Fecha y Hora**: 2026-10-05 15:05  
**Módulo**: Modo Proyecto / Diagrama de Gantt (`MandalaGanttView`, `types/mandala.ts`, `App.tsx`, `Navbar.tsx`)  
**Contexto**: Permitir a los usuarios visualizar, calendarizar y gestionar las 64 acciones del Mandala 9x9 como un cronograma completo de proyecto con fechas, dependencias (nodo anterior/nodo siguiente), progreso y ruta de ejecución.

---

## 1. Objetivos

1. **Ampliación del Modelo de Datos (`types/mandala.ts`)**:
   - Incorporar los nuevos atributos requeridos para las tareas (`MandalaAction`):
     - `startDate?: string` (fecha de inicio en formato ISO YYYY-MM-DD).
     - `endDate?: string` (fecha de fin en formato ISO YYYY-MM-DD).
     - `predecessorId?: string` (ID del nodo anterior / tarea previa condicionante).
     - `successorId?: string` (ID del nodo siguiente / tarea sucesora encadenada).
     - `progress?: number` (porcentaje de avance 0-100%).
     - `priority?: 'low' | 'medium' | 'high' | 'urgent'` (prioridad del entregable).
     - `status?: 'not_started' | 'in_progress' | 'completed' | 'blocked'` (estado operativo).
     - `assignee?: string` (responsable/asignado de la tarea).
     - `estimatedHours?: number` (estimación de esfuerzo).
     - `isMilestone?: boolean` (indicador de hito clave).

2. **Creación del Componente de Gráfico de Gantt (`components/MandalaGanttView.tsx`)**:
   - Interfaz con panel WBS (Work Breakdown Structure) a la izquierda y línea de tiempo interactiva a la derecha.
   - Escalas de visualización: Días, Semanas y Meses.
   - Agrupación por Pilares (las 8 fases/áreas maestras del Mandala).
   - Barras de cronograma estilizadas según los colores de cada pilar con barra de avance (`progress%`) interna.
   - Visualización de conexiones y dependencias (nodo anterior -> tarea actual -> nodo siguiente).
   - Línea indicadora de fecha actual ("Hoy").
   - Algoritmo inteligente de **Auto-programación ("Auto-programar Cronograma")** para proyectar de forma secuencial y balanceada las fechas y dependencias en cualquier meta que aún no tenga fechas asignadas.
   - Edición rápida inline y modal/drawer de ajuste de tarea (fechas, dependencias, prioridad, responsable y progreso).
   - Filtros por pilar, estado de tarea y búsqueda por texto.

3. **Integración en la Navegación y Estado Global (`Navbar.tsx` y `App.tsx`)**:
   - Ampliar `ActiveViewType` para incluir `'gantt'`.
   - Añadir el acceso al Gráfico de Gantt en el Navbar (escritorio y sub-navbar móvil) con icono alusivo (`CalendarRange` / `GanttChart`).
   - Conectar los eventos de actualización de tareas en `App.tsx` para sincronizar cambios en el estado del `Goal` y persistirlos automáticamente en `localStorage`.

---

## 2. Fases de Ejecución

- [ ] **Fase 1: Modelo de Datos (`types/mandala.ts`)**
  - Añadir los nuevos atributos opcionales a `MandalaAction`.
  - Asegurar retrocompatibilidad con las metas existentes y presets.
- [ ] **Fase 2: Componente Gantt (`components/MandalaGanttView.tsx`)**
  - Implementar lógica matemática de cálculo de fechas, offsets de días/semanas/meses, ancho de timeline y posicionamiento de barras.
  - Generar cálculo de dependencias y trazado de flechas/enlaces entre nodos predecesores y sucesores.
  - Implementar auto-programación automática secuencial para metas sin fechas.
  - Diseñar panel WBS colapsable con edición directa y controles estéticos premium (dark/light mode).
- [ ] **Fase 3: Integración en Navegación y Vistas (`Navbar.tsx`, `App.tsx`)**
  - Actualizar `ActiveViewType = 'grid' | 'hierarchy' | 'gantt' | 'goals'`.
  - Agregar botones y pestañas en el Navbar.
  - Integrar `<MandalaGanttView>` en `App.tsx` con handlers de actualización.
- [ ] **Fase 4: Verificación y Compilación**
  - Comprobar tipos con `npm run lint`.
  - Probar build con `npm run build`.
  - Verificar en el navegador y con curl.
  - Generar el reporte de entrega `docs/YYYY-MM-DD_HH-mm_walkthrough.md`.
