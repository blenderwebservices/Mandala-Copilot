import React, { useState } from 'react';
import { Goal, Pillar, MandalaAction, PILLAR_COLORS } from '../types/mandala';
import { 
  Sparkles, 
  RotateCw, 
  X, 
  Check, 
  Edit3, 
  Layers, 
  Wand2, 
  ListOrdered, 
  Save, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  FileText, 
  ArrowRight,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { 
  fetchGeneratedPillars, 
  fetchGeneratedActions, 
  GeneratedAction,
  fetchHaradaValidation,
  HaradaValidationResult
} from '../services/api';
import { HaradaValidationCard } from './HaradaValidationCard';

interface MainGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  onSaveGoal: (updatedGoal: Goal) => void;
  tier: 'free' | 'pro';
  onOpenTierModal: () => void;
}

export const MainGoalModal: React.FC<MainGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSaveGoal,
  tier,
  onOpenTierModal,
}) => {
  const [activeTab, setActiveTab] = useState<'pillars' | 'actions'>('pillars');

  // Goal meta fields
  const [goalTitle, setGoalTitle] = useState(goal.title);
  const [goalContext, setGoalContext] = useState(goal.context || '');

  // Harada validation state
  const [haradaValidation, setHaradaValidation] = useState<HaradaValidationResult | null>(null);
  const [isValidatingHarada, setIsValidatingHarada] = useState(false);

  // Local pillars copy for editing
  const [pillars, setPillars] = useState<Pillar[]>(() => JSON.parse(JSON.stringify(goal.pillars)));

  // Focus prompt for pillars regeneration
  const [pillarFocusPrompt, setPillarFocusPrompt] = useState('');
  const [isRegeneratingPillars, setIsRegeneratingPillars] = useState(false);

  // Actions regeneration state
  const [isRegeneratingAllActions, setIsRegeneratingAllActions] = useState(false);
  const [actionsProgress, setActionsProgress] = useState<{ current: number; total: number }>({ current: 0, total: 8 });
  const [actionsFocusPrompt, setActionsFocusPrompt] = useState('');

  // Single pillar regenerating index
  const [regeneratingPillarIdx, setRegeneratingPillarIdx] = useState<number | null>(null);

  // Inline pillar editing
  const [editingPillarIdx, setEditingPillarIdx] = useState<number | null>(null);
  const [editingPillarText, setEditingPillarText] = useState('');

  // Expanded pillar accordion in actions tab
  const [expandedPillarIdx, setExpandedPillarIdx] = useState<number | null>(null);

  // Manual actions editing modal / panel state inside modal
  const [manualPillarIdx, setManualPillarIdx] = useState<number | null>(null);
  const [manualActionDrafts, setManualActionDrafts] = useState<{ title: string; type: 'one_time' | 'recurring' }[]>([]);
  const [pasteBulkText, setPasteBulkText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  // Notification message
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackNotice({ text, type });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Keep state synced when modal opens or goal prop changes
  React.useEffect(() => {
    if (isOpen) {
      setGoalTitle(goal.title);
      setGoalContext(goal.context || '');
      setPillars(JSON.parse(JSON.stringify(goal.pillars)));
      setEditingPillarIdx(null);
      setManualPillarIdx(null);
      setFeedbackNotice(null);
    }
  }, [isOpen, goal]);

  if (!isOpen) return null;

  // Handle single pillar inline edit
  const handleSavePillarInline = (idx: number) => {
    if (editingPillarText.trim()) {
      const updated = [...pillars];
      updated[idx] = {
        ...updated[idx],
        title: editingPillarText.trim(),
      };
      setPillars(updated);
    }
    setEditingPillarIdx(null);
  };

  // 1. REGENERATE 8 PILLARS WITH AI
  const handleRegeneratePillarsWithAi = async () => {
    if (!goalTitle.trim()) {
      showNotice('Ingresa un título para la meta antes de generar pilares.', 'error');
      return;
    }
    if (tier === 'free') {
      onOpenTierModal();
      return;
    }

    setIsRegeneratingPillars(true);
    try {
      const newPillarTitles = await fetchGeneratedPillars(goalTitle, goalContext, pillarFocusPrompt);
      if (Array.isArray(newPillarTitles) && newPillarTitles.length >= 8) {
        const updated = pillars.map((p, idx) => ({
          ...p,
          title: newPillarTitles[idx] || p.title,
        }));
        setPillars(updated);
        showNotice('¡Los 8 pilares han sido regenerados con éxito por la IA!', 'success');
      }
    } catch (err: any) {
      console.error('Error al regenerar pilares:', err);
      showNotice('No se pudieron regenerar los pilares con IA. Inténtalo de nuevo.', 'error');
    } finally {
      setIsRegeneratingPillars(false);
    }
  };

  // 2. REGENERATE ALL 64 ACTIONS WITH AI
  const handleRegenerateAllActionsWithAi = async () => {
    if (tier === 'free') {
      onOpenTierModal();
      return;
    }

    setIsRegeneratingAllActions(true);
    setActionsProgress({ current: 0, total: 8 });

    const allPillarTitles = pillars.map((p) => p.title);
    const updatedPillars = [...pillars];

    try {
      for (let i = 0; i < updatedPillars.length; i++) {
        setActionsProgress({ current: i + 1, total: 8 });
        const p = updatedPillars[i];

        const rawActions = await fetchGeneratedActions(
          goalTitle,
          p.title,
          allPillarTitles,
          actionsFocusPrompt || undefined
        );

        const newActions: MandalaAction[] = rawActions.map((ra, aIdx) => ({
          id: `action-${Date.now()}-${i}-${aIdx}`,
          position: aIdx,
          title: ra.title,
          type: ra.type,
          isCompleted: false,
          streakCount: 0,
          habitDays: [false, false, false, false, false, false, false],
        }));

        updatedPillars[i] = {
          ...p,
          actions: newActions,
        };
      }

      setPillars(updatedPillars);
      showNotice('¡Se han regenerado con IA las 64 acciones de la matriz 8x8!', 'success');
    } catch (err: any) {
      console.error('Error al regenerar todas las acciones:', err);
      showNotice('Hubo un problema al regenerar algunas acciones.', 'error');
    } finally {
      setIsRegeneratingAllActions(false);
    }
  };

  // 3. REGENERATE ACTIONS OF A SINGLE PILLAR WITH AI
  const handleRegenerateSinglePillarWithAi = async (pIdx: number, customPrompt?: string) => {
    if (tier === 'free') {
      onOpenTierModal();
      return;
    }

    setRegeneratingPillarIdx(pIdx);
    const targetPillar = pillars[pIdx];
    const allPillarTitles = pillars.map((p) => p.title);

    try {
      const rawActions = await fetchGeneratedActions(
        goalTitle,
        targetPillar.title,
        allPillarTitles,
        customPrompt || undefined
      );

      const newActions: MandalaAction[] = rawActions.map((ra, aIdx) => ({
        id: `action-${Date.now()}-${pIdx}-${aIdx}`,
        position: aIdx,
        title: ra.title,
        type: ra.type,
        isCompleted: false,
        streakCount: 0,
        habitDays: [false, false, false, false, false, false, false],
      }));

      const updated = [...pillars];
      updated[pIdx] = {
        ...targetPillar,
        actions: newActions,
      };

      setPillars(updated);
      showNotice(`Acciones regeneradas para "${targetPillar.title}".`, 'success');
    } catch (err: any) {
      console.error('Error al regenerar pilar:', err);
      showNotice('Error al regenerar acciones del pilar con IA.', 'error');
    } finally {
      setRegeneratingPillarIdx(null);
    }
  };

  // 4. OPEN MANUAL ACTIONS EDITOR FOR A PILLAR
  const handleOpenManualActions = (pIdx: number) => {
    setManualPillarIdx(pIdx);
    const currentActions = pillars[pIdx].actions || [];
    const drafts = Array.from({ length: 8 }, (_, i) => ({
      title: currentActions[i]?.title || `Acción clave 0${i + 1}`,
      type: currentActions[i]?.type || (i % 3 === 0 ? 'recurring' : 'one_time'),
    }));
    setManualActionDrafts(drafts);
    setPasteBulkText('');
    setShowPasteBox(false);
  };

  // Apply Bulk Pasted Text into the 8 drafts
  const handleApplyPasteBulk = () => {
    if (!pasteBulkText.trim()) return;
    const lines = pasteBulkText
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•\d+.\s]+/, ''))
      .filter(Boolean);

    if (lines.length === 0) return;

    setManualActionDrafts((prev) =>
      prev.map((draft, idx) => ({
        ...draft,
        title: lines[idx] !== undefined ? lines[idx] : draft.title,
      }))
    );
    setShowPasteBox(false);
    setPasteBulkText('');
    showNotice(`Se aplicaron ${Math.min(lines.length, 8)} líneas a los slots de acciones.`);
  };

  // Save Manual Actions
  const handleSaveManualActions = () => {
    if (manualPillarIdx === null) return;
    const target = pillars[manualPillarIdx];

    const updatedActions: MandalaAction[] = manualActionDrafts.map((d, aIdx) => {
      const existing = target.actions[aIdx];
      return {
        id: existing?.id || `action-${Date.now()}-${manualPillarIdx}-${aIdx}`,
        position: aIdx,
        title: d.title.trim() || `Acción 0${aIdx + 1}`,
        type: d.type,
        isCompleted: existing?.isCompleted || false,
        streakCount: existing?.streakCount || 0,
        habitDays: existing?.habitDays || [false, false, false, false, false, false, false],
      };
    });

    const updatedPillars = [...pillars];
    updatedPillars[manualPillarIdx] = {
      ...target,
      actions: updatedActions,
    };

    setPillars(updatedPillars);
    setManualPillarIdx(null);
    showNotice(`Acciones de "${target.title}" actualizadas manualmente.`);
  };

  // Reset all 64 actions to clean draft templates
  const handleResetAllActionsManually = () => {
    if (!window.confirm('¿Seguro que deseas restablecer las 64 acciones con una plantilla limpia para editar manualmente?')) {
      return;
    }
    const updated = pillars.map((p, pIdx) => ({
      ...p,
      actions: Array.from({ length: 8 }, (_, aIdx) => ({
        id: `action-${Date.now()}-${pIdx}-${aIdx}`,
        position: aIdx,
        title: `Acción clave ${aIdx + 1} para ${p.title}`,
        type: aIdx % 3 === 0 ? ('recurring' as const) : ('one_time' as const),
        isCompleted: false,
        streakCount: 0,
        habitDays: [false, false, false, false, false, false, false],
      })),
    }));
    setPillars(updated);
    showNotice('Se han restablecido las 64 acciones a plantilla manual.');
  };

  // FINAL SAVE ALL
  const handleFinalSave = () => {
    const updatedGoal: Goal = {
      ...goal,
      title: goalTitle.trim() || goal.title,
      context: goalContext.trim() || undefined,
      pillars,
      updatedAt: new Date().toISOString(),
    };

    onSaveGoal(updatedGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Formulario de la Meta Principal
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Núcleo Harada 9x9
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Regeneración Asistida con IA y Control Manual de Pilares y Acciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert Notice */}
        {feedbackNotice && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              feedbackNotice.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{feedbackNotice.text}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('pillars')}
            className={`pb-3 px-1 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'pillars'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Meta & 8 Pilares</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              8
            </span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`pb-3 px-1 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'actions'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ListOrdered className="h-4 w-4" />
            <span>Desglose de Acciones (8x8)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              64
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ================= TAB 1: META Y 8 PILARES ================= */}
          {activeTab === 'pillars' && (
            <div className="space-y-6">
              {/* Meta Inputs */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Título de la Gran Meta Central <span className="text-indigo-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!goalTitle.trim()) return;
                        setIsValidatingHarada(true);
                        try {
                          const res = await fetchHaradaValidation(goalTitle, goalContext);
                          setHaradaValidation(res);
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setIsValidatingHarada(false);
                        }
                      }}
                      disabled={!goalTitle.trim() || isValidatingHarada}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Sparkles className={`h-3 w-3 ${isValidatingHarada ? 'animate-spin' : ''}`} />
                      <span>{isValidatingHarada ? 'Analizando con IA...' : 'Auditar con Método Harada'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => {
                      setGoalTitle(e.target.value);
                      if (haradaValidation) setHaradaValidation(null);
                    }}
                    placeholder="Ej. Lanzar mi SaaS B2B en 6 meses con $2,000 MRR..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 font-semibold"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    El Método Harada exige que el Objetivo Central sea <strong>claro, medible y desafiante</strong>.
                  </p>
                </div>

                {/* Harada Validation Diagnostic & 3 Reformulated Suggestions */}
                {haradaValidation && (
                  <HaradaValidationCard
                    validation={haradaValidation}
                    onSelectSuggestion={(newTitle) => {
                      setGoalTitle(newTitle);
                      setHaradaValidation(null);
                      showNotice('Meta actualizada según la sugerencia del Método Harada.');
                    }}
                    onProceedAnyway={() => setHaradaValidation(null)}
                  />
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Contexto o Restricciones (Opcional)
                  </label>
                  <textarea
                    value={goalContext}
                    onChange={(e) => setGoalContext(e.target.value)}
                    rows={2}
                    placeholder="Ej. Trabajo solo tardes y fines de semana, conocimientos previos en React y Node, presupuesto bajo..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 8 Pillars Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <span>Los 8 Pilares Estratégicos</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Edita el texto haciendo clic sobre cada pilar, o regenéralos en lote con la IA.
                  </p>
                </div>

                {/* AI Regeneration Bar for Pillars */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pillarFocusPrompt}
                    onChange={(e) => setPillarFocusPrompt(e.target.value)}
                    placeholder="Matiz de enfoque (opcional)..."
                    className="bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-60"
                  />
                  <button
                    onClick={handleRegeneratePillarsWithAi}
                    disabled={isRegeneratingPillars || !goalTitle.trim()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                    title="Regenerar los 8 pilares con Google Gemini"
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${isRegeneratingPillars ? 'animate-spin' : ''}`} />
                    <span>{isRegeneratingPillars ? 'Analizando...' : 'Regenerar con IA'}</span>
                  </button>
                </div>
              </div>

              {/* 8 Pillars Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pillars.map((pillar, idx) => (
                  <div
                    key={`pillar-card-${pillar.id || idx}`}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950/70 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex items-center justify-between gap-3 shadow-xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                        0{idx + 1}
                      </span>

                      {editingPillarIdx === idx ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editingPillarText}
                            onChange={(e) => setEditingPillarText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSavePillarInline(idx)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePillarInline(idx)}
                            className="px-2.5 py-1 bg-indigo-600 text-[10px] text-white rounded font-medium cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                            onClick={() => {
                              setEditingPillarIdx(idx);
                              setEditingPillarText(pillar.title);
                            }}
                            title="Haz clic para editar el texto del pilar"
                          >
                            {pillar.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {pillar.actions?.length || 0} acciones asignadas
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit Text */}
                      <button
                        onClick={() => {
                          setEditingPillarIdx(idx);
                          setEditingPillarText(pillar.title);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar nombre"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Regenerate this pillar's actions with AI */}
                      <button
                        onClick={() => handleRegenerateSinglePillarWithAi(idx)}
                        disabled={regeneratingPillarIdx === idx}
                        className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors rounded cursor-pointer"
                        title="Regenerar acciones de este pilar con IA"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${regeneratingPillarIdx === idx ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 2: DESGLOSE DE ACCIONES (8x8) ================= */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              
              {/* Batch Actions Header & Controls */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-indigo-500" />
                      <span>Regeneración Integral de Acciones (8x8 = 64)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Genera o reestructura las 8 acciones de cada uno de los 8 pilares estratégicos.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetAllActionsManually}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      title="Restablecer todas las acciones a borrador manual limpio"
                    >
                      Restablecer Manual
                    </button>

                    <button
                      onClick={handleRegenerateAllActionsWithAi}
                      disabled={isRegeneratingAllActions}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className={`h-4 w-4 ${isRegeneratingAllActions ? 'animate-pulse' : ''}`} />
                      <span>{isRegeneratingAllActions ? 'Generando 64 acciones...' : 'Regenerar Todo con IA (8x8)'}</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar when batch regenerating */}
                {isRegeneratingAllActions && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>Procesando Pilar {actionsProgress.current} de {actionsProgress.total}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {Math.round((actionsProgress.current / actionsProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-300 rounded-full"
                        style={{ width: `${(actionsProgress.current / actionsProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion List of Pillars for Action Review / Manual Edit */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Desglose por Pilar
                </span>

                {pillars.map((pillar, pIdx) => {
                  const isExpanded = expandedPillarIdx === pIdx;
                  const isRegenerating = regeneratingPillarIdx === pIdx;

                  return (
                    <div
                      key={`actions-pillar-${pillar.id || pIdx}`}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/40 transition-colors"
                    >
                      {/* Pillar Strip Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60 gap-3">
                        <div
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          onClick={() => setExpandedPillarIdx(isExpanded ? null : pIdx)}
                        >
                          <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
                            0{pIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {pillar.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {pillar.actions.filter((a) => a.isCompleted).length}/{pillar.actions.length} compl.
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Manual Edit Button */}
                          <button
                            onClick={() => handleOpenManualActions(pIdx)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Regenerar o editar las 8 acciones manualmente"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span className="hidden sm:inline">Manual</span>
                          </button>

                          {/* AI Regenerate Pillar Actions */}
                          <button
                            onClick={() => handleRegenerateSinglePillarWithAi(pIdx)}
                            disabled={isRegenerating}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Regenerar las 8 acciones de este pilar con IA"
                          >
                            <Sparkles className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Con IA</span>
                          </button>

                          {/* Toggle Accordion */}
                          <button
                            onClick={() => setExpandedPillarIdx(isExpanded ? null : pIdx)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Actions List */}
                      {isExpanded && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/30 dark:bg-slate-900/20">
                          {pillar.actions.map((act, aIdx) => (
                            <div
                              key={`expanded-act-${pIdx}-${aIdx}`}
                              className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/60 flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  A{aIdx + 1}
                                </span>
                                <span className="text-xs text-slate-800 dark:text-slate-200 truncate">
                                  {act.title}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                  act.type === 'recurring'
                                    ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300'
                                    : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                }`}
                              >
                                {act.type === 'recurring' ? 'Hábito' : 'Única'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= MANUAL ACTIONS DRAWER / SUB-MODAL ================= */}
          {manualPillarIdx !== null && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Regeneración Manual de Acciones: {pillars[manualPillarIdx]?.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => setManualPillarIdx(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  {/* Toolbar options */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Define manualmente las 8 acciones de este pilar:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPasteBox(!showPasteBox)}
                        className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        📋 Pegar lista (8 líneas)
                      </button>
                      <button
                        onClick={() =>
                          setManualActionDrafts((prev) =>
                            prev.map((d, i) => ({ title: '', type: d.type }))
                          )
                        }
                        className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 font-medium transition-colors cursor-pointer"
                      >
                        Limpiar todo
                      </button>
                    </div>
                  </div>

                  {/* Optional Paste Area */}
                  {showPasteBox && (
                    <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 rounded-xl space-y-2 animate-in fade-in">
                      <label className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 block">
                        Pega hasta 8 líneas de texto (cada línea se asignará a un slot):
                      </label>
                      <textarea
                        value={pasteBulkText}
                        onChange={(e) => setPasteBulkText(e.target.value)}
                        rows={4}
                        placeholder="Acción 1...&#10;Acción 2...&#10;Acción 3..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowPasteBox(false)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleApplyPasteBulk}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Asignar a los 8 slots
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 8 Inputs List */}
                  <div className="space-y-2">
                    {manualActionDrafts.map((draft, idx) => (
                      <div
                        key={`manual-slot-${idx}`}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60"
                      >
                        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 w-6 shrink-0">
                          A{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) => {
                            const updated = [...manualActionDrafts];
                            updated[idx].title = e.target.value;
                            setManualActionDrafts(updated);
                          }}
                          placeholder={`Nombre de la acción ${idx + 1}...`}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...manualActionDrafts];
                            updated[idx].type = draft.type === 'recurring' ? 'one_time' : 'recurring';
                            setManualActionDrafts(updated);
                          }}
                          className={`text-[10px] font-medium px-2 py-1 rounded shrink-0 cursor-pointer transition-colors ${
                            draft.type === 'recurring'
                              ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300'
                              : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                          }`}
                          title="Alternar tipo"
                        >
                          {draft.type === 'recurring' ? 'Hábito' : 'Única'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setManualPillarIdx(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveManualActions}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    Guardar Acciones Manuales
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleFinalSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Aplicar y Guardar Cambios en la Matriz</span>
          </button>
        </div>

      </div>
    </div>
  );
};
