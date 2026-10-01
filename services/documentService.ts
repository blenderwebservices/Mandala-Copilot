import { Goal, MandalaDocument, Pillar, MandalaAction } from "../types/mandala";

/**
 * Creates a standardized MandalaDocument wrapper around a Goal.
 */
export function createDocument(goal: Goal): MandalaDocument {
  return {
    version: "1.0",
    format: "mandala-document",
    exportedAt: new Date().toISOString(),
    source: "Mandala Copilot 9x9",
    goal: JSON.parse(JSON.stringify(goal)),
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

  const safeTitle = (customName || goal.title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ_\s-]/gi, "")
    .replace(/\s+/g, "-")
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
 * Parses and validates raw JSON string into a Goal.
 * Supports both wrapped MandalaDocument format and raw Goal format.
 */
export function parseDocumentJson(jsonString: string): { success: boolean; goal?: Goal; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);

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

    // Sanitize and normalize pillars and actions
    const sanitizedPillars: Pillar[] = rawGoal.pillars.map((p: any, pIdx: number) => {
      const actions: MandalaAction[] = Array.isArray(p.actions)
        ? p.actions.map((a: any, aIdx: number) => ({
            id: a.id || `a-${pIdx}-${aIdx}-${Date.now()}`,
            position: typeof a.position === "number" ? a.position : aIdx,
            title: typeof a.title === "string" && a.title.trim() ? a.title : `Acción ${aIdx + 1}`,
            type: a.type === "recurring" ? "recurring" : "one_time",
            isCompleted: Boolean(a.isCompleted),
            completedAt: a.completedAt || undefined,
            streakCount: typeof a.streakCount === "number" ? a.streakCount : 0,
            habitDays: Array.isArray(a.habitDays) && a.habitDays.length === 7
              ? a.habitDays.map(Boolean)
              : [false, false, false, false, false, false, false],
            isStuck: Boolean(a.isStuck),
            notes: typeof a.notes === "string" ? a.notes : undefined,
          }))
        : [];

      return {
        id: p.id || `p-${pIdx}-${Date.now()}`,
        position: typeof p.position === "number" ? p.position : pIdx,
        title: typeof p.title === "string" && p.title.trim() ? p.title : `Pilar ${pIdx + 1}`,
        colorTheme: p.colorTheme || "Indigo",
        actions,
      };
    });

    const normalizedGoal: Goal = {
      id: rawGoal.id || `goal-${Date.now()}`,
      title: rawGoal.title.trim(),
      context: typeof rawGoal.context === "string" ? rawGoal.context : undefined,
      status: ["draft", "active", "completed", "abandoned"].includes(rawGoal.status)
        ? rawGoal.status
        : "active",
      createdAt: rawGoal.createdAt || new Date().toISOString(),
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
 * Reads a File object and parses it as a Goal document.
 */
export function readDocumentFile(file: File): Promise<{ success: boolean; goal?: Goal; error?: string }> {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, error: "No se seleccionó ningún archivo." });
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
 * Creates a duplicate of a Goal with fresh IDs and an updated title.
 */
export function duplicateGoal(goal: Goal, newTitleSuffix = "(Copia)"): Goal {
  const timestamp = Date.now();
  const cloned = JSON.parse(JSON.stringify(goal)) as Goal;

  cloned.id = `goal-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
  cloned.title = `${cloned.title} ${newTitleSuffix}`.trim();
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
