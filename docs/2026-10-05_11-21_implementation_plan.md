# Plan de Implementación: Validación de Metas según el Método Harada (Clara, Medible y Desafiante) con Sugerencias Asistidas por IA

## Objetivo
Implementar un sistema de análisis inteligente con IA durante la creación o edición de metas que evalúe si el enunciado propuesto por el usuario cumple con el principio fundamental del Método Harada para el Objetivo Central:
> *"El Objetivo Central (Centro): En la casilla central de toda la cuadrícula (el centro del bloque 3x3 del medio) se escribe el objetivo principal, el cual debe ser claro, medible y desafiante."*

Si la IA detecta incongruencia, vaguedad o falta de métricas/plazo, presentará un diagnóstico constructivo y ofrecerá exactamente **3 metas alternativas reformuladas** alineadas con la intención del usuario y la rigurosidad del Método Harada, permitiendo adoptarlas con un solo clic.

---

## Requisitos y Especificaciones

### 1. Endpoint Backend en Express (`server.ts`)
- **Ruta**: `POST /api/validate-harada-goal`
- **Entrada**: `{ goalTitle: string, goalContext?: string }`
- **Evaluación mediante Gemini**:
  - Evaluación de los 3 criterios del Método Harada:
    1. **Claridad** (específico, concreto, sin ambigüedades).
    2. **Medibilidad** (criterio cuantitativo, número, porcentaje, plazo o resultado tangible verificable).
    3. **Nivel de Desafío** (ambicioso, que justifique desplegar 8 pilares estratégicos y 64 acciones).
  - Cálculo de `isCongruent` (boolean) y `score` (0 a 100).
  - Diagnóstico conciso explicando qué elemento le falta o qué fortalezas tiene.
  - Generación de **exactamente 3 alternativas reformuladas** que respeten la idea original del usuario pero con estructura impecable de Harada.
  - Fallback heurístico inteligente en caso de que la API de Gemini no esté configurada o no haya conexión.

### 2. Capa de Servicios Frontend (`services/api.ts`)
- Definir interfaces:
  - `HaradaCriteria`: `{ isClear: boolean; isMeasurable: boolean; isChallenging: boolean }`
  - `HaradaSuggestion`: `{ title: string; rationale: string }`
  - `HaradaValidationResult`:
    - `isCongruent: boolean`
    - `score: number`
    - `criteria: HaradaCriteria`
    - `diagnosis: string`
    - `recommendation: string`
    - `suggestions: HaradaSuggestion[]`
    - `isAiGenerated: boolean`
- Función exportada: `validateHaradaGoal(goalTitle: string, goalContext?: string): Promise<HaradaValidationResult>`.

### 3. Interfaz de Usuario en Creación de Metas (`components/OnboardingModal.tsx`)
- En el **Paso 1 (Tu Gran Meta)**:
  - Botón interactivo: `[✨ Validar y Optimizar con Método Harada]`.
  - Al hacer clic (o al pulsar "Siguiente / Generar Pilares" si la meta es muy corta o vaga):
    - Muestra estado de análisis con animación de IA.
    - Si la meta necesita refinamiento o no es congruente:
      - Despliega tarjeta visual con los 3 criterios Harada (Clara: ✓/✗, Medible: ✓/✗, Desafiante: ✓/✗).
      - Muestra el diagnóstico y las **3 sugerencias reformuladas**.
      - Cada sugerencia incluye botón `[Usar esta meta]` para sustituir el campo al instante.
      - Opción clara para el usuario: "Continuar con mi redacción original" o "Adoptar sugerencia".

### 4. Soporte en Modal de Edición de Meta Principal (`components/MainGoalModal.tsx`)
- Integrar la misma capacidad de validación y sugerencias Harada en el modal de edición para permitir que metas ya existentes también puedan ser optimizadas en cualquier momento.

---

## Fases de Ejecución

1. **Fase 1**: Añadir endpoint `POST /api/validate-harada-goal` en `server.ts` con llamada a Gemini GenAI SDK y fallback estructurado.
2. **Fase 2**: Añadir tipos y función `validateHaradaGoal` en `services/api.ts`.
3. **Fase 3**: Integrar el componente/bloque de validación y las 3 sugerencias en `components/OnboardingModal.tsx`.
4. **Fase 4**: Añadir la validación en `components/MainGoalModal.tsx`.
5. **Fase 5**: Compilación (`npm run lint`, `npm run build`), prueba funcional y generación de walkthrough en `docs/`.
