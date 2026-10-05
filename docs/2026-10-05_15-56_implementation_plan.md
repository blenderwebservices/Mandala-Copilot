# Plan de Implementación: Búsqueda Insensible a Acentos y Diacríticos

**Fecha y Hora**: 2026-10-05 15:56  
**Módulo**: Utilidades de Búsqueda (`services/searchUtils.ts`, `App.tsx`, `MandalaGrid9x9.tsx`, `MandalaHierarchyView.tsx`, `MandalaGanttView.tsx`, `GoalsLibraryView.tsx`)  
**Contexto**: Permitir que la búsqueda incluya palabras acentuadas sin importar si el usuario escribe con tildes o sin tildes (ej: "metodo" encuentra "método", "habitos" encuentra "hábitos", "autenticación" encuentra "autenticacion").

---

## 1. Objetivos

1. **Creación del Módulo de Normalización (`services/searchUtils.ts`)**:
   - Implementar función `normalizeText(text: string): string` utilizando descomposición canónica Unicode (`NFD`) y remoción de diacríticos (`/[\u0300-\u036f]/g`).
   - Implementar función `matchTextAccentInsensitive(targetText: string, queryText: string): boolean` con soporte para subcadenas completas y múltiples términos separados por espacios.

2. **Integración en Todas las Vistas y Componentes**:
   - **`App.tsx`**: Cálculo de estadísticas (`globalFilterStats`) de coincidencias en tiempo real usando normalización insensible a tildes sobre título, notas, pilar y responsable.
   - **`MandalaGrid9x9.tsx`**: Resaltado y conteo de celdas 9x9 insensible a acentos.
   - **`MandalaHierarchyView.tsx`**: Filtrado de lista y auto-expansión insensible a acentos.
   - **`MandalaGanttView.tsx`**: Filtrado de tareas WBS y barras temporales en el cronograma insensible a acentos.
   - **`GoalsLibraryView.tsx`**: Búsqueda en biblioteca de metas y documentos insensible a acentos.

---

## 2. Fases de Ejecución

- [ ] **Fase 1: Módulo `services/searchUtils.ts`**
  - Crear utilidades `normalizeText` y `matchTextAccentInsensitive`.
- [ ] **Fase 2: Conexión en `App.tsx`**
  - Aplicar `matchTextAccentInsensitive` al cálculo de coincidencias globales.
- [ ] **Fase 3: Conexión en `MandalaGrid9x9.tsx`, `MandalaHierarchyView.tsx`, `MandalaGanttView.tsx`, `GoalsLibraryView.tsx`**
  - Reemplazar comparaciones simples `includes(query)` con la función insensible a tildes.
- [ ] **Fase 4: Verificación y Walkthrough**
  - Chequeo de tipos `npm run lint`.
  - Compilación `npm run build`.
  - Reinicio y validación de servidor.
  - Guardar reporte de entrega `docs/YYYY-MM-DD_HH-mm_walkthrough.md`.
