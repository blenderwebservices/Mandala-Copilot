import { ActionType } from '../types/mandala';

export interface GeneratedAction {
  title: string;
  type: ActionType;
}

export interface RecalibrationResult {
  diagnosis: string;
  recommendation: string;
  replacementActions: GeneratedAction[];
}

export interface WeeklyCheckinResult {
  overallAssessment: string;
  bottleneck: string;
  keyWins: string[];
  nextActions: string[];
  motivationalNote: string;
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
