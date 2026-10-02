import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial load
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = 3000;

// Security Headers Middleware (Pilar 8 - Checklist 15)
app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
  next();
});

// Explicit JSON request body size limit to prevent memory exhaustion (DoS)
app.use(express.json({ limit: "1mb" }));

// Helper to dynamically read latest configuration from .env
function loadEnvConfig() {
  const envPath = path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  } else {
    dotenv.config({ override: true });
  }
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  return { apiKey, model, envPath };
}

function maskApiKey(key: string): string {
  if (!key) return "(no configurada)";
  if (key === "MY_GEMINI_API_KEY" || key.includes("MY_GEMINI_API_KEY")) {
    return "MY_GEMINI_API_KEY (plantilla por defecto)";
  }
  if (key.length <= 8) return "****";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

function getAiClient(customApiKey?: string) {
  const { apiKey } = loadEnvConfig();
  const keyToUse = customApiKey !== undefined && customApiKey.trim() !== "" ? customApiKey.trim() : apiKey;
  return new GoogleGenAI({
    apiKey: keyToUse,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Deep health check for Gemini API key and model availability
async function checkGeminiHealth(targetKey?: string, targetModel?: string) {
  const { apiKey: envKey, model: envModel } = loadEnvConfig();
  const apiKey = targetKey !== undefined && targetKey.trim() !== "" ? targetKey.trim() : envKey;
  const model = targetModel !== undefined && targetModel.trim() !== "" ? targetModel.trim() : envModel;

  if (!apiKey) {
    return {
      ok: false,
      status: "missing_key",
      message: "No se ha configurado la variable GEMINI_API_KEY en el archivo .env",
      details: "El archivo .env no tiene definida una clave API o está vacía.",
      model,
      keyMasked: maskApiKey(apiKey),
      checkedAt: new Date().toISOString(),
    };
  }

  if (apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_GEMINI_API_KEY")) {
    return {
      ok: false,
      status: "placeholder_key",
      message: "GEMINI_API_KEY tiene el valor por defecto de plantilla (\"MY_GEMINI_API_KEY\")",
      details: "Obtén tu clave gratuita en Google AI Studio (https://aistudio.google.com/app/apikey) y reemplázala en tu archivo .env o en el modal de configuración.",
      model,
      keyMasked: maskApiKey(apiKey),
      checkedAt: new Date().toISOString(),
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  const t0 = Date.now();
  try {
    const result = await ai.models.generateContent({
      model,
      contents: "Responde únicamente la palabra OK",
      config: {
        maxOutputTokens: 10,
      },
    });
    const latencyMs = Date.now() - t0;
    const responseSample = result.text?.trim() || "OK";

    return {
      ok: true,
      status: "connected",
      message: `Conexión con Gemini exitosa. El modelo \"${model}\" está operativo.`,
      model,
      keyMasked: maskApiKey(apiKey),
      latencyMs,
      responseSample,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    const latencyMs = Date.now() - t0;
    const errMsg = error.message || String(error);
    let status = "error";
    let userMessage = "Error al comunicarse con la API de Google Gemini.";

    if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid") || errMsg.includes("INVALID_ARGUMENT")) {
      status = "invalid_key";
      userMessage = "Clave API inválida o incorrecta. Verifica que la hayas copiado completa desde Google AI Studio.";
    } else if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429")) {
      status = "quota_exceeded";
      userMessage = "Límite de cuota o peticiones excedido (429 Too Many Requests).";
    } else if (errMsg.includes("NOT_FOUND") || errMsg.includes("models/")) {
      status = "model_not_found";
      userMessage = `El modelo \"${model}\" no fue encontrado o no está disponible con esta clave. Prueba seleccionando \"gemini-2.5-flash\".`;
    }

    return {
      ok: false,
      status,
      message: userMessage,
      details: errMsg,
      model,
      keyMasked: maskApiKey(apiKey),
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  }
}

// ==========================================
// 0. AI Health & Status Diagnostics Endpoints
// ==========================================

// Check current server status (GET)
app.get("/api/gemini-status", async (_req: Request, res: Response) => {
  const result = await checkGeminiHealth();
  return res.json(result);
});

// Test custom key or save directly to .env (POST)
app.post("/api/gemini-status", async (req: Request, res: Response) => {
  const { apiKey, model, saveToEnv } = req.body;

  if (saveToEnv && typeof apiKey === "string" && apiKey.trim() !== "") {
    const cleanKey = apiKey.trim();

    // Strict validation to prevent .env file injection (Pilar 8)
    if (!/^[a-zA-Z0-9_\-\.]{8,256}$/.test(cleanKey)) {
      return res.status(400).json({
        ok: false,
        status: "invalid_key_format",
        message: "Formato de API Key no válido. No se permiten espacios, saltos de línea ni caracteres de control.",
      });
    }

    const cleanModel = typeof model === "string" ? model.trim() : "";
    if (cleanModel && !/^[a-zA-Z0-9\.\-]{3,60}$/.test(cleanModel)) {
      return res.status(400).json({
        ok: false,
        status: "invalid_model_format",
        message: "Identificador de modelo no válido.",
      });
    }

    try {
      const envPath = path.resolve(__dirname, ".env");
      let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

      // Replace or append GEMINI_API_KEY safely
      if (/^GEMINI_API_KEY=.*$/m.test(content)) {
        content = content.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY="${cleanKey}"`);
      } else {
        content += `\nGEMINI_API_KEY="${cleanKey}"\n`;
      }

      // Replace or append GEMINI_MODEL if specified safely
      if (cleanModel) {
        if (/^GEMINI_MODEL=.*$/m.test(content)) {
          content = content.replace(/^GEMINI_MODEL=.*$/m, `GEMINI_MODEL="${cleanModel}"`);
        } else {
          content += `\nGEMINI_MODEL="${cleanModel}"\n`;
        }
      }

      fs.writeFileSync(envPath, content, "utf8");
      console.log("💾 Updated .env file safely with validated Gemini configuration");
    } catch (saveErr: any) {
      console.error("Failed to write to .env:", saveErr);
    }
  }

  const result = await checkGeminiHealth(apiKey, model);
  return res.json(result);
});

// Live prompt execution test (Playground)
app.post("/api/gemini-test-prompt", async (req: Request, res: Response) => {
  const { prompt, model, apiKey } = req.body;
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "prompt is required" });
  }

  // Prevent token exhaustion DoS
  if (prompt.length > 2000) {
    return res.status(400).json({ error: "El prompt supera el límite permitido de 2,000 caracteres." });
  }

  const { model: envModel } = loadEnvConfig();
  const modelToUse = (typeof model === "string" && /^[a-zA-Z0-9\.\-]{3,60}$/.test(model.trim())) ? model.trim() : envModel;
  const ai = getAiClient(apiKey);

  const t0 = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        maxOutputTokens: 250,
      },
    });
    const latencyMs = Date.now() - t0;
    return res.json({
      ok: true,
      response: response.text || "(Respuesta vacía)",
      latencyMs,
      model: modelToUse,
    });
  } catch (err: any) {
    const latencyMs = Date.now() - t0;
    return res.status(500).json({
      ok: false,
      error: err.message || "Error al ejecutar el prompt de prueba",
      latencyMs,
      model: modelToUse,
    });
  }
});

// ==========================================
// 1. Generate 8 Strategic Pillars
// ==========================================
app.post("/api/generate-pillars", async (req: Request, res: Response) => {
  const { goalTitle, goalContext, focusPrompt } = req.body;

  if (!goalTitle || typeof goalTitle !== "string" || !goalTitle.trim()) {
    return res.status(400).json({ error: "goalTitle is required" });
  }

  // Bound user inputs to prevent prompt ballooning / token exhaustion
  const safeGoalTitle = goalTitle.trim().substring(0, 300);
  const safeGoalContext = typeof goalContext === "string" ? goalContext.trim().substring(0, 1500) : "";
  const safeFocusPrompt = typeof focusPrompt === "string" ? focusPrompt.trim().substring(0, 500) : "";

  const { model } = loadEnvConfig();
  const ai = getAiClient();

  try {
    const prompt = `Meta principal: "${safeGoalTitle}".
Contexto adicional: "${safeGoalContext || "Sin contexto adicional"}".
${safeFocusPrompt ? `Instrucción especial de enfoque: "${safeFocusPrompt}".` : ""}
Genera exactamente 8 pilares estratégicos y mutuamente excluyentes para el método Mandala Chart 9x9.
Cada pilar debe ser un título conciso en español de 1 a 4 palabras.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un estratega senior de proyectos y coach de productividad experto en la metodología Mandala Chart (Método Harada). 
Tu objetivo es descomponer la meta principal del usuario en exactamente 8 pilares estratégicos, equilibrados y mutuamente excluyentes.
Debes devolver ÚNICAMENTE un arreglo JSON con exactamente 8 cadenas de texto cortas (máximo 4 palabras cada una).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const rawText = response.text || "[]";
    let pillars: string[] = JSON.parse(rawText.trim());

    if (!Array.isArray(pillars) || pillars.length < 8) {
      const defaults = [
        "Estrategia y Planificación",
        "Desarrollo Técnico",
        "Operaciones y Procesos",
        "Marketing y Difusión",
        "Finanzas y Recursos",
        "Salud y Hábitos",
        "Red de Contactos",
        "Monitoreo y Métricas",
      ];
      while (pillars.length < 8) {
        pillars.push(defaults[pillars.length]);
      }
    }
    pillars = pillars.slice(0, 8);

    return res.json({ pillars, isAiGenerated: true, model });
  } catch (error: any) {
    console.error("Error generating pillars with Gemini:", error);
    const fallbackPillars = [
      "Arquitectura y MVP",
      "Infraestructura Cloud",
      "Diseño y UX",
      "Adquisición de Usuarios",
      "Métricas y Feedback",
      "Finanzas y Monetización",
      "Hábitos y Disciplina",
      "Legal y Operaciones",
    ];
    return res.json({
      pillars: fallbackPillars,
      isAiGenerated: false,
      warning: `Generado con plantilla base porque la llamada a Gemini falló (${error.message || "error de conexión"}).`,
    });
  }
});

// ==========================================
// 2. Generate 8 Actions for a Specific Pillar
// ==========================================
app.post("/api/generate-actions", async (req: Request, res: Response) => {
  const { goalTitle, pillarTitle, allPillars, focusPrompt } = req.body;

  if (
    !goalTitle ||
    typeof goalTitle !== "string" ||
    !goalTitle.trim() ||
    !pillarTitle ||
    typeof pillarTitle !== "string" ||
    !pillarTitle.trim()
  ) {
    return res.status(400).json({ error: "goalTitle and pillarTitle are required strings" });
  }

  const safeGoalTitle = goalTitle.trim().substring(0, 300);
  const safePillarTitle = pillarTitle.trim().substring(0, 200);
  const safeFocusPrompt = typeof focusPrompt === "string" ? focusPrompt.trim().substring(0, 500) : "";
  const safeAllPillars = Array.isArray(allPillars)
    ? allPillars.slice(0, 16).map((p) => String(p).substring(0, 100))
    : undefined;

  const { model } = loadEnvConfig();
  const ai = getAiClient();

  try {
    const prompt = `Meta principal: "${safeGoalTitle}".
Pilar estratégico: "${safePillarTitle}".
Otros pilares existentes: ${safeAllPillars ? JSON.stringify(safeAllPillars) : "No especificados"}.
${safeFocusPrompt ? `Instrucción de refinamiento o enfoque: "${safeFocusPrompt}".` : ""}
Genera exactamente 8 acciones concretas, medibles y realizables para este pilar.
Clasifica cada una como "one_time" (tarea puntual que se completa una vez) o "recurring" (hábito, rutina diaria o semanal).`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un experto en ejecución de proyectos de alto impacto. 
El usuario tiene una meta principal y un pilar estratégico específico.
Tu objetivo es definir exactamente 8 acciones concretas, medibles, realistas y no redundantes.
Debes clasificar cada acción como:
- "one_time": Hitos o tareas únicas (ej. "Comprar dominio", "Configurar base de datos Postgres", "Firmar contrato").
- "recurring": Hábitos o rutinas periódicas (ej. "Hacer 30 minutos de testing diario", "Revisión semanal de KPIs", "Publicar 2 hilos semanales").
Devuelve ÚNICAMENTE un arreglo JSON de 8 objetos con las claves "title" (string de 3 a 8 palabras) y "type" ("one_time" o "recurring").`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Título de la acción concreta en español",
              },
              type: {
                type: Type.STRING,
                enum: ["one_time", "recurring"],
                description: "one_time para tarea única, recurring para hábito",
              },
            },
            required: ["title", "type"],
          },
        },
      },
    });

    const rawText = response.text || "[]";
    let actions: { title: string; type: "one_time" | "recurring" }[] = JSON.parse(rawText.trim());

    if (!Array.isArray(actions) || actions.length < 8) {
      const padDefaults: { title: string; type: "one_time" | "recurring" }[] = [
        { title: `Definir especificación de ${pillarTitle}`, type: "one_time" },
        { title: `Revisión semanal de avances en ${pillarTitle}`, type: "recurring" },
        { title: `Automatizar proceso crítico de ${pillarTitle}`, type: "one_time" },
        { title: `Bloque de 45 min diarios enfocado en ${pillarTitle}`, type: "recurring" },
        { title: `Crear checklist de calidad para ${pillarTitle}`, type: "one_time" },
        { title: `Medir indicador clave de ${pillarTitle}`, type: "recurring" },
        { title: `Resolver principales bloqueos de ${pillarTitle}`, type: "one_time" },
        { title: `Documentar aprendizajes de ${pillarTitle}`, type: "recurring" },
      ];
      while (actions.length < 8) {
        actions.push(padDefaults[actions.length]);
      }
    }
    actions = actions.slice(0, 8);

    return res.json({ actions, isAiGenerated: true, model });
  } catch (error: any) {
    console.error("Error generating actions with Gemini:", error);
    const fallbackActions = [
      { title: `Auditar requerimientos actuales de ${pillarTitle}`, type: "one_time" as const },
      { title: `Ejecutar sesión de trabajo diario de 45 min`, type: "recurring" as const },
      { title: `Configurar herramientas clave para ${pillarTitle}`, type: "one_time" as const },
      { title: `Check-in de progreso todos los viernes`, type: "recurring" as const },
      { title: `Desarrollar prototipo inicial de ${pillarTitle}`, type: "one_time" as const },
      { title: `Medir métricas de eficiencia semanal`, type: "recurring" as const },
      { title: `Validar entregables con usuarios de prueba`, type: "one_time" as const },
      { title: `Mantener backlog organizado y priorizado`, type: "recurring" as const },
    ];
    return res.json({
      actions: fallbackActions,
      isAiGenerated: false,
      warning: `Generado con plantilla base offline (${error.message || "error de API"}).`,
    });
  }
});

// ==========================================
// 3. Batch Generate All 8 Quadrants (64 Actions)
// ==========================================
app.post("/api/generate-all-quadrants", async (req: Request, res: Response) => {
  const { goalTitle, pillars } = req.body;

  if (!goalTitle || !Array.isArray(pillars) || pillars.length === 0) {
    return res.status(400).json({ error: "goalTitle and pillars array are required" });
  }

  const { model } = loadEnvConfig();
  const ai = getAiClient();

  try {
    const prompt = `Meta principal: "${goalTitle}".
Los 8 pilares estratégicos son:
${pillars.map((p, idx) => `${idx + 1}. ${p}`).join("\n")}

Genera exactamente 8 acciones para cada uno de los 8 pilares (64 acciones en total).
Para cada pilar, provee 8 objetos con "title" y "type" ("one_time" o "recurring").`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un estratega de ejecución integral. Genera el desglose completo de 64 acciones del Mandala Chart.
Devuelve un objeto JSON donde cada clave es el índice del pilar (de "0" a "7") y su valor es un arreglo de exactamente 8 acciones con:
- title: string conciso
- type: "one_time" | "recurring"`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quadrants: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["one_time", "recurring"] },
                  },
                  required: ["title", "type"],
                },
              },
            },
          },
          required: ["quadrants"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true, model });
  } catch (error: any) {
    console.error("Error generating all quadrants with Gemini:", error);
    return res.status(500).json({ error: "Failed to batch generate all quadrants", details: error.message });
  }
});

// ==========================================
// 4. Recalibration Assistant
// ==========================================
app.post("/api/recalibrate", async (req: Request, res: Response) => {
  const { goalTitle, pillarTitle, actionTitle, actionType, feedbackReason } = req.body;

  if (!actionTitle || !pillarTitle) {
    return res.status(400).json({ error: "actionTitle and pillarTitle are required" });
  }

  const { model } = loadEnvConfig();
  const ai = getAiClient();

  try {
    const prompt = `Meta: "${goalTitle}".
Pilar: "${pillarTitle}".
Acción que está costando cumplir o bloqueada: "${actionTitle}" (${actionType}).
Motivo o síntoma: "${feedbackReason || "Falta de tiempo, fricción de inicio o tarea demasiado grande"}".

Analiza por qué esta acción está causando fricción y propón:
1. Un diagnóstico directo y empático (1-2 oraciones).
2. Una recomendación estratégica táctica.
3. De 2 a 3 micro-acciones sustitutas más pequeñas y fáciles de arrancar, o una versión calibrada del hábito.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un coach de recalibración adaptativa en metodologías ágiles y formación de hábitos (Atomic Habits + Harada Method).
Tu misión es desbloquear al usuario cuando una tarea del Mandala Chart se estanca.
Reduce la fricción cognitiva descomponiendo la tarea en micro-pasos alcanzables.
Devuelve JSON con las propiedades:
- diagnosis (string)
- recommendation (string)
- replacementActions (arreglo de 2-3 objetos con title y type)`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            replacementActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["one_time", "recurring"] },
                },
                required: ["title", "type"],
              },
            },
          },
          required: ["diagnosis", "recommendation", "replacementActions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true, model });
  } catch (error: any) {
    console.error("Error during recalibration with Gemini:", error);
    return res.json({
      diagnosis: "La tarea actual presenta una barrera de inicio alta o alcance difuso.",
      recommendation: "Divide la tarea en una acción inicial de 15 minutos sin presión de resultado.",
      replacementActions: [
        { title: `Dedicar 15 min a esquematizar ${actionTitle}`, type: "one_time" as const },
        { title: `Ejecutar la primera versión mínima en 20 minutos`, type: "one_time" as const },
        { title: `Micro-hábito: 10 minutos de avance diario`, type: "recurring" as const },
      ],
      isAiGenerated: false,
    });
  }
});

