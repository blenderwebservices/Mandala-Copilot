import { Goal, MandalaDocument, Pillar, MandalaAction } from "../types/mandala";

/**
 * Maximum document file size (5MB) to protect against memory exhaustion (DoS).
 */
export const MAX_DOC_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Structural element caps to prevent excessive memory/render loop degradation.
 */
export const MAX_PILLARS_PER_GOAL = 16;
export const MAX_ACTIONS_PER_PILLAR = 32;
export const MAX_TEXT_LENGTH = 300;
export const MAX_CONTEXT_LENGTH = 2000;

/**
 * Deeply sanitizes any incoming object by discarding prototype pollution vectors
 * (__proto__, constructor, prototype) across the entire hierarchy.
 */
export function stripPollution<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => stripPollution(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue; // Discard hazardous pollution properties
    }
    clean[key] = typeof value === "object" && value !== null ? stripPollution(value) : value;
  }
  return clean as T;
}

/**
 * Creates a standardized MandalaDocument wrapper around a Goal.
 */
export function createDocument(goal: Goal): MandalaDocument {
  return {
    version: "1.0",
    format: "mandala-document",
    exportedAt: new Date().toISOString(),
    source: "Mandala Copilot 9x9",
    goal: stripPollution(JSON.parse(JSON.stringify(goal))),
  };
}

/**
 * Exports and triggers a download of a Goal as a .mandala document file.
 */
