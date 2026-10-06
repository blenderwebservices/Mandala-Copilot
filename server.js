import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getCandidateEnvPaths() {
  const paths = [
    path.resolve(__dirname, ".env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "..", ".env"),
    path.resolve(process.cwd(), "..", ".env")
  ];
  return Array.from(new Set(paths));
}
function resolveEnvFilePath() {
  const searchedPaths = getCandidateEnvPaths();
  for (const candidate of searchedPaths) {
    try {
      if (fs.existsSync(candidate)) {
        return { foundPath: candidate, searchedPaths };
      }
    } catch {
    }
  }
  return { foundPath: null, searchedPaths };
}
const initialEnv = resolveEnvFilePath();
if (initialEnv.foundPath) {
  dotenv.config({ path: initialEnv.foundPath });
} else {
  dotenv.config();
}
const app = express();
const PORT = process.env.PORT || 3e3;
app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
  next();
});
app.use(express.json({ limit: "1mb" }));
function loadEnvConfig() {
  const { foundPath, searchedPaths } = resolveEnvFilePath();
  if (foundPath) {
    dotenv.config({ path: foundPath, override: true });
  } else {
    dotenv.config({ override: true });
  }
  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  const model = (process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || "gemini-2.5-flash").trim();
  const source = foundPath ? "file" : apiKey ? "system_env" : "none";
  return {
    apiKey,
    model,
    envPath: foundPath || path.resolve(__dirname, ".env"),
    envFound: Boolean(foundPath),
    searchedPaths,
    source
  };
}
function maskApiKey(key) {
  if (!key) return "(no configurada)";
  if (key === "MY_GEMINI_API_KEY" || key.includes("MY_GEMINI_API_KEY")) {
    return "MY_GEMINI_API_KEY (plantilla por defecto)";
  }
  if (key.length <= 8) return "****";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
function getAiClient(customApiKey) {
  const { apiKey } = loadEnvConfig();
  const keyToUse = customApiKey !== void 0 && customApiKey.trim() !== "" ? customApiKey.trim() : apiKey;
  return new GoogleGenAI({
    apiKey: keyToUse,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function checkGeminiHealth(targetKey, targetModel) {
  const { apiKey: envKey, model: envModel, envPath, envFound, searchedPaths, source } = loadEnvConfig();
  const apiKey = targetKey !== void 0 && targetKey.trim() !== "" ? targetKey.trim() : envKey;
  const model = targetModel !== void 0 && targetModel.trim() !== "" ? targetModel.trim() : envModel;
  const baseDiagnostic = {
    model,
    keyMasked: maskApiKey(apiKey),
    envPath,
    envFound,
    source: targetKey ? "manual_test" : source,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!apiKey) {
    return {
      ...baseDiagnostic,
      ok: false,
      status: "missing_key",
      message: envFound ? `Archivo .env detectado (${path.basename(path.dirname(envPath))}/.env), pero no contiene la variable GEMINI_API_KEY.` : "No se encontr\xF3 el archivo .env ni la variable GEMINI_API_KEY en el servidor.",
      details: envFound ? `Archivo le\xEDdo en: ${envPath}. Define GEMINI_API_KEY="AIzaSy..." dentro de dicho archivo.` : `Rutas examinadas sin \xE9xito: ${searchedPaths.join(", ")}. Puedes colocar el .env en la ra\xEDz de la aplicaci\xF3n o definir la variable en el panel del hosting.`
    };
  }
  if (apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_GEMINI_API_KEY")) {
    return {
      ...baseDiagnostic,
      ok: false,
      status: "placeholder_key",
      message: 'GEMINI_API_KEY tiene el valor por defecto de plantilla ("MY_GEMINI_API_KEY")',
      details: "Obt\xE9n tu clave gratuita en Google AI Studio (https://aistudio.google.com/app/apikey) y reempl\xE1zala en tu archivo .env o en el modal de configuraci\xF3n."
    };
  }
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });
  const t0 = Date.now();
  try {
    const result = await ai.models.generateContent({
      model,
      contents: "Responde \xFAnicamente la palabra OK",
      config: {
        maxOutputTokens: 10
      }
    });
    const latencyMs = Date.now() - t0;
    const responseSample = result.text?.trim() || "OK";
    return {
      ...baseDiagnostic,
      ok: true,
      status: "connected",
      message: `Conexi\xF3n con Gemini exitosa. El modelo "${model}" est\xE1 operativo.`,
      latencyMs,
      responseSample
    };
  } catch (error) {
    const latencyMs = Date.now() - t0;
    const errMsg = error.message || String(error);
    let status = "error";
    let userMessage = "Error al comunicarse con la API de Google Gemini.";
    if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid") || errMsg.includes("INVALID_ARGUMENT")) {
      status = "invalid_key";
      userMessage = "Clave API inv\xE1lida o incorrecta. Verifica que la hayas copiado completa desde Google AI Studio.";
    } else if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429")) {
      status = "quota_exceeded";
      userMessage = "L\xEDmite de cuota o peticiones excedido (429 Too Many Requests).";
    } else if (errMsg.includes("NOT_FOUND") || errMsg.includes("models/")) {
      status = "model_not_found";
      userMessage = `El modelo "${model}" no fue encontrado o no est\xE1 disponible con esta clave. Prueba seleccionando "gemini-2.5-flash".`;
    }
    return {
      ...baseDiagnostic,
      ok: false,
      status,
      message: userMessage,
      details: errMsg,
      latencyMs
    };
  }
}
app.get("/api/gemini-status", async (_req, res) => {
  const result = await checkGeminiHealth();
  return res.json(result);
});
app.post("/api/gemini-status", async (req, res) => {
  const { apiKey, model, saveToEnv } = req.body;
  if (saveToEnv && typeof apiKey === "string" && apiKey.trim() !== "") {
    const cleanKey = apiKey.trim();
    if (!/^[a-zA-Z0-9_\-\.]{8,256}$/.test(cleanKey)) {
      return res.status(400).json({
        ok: false,
        status: "invalid_key_format",
        message: "Formato de API Key no v\xE1lido. No se permiten espacios, saltos de l\xEDnea ni caracteres de control."
      });
    }
    const cleanModel = typeof model === "string" ? model.trim() : "";
    if (cleanModel && !/^[a-zA-Z0-9\.\-]{3,60}$/.test(cleanModel)) {
      return res.status(400).json({
        ok: false,
        status: "invalid_model_format",
        message: "Identificador de modelo no v\xE1lido."
      });
    }
    try {
      const { envPath: targetEnvPath } = loadEnvConfig();
      let content = fs.existsSync(targetEnvPath) ? fs.readFileSync(targetEnvPath, "utf8") : "";
      if (/^GEMINI_API_KEY=.*$/m.test(content)) {
        content = content.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY="${cleanKey}"`);
      } else if (/^VITE_GEMINI_API_KEY=.*$/m.test(content)) {
        content = content.replace(/^VITE_GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY="${cleanKey}"`);
      } else if (/^GOOGLE_API_KEY=.*$/m.test(content)) {
        content = content.replace(/^GOOGLE_API_KEY=.*$/m, `GEMINI_API_KEY="${cleanKey}"`);
      } else {
        content += `
GEMINI_API_KEY="${cleanKey}"
`;
      }
      if (cleanModel) {
        if (/^GEMINI_MODEL=.*$/m.test(content)) {
          content = content.replace(/^GEMINI_MODEL=.*$/m, `GEMINI_MODEL="${cleanModel}"`);
        } else if (/^VITE_GEMINI_MODEL=.*$/m.test(content)) {
          content = content.replace(/^VITE_GEMINI_MODEL=.*$/m, `GEMINI_MODEL="${cleanModel}"`);
        } else {
          content += `
GEMINI_MODEL="${cleanModel}"
`;
        }
      }
      fs.writeFileSync(targetEnvPath, content, "utf8");
      console.log(`\u{1F4BE} Updated .env file safely at ${targetEnvPath} with validated Gemini configuration`);
    } catch (saveErr) {
      console.error("Failed to write to .env:", saveErr);
    }
  }
  const result = await checkGeminiHealth(apiKey, model);
  return res.json(result);
});
app.post("/api/gemini-test-prompt", async (req, res) => {
  const { prompt, model, apiKey } = req.body;
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "prompt is required" });
  }
  if (prompt.length > 2e3) {
    return res.status(400).json({ error: "El prompt supera el l\xEDmite permitido de 2,000 caracteres." });
  }
  const { model: envModel } = loadEnvConfig();
  const modelToUse = typeof model === "string" && /^[a-zA-Z0-9\.\-]{3,60}$/.test(model.trim()) ? model.trim() : envModel;
  const ai = getAiClient(apiKey);
  const t0 = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        maxOutputTokens: 250
      }
    });
    const latencyMs = Date.now() - t0;
    return res.json({
      ok: true,
      response: response.text || "(Respuesta vac\xEDa)",
      latencyMs,
      model: modelToUse
    });
  } catch (err) {
    const latencyMs = Date.now() - t0;
    return res.status(500).json({
      ok: false,
      error: err.message || "Error al ejecutar el prompt de prueba",
      latencyMs,
      model: modelToUse
    });
  }
});
app.post("/api/validate-harada-goal", async (req, res) => {
  const { goalTitle, goalContext } = req.body;
  if (!goalTitle || typeof goalTitle !== "string" || !goalTitle.trim()) {
    return res.status(400).json({ error: "goalTitle is required" });
  }
  const safeGoalTitle = goalTitle.trim().substring(0, 350);
  const safeGoalContext = typeof goalContext === "string" ? goalContext.trim().substring(0, 1500) : "";
  const { model } = loadEnvConfig();
  const ai = getAiClient();
  try {
    const prompt = `Analiza el siguiente objetivo para el centro de una matriz 9x9 del M\xE9todo Harada:
Objetivo propuesto: "${safeGoalTitle}"
Contexto opcional: "${safeGoalContext || "Sin contexto adicional"}"

Eval\xFAa rigurosamente si cumple con el principio fundamental del M\xE9todo Harada:
"En la casilla central de toda la cuadr\xEDcula (el centro del bloque 3x3 del medio) se escribe el objetivo principal, el cual debe ser claro, medible y desafiante."

Debes responder con:
- isCongruent: boolean (true solo si ya es muy claro, incluye m\xE9tricas/plazo medible y es suficientemente desafiante; false si es vago, abstracto, sin plazo o sin m\xE9trica).
- score: n\xFAmero del 0 al 100 evaluando la alineaci\xF3n con el m\xE9todo Harada.
- criteria: { isClear: boolean, isMeasurable: boolean, isChallenging: boolean }
- diagnosis: Explicaci\xF3n breve y constructiva de qu\xE9 le falta o qu\xE9 tiene bien seg\xFAn el m\xE9todo Harada.
- recommendation: Un consejo pr\xE1ctico de 1 oraci\xF3n para formular objetivos seg\xFAn Harada.
- suggestions: Exactamente 3 metas alternativas reformuladas que preserven la intenci\xF3n del usuario pero estructuradas a la perfecci\xF3n (claras, con m\xE9trica/plazo medible y ambiciosas/desafiantes). Para cada una proporciona "title" (la meta reformulada) y "rationale" (por qu\xE9 cumple con el m\xE9todo Harada).`;
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un consultor de clase mundial y coach certificado en el M\xE9todo Harada y la formulaci\xF3n del Objetivo Central de la matriz Mandala Chart 9x9.
El objetivo principal en la casilla central de toda la cuadr\xEDcula (el centro del bloque 3x3 del medio) debe ser:
1. Claro: Espec\xEDfico y concreto, sin vaguedades.
2. Medible: Cuantificable, con n\xFAmero, porcentaje o plazo temporal delimitado verificable.
3. Desafiante: Ambicioso, inspirador, que requiera coordinar 8 pilares estrat\xE9gicos y 64 acciones concretas.

Si el enunciado del usuario no cumple perfectamente con estas tres caracter\xEDsticas, se\xF1\xE1lalo constructivamente y proporciona siempre 3 alternativas superiores que respeten su deseo pero alineadas al M\xE9todo Harada.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCongruent: { type: Type.BOOLEAN },
            score: { type: Type.INTEGER },
            criteria: {
              type: Type.OBJECT,
              properties: {
                isClear: { type: Type.BOOLEAN },
                isMeasurable: { type: Type.BOOLEAN },
                isChallenging: { type: Type.BOOLEAN }
              },
              required: ["isClear", "isMeasurable", "isChallenging"]
            },
            diagnosis: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ["title", "rationale"]
              }
            }
          },
          required: ["isCongruent", "score", "criteria", "diagnosis", "recommendation", "suggestions"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      ...parsed,
      isAiGenerated: true,
      model
    });
  } catch (error) {
    console.error("Error validating Harada goal with Gemini:", error);
    const hasNumber = /\d+/.test(safeGoalTitle);
    const hasTimeframe = /(mes|meses|días|semanas|año|202\d|q[1-4]|trimestre)/i.test(safeGoalTitle);
    const isLongEnough = safeGoalTitle.split(" ").length >= 4;
    const isClear = isLongEnough;
    const isMeasurable = hasNumber || hasTimeframe;
    const isChallenging = safeGoalTitle.length >= 15;
    const isCongruent = isClear && isMeasurable && isChallenging;
    const baseClean = safeGoalTitle.replace(/^(quiero|deseo|voy a|meta:|objetivo:)\s*/i, "").trim();
    return res.json({
      isCongruent,
      score: isCongruent ? 85 : 45,
      criteria: {
        isClear,
        isMeasurable,
        isChallenging
      },
      diagnosis: isCongruent ? "Tu meta cuenta con claridad y elementos medibles seg\xFAn el M\xE9todo Harada." : "El objetivo propuesto requiere mayor precisi\xF3n en m\xE9tricas verificables y un horizonte temporal definido para desglosarse en 8 pilares.",
      recommendation: "Un objetivo Harada de alto impacto incluye qu\xE9 lograr\xE1s, en qu\xE9 cifra o est\xE1ndar, y en qu\xE9 plazo espec\xEDfico.",
      suggestions: [
        {
          title: `Lanzar exitosamente ${baseClean || "mi proyecto"} en 6 meses con m\xE9tricas validadas`,
          rationale: "Establece un horizonte de 6 meses y un est\xE1ndar concreto de validaci\xF3n."
        },
        {
          title: `Consolidar ${baseClean || "mi iniciativa"} alcanzando los primeros 100 usuarios activos antes de fin de a\xF1o`,
          rationale: "A\xF1ade una meta cuantitativa medible (100 usuarios) y un plazo claro."
        },
        {
          title: `Desarrollar y monetizar ${baseClean || "el objetivo"} con $2,000 MRR en los pr\xF3ximos 180 d\xEDas`,
          rationale: "Introduce un hito financiero tangible y una ventana de ejecuci\xF3n disciplinada."
        }
      ],
      isAiGenerated: false
    });
  }
});
app.post("/api/generate-pillars", async (req, res) => {
  const { goalTitle, goalContext, focusPrompt } = req.body;
  if (!goalTitle || typeof goalTitle !== "string" || !goalTitle.trim()) {
    return res.status(400).json({ error: "goalTitle is required" });
  }
  const safeGoalTitle = goalTitle.trim().substring(0, 300);
  const safeGoalContext = typeof goalContext === "string" ? goalContext.trim().substring(0, 1500) : "";
  const safeFocusPrompt = typeof focusPrompt === "string" ? focusPrompt.trim().substring(0, 500) : "";
  const { model } = loadEnvConfig();
  const ai = getAiClient();
  try {
    const prompt = `Meta principal: "${safeGoalTitle}".
Contexto adicional: "${safeGoalContext || "Sin contexto adicional"}".
${safeFocusPrompt ? `Instrucci\xF3n especial de enfoque: "${safeFocusPrompt}".` : ""}
Genera exactamente 8 pilares estrat\xE9gicos y mutuamente excluyentes para el m\xE9todo Mandala Chart 9x9.
Cada pilar debe ser un t\xEDtulo conciso en espa\xF1ol de 1 a 4 palabras.`;
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un estratega senior de proyectos y coach de productividad experto en la metodolog\xEDa Mandala Chart (M\xE9todo Harada). 
Tu objetivo es descomponer la meta principal del usuario en exactamente 8 pilares estrat\xE9gicos, equilibrados y mutuamente excluyentes.
Debes devolver \xDANICAMENTE un arreglo JSON con exactamente 8 cadenas de texto cortas (m\xE1ximo 4 palabras cada una).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });
    const rawText = response.text || "[]";
    let pillars = JSON.parse(rawText.trim());
    if (!Array.isArray(pillars) || pillars.length < 8) {
      const defaults = [
        "Estrategia y Planificaci\xF3n",
        "Desarrollo T\xE9cnico",
        "Operaciones y Procesos",
        "Marketing y Difusi\xF3n",
        "Finanzas y Recursos",
        "Salud y H\xE1bitos",
        "Red de Contactos",
        "Monitoreo y M\xE9tricas"
      ];
      while (pillars.length < 8) {
        pillars.push(defaults[pillars.length]);
      }
    }
    pillars = pillars.slice(0, 8);
    return res.json({ pillars, isAiGenerated: true, model });
  } catch (error) {
    console.error("Error generating pillars with Gemini:", error);
    const fallbackPillars = [
      "Arquitectura y MVP",
      "Infraestructura Cloud",
      "Dise\xF1o y UX",
      "Adquisici\xF3n de Usuarios",
      "M\xE9tricas y Feedback",
      "Finanzas y Monetizaci\xF3n",
      "H\xE1bitos y Disciplina",
      "Legal y Operaciones"
    ];
    return res.json({
      pillars: fallbackPillars,
      isAiGenerated: false,
      warning: `Generado con plantilla base porque la llamada a Gemini fall\xF3 (${error.message || "error de conexi\xF3n"}).`
    });
  }
});
app.post("/api/generate-actions", async (req, res) => {
  const { goalTitle, pillarTitle, allPillars, focusPrompt } = req.body;
  if (!goalTitle || typeof goalTitle !== "string" || !goalTitle.trim() || !pillarTitle || typeof pillarTitle !== "string" || !pillarTitle.trim()) {
    return res.status(400).json({ error: "goalTitle and pillarTitle are required strings" });
  }
  const safeGoalTitle = goalTitle.trim().substring(0, 300);
  const safePillarTitle = pillarTitle.trim().substring(0, 200);
  const safeFocusPrompt = typeof focusPrompt === "string" ? focusPrompt.trim().substring(0, 500) : "";
  const safeAllPillars = Array.isArray(allPillars) ? allPillars.slice(0, 16).map((p) => String(p).substring(0, 100)) : void 0;
  const { model } = loadEnvConfig();
  const ai = getAiClient();
  try {
    const prompt = `Meta principal: "${safeGoalTitle}".
Pilar estrat\xE9gico: "${safePillarTitle}".
Otros pilares existentes: ${safeAllPillars ? JSON.stringify(safeAllPillars) : "No especificados"}.
${safeFocusPrompt ? `Instrucci\xF3n de refinamiento o enfoque: "${safeFocusPrompt}".` : ""}
Genera exactamente 8 acciones concretas, medibles y realizables para este pilar.
Clasifica cada una como "one_time" (tarea puntual que se completa una vez) o "recurring" (h\xE1bito, rutina diaria o semanal).`;
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un experto en ejecuci\xF3n de proyectos de alto impacto. 
El usuario tiene una meta principal y un pilar estrat\xE9gico espec\xEDfico.
Tu objetivo es definir exactamente 8 acciones concretas, medibles, realistas y no redundantes.
Debes clasificar cada acci\xF3n como:
- "one_time": Hitos o tareas \xFAnicas (ej. "Comprar dominio", "Configurar base de datos Postgres", "Firmar contrato").
- "recurring": H\xE1bitos o rutinas peri\xF3dicas (ej. "Hacer 30 minutos de testing diario", "Revisi\xF3n semanal de KPIs", "Publicar 2 hilos semanales").
Devuelve \xDANICAMENTE un arreglo JSON de 8 objetos con las claves "title" (string de 3 a 8 palabras) y "type" ("one_time" o "recurring").`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "T\xEDtulo de la acci\xF3n concreta en espa\xF1ol"
              },
              type: {
                type: Type.STRING,
                enum: ["one_time", "recurring"],
                description: "one_time para tarea \xFAnica, recurring para h\xE1bito"
              }
            },
            required: ["title", "type"]
          }
        }
      }
    });
    const rawText = response.text || "[]";
    let actions = JSON.parse(rawText.trim());
    if (!Array.isArray(actions) || actions.length < 8) {
      const padDefaults = [
        { title: `Definir especificaci\xF3n de ${pillarTitle}`, type: "one_time" },
        { title: `Revisi\xF3n semanal de avances en ${pillarTitle}`, type: "recurring" },
        { title: `Automatizar proceso cr\xEDtico de ${pillarTitle}`, type: "one_time" },
        { title: `Bloque de 45 min diarios enfocado en ${pillarTitle}`, type: "recurring" },
        { title: `Crear checklist de calidad para ${pillarTitle}`, type: "one_time" },
        { title: `Medir indicador clave de ${pillarTitle}`, type: "recurring" },
        { title: `Resolver principales bloqueos de ${pillarTitle}`, type: "one_time" },
        { title: `Documentar aprendizajes de ${pillarTitle}`, type: "recurring" }
      ];
      while (actions.length < 8) {
        actions.push(padDefaults[actions.length]);
      }
    }
    actions = actions.slice(0, 8);
    return res.json({ actions, isAiGenerated: true, model });
  } catch (error) {
    console.error("Error generating actions with Gemini:", error);
    const fallbackActions = [
      { title: `Auditar requerimientos actuales de ${pillarTitle}`, type: "one_time" },
      { title: `Ejecutar sesi\xF3n de trabajo diario de 45 min`, type: "recurring" },
      { title: `Configurar herramientas clave para ${pillarTitle}`, type: "one_time" },
      { title: `Check-in de progreso todos los viernes`, type: "recurring" },
      { title: `Desarrollar prototipo inicial de ${pillarTitle}`, type: "one_time" },
      { title: `Medir m\xE9tricas de eficiencia semanal`, type: "recurring" },
      { title: `Validar entregables con usuarios de prueba`, type: "one_time" },
      { title: `Mantener backlog organizado y priorizado`, type: "recurring" }
    ];
    return res.json({
      actions: fallbackActions,
      isAiGenerated: false,
      warning: `Generado con plantilla base offline (${error.message || "error de API"}).`
    });
  }
});
app.post("/api/generate-all-quadrants", async (req, res) => {
  const { goalTitle, pillars } = req.body;
  if (!goalTitle || !Array.isArray(pillars) || pillars.length === 0) {
    return res.status(400).json({ error: "goalTitle and pillars array are required" });
  }
  const { model } = loadEnvConfig();
  const ai = getAiClient();
  try {
    const prompt = `Meta principal: "${goalTitle}".
Los 8 pilares estrat\xE9gicos son:
${pillars.map((p, idx) => `${idx + 1}. ${p}`).join("\n")}

Genera exactamente 8 acciones para cada uno de los 8 pilares (64 acciones en total).
Para cada pilar, provee 8 objetos con "title" y "type" ("one_time" o "recurring").`;
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un estratega de ejecuci\xF3n integral. Genera el desglose completo de 64 acciones del Mandala Chart.
Devuelve un objeto JSON donde cada clave es el \xEDndice del pilar (de "0" a "7") y su valor es un arreglo de exactamente 8 acciones con:
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
                    type: { type: Type.STRING, enum: ["one_time", "recurring"] }
                  },
                  required: ["title", "type"]
                }
              }
            }
          },
          required: ["quadrants"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true, model });
  } catch (error) {
    console.error("Error generating all quadrants with Gemini:", error);
    return res.status(500).json({ error: "Failed to batch generate all quadrants", details: error.message });
  }
});
app.post("/api/recalibrate", async (req, res) => {
  const { goalTitle, pillarTitle, actionTitle, actionType, feedbackReason } = req.body;
  if (!actionTitle || !pillarTitle) {
    return res.status(400).json({ error: "actionTitle and pillarTitle are required" });
  }
  const { model } = loadEnvConfig();
  const ai = getAiClient();
  try {
    const prompt = `Meta: "${goalTitle}".
Pilar: "${pillarTitle}".
Acci\xF3n que est\xE1 costando cumplir o bloqueada: "${actionTitle}" (${actionType}).
Motivo o s\xEDntoma: "${feedbackReason || "Falta de tiempo, fricci\xF3n de inicio o tarea demasiado grande"}".

Analiza por qu\xE9 esta acci\xF3n est\xE1 causando fricci\xF3n y prop\xF3n:
1. Un diagn\xF3stico directo y emp\xE1tico (1-2 oraciones).
2. Una recomendaci\xF3n estrat\xE9gica t\xE1ctica.
3. De 2 a 3 micro-acciones sustitutas m\xE1s peque\xF1as y f\xE1ciles de arrancar, o una versi\xF3n calibrada del h\xE1bito.`;
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres un coach de recalibraci\xF3n adaptativa en metodolog\xEDas \xE1giles y formaci\xF3n de h\xE1bitos (Atomic Habits + Harada Method).
Tu misi\xF3n es desbloquear al usuario cuando una tarea del Mandala Chart se estanca.
Reduce la fricci\xF3n cognitiva descomponiendo la tarea en micro-pasos alcanzables.
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
                  type: { type: Type.STRING, enum: ["one_time", "recurring"] }
                },
                required: ["title", "type"]
              }
            }
          },
          required: ["diagnosis", "recommendation", "replacementActions"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true, model });
  } catch (error) {
    console.error("Error during recalibration with Gemini:", error);
    return res.json({
      diagnosis: "La tarea actual presenta una barrera de inicio alta o alcance difuso.",
      recommendation: "Divide la tarea en una acci\xF3n inicial de 15 minutos sin presi\xF3n de resultado.",
      replacementActions: [
        { title: `Dedicar 15 min a esquematizar ${actionTitle}`, type: "one_time" },
        { title: `Ejecutar la primera versi\xF3n m\xEDnima en 20 minutos`, type: "one_time" },
        { title: `Micro-h\xE1bito: 10 minutos de avance diario`, type: "recurring" }
      ],
      isAiGenerated: false
    });
  }
});
app.post("/api/weekly-checkin", async (req, res) => {
  const { goalTitle, stats } = req.body;
  const { model } = loadEnvConfig();
  const ai = getAiClient();
  try {
    const prompt = `Meta: "${goalTitle}".
Estad\xEDsticas de la semana:
- Acciones completadas: ${stats.completed}/${stats.total} (${stats.percentage}%)
- Tareas \xFAnicas listas: ${stats.completedOneTime}/${stats.totalOneTime}
- H\xE1bitos activos con racha: ${stats.activeRecurring}/${stats.totalRecurring}
- Progreso por cuadrante:
${stats.pillarBreakdown?.map((p) => `  * ${p.title}: ${p.progress}% (${p.completed}/${p.total})`).join("\n")}

Genera un check-in estrat\xE9gico semanal evaluando la tracci\xF3n, identificando el cuello de botella principal y dando 3 consejos adaptativos para la siguiente semana.`;
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Eres el Copiloto Ejecutivo de Productividad del Mandala Chart.
Analiza la velocidad de avance con rigor anal\xEDtico y tono motivacional profesional.
Devuelve un JSON con:
- overallAssessment (string, resumen de 2 frases)
- bottleneck (string, pilar o h\xE1bito que necesita atenci\xF3n inmediata)
- keyWins (array de 2 strings con lo m\xE1s destacable)
- nextActions (array de 3 strings con ajustes t\xE1cticos prioritarios)
- motivationalNote (string inspirador pero sobrio)`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: { type: Type.STRING },
            bottleneck: { type: Type.STRING },
            keyWins: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            motivationalNote: { type: Type.STRING }
          },
          required: ["overallAssessment", "bottleneck", "keyWins", "nextActions", "motivationalNote"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ ...parsed, isAiGenerated: true, model });
  } catch (error) {
    console.error("Error during weekly checkin with Gemini:", error);
    return res.json({
      overallAssessment: "Tu ritmo de ejecuci\xF3n muestra tracci\xF3n en los pilares fundamentales.",
      bottleneck: "Consistencia en los h\xE1bitos diarios de mayor fricci\xF3n.",
      keyWins: ["Estructura 9x9 completamente delineada", "Primeras tareas de infraestructura activas"],
      nextActions: [
        "Priorizar las tareas \xFAnicas de alto apalancamiento",
        "Reducir el umbral de entrada de los h\xE1bitos a 15 minutos",
        "Hacer un corte de progreso a mitad de semana"
      ],
      motivationalNote: "El \xE9xito de la matriz 9x9 no es la perfecci\xF3n, sino la consistencia visible d\xEDa tras d\xEDa.",
      isAiGenerated: false
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
