import { ActionType } from '../types/mandala';

export interface GeneratedAction {
  title: string;
  type: ActionType;
}

export interface RecalibrationResult {
  diagnosis: string;
  recommendation: string;
  replacementActions: GeneratedAction[];
  isAiGenerated?: boolean;
}

export interface WeeklyCheckinResult {
  overallAssessment: string;
  bottleneck: string;
  keyWins: string[];
  nextActions: string[];
  motivationalNote: string;
  isAiGenerated?: boolean;
}

export interface HaradaCriteria {
  isClear: boolean;
  isMeasurable: boolean;
  isChallenging: boolean;
}

export interface HaradaSuggestion {
  title: string;
  rationale: string;
}

export interface HaradaValidationResult {
  isCongruent: boolean;
  score: number;
  criteria: HaradaCriteria;
  diagnosis: string;
  recommendation: string;
  suggestions: HaradaSuggestion[];
  isAiGenerated?: boolean;
}

export type GeminiStatusType =
  | 'connected'
  | 'missing_key'
  | 'placeholder_key'
  | 'invalid_key'
  | 'quota_exceeded'
  | 'model_not_found'
  | 'error';

export interface GeminiStatusResult {
  ok: boolean;
  status: GeminiStatusType;
  message: string;
  details?: string;
  model: string;
  keyMasked?: string;
  latencyMs?: number;
  responseSample?: string;
  checkedAt: string;
  envPath?: string;
  envFound?: boolean;
  source?: string;
}

export interface PromptTestResult {
  ok: boolean;
  response: string;
  latencyMs: number;
  model: string;
  error?: string;
}

export async function fetchGeminiStatus(
  testKey?: string,
  testModel?: string,
  saveToEnv?: boolean
): Promise<GeminiStatusResult> {
  const isPost = testKey !== undefined || testModel !== undefined || saveToEnv !== undefined;
  const options: RequestInit = isPost
    ? {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: testKey, model: testModel, saveToEnv }),
      }
    : {
        method: 'GET',
      };

  const res = await fetch('/api/gemini-status', options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al consultar estado de Gemini');
  }
  return await res.json();
}

export async function testGeminiPrompt(
  prompt: string,
  model?: string,
  apiKey?: string
): Promise<PromptTestResult> {
  const res = await fetch('/api/gemini-test-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, apiKey }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Error en prueba de prompt');
  }
  return await res.json();
}

export async function fetchGeneratedPillars(
  goalTitle: string,
  goalContext?: string,
  focusPrompt?: string
): Promise<string[]> {
  const res = await fetch('/api/generate-pillars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalTitle, goalContext, focusPrompt }),
  });

  if (!res.ok) {
    throw new Error('Error al generar los pilares');
  }

  const data = await res.json();
  return data.pillars || [];
}

export async function fetchGeneratedActions(
  goalTitle: string,
  pillarTitle: string,
  allPillars?: string[],
  focusPrompt?: string
): Promise<GeneratedAction[]> {
  const res = await fetch('/api/generate-actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalTitle, pillarTitle, allPillars, focusPrompt }),
  });

  if (!res.ok) {
    throw new Error('Error al generar las acciones');
  }

  const data = await res.json();
  return data.actions || [];
}

export async function fetchBatchAllQuadrants(
  goalTitle: string,
  pillars: string[]
): Promise<GeneratedAction[][]> {
  const res = await fetch('/api/generate-all-quadrants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalTitle, pillars }),
  });

  if (!res.ok) {
    throw new Error('Error al generar la cuadrícula completa');
  }

  const data = await res.json();
  return data.quadrants || [];
}

export async function fetchRecalibration(
  goalTitle: string,
  pillarTitle: string,
  actionTitle: string,
  actionType: string,
  feedbackReason?: string
): Promise<RecalibrationResult> {
  const res = await fetch('/api/recalibrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalTitle, pillarTitle, actionTitle, actionType, feedbackReason }),
  });

  if (!res.ok) {
    throw new Error('Error al recalibrar la acción');
  }

  return await res.json();
}

export async function fetchWeeklyCheckin(
  goalTitle: string,
  stats: any
): Promise<WeeklyCheckinResult> {
  const res = await fetch('/api/weekly-checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalTitle, stats }),
  });

  if (!res.ok) {
    throw new Error('Error al ejecutar el check-in semanal');
  }

  return await res.json();
}

export async function fetchHaradaValidation(
  goalTitle: string,
  goalContext?: string
): Promise<HaradaValidationResult> {
  const res = await fetch('/api/validate-harada-goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalTitle, goalContext }),
  });

  if (!res.ok) {
    throw new Error('Error al validar la meta con el Método Harada');
  }

  return await res.json();
}

