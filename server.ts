import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Generate 8 Strategic Pillars
app.post('/api/generate-pillars', async (req: Request, res: Response) => {
  const { goalTitle, goalContext, focusPrompt } = req.body;

  if (!goalTitle) {
    return res.status(400).json({ error: 'goalTitle is required' });
  }

  try {
    const prompt = `Meta principal: "${goalTitle}".
Contexto adicional: "${goalContext || 'Sin contexto adicional'}".
${focusPrompt ? `Instrucción especial de enfoque: "${focusPrompt}".` : ''}
Genera exactamente 8 pilares estratégicos y mutuamente excluyentes para el método Mandala Chart 9x9.
Cada pilar debe ser un título conciso en español de 1 a 4 palabras.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Eres un estratega senior de proyectos y coach de productividad experto en la metodología Mandala Chart (Método Harada). 
Tu objetivo es descomponer la meta principal del usuario en exactamente 8 pilares estratégicos, equilibrados y mutuamente excluyentes.
Debes devolver ÚNICAMENTE un arreglo JSON con exactamente 8 cadenas de texto cortas (máximo 4 palabras cada una).`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const rawText = response.text || '[]';
    let pillars: string[] = JSON.parse(rawText.trim());

    if (!Array.isArray(pillars) || pillars.length < 8) {
      // Fallback padding if fewer than 8 returned
      const defaults = [
        'Estrategia y Planificación',
        'Desarrollo Técnico',
        'Operaciones y Procesos',
        'Marketing y Difusión',
        'Finanzas y Recursos',
        'Salud y Hábitos',
        'Red de Contactos',
        'Monitoreo y Métricas',
      ];
      while (pillars.length < 8) {
        pillars.push(defaults[pillars.length]);
      }
    }
    pillars = pillars.slice(0, 8);

    return res.json({ pillars });
  } catch (error: any) {
    console.error('Error generating pillars:', error);
    // Graceful fallback with domain relevant items
    const fallbackPillars = [
      'Arquitectura y MVP',
      'Infraestructura Cloud',
      'Diseño y UX',
      'Adquisición de Usuarios',
      'Métricas y Feedback',
      'Finanzas y Monetización',
      'Hábitos y Disciplina',
      'Legal y Operaciones',
    ];
    return res.json({
      pillars: fallbackPillars,
      warning: 'Generado con plantilla base inteligente debido a latencia de red.',
    });
  }
});

