# Plan de Implementación: Detección y Carga Resiliente de .env en Producción

**Fecha y Hora**: 2026-10-06 12:21  
**Módulo**: Backend Express y Diagnóstico de IA (`server.ts`, `server.js`, `services/api.ts`, `components/AiStatusModal.tsx`)  
**Contexto**: El usuario configuró el archivo `.env` a nivel de la raíz del sitio en producción, pero la aplicación no reconoce las variables `GEMINI_API_KEY` ni `GEMINI_MODEL`.

---

## 1. Análisis de Causas

1. **Discrepancia de Rutas en Servidores de Producción (Plesk / cPanel / Passenger)**:
   - En servidores web, la "raíz del sitio" (ej. `/var/www/vhosts/dominio.com/`) está un nivel por encima del "Document Root / Application Root" (ej. `/var/www/vhosts/dominio.com/httpdocs/`).
   - El código actual solo busca en `path.resolve(__dirname, ".env")` y `process.cwd()`. Si el archivo `.env` está en el directorio superior (`../.env`), es ignorado.
2. **Rigidez en Nomenclatura de Variables**:
   - Si el usuario definió `VITE_GEMINI_API_KEY`, `GOOGLE_API_KEY` o `VITE_GEMINI_MODEL`, el servidor no las toma en cuenta.
3. **Falta de Retroalimentación de Diagnóstico en la UI**:
   - El modal de estado de IA no reporta en qué ruta física del servidor se está buscando o si se detectó el archivo `.env`.

---

## 2. Objetivos de la Solución

1. **Búsqueda Multi-Ruta de `.env` en `server.ts`**:
   - Implementar función `resolveEnvFilePath()` que evalúe secuencialmente:
     - `__dirname/.env` (directorio del ejecutable)
     - `process.cwd()/.env` (directorio de trabajo del proceso)
     - `path.resolve(__dirname, "..", ".env")` (directorio padre de `server.js`, común en Plesk cuando `.env` está fuera de `httpdocs`)
     - `path.resolve(process.cwd(), "..", ".env")` (directorio padre del cwd)
2. **Compatibilidad de Nombres de Variables**:
   - API Key: `GEMINI_API_KEY` || `VITE_GEMINI_API_KEY` || `GOOGLE_API_KEY`.
   - Modelo: `GEMINI_MODEL` || `VITE_GEMINI_MODEL` || `"gemini-2.5-flash"`.
3. **Escritura Inteligente en `POST /api/gemini-status`**:
   - Si se detecta un archivo `.env` existente (incluso en `../.env`), actualizar ese archivo específico.
4. **Visibilidad en Diagnóstico (`/api/gemini-status` y `AiStatusModal.tsx`)**:
   - Reportar la ruta detectada (o las rutas exploradas) y si la clave proviene de `.env` o del sistema operativo / panel de hosting.
5. **Recompilación y Entrega**:
   - Ejecutar `npm run build` para regenerar `dist/` y `server.js`.
   - Documentar en walkthrough y dar instrucciones claras para el entorno de producción.

---

## 3. Fases de Ejecución

- [ ] **Fase 1: Actualizar `server.ts`**
  - Implementar resolución de rutas candidatas para `.env`.
  - Fallbacks de variables de entorno.
  - Enriquecer `checkGeminiHealth` y `POST /api/gemini-status` con metadatos de ruta.
- [ ] **Fase 2: Actualizar `services/api.ts` y `components/AiStatusModal.tsx`**
  - Añadir tipado de diagnóstico para `envPath` y `envFound`.
  - Mostrar badge informativo de ruta `.env` en el modal.
- [ ] **Fase 3: Validación y Compilación**
  - Ejecutar verificación de tipos `npm run lint`.
  - Ejecutar compilación `npm run build`.
- [ ] **Fase 4: Documentación y Entrega**
  - Generar walkthrough en `docs/2026-10-06_12-25_walkthrough.md`.
