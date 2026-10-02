import React, { useState } from 'react';
import { Pillar, MandalaAction, ActionType } from '../types/mandala';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  RotateCw, 
  Zap, 
  Flame, 
  Trash2, 
  Edit3, 
  Wand2, 
  AlertCircle,
  ListOrdered,
  ClipboardPaste,
  Save
} from 'lucide-react';

interface PillarFocusModalProps {
  pillar: Pillar;
  pillarIndex: number;
  goalTitle: string;
  onClose: () => void;
  onNavigatePillar: (newIndex: number) => void;
  onToggleAction: (actionIndex: number) => void;
  onUpdateActionTitle: (actionIndex: number, newTitle: string) => void;
  onToggleActionType: (actionIndex: number) => void;
  onToggleHabitDay: (actionIndex: number, dayIndex: number) => void;
  onRegenerateQuadrant: (focusPrompt: string) => Promise<void>;
  isRegenerating: boolean;
  onRequestRecalibrate: (action: MandalaAction, actionIndex: number) => void;
  onUpdateAllPillarActions: (newActions: MandalaAction[]) => void;
}

export const PillarFocusModal: React.FC<PillarFocusModalProps> = ({
  pillar,
  pillarIndex,
  goalTitle,
  onClose,
  onNavigatePillar,
  onToggleAction,
  onUpdateActionTitle,
  onToggleActionType,
  onToggleHabitDay,
  onRegenerateQuadrant,
  isRegenerating,
  onRequestRecalibrate,
  onUpdateAllPillarActions,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [customFocusPrompt, setCustomFocusPrompt] = useState('');
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);

  // Manual actions regeneration modal / drawer state
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [manualDrafts, setManualDrafts] = useState<{ title: string; type: ActionType }[]>([]);
  const [manualPasteText, setManualPasteText] = useState('');
  const [showManualPaste, setShowManualPaste] = useState(false);

  const completedCount = pillar.actions.filter((a) => a.isCompleted).length;
  const progressPercent = Math.round((completedCount / (pillar.actions.length || 1)) * 100);

  // Recurring tasks streak calculation for the current pillar
  const recurringActions = pillar.actions.filter((a) => a.type === 'recurring');
  const totalRecurring = recurringActions.length;
  const maxStreak = recurringActions.length > 0
    ? Math.max(...recurringActions.map((a) => a.streakCount || 0))
    : 0;

  const daysLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const handleStartEdit = (idx: number, currentTitle: string) => {
    setEditingIndex(idx);
    setEditText(currentTitle);
  };

  const handleSaveEdit = (idx: number) => {
    if (editText.trim()) {
      onUpdateActionTitle(idx, editText.trim());
    }
    setEditingIndex(null);
  };

  const handleRunRegenerate = async (e?: React.FormEvent, directPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = directPrompt !== undefined ? directPrompt : customFocusPrompt;
    await onRegenerateQuadrant(promptToSend);
    setShowRegenerateInput(false);
    setCustomFocusPrompt('');
  };

  // Open Manual Editor
  const handleOpenManualEditor = () => {
    const drafts = Array.from({ length: 8 }, (_, i) => ({
      title: pillar.actions[i]?.title || `Acción clave 0${i + 1}`,
      type: pillar.actions[i]?.type || (i % 3 === 0 ? 'recurring' : 'one_time'),
    }));
    setManualDrafts(drafts);
    setManualPasteText('');
    setShowManualPaste(false);
    setShowManualEditor(true);
  };

  // Apply Bulk Pasted Text
  const handleApplyManualPaste = () => {
    if (!manualPasteText.trim()) return;
    const lines = manualPasteText
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•\d+.\s]+/, ''))
      .filter(Boolean);

    if (lines.length === 0) return;

    setManualDrafts((prev) =>
      prev.map((d, idx) => ({
        ...d,
        title: lines[idx] !== undefined ? lines[idx] : d.title,
      }))
    );
    setShowManualPaste(false);
    setManualPasteText('');
  };

  // Save Manual Actions
  const handleSaveManualEditor = () => {
    const newActions: MandalaAction[] = manualDrafts.map((d, idx) => ({
      id: pillar.actions[idx]?.id || `action-${Date.now()}-${pillarIndex}-${idx}`,
      position: idx,
      title: d.title.trim() || `Acción clave 0${idx + 1}`,
      type: d.type,
      isCompleted: pillar.actions[idx]?.isCompleted || false,
      streakCount: pillar.actions[idx]?.streakCount || 0,
      habitDays: pillar.actions[idx]?.habitDays || [false, false, false, false, false, false, false],
    }));

    onUpdateAllPillarActions(newActions);
    setShowManualEditor(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Header Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shrink-0">
              Pilar {pillarIndex + 1} de 8
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Enfoque Micro en Cuadrante</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">{pillar.title}</h2>
            </div>
          </div>

          {/* Tarjeta de Racha Actual */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/25 shadow-sm shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
              <Flame className="h-4 w-4 fill-amber-400/20 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400 font-mono">
                  Racha actual
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  · {totalRecurring} {totalRecurring === 1 ? 'hábito' : 'hábitos'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {maxStreak} {maxStreak === 1 ? 'día' : 'días'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {maxStreak > 0 ? 'consecutivos cumplidos' : 'sin racha aún'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onNavigatePillar((pillarIndex + 7) % 8)}
                className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Pilar anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-500 dark:text-slate-400">
                {pillarIndex + 1}/8
              </span>
              <button
                onClick={() => onNavigatePillar((pillarIndex + 1) % 8)}
                className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Siguiente pilar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress & Actions Toolbar Strip */}
        <div className="px-6 py-3 bg-slate-100/60 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full max-w-sm">
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  progressPercent === 100
                    ? 'bg-emerald-500'
                    : progressPercent >= 50
                    ? 'bg-teal-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
              {completedCount}/8 ({progressPercent}%)
            </span>
          </div>

          {/* Regenerate Action Buttons: AI & Manual */}
          <div className="flex items-center gap-2">
            {/* 1. Regenerar con IA */}
            <button
              onClick={() => setShowRegenerateInput(!showRegenerateInput)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showRegenerateInput
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30'
              }`}
              title="Regenerar las 8 acciones de este pilar con IA"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Regenerar con IA</span>
            </button>

            {/* 2. Regenerar Manualmente */}
            <button
              onClick={handleOpenManualEditor}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reescribir o estructurar manualmente las 8 acciones"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Regenerar Manualmente</span>
            </button>
          </div>
        </div>

        {/* AI Regenerate Prompt Bar */}
        {showRegenerateInput && (
          <form
            onSubmit={(e) => handleRunRegenerate(e)}
            className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in"
          >
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={customFocusPrompt}
                onChange={(e) => setCustomFocusPrompt(e.target.value)}
                placeholder="Matiz de enfoque (opcional, ej. 'Hazlas más técnicas', 'Bajo coste', 'Orientado a ventas')..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-indigo-500/40 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={isRegenerating}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={isRegenerating}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isRegenerating ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Regenerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{customFocusPrompt.trim() ? 'Aplicar Enfoque' : 'Regenerar Ahora'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowRegenerateInput(false)}
                className="px-2.5 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Micro Grid Body: 8 Actions cards */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pillar.actions.map((action, idx) => {
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={`focus-action-${action.id || idx}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    action.isCompleted
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 text-slate-800 dark:text-slate-200'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => onToggleAction(idx)}
                      className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                        action.isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {action.isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>

                    {/* Content / Title */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(idx)}
                            className="w-full bg-white dark:bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(idx)}
                            className="px-2 py-1 bg-indigo-600 text-[10px] text-white rounded font-medium cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <div className="group flex items-start justify-between gap-2">
                          <p
                            className={`text-xs font-medium leading-snug cursor-pointer ${
                              action.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
                            }`}
                            onClick={() => handleStartEdit(idx, action.title)}
                          >
                            {action.title}
                          </p>
                          <button
                            onClick={() => handleStartEdit(idx, action.title)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-opacity p-0.5 cursor-pointer"
                            title="Editar texto"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {/* Metadata Row: Recurrence Badge + Habit Tracker or AI Recalibrate */}
                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                        {/* Type toggle */}
                        <button
                          onClick={() => onToggleActionType(idx)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                            action.type === 'recurring'
                              ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/30'
                              : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/30'
                          }`}
                          title="Alternar entre Hábito y Tarea Única"
                        >
                          {action.type === 'recurring' ? (
                            <>
                              <RotateCw className="h-2.5 w-2.5" />
                              <span>Hábito</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-2.5 w-2.5" />
                              <span>Tarea Única</span>
                            </>
                          )}
                        </button>

                        {/* If Recurring: 7-day checkboxes and streak */}
                        {action.type === 'recurring' && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 font-mono mr-1">Semana:</span>
                            {daysLabels.map((day, dIdx) => {
                              const isDayActive = action.habitDays?.[dIdx] || false;
                              return (
                                <button
                                  key={`day-${idx}-${dIdx}`}
                                  onClick={() => onToggleHabitDay(idx, dIdx)}
                                  className={`w-4 h-4 rounded text-[9px] font-mono flex items-center justify-center transition-colors cursor-pointer ${
                                    isDayActive
                                      ? 'bg-teal-500 text-white dark:text-slate-950 font-bold'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                                  }`}
                                  title={`${day}: ${isDayActive ? 'Completado' : 'Pendiente'}`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                            {action.streakCount > 0 && (
                              <span className="text-[10px] text-amber-500 dark:text-amber-400 font-mono font-bold flex items-center gap-0.5 ml-1">
                                <Flame className="h-3 w-3" />
                                {action.streakCount}
                              </span>
                            )}
                          </div>
                        )}

                        {/* AI Recalibrate Trigger */}
                        <button
                          onClick={() => onRequestRecalibrate(action, idx)}
                          className="text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                          title="¿Estancado o difícil? Pide a la IA que la recalibre o divida"
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>Recalibrar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MANUAL ACTIONS REGENERATION OVERLAY PANEL */}
        {showManualEditor && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Regenerar Manualmente las Acciones de "{pillar.title}"
                  </h4>
                </div>
                <button
                  onClick={() => setShowManualEditor(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Escribe o modifica las 8 acciones para este pilar:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowManualPaste(!showManualPaste)}
                      className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                    >
                      📋 Pegar 8 líneas
                    </button>
                    <button
                      onClick={() =>
                        setManualDrafts((prev) =>
                          prev.map((d) => ({ title: '', type: d.type }))
                        )
                      }
                      className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 font-medium transition-colors cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Paste Text Area */}
                {showManualPaste && (
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 rounded-xl space-y-2 animate-in fade-in">
                    <label className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 block">
                      Pega hasta 8 líneas de texto (una acción por línea):
                    </label>
                    <textarea
                      value={manualPasteText}
                      onChange={(e) => setManualPasteText(e.target.value)}
                      rows={4}
                      placeholder="Acción 1...&#10;Acción 2...&#10;Acción 3..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowManualPaste(false)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleApplyManualPaste}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                )}

                {/* 8 Inputs */}
                <div className="space-y-2">
                  {manualDrafts.map((draft, idx) => (
                    <div
                      key={`manual-pillar-slot-${idx}`}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60"
                    >
                      <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 w-6 shrink-0">
                        A{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => {
                          const updated = [...manualDrafts];
                          updated[idx].title = e.target.value;
                          setManualDrafts(updated);
                        }}
                        placeholder={`Nombre de la acción ${idx + 1}...`}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...manualDrafts];
                          updated[idx].type = draft.type === 'recurring' ? 'one_time' : 'recurring';
                          setManualDrafts(updated);
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

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowManualEditor(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveManualEditor}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Guardar Acciones
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>
            Pilar: <strong className="text-slate-900 dark:text-white">{pillar.title}</strong> · Meta:{' '}
            <span className="text-slate-700 dark:text-slate-300">{goalTitle}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium transition-colors cursor-pointer"
          >
            Volver a Matriz 9x9
          </button>
        </div>

      </div>
    </div>
  );
};