// 2. Generate 8 Actions for a Specific Pillar
app.post('/api/generate-actions', async (req: Request, res: Response) => {
  const { goalTitle, pillarTitle, allPillars, focusPrompt } = req.body;

  if (!goalTitle || !pillarTitle) {
    return res.status(400).json({ error: 'goalTitle and pillarTitle are required' });
  }

  try {
    const prompt = `Meta principal: "${goalTitle}".
Pilar estratégico: "${pillarTitle}".
Otros pilares existentes: ${allPillars ? JSON.stringify(allPillars) : 'No especificados'}.
${focusPrompt ? `Instrucción de refinamiento o enfoque: "${focusPrompt}".` : ''}
Genera exactamente 8 acciones concretas, medibles y realizables para este pilar.
Clasifica cada una como 'one_time' (tarea puntual que se completa una vez) o 'recurring' (hábito, rutina diaria o semanal).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Eres un experto en ejecución de proyectos de alto impacto. 
El usuario tiene una meta principal y un pilar estratégico específico.
Tu objetivo es definir exactamente 8 acciones concretas, medibles, realistas y no redundantes.
Debes clasificar cada acción como:
- 'one_time': Hitos o tareas únicas (ej. "Comprar dominio", "Configurar base de datos Postgres", "Firmar contrato").
- 'recurring': Hábitos o rutinas periódicas (ej. "Hacer 30 minutos de testing diario", "Revisión semanal de KPIs", "Publicar 2 hilos semanales").
Devuelve ÚNICAMENTE un arreglo JSON de 8 objetos con las claves "title" (string de 3 a 8 palabras) y "type" ('one_time' o 'recurring').`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Título de la acción concreta en español',
              },
              type: {
                type: Type.STRING,
                enum: ['one_time', 'recurring'],
                description: 'one_time para tarea única, recurring para hábito',
              },
            },
            required: ['title', 'type'],
          },
        },
      },
    });

    const rawText = response.text || '[]';
    let actions: { title: string; type: 'one_time' | 'recurring' }[] = JSON.parse(rawText.trim());

    if (!Array.isArray(actions) || actions.length < 8) {
      const padDefaults: { title: string; type: 'one_time' | 'recurring' }[] = [
        { title: `Definir especificación de ${pillarTitle}`, type: 'one_time' },
        { title: `Revisión semanal de avances en ${pillarTitle}`, type: 'recurring' },
        { title: `Automatizar proceso crítico de ${pillarTitle}`, type: 'one_time' },
        { title: `Bloque de 45 min diarios enfocado en ${pillarTitle}`, type: 'recurring' },
        { title: `Crear checklist de calidad para ${pillarTitle}`, type: 'one_time' },
        { title: `Medir indicador clave de ${pillarTitle}`, type: 'recurring' },
        { title: `Resolver principales bloqueos de ${pillarTitle}`, type: 'one_time' },
        { title: `Documentar aprendizajes de ${pillarTitle}`, type: 'recurring' },
      ];
      while (actions.length < 8) {
        actions.push(padDefaults[actions.length]);
      }
    }
    actions = actions.slice(0, 8);

    return res.json({ actions });
  } catch (error: any) {
    console.error('Error generating actions:', error);
    const fallbackActions = [
      { title: `Auditar requerimientos actuales de ${pillarTitle}`, type: 'one_time' as const },
      { title: `Ejecutar sesión de trabajo diario de 45 min`, type: 'recurring' as const },
      { title: `Configurar herramientas clave para ${pillarTitle}`, type: 'one_time' as const },
      { title: `Check-in de progreso todos los viernes`, type: 'recurring' as const },
      { title: `Desarrollar prototipo inicial de ${pillarTitle}`, type: 'one_time' as const },
      { title: `Medir métricas de eficiencia semanal`, type: 'recurring' as const },
      { title: `Validar entregables con usuarios de prueba`, type: 'one_time' as const },
      { title: `Mantener backlog organizado y priorizado`, type: 'recurring' as const },
    ];
    return res.json({ actions: fallbackActions });
  }
});

