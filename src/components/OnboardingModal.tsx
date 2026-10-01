import React, { useState } from 'react';
import { Goal, Pillar, MandalaAction, PILLAR_COLORS } from '../types/mandala';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  RotateCw, 
  Zap, 
  Edit3, 
  Trash2, 
  Layers, 
  Wand2, 
  AlertCircle,
  X
} from 'lucide-react';
import { fetchGeneratedPillars, fetchGeneratedActions, fetchBatchAllQuadrants } from '../services/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: (goal: Goal) => void;
  presetGoals: Goal[];
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onGoalCreated,
  presetGoals,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalContext, setGoalContext] = useState('');
  const [focusPrompt, setFocusPrompt] = useState('');

  // Step 1: Pillars
  const [isLoadingPillars, setIsLoadingPillars] = useState(false);
  const [suggestedPillars, setSuggestedPillars] = useState<string[]>([]);
  const [editingPillarIdx, setEditingPillarIdx] = useState<number | null>(null);
  const [editingPillarText, setEditingPillarText] = useState('');

  // Step 2: Actions breakdown mode
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 8,
  });
  const [completedPillarsWithActions, setCompletedPillarsWithActions] = useState<Pillar[]>([]);

  if (!isOpen) return null;

  // Handle Generate Pillars from AI
  const handleGeneratePillars = async (customFocus?: string) => {
    if (!goalTitle.trim()) return;
    setIsLoadingPillars(true);
    try {
      const pillars = await fetchGeneratedPillars(goalTitle, goalContext, customFocus || focusPrompt);
      setSuggestedPillars(pillars);
      setStep(2);
    } catch (err) {
      console.error(err);
      // Fallback 8 pillars
      setSuggestedPillars([
        'Estrategia y MVP',
        'Desarrollo Técnico',
        'Diseño y Experiencia',
        'Adquisición de Clientes',
        'Métricas y Feedback',
        'Finanzas y Monetización',
        'Hábitos y Disciplina',
        'Operaciones y Legal',
      ]);
      setStep(2);
    } finally {
      setIsLoadingPillars(false);
    }
  };

  // Select Preset
  const handleSelectPreset = (preset: Goal) => {
    onGoalCreated(preset);
    onClose();
  };

  // Edit pillar
  const handleSavePillarEdit = (idx: number) => {
    if (editingPillarText.trim()) {
      const updated = [...suggestedPillars];
      updated[idx] = editingPillarText.trim();
      setSuggestedPillars(updated);
    }
    setEditingPillarIdx(null);
  };

  // Step 2 -> 3: Breakdown actions
  const handleStartBreakdown = async () => {
    setIsGeneratingActions(true);
    setStep(3);

    const pillarsWithActions: Pillar[] = [];

    try {
      // Generate pillar by pillar with visual progress
      for (let i = 0; i < suggestedPillars.length; i++) {
        setGenerationProgress({ current: i + 1, total: 8 });
        const pTitle = suggestedPillars[i];
        const rawActions = await fetchGeneratedActions(goalTitle, pTitle, suggestedPillars);

        const actions: MandalaAction[] = rawActions.map((ra, aIdx) => ({
          id: `a-${Date.now()}-${i}-${aIdx}`,
          position: aIdx,
          title: ra.title,
          type: ra.type,
          isCompleted: false,
          streakCount: 0,
          habitDays: [false, false, false, false, false, false, false],
        }));

        const pillarObj: Pillar = {
          id: `pillar-${Date.now()}-${i}`,
          position: i,
          title: pTitle,
          colorTheme: PILLAR_COLORS[i % PILLAR_COLORS.length].name,
          actions,
        };

        pillarsWithActions.push(pillarObj);
        setCompletedPillarsWithActions([...pillarsWithActions]);
      }

      // Finish and create goal
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: goalTitle,
        context: goalContext,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pillars: pillarsWithActions,
      };

      onGoalCreated(newGoal);
      onClose();
    } catch (err) {
      console.error('Error generating actions breakdown:', err);
      // Fallback fill
      while (pillarsWithActions.length < 8) {
        const i = pillarsWithActions.length;
        const pTitle = suggestedPillars[i] || `Pilar ${i + 1}`;
        pillarsWithActions.push({
          id: `pillar-${Date.now()}-${i}`,
          position: i,
          title: pTitle,
          colorTheme: PILLAR_COLORS[i % PILLAR_COLORS.length].name,
          actions: Array.from({ length: 8 }, (_, aIdx) => ({
            id: `a-${Date.now()}-${i}-${aIdx}`,
            position: aIdx,
            title: `Acción clave 0${aIdx + 1} para ${pTitle}`,
            type: aIdx % 3 === 0 ? 'recurring' : 'one_time',
            isCompleted: false,
            streakCount: 0,
            habitDays: [false, false, false, false, false, false, false],
          })),
        });
      }

      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: goalTitle,
        context: goalContext,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pillars: pillarsWithActions,
      };

      onGoalCreated(newGoal);
      onClose();
    } finally {
      setIsGeneratingActions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Copiloto de Generación Asistida por IA
              </h2>
              <p className="text-[11px] text-slate-400">
                Paso {step} de 3 · {step === 1 ? 'Tu Gran Meta' : step === 2 ? 'Los 8 Pilares' : 'Desglose 8x8 (64 acciones)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* STEP 1: Main Goal & Context */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                ¿Cuál es tu gran meta? <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Ej. Lanzar mi SaaS en 6 meses, Conseguir plaza de Senior Dev, Correr una maratón..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all font-medium"
                autoFocus
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Un único objetivo claro y ambicioso. La IA no te pedirá pensar en las 64 tareas de golpe.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contexto o restricciones adicionales (Opcional)
              </label>
              <textarea
                value={goalContext}
                onChange={(e) => setGoalContext(e.target.value)}
                rows={2}
                placeholder="Ej. Presupuesto bajo, trabajo en solitario solo tardes y fines de semana, conocimientos previos en React..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
              />
            </div>

            {/* Presets shortcut */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                O explora una plantilla lista:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetGoals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-850 hover:border-slate-700 text-left transition-all group"
                  >
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.context}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleGeneratePillars()}
                disabled={!goalTitle.trim() || isLoadingPillars}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-900/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoadingPillars ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analizando con IA...</span>
                  </>
                ) : (
                  <>
                    <span>Proponer 8 Pilares</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Review and Refine 8 Pillars */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-indigo-400 font-semibold uppercase">
                Paso 1: Pilares Estratégicos
              </span>
              <h3 className="text-sm font-bold text-white">
                Los 8 pilares propuestos para "{goalTitle}"
              </h3>
              <p className="text-xs text-slate-400">
                Puedes editar cualquier título haciendo clic sobre él, o pedirle a la IA que los regenere con un matiz diferente.
              </p>
            </div>

            {/* 8 Pillars Interactive Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {suggestedPillars.map((pillar, idx) => (
                <div
                  key={`pillar-sugg-${idx}`}
                  className="p-3 rounded-lg border border-slate-700/80 bg-slate-950/70 flex items-center justify-between gap-3 group hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0">
                      0{idx + 1}
                    </span>
                    {editingPillarIdx === idx ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={editingPillarText}
                          onChange={(e) => setEditingPillarText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSavePillarEdit(idx)}
                          className="w-full bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSavePillarEdit(idx)}
                          className="px-2 py-0.5 bg-indigo-600 text-[10px] text-white rounded font-medium"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-xs font-semibold text-slate-200 truncate cursor-pointer hover:text-white"
                        onClick={() => {
                          setEditingPillarIdx(idx);
                          setEditingPillarText(pillar);
                        }}
                      >
                        {pillar}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditingPillarIdx(idx);
                      setEditingPillarText(pillar);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity p-1"
                    title="Editar pilar"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Prompt Refinement Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-[11px] text-slate-400 font-medium block">
                ¿Quieres reorientar los pilares con otro enfoque?
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={focusPrompt}
                  onChange={(e) => setFocusPrompt(e.target.value)}
                  placeholder="Ej. 'Hazlos más técnicos', 'Menos marketing y más infraestructura', 'Más agresivo en ventas'..."
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  onClick={() => handleGeneratePillars(focusPrompt)}
                  disabled={isLoadingPillars}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shrink-0 border border-slate-700"
                >
                  <RotateCw className={`h-3 w-3 ${isLoadingPillars ? 'animate-spin' : ''}`} />
                  <span>Regenerar</span>
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ← Cambiar Meta
              </button>
              <button
                onClick={handleStartBreakdown}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-900/30 flex items-center gap-2"
              >
                <span>Aprobar Pilares y Desglosar Acciones (8x8)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Progressive Generation of 64 Actions */}
        {step === 3 && (
          <div className="p-8 space-y-6 text-center">
            <div className="h-14 w-14 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                Generando el desglose 8x8 con IA
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Descomponiendo cada pilar en 8 acciones concretas y etiquetando automáticamente tareas únicas vs hábitos recurrentes.
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Pilar {generationProgress.current} de {generationProgress.total}</span>
                <span className="text-indigo-400 font-bold">
                  {Math.round((generationProgress.current / generationProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Completed pillars ticker */}
            <div className="text-left max-w-md mx-auto space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                Pilares procesados:
              </span>
              {completedPillarsWithActions.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{p.title}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">8 acciones generadas</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
