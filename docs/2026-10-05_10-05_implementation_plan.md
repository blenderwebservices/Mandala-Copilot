# Plan de Implementación: Vista Jerárquica Móvil y Flexible (Niveles Meta -> Pilares -> Acciones)

## Objetivo
Implementar una vista alternativa jerárquica (Tree / Acordeón multinivel) para Mandala Copilot que resuelva las limitaciones de espacio en celulares y pantallas estrechas, ofreciendo paridad funcional total con la Matriz 9×9 tradicional.

---

## Requisitos y Especificaciones

1. **Jerarquía Visual de 3 Niveles**:
   - **Nivel 1 (Meta Central)**:
     - Cabecera con título de la meta activa, contexto descriptivo y porcentaje de avance global.
     - Indicador de hábitos en racha (`🔥`).
     - Botón de edición y regeneración con IA (`MainGoalModal`).
     - Botón de Check-in Semanal (`WeeklyCheckinModal`).
     - Botón para Expandir / Colapsar todos los pilares.
     - Filtros de estado (`Todas`, `Pendientes`, `Hábitos`, `Tareas Únicas`).
   - **Nivel 2 (8 Pilares)**:
     - Acordeón temático respetando la paleta de colores de cada pilar (`PILLAR_COLORS`).
     - Barra de progreso individual (0% a 100%) y badge numérico (`01..08`).
     - Botón de regeneración de acciones con IA (`Sparkles`).
     - Botón de Foco / Zoom (`Maximize2`) para abrir el `PillarFocusModal`.
     - Flecha / chevron para expandir y contraer el contenido del pilar.
   - **Nivel 3 (Acciones de cada Pilar)**:
     - Fila táctil con altura cómoda (mínimo 44px) con soporte interactivo.
     - Checkbox/toggle de completado a la izquierda con animación y tachado.
     - Numeración de acción (`01..08`) y título editable in-line o mediante tap.
     - Selector de días de la semana `[L M X J V S D]` para hábitos recurrentes con contador de racha.
     - Botones al final de la línea:
       - Toggle de tipo: Tarea Única (`Target`) ↔ Hábito (`RotateCw`).
       - Edición de título (`Edit3`).
       - Recalibración inteligente con IA (`Zap` / `Sparkles`) que abre `RecalibrateModal`.

2. **Navegación e Integración de Vistas**:
   - Selector en `Navbar.tsx` con opciones:
     - **Matriz 9×9** (`Grid3X3`)
     - **Jerárquica** (`ListTree`)
     - **Documentos** (`FolderKanban`)
   - Soporte tanto en desktop como en dispositivos móviles (barra de navegación móvil / responsive).
   - Detección responsive inicial: Si el ancho de pantalla es móvil (`< 768px`), la vista predeterminada es la Jerárquica para evitar el scroll horizontal forzado.

3. **Arquitectura y Archivos Involucrados**:
   - `components/MandalaHierarchyView.tsx` (Nuevo componente).
   - `App.tsx` (Soporte para `activeView: 'grid' | 'hierarchy' | 'goals'`, generalización de handlers).
   - `components/Navbar.tsx` (Botón de vista jerárquica y controles responsive).

---

## Fases de Ejecución

1. **Fase 1**: Crear `components/MandalaHierarchyView.tsx` con soporte completo de niveles, filtros, acordeones, edición inline y botones al final de línea.
2. **Fase 2**: Actualizar `App.tsx` para incorporar `'hierarchy'` en `activeView`, adaptar los manejadores de eventos (edición de título, hábitos, tipo, recalibración con pilar específico) y renderizar la nueva vista.
3. **Fase 3**: Actualizar `Navbar.tsx` con la nueva opción de navegación tanto en desktop como en la vista móvil.
4. **Fase 4**: Validación visual y funcional en navegador (modo móvil y desktop), asegurando que todas las acciones (completar, recalibrar, editar, alternar días y tipos) funcionen idénticamente a la matriz 9×9.
5. **Fase 5**: Crear reporte de entrega en `docs/2026-10-05_HH-mm_walkthrough.md`.
