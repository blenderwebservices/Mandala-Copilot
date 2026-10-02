# Plan de Implementación: Impresión del Documento Interpretado (.md) sin Modal

**Fecha y Hora:** 2026-10-02 16:38 (Zona horaria local)  
**Proyecto:** Mandala Copilot AI  
**Referencia:** Cumplimiento de directivas de [`AGENTS.md`](file:///Users/francisco/Herd/Mandala-Copilot/AGENTS.md)

---

## 🎯 Requerimiento del Usuario

> *"Al mandar a imprimir, en Imprimir / PDF, manda a imprimir la ventana modal, no el documento en si, corrige esta situacion mandando a imprimir el documento con el .md correctamente interpretado"*

### Diagnóstico del Problema Actual
1. **Impresión de la ventana modal**: En [`components/ExportPrintModal.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/ExportPrintModal.tsx), `handlePrint()` ejecuta directamente `window.print()`. Como el modal está abierto en pantalla con posición fija (`fixed inset-0`) y fondo oscuro con desenfoque (`backdrop-blur-md`), el navegador envía a la impresora o PDF la caja del diálogo del modal con sus botones ("Imprimir / PDF", "Copiar Markdown", etc.), el fondo oscuro cortado y la cuadrícula de fondo, en lugar del contenido del documento.
2. **Falta de interpretación de Markdown para impresión**: El documento no se renderiza como documento imprimible formateado (con títulos, citas de contexto, casillas de verificación, barras de progreso y estructura de pilares), sino que solo existía como una pequeña caja de texto monoespaciado crudo.

---

## 🏗️ Solución Propuesta

### 1. Servicio / Generador de Documento Imprimible Interpretado (`services/printService.ts`)
- Implementar una función dedicada `printMandalaDocument(goal: Goal)` que:
  - Genere un documento HTML limpio, autocontenido y estilizado para impresión (formato A4/Carta con márgenes adecuados, tipografía ejecutiva, soporte de color para PDF `-webkit-print-color-adjust: exact`).
  - Interprete y formatee la estructura completa del Mandala Chart:
    - **Encabezado**: Título del documento/meta, metadatos (fecha, total de pilares, total de acciones).
    - **Contexto Estratégico**: Bloque de cita ejecutiva estilizada (`blockquote`).
    - **Métricas de Progreso**: Porcentaje completado, barra de progreso visual, desglose de Hábitos vs Tareas.
    - **8 Pilares Estratégicos (8×8)**:
      - Distribución en 2 columnas balanceadas para aprovechar el papel.
      - Reglas de salto de página `break-inside: avoid;` para no cortar pilares por la mitad.
      - 64 acciones con casillas de verificación (`☑` completada / `☐` pendiente), etiquetas de tipo (Hábito/Tarea) y notas.
    - **Pie de página**: Leyenda de auditoría y fecha/hora.
  - Ejecute la impresión a través de un iframe invisible aislado, garantizando que:
    - **Cero elementos de la UI modal** aparezcan en el PDF o papel.
    - El tema oscuro de la aplicación no afecte la impresión (fondo blanco nítido, texto oscuro legible).
    - Funcione de manera instantánea y confiable en Chrome, Safari, Firefox y Edge.

### 2. Actualización de [`components/ExportPrintModal.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/ExportPrintModal.tsx)
- Reemplazar el `handlePrint` básico para llamar a `printMandalaDocument(goal)`.
- Añadir un selector de pestañas en la vista previa:
  - **"Vista Interpretada"** (por defecto): Previsualiza el documento maquetado tal cual saldrá en la impresión / PDF.
  - **"Markdown Crudo (.md)"**: Mantiene la visualización del texto markdown original y la opción de copiar al portapapeles.
- Agregar clases `.no-print` en el contenedor del modal como salvaguarda adicional.

### 3. Reglas Globales en [`index.css`](file:///Users/francisco/Herd/Mandala-Copilot/index.css)
- Reforzar `@media print` para ocultar automáticamente modales (`[role="dialog"]`, `.fixed`, `.no-print`), headers y navegaciones ante cualquier llamada a imprimir desde el sistema.

---

## 🔍 Plan de Validación
1. Verificar compilación TypeScript con `npx tsc --noEmit`.
2. Verificar build de Vite con `npm run build`.
3. Probar la apertura del modal "Imprimir / Exportar" y pulsar "Imprimir / PDF".
4. Verificar que el documento generado en la cola de impresión contenga únicamente el documento formateado e interpretado, sin modales ni fondos.
5. Generar reporte de entrega en `docs/2026-10-02_16-38_walkthrough.md`.