// 3. Batch Generate All 8 Quadrants (64 Actions)
app.post('/api/generate-all-quadrants', async (req: Request, res: Response) => {
  const { goalTitle, pillars } = req.body;

  if (!goalTitle || !Array.isArray(pillars) || pillars.length === 0) {
    return res.status(400).json({ error: 'goalTitle and pillars array are required' });
  }

  try {
    const prompt = `Meta principal: "${goalTitle}".
Los 8 pilares estratégicos son:
${pillars.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

Genera exactamente 8 acciones para cada uno de los 8 pilares (64 acciones en total).
Para cada pilar, provee 8 objetos con 'title' y 'type' ('one_time' o 'recurring').`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Eres un estratega de ejecución integral. Genera el desglose completo de 64 acciones del Mandala Chart.
Devuelve un objeto JSON donde cada clave es el índice del pilar (de "0" a "7") y su valor es un arreglo de exactamente 8 acciones con:
- title: string conciso
- type: 'one_time' | 'recurring'`,
        responseMimeType: 'application/json',
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
                    type: { type: Type.STRING, enum: ['one_time', 'recurring'] },
                  },
                  required: ['title', 'type'],
                },
              },
            },
          },
          required: ['quadrants'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating all quadrants:', error);
    return res.status(500).json({ error: 'Failed to batch generate all quadrants' });
  }
});

// 4. Recalibration Assistant (When an action is stalled or too difficult)
app.post('/api/recalibrate', async (req: Request, res: Response) => {
  const { goalTitle, pillarTitle, actionTitle, actionType, feedbackReason } = req.body;

  if (!actionTitle || !pillarTitle) {
    return res.status(400).json({ error: 'actionTitle and pillarTitle are required' });
  }

  try {
    const prompt = `Meta: "${goalTitle}".
Pilar: "${pillarTitle}".
Acción que está costando cumplir o bloqueada: "${actionTitle}" (${actionType}).
Motivo o síntoma: "${feedbackReason || 'Falta de tiempo, fricción de inicio o tarea demasiado grande'}".

Analiza por qué esta acción está causando fricción y propón:
1. Un diagnóstico directo y empático (1-2 oraciones).
2. Una recomendación estratégica táctica.
3. De 2 a 3 micro-acciones sustitutas más pequeñas y fáciles de arrancar, o una versión calibrada del hábito.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Eres un coach de recalibración adaptativa en metodologías ágiles y formación de hábitos (Atomic Habits + Harada Method).
Tu misión es desbloquear al usuario cuando una tarea del Mandala Chart se estanca.
Reduce la fricción cognitiva descomponiendo la tarea en micro-pasos alcanzables.
Devuelve JSON con las propiedades:
- diagnosis (string)
- recommendation (string)
- replacementActions (arreglo de 2-3 objetos con title y type)`,
        responseMimeType: 'application/json',
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
                  type: { type: Type.STRING, enum: ['one_time', 'recurring'] },
                },
                required: ['title', 'type'],
              },
            },
          },
          required: ['diagnosis', 'recommendation', 'replacementActions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error during recalibration:', error);
    return res.json({
      diagnosis: 'La tarea actual presenta una barrera de inicio alta o alcance difuso.',
      recommendation: 'Divide la tarea en una acción inicial de 15 minutos sin presión de resultado.',
      replacementActions: [
        { title: `Dedicar 15 min a esquematizar ${actionTitle}`, type: 'one_time' as const },
        { title: `Ejecutar la primera versión mínima en 20 minutos`, type: 'one_time' as const },
        { title: `Micro-hábito: 10 minutos de avance diario`, type: 'recurring' as const },
      ],
    });
  }
});

// 5. Weekly Adaptive Check-In
app.post('/api/weekly-checkin', async (req: Request, res: Response) => {
  const { goalTitle, stats } = req.body;

  try {
    const prompt = `Meta: "${goalTitle}".
Estadísticas de la semana:
- Acciones completadas: ${stats.completed}/${stats.total} (${stats.percentage}%)
- Tareas únicas listas: ${stats.completedOneTime}/${stats.totalOneTime}
- Hábitos activos con racha: ${stats.activeRecurring}/${stats.totalRecurring}
- Progreso por cuadrante:
${stats.pillarBreakdown?.map((p: any) => `  * ${p.title}: ${p.progress}% (${p.completed}/${p.total})`).join('\n')}

Genera un check-in estratégico semanal evaluando la tracción, identificando el cuello de botella principal y dando 3 consejos adaptativos para la siguiente semana.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: { type: Type.STRING },
            bottleneck: { type: Type.STRING },
            keyWins: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            motivationalNote: { type: Type.STRING },
          },
          required: ['overallAssessment', 'bottleneck', 'keyWins', 'nextActions', 'motivationalNote'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error during weekly checkin:', error);
    return res.json({
      overallAssessment: 'Tu ritmo de ejecución muestra tracción en los pilares fundamentales.',
      bottleneck: 'Consistencia en los hábitos diarios de mayor fricción.',
      keyWins: ['Estructura 9x9 completamente delineada', 'Primeras tareas de infraestructura activas'],
      nextActions: [
        'Priorizar las tareas únicas de alto apalancamiento',
        'Reducir el umbral de entrada de los hábitos a 15 minutos',
        'Hacer un corte de progreso a mitad de semana',
      ],
      motivationalNote: 'El éxito de la matriz 9x9 no es la perfección, sino la consistencia visible día tras día.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
