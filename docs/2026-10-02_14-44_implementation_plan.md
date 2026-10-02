# Plan de Implementación: Regeneración de Pilares y Acciones con IA y Manualmente (Meta Principal y por Cada Pilar)

**Fecha y Hora:** 2026-10-02 14:44 (Zona horaria local)  
**Proyecto:** Mandala Copilot AI  
**Referencia:** Cumplimiento de directivas de [`AGENTS.md`](file:///Users/francisco/Herd/Mandala-Copilot/AGENTS.md)

---

## 🎯 Objetivo de la Tarea

Recuperar y potenciar la funcionalidad solicitada por el usuario:
1. **Desde el formulario de la Meta Principal**:
   - Poder regenerar los **8 Pilares** con IA (con o sin directriz de enfoque/prompt personalizado) o modificarlos manualmente.
   - Poder regenerar las **Acciones** (desglose 8x8 completo o por pilares) con IA o restablecerlas/editarlas manualmente.
2. **Desde Cada Pilar**:
   - Poder regenerar las 8 acciones de dicho pilar con **IA** (con prompt de enfoque o un solo clic).
   - Poder regenerar / estructurar las 8 acciones **manualmente** (mediante un editor rápido de los 8 slots, opciones para pegar lista de 8 tareas, limpiar o usar plantillas predeterminadas).
   - Acceso rápido a estas acciones tanto desde el modal de zoom del pilar (`PillarFocusModal`) como directamente desde la cuadrícula 9x9 (`MandalaGrid9x9`).

---

## 🏗️ Arquitectura y Componentes a Implementar

### 1. Nuevo Componente: Modal / Formulario de la Meta Principal (`components/MainGoalModal.tsx`)
- **Acceso intuitivo**:
  - Al hacer clic en el cuadrante central **"META"** de la matriz 9x9 (que ahora tendrá estado hover interactivo, badge e icono `Edit3`/`Sparkles`).
  - Botón *"Editar y Regenerar Meta"* en el banner superior de la matriz 9x9.
- **Formulario de la Meta**:
  - Edición del título (`title`) y contexto/restricciones (`context`).
  - **Pestaña / Bloque de Pilares**:
    - Vista de los 8 pilares con edición en línea inmediata.
    - Campo de enfoque ("Hazlos más centrados en ventas", "Enfoque técnico", etc.).
    - Botón **"Regenerar 8 Pilares con IA"** con spinner de carga.
    - Opción de restaurar o reordenar manualmente.
  - **Pestaña / Bloque de Acciones**:
    - Botón **"Regenerar las 64 Acciones con IA (8x8)"** con barra de progreso reactiva pilar por pilar (1 a 8).
    - Opción de **"Regenerar Acciones Manualmente"** (reiniciar las 64 acciones con borrador limpio para llenado manual).
  - Botón **"Guardar Cambios"** que persiste en el estado global (`App.tsx`) y `localStorage`.

### 2. Actualización de `components/PillarFocusModal.tsx` (Enfoque en Cada Pilar)
- **Regeneración con IA**:
  - Botón destacado y directo **"Regenerar con IA"** (con opción de añadir prompt de matiz o ejecutar regeneración instantánea).
  - Indicador de estado de carga mientras Gemini genera las 8 acciones.
- **Regeneración Manual**:
  - Botón **"Regenerar Manualmente"** que abre una vista interactiva de los 8 slots:
    - 8 campos de entrada numerados (A1..A8) con selector de tipo (*Tarea Única* vs *Hábito*).
    - Área para **Pegar 8 líneas de texto** (divide automáticamente saltos de línea en las 8 acciones).
    - Botón de **"Limpiar todas las acciones"** para empezar de cero.
    - Botón **"Aplicar Acciones Manuales"**.

### 3. Actualización de `components/MandalaGrid9x9.tsx`
- Celda central de la Meta (`cell.isCenterGoal`): Convertida de un simple `div` estático a un botón interactivo accesible con animación hover, tooltip y badge *"Editar / Regenerar"*.
- Banner superior de la meta: Incorporación de botón rápido con icono `Sparkles` / `Edit3` para abrir el formulario de la Meta Principal.
- En cada uno de los 8 macrobloques de pilares exteriores:
  - Botón de acción rápida con icono `Sparkles` para regenerar con IA directamente desde la cuadrícula.
  - Al hacer clic en el pilar central del cuadrante o en el botón de zoom, se accede a las opciones completas de regeneración con IA y manual.

### 4. Integración en `App.tsx`
- Estado `isMainGoalModalOpen` para controlar la apertura del modal de la Meta Principal.
- Handlers para:
  - Actualizar meta y contexto.
  - Regenerar pilares con IA para la meta activa.
  - Regenerar todas las acciones (8x8) para la meta activa.
  - Regenerar acciones de un pilar específico (con IA o manualmente).
- Conexión de props con `MandalaGrid9x9`, `MainGoalModal` y `PillarFocusModal`.

---

## 🔍 Plan de Pruebas y Validación

1. **Prueba de Compilación y Tipos**:
   - `npx tsc --noEmit` sin ningún error de TypeScript.
2. **Prueba de Build**:
   - `npm run build` sin advertencias críticas.
3. **Prueba Funcional en Navegador / Subagente**:
   - Abrir el formulario de la Meta Principal desde la celda central o el banner.
   - Ejecutar la regeneración de pilares con IA.
   - Modificar manualmente un pilar y regenerar las acciones con IA.
   - Abrir un pilar individual y regenerar sus acciones con IA.
   - Regenerar manualmente las acciones de un pilar pegando texto o editando los 8 slots.
   - Verificar la persistencia de cambios en `localStorage` y en la vista 9x9.