// ==========================================
// 5. Weekly Adaptive Check-In
// ==========================================
app.post("/api/weekly-checkin", async (req: Request, res: Response) => {
  const { goalTitle, stats } = req.body;

  const { model } = loadEnvConfig();
  const ai = getAiClient();

  try {
    const prompt = `Meta: "${goalTitle}".
Estadísticas de la semana:
- Acciones completadas: ${stats.completed}/${stats.total} (${stats.percentage}%)
- Tareas únicas listas: ${stats.completedOneTime}/${stats.totalOneTime}
- Hábitos activos con racha: ${stats.activeRecurring}/${stats.totalRecurring}
- Progreso por cuadrante:
${stats.pillarBreakdown?.map((p: any) => `  * ${p.title}: ${p.progress}% (${p.completed}/${p.total})`).join("\n")}

Genera un check-in estratégico semanal evaluando la tracción, identificando el cuello de botella principal y dando 3 consejos adaptativos para la siguiente semana.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres el Copiloto Ejecutivo de Productividad del Mandala Chart.
Analiza la velocidad de avance con rigor analítico y tono motivacional profesional.
Devuelve un JSON con:
- overallAssessment (string, resumen de 2 frases)
- bottleneck (string, pilar o hábito que necesita atención inmediata)
- keyWins (array de 2 strings con lo más destacable)
- nextActions (array de 3 strings con ajustes tácticos prioritarios)
- motivationalNote (string inspirador pero sobrio)`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: { type: Type.STRING },
            bottleneck: { type: Type.STRING },
            keyWins: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            motivationalNote: { type: Type.STRING },
          },
          required: ["overallAssessment", "bottleneck", "keyWins", "nextActions", "motivationalNote"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true, model });
  } catch (error: any) {
    console.error("Error during weekly checkin with Gemini:", error);
    return res.json({
      overallAssessment: "Tu ritmo de ejecución muestra tracción en los pilares fundamentales.",
      bottleneck: "Consistencia en los hábitos diarios de mayor fricción.",
      keyWins: ["Estructura 9x9 completamente delineada", "Primeras tareas de infraestructura activas"],
      nextActions: [
        "Priorizar las tareas únicas de alto apalancamiento",
        "Reducir el umbral de entrada de los hábitos a 15 minutos",
        "Hacer un corte de progreso a mitad de semana",
      ],
      motivationalNote: "El éxito de la matriz 9x9 no es la perfección, sino la consistencia visible día tras día.",
      isAiGenerated: false,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