export function downloadDocumentFile(goal: Goal, customName?: string): void {
  const mandalaDoc = createDocument(goal);
  const jsonStr = JSON.stringify(mandalaDoc, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Strict sanitization of filename to prevent path traversal or invalid characters
  const rawTitle = customName || goal.title || "documento-meta";
  const safeTitle =
    rawTitle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúüñ_\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/\.{2,}/g, "")
      .substring(0, 50) || "documento-meta";

  const filename = `${safeTitle}.mandala.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates raw JSON string into a Goal with strict schema and pollution protection.
 * Supports both wrapped MandalaDocument format and raw Goal format.
 */
export function parseDocumentJson(jsonString: string): { success: boolean; goal?: Goal; error?: string } {
  try {
    const rawParsed = JSON.parse(jsonString);
    const parsed = stripPollution(rawParsed);

    let rawGoal: any = null;

    if (parsed && typeof parsed === "object") {
      if (parsed.format === "mandala-document" && parsed.goal) {
        rawGoal = parsed.goal;
      } else if (parsed.title && Array.isArray(parsed.pillars)) {
        rawGoal = parsed;
      }
    }

    if (!rawGoal) {
      return {
        success: false,
        error: "El archivo no contiene un formato de documento de meta válido.",
      };
    }

    if (!rawGoal.title || typeof rawGoal.title !== "string" || !rawGoal.title.trim()) {
      return {
        success: false,
        error: "El documento no tiene un título de meta válido.",
      };
    }

    if (!Array.isArray(rawGoal.pillars) || rawGoal.pillars.length === 0) {
      return {
        success: false,
        error: "El documento no contiene pilares estratégicos.",
      };
    }

    // Sanitize and normalize pillars and actions with finite bounds
    const boundedPillars = rawGoal.pillars.slice(0, MAX_PILLARS_PER_GOAL);

    const sanitizedPillars: Pillar[] = boundedPillars.map((p: any, pIdx: number) => {
      const rawActions = Array.isArray(p.actions) ? p.actions.slice(0, MAX_ACTIONS_PER_PILLAR) : [];

      const actions: MandalaAction[] = rawActions.map((a: any, aIdx: number) => ({
        id: typeof a.id === "string" && a.id.trim() ? a.id.substring(0, 50) : `a-${pIdx}-${aIdx}-${Date.now()}`,
        position: typeof a.position === "number" && isFinite(a.position) ? Math.max(0, Math.min(64, a.position)) : aIdx,
        title:
          typeof a.title === "string" && a.title.trim()
            ? a.title.trim().substring(0, MAX_TEXT_LENGTH)
            : `Acción ${aIdx + 1}`,
        type: a.type === "recurring" ? "recurring" : "one_time",
        isCompleted: Boolean(a.isCompleted),
        completedAt: typeof a.completedAt === "string" ? a.completedAt.substring(0, 50) : undefined,
        streakCount:
          typeof a.streakCount === "number" && isFinite(a.streakCount)
            ? Math.max(0, Math.min(10000, Math.round(a.streakCount)))
            : 0,
        habitDays:
          Array.isArray(a.habitDays) && a.habitDays.length === 7
            ? a.habitDays.map(Boolean)
            : [false, false, false, false, false, false, false],
        isStuck: Boolean(a.isStuck),
        notes: typeof a.notes === "string" ? a.notes.trim().substring(0, MAX_CONTEXT_LENGTH) : undefined,
      }));

      return {
        id: typeof p.id === "string" && p.id.trim() ? p.id.substring(0, 50) : `p-${pIdx}-${Date.now()}`,
        position: typeof p.position === "number" && isFinite(p.position) ? Math.max(0, Math.min(16, p.position)) : pIdx,
        title:
          typeof p.title === "string" && p.title.trim()
            ? p.title.trim().substring(0, MAX_TEXT_LENGTH)
            : `Pilar ${pIdx + 1}`,
        colorTheme: typeof p.colorTheme === "string" ? p.colorTheme.substring(0, 30) : "Indigo",
        actions,
      };
    });

    const normalizedGoal: Goal = {
      id: typeof rawGoal.id === "string" && rawGoal.id.trim() ? rawGoal.id.substring(0, 60) : `goal-${Date.now()}`,
      title: rawGoal.title.trim().substring(0, MAX_TEXT_LENGTH),
      context:
        typeof rawGoal.context === "string" && rawGoal.context.trim()
          ? rawGoal.context.trim().substring(0, MAX_CONTEXT_LENGTH)
          : undefined,
      status: ["draft", "active", "completed", "abandoned"].includes(rawGoal.status) ? rawGoal.status : "active",
      createdAt: typeof rawGoal.createdAt === "string" ? rawGoal.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pillars: sanitizedPillars,
    };

    return { success: true, goal: normalizedGoal };
  } catch (err: any) {
    return {
      success: false,
      error: `Error al leer el archivo JSON: ${err.message || "Estructura inválida"}`,
    };
  }
}

/**
 * Reads a File object and parses it as a Goal document with strict file size checking.
 */
export function readDocumentFile(file: File): Promise<{ success: boolean; goal?: Goal; error?: string }> {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, error: "No se seleccionó ningún archivo." });
      return;
    }

    // Protection against Memory DoS / Out-of-Memory (Pilar 6 - Checklist 11)
    if (file.size > MAX_DOC_FILE_SIZE) {
      resolve({
        success: false,
        error: `El archivo supera el tamaño máximo permitido (${MAX_DOC_FILE_SIZE / (1024 * 1024)} MB).`,
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        resolve({ success: false, error: "El archivo está vacío." });
        return;
      }
      const result = parseDocumentJson(content);
      resolve(result);
    };

    reader.onerror = () => {
      resolve({ success: false, error: "No se pudo leer el archivo seleccionado." });
    };

    reader.readAsText(file);
  });
}

/**
 * Creates a duplicate of a Goal with fresh IDs and an updated title, protected against prototype pollution.
 */
export function duplicateGoal(goal: Goal, newTitleSuffix = "(Copia)"): Goal {
  const timestamp = Date.now();
  const cloned = stripPollution(JSON.parse(JSON.stringify(goal))) as Goal;

  cloned.id = `goal-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
  cloned.title = `${cloned.title} ${newTitleSuffix}`.trim().substring(0, MAX_TEXT_LENGTH);
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = new Date().toISOString();

  cloned.pillars = cloned.pillars.map((p, pIdx) => ({
    ...p,
    id: `p-${pIdx}-${timestamp}`,
    actions: p.actions.map((a, aIdx) => ({
      ...a,
      id: `a-${pIdx}-${aIdx}-${timestamp}`,
    })),
  }));

  return cloned;
}

/**
 * Generates a deterministic content fingerprint string to detect changes in a Goal.
 */
export function getGoalFingerprint(goal: Goal | null | undefined): string {
  if (!goal) return "";
  return JSON.stringify({
    title: (goal.title || "").trim(),
    context: (goal.context || "").trim(),
    pillars: (goal.pillars || []).map((p) => ({
      title: (p.title || "").trim(),
      actions: (p.actions || []).map((a) => ({
        title: (a.title || "").trim(),
        type: a.type,
        isCompleted: !!a.isCompleted,
        streakCount: a.streakCount || 0,
        habitDays: a.habitDays || [],
      })),
    })),
  });
}
