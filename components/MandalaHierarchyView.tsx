import React, { useState } from 'react';
import { Goal, Pillar, MandalaAction, PILLAR_COLORS } from '../types/mandala';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Maximize2,
  RotateCw,
  Flame,
  Zap,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Search,
  ChevronsUpDown,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { GlobalFilterStatus } from './GlobalFilterBar';
import { matchAnyTextAccentInsensitive } from '../services/searchUtils';

interface MandalaHierarchyViewProps {
  goal: Goal;
  onToggleAction: (pillarIndex: number, actionIndex: number) => void;
  onUpdateActionTitle: (pillarIndex: number, actionIndex: number, newTitle: string) => void;
  onToggleActionType: (pillarIndex: number, actionIndex: number) => void;
  onToggleHabitDay: (pillarIndex: number, actionIndex: number, dayIndex: number) => void;
  onRequestRecalibrate: (action: MandalaAction, actionIndex: number, pillarIndex: number) => void;
  onSelectPillar: (pillarIndex: number) => void;
  onGeneratePillarActions: (pillarIndex: number) => void;
  isGeneratingPillar: number | null;
  onOpenCheckin: () => void;
  onOpenMainGoalModal: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: GlobalFilterStatus;
  onStatusFilterChange?: (status: GlobalFilterStatus) => void;
}

export const MandalaHierarchyView: React.FC<MandalaHierarchyViewProps> = ({
  goal,
  onToggleAction,
  onUpdateActionTitle,
  onToggleActionType,
  onToggleHabitDay,
  onRequestRecalibrate,
  onSelectPillar,
  onGeneratePillarActions,
  isGeneratingPillar,
  onOpenCheckin,
  onOpenMainGoalModal,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  statusFilter: externalStatusFilter,
  onStatusFilterChange: externalOnStatusFilterChange,
}) => {
  const [internalFilterType, setInternalFilterType] = useState<GlobalFilterStatus>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const onSearchChange = externalOnSearchChange || setInternalSearchQuery;
  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalFilterType;
  const onStatusFilterChange = externalOnStatusFilterChange || setInternalFilterType;
  
  // Track open/collapsed state for each of the 8 pillars (default all open)
  const [expandedPillars, setExpandedPillars] = useState<Record<number, boolean>>(() => ({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
  }));

  // Inline editing state for an action
  const [editingTarget, setEditingTarget] = useState<{
    pillarIndex: number;
    actionIndex: number;
    title: string;
  } | null>(null);

  // Calculate overall stats
  let totalActions = 0;
  let completedActions = 0;
  let totalRecurring = 0;
  let activeStreaks = 0;

  goal.pillars.forEach((p) => {
    p.actions.forEach((a) => {
      totalActions++;
      if (a.isCompleted) completedActions++;
      if (a.type === 'recurring') {
        totalRecurring++;
        if (a.streakCount > 0) activeStreaks++;
      }
    });
  });

  const overallProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const togglePillar = (pIdx: number) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [pIdx]: !prev[pIdx],
    }));
  };

  const expandAll = () => {
    const nextState: Record<number, boolean> = {};
    goal.pillars.forEach((_, idx) => {
      nextState[idx] = true;
    });
    setExpandedPillars(nextState);
  };

  const collapseAll = () => {
    const nextState: Record<number, boolean> = {};
    goal.pillars.forEach((_, idx) => {
      nextState[idx] = false;
    });
    setExpandedPillars(nextState);
  };

  const getPillarProgress = (pillar: Pillar) => {
    if (!pillar.actions || pillar.actions.length === 0) return 0;
    const completed = pillar.actions.filter((a) => a.isCompleted).length;
    return Math.round((completed / pillar.actions.length) * 100);
  };

  const daysLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const handleStartEdit = (pIdx: number, aIdx: number, currentTitle: string) => {
    setEditingTarget({
      pillarIndex: pIdx,
      actionIndex: aIdx,
      title: currentTitle,
    });
  };

  const handleSaveEdit = () => {
    if (editingTarget && editingTarget.title.trim()) {
      onUpdateActionTitle(
        editingTarget.pillarIndex,
        editingTarget.actionIndex,
        editingTarget.title.trim()
      );
    }
    setEditingTarget(null);
  };

  const handleCancelEdit = () => {
    setEditingTarget(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      {/* ========================================================= */}
      {/* NIVEL 1: META CENTRAL (Cabecera Global & Indicadores Clave) */}
      {/* ========================================================= */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 p-4 sm:p-6 backdrop-blur-md shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Main Goal Info */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                Nivel 1 · Meta Central
              </span>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {completedActions} de {totalActions} completadas ({overallProgress}%)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight text-balance">
                {goal.title}
              </h1>
            </div>

            {goal.context && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                {goal.context}
              </p>
            )}

            {/* Quick Actions for Level 1 */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenMainGoalModal}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Editar o recalibrar la meta central y sus pilares con Gemini AI"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Editar Meta & Regenerar</span>
              </button>

              <button
                type="button"
                onClick={onOpenCheckin}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Evaluar el estado del proyecto con el asistente de check-in semanal"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Check-in Semanal</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-4 sm:gap-6 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 pt-3 lg:pt-0 w-full lg:w-auto shrink-0">
            {/* Progress Gauge */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                <svg className="w-14 h-14 -rotate-90 absolute">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    className={`${
                      overallProgress === 100
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : overallProgress >= 50
                        ? 'text-teal-500 dark:text-teal-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                    } transition-all duration-700 ease-out`}
                    strokeWidth="4"
                    strokeDasharray={138.23}
                    strokeDashoffset={138.23 - (138.23 * overallProgress) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{overallProgress}%</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Progreso</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {completedActions} / {totalActions}
                </p>
              </div>
            </div>

            {/* Recurring Habits Streak */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <Flame className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Hábitos</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {activeStreaks} activos ({totalRecurring})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => onStatusFilterChange('all')}
              className={`px-3 py-1 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todas ({totalActions})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('pending')}
              className={`px-3 py-1 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Pendientes ({totalActions - completedActions})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('completed')}
              className={`px-3 py-1 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Completadas ({completedActions})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('recurring')}
              className={`px-3 py-1 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'recurring'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Hábitos ({totalRecurring})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('one_time')}
              className={`px-3 py-1 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'one_time'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Únicas ({totalActions - totalRecurring})
            </button>
          </div>

          {/* Search and Expand/Collapse Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por palabra clave..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Expandir todos los pilares"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Expandir</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title="Colapsar todos los pilares"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Colapsar</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* NIVEL 2: LOS 8 PILARES Y NIVEL 3: ACCIONES SUPEDITADAS    */}
      {/* ========================================================= */}
      <section className="space-y-4">
        {goal.pillars.map((pillar, pIdx) => {
          const colorTheme = PILLAR_COLORS[pIdx % PILLAR_COLORS.length];
          const progress = getPillarProgress(pillar);
          const isExpanded = !!expandedPillars[pIdx];
          const isGenerating = isGeneratingPillar === pIdx;

          // Filter actions based on state and search query
          const cleanQ = searchQuery.trim().toLowerCase();
          const filteredActions = pillar.actions.map((act, originalIndex) => ({
            action: act,
            actionIndex: originalIndex,
          })).filter(({ action }) => {
            let matchesStatus = true;
            if (statusFilter === 'pending') matchesStatus = !action.isCompleted && action.progress !== 100;
            else if (statusFilter === 'completed') matchesStatus = action.isCompleted || action.progress === 100;
            else if (statusFilter === 'in_progress') matchesStatus = !action.isCompleted && ((action.progress && action.progress > 0) || action.status === 'in_progress');
            else if (statusFilter === 'blocked') matchesStatus = !!action.isStuck || action.status === 'blocked';
            else if (statusFilter === 'recurring') matchesStatus = action.type === 'recurring';
            else if (statusFilter === 'one_time') matchesStatus = action.type === 'one_time';

            const matchesSearch = matchAnyTextAccentInsensitive(
              [action.title, action.notes, action.assignee],
              searchQuery
            );

            return matchesStatus && matchesSearch;
          });

          // Auto-expand if active query and actions match
          const shouldExpand = (cleanQ || statusFilter !== 'all') ? filteredActions.length > 0 : isExpanded;

          const completedInPillar = pillar.actions.filter((a) => a.isCompleted).length;

          return (
            <div
              key={`pillar-hierarchy-${pIdx}`}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm'
                  : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* ===================================================== */}
              {/* NIVEL 2: CABECERA DEL PILAR                           */}
              {/* ===================================================== */}
              <div
                onClick={() => togglePillar(pIdx)}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors border-l-4 ${
                  colorTheme.border.replace('border-', 'border-l-') || 'border-l-indigo-500'
                } hover:bg-slate-50/80 dark:hover:bg-slate-800/40`}
              >
                {/* Pillar ID, Title & Progress */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      P0{pIdx + 1}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {pillar.title}
                      </h2>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 font-mono">
                        ({completedInPillar}/8)
                      </span>
                    </div>

                    {/* Progress Bar inside header */}
                    <div className="w-full max-w-xs mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress === 100
                              ? 'bg-emerald-500'
                              : progress >= 50
                              ? 'bg-teal-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                        {progress}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar Header Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* AI Regenerate Pillar Actions */}
                  <button
                    type="button"
                    onClick={() => onGeneratePillarActions(pIdx)}
                    disabled={isGenerating}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 border border-slate-200 dark:border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                    title="Regenerar las 8 acciones de este pilar con Gemini AI"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin text-indigo-600' : ''}`} />
                    <span className="hidden sm:inline">{isGenerating ? 'Generando...' : 'IA'}</span>
                  </button>

                  {/* Zoom to Pillar Modal */}
                  <button
                    type="button"
                    onClick={() => onSelectPillar(pIdx)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                    title="Hacer zoom en el pilar (Editor manual y calibración avanzada)"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Zoom</span>
                  </button>

                  {/* Accordion Chevron */}
                  <button
                    type="button"
                    onClick={() => togglePillar(pIdx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={shouldExpand ? 'Colapsar pilar' : 'Expandir pilar'}
                  >
                    {shouldExpand ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* ===================================================== */}
              {/* NIVEL 3: ACCIONES SUPEDITADAS (Listado de Acciones)   */}
              {/* ===================================================== */}
              {shouldExpand && (
                <div className="border-t border-slate-100 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/40 bg-slate-50/50 dark:bg-slate-950/30">
                  {filteredActions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No hay acciones que coincidan con el filtro actual en este pilar.
                    </div>
                  ) : (
                    filteredActions.map(({ action, actionIndex }) => {
                      const isEditing =
                        editingTarget?.pillarIndex === pIdx &&
                        editingTarget?.actionIndex === actionIndex;

                      return (
                        <div
                          key={`hierarchy-act-${pIdx}-${actionIndex}`}
                          className={`p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors group ${
                            action.isCompleted
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/15 text-slate-600 dark:text-slate-400'
                              : 'hover:bg-white dark:hover:bg-slate-900/60 text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {/* Left: Checkbox + Action Order + Title / Inline Edit */}
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            {/* Toggle Completion Checkbox */}
                            <button
                              type="button"
                              onClick={() => onToggleAction(pIdx, actionIndex)}
                              className="mt-0.5 sm:mt-0 p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-transform active:scale-90 cursor-pointer shrink-0"
                              title={action.isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                            >
                              {action.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/60" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400" />
                              )}
                            </button>

                            {/* Position Badge: A1..A8 */}
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5 sm:mt-0">
                              A{actionIndex + 1}
                            </span>

                            {/* Title (or Inline Editing Field) */}
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingTarget.title}
                                  onChange={(e) =>
                                    setEditingTarget({
                                      ...editingTarget,
                                      title: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  className="w-full px-2.5 py-1 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                                  title="Guardar título"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                                <span
                                  onClick={() => handleStartEdit(pIdx, actionIndex, action.title)}
                                  className={`text-xs sm:text-sm font-medium leading-snug cursor-pointer select-text hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors ${
                                    action.isCompleted
                                      ? 'line-through text-slate-400 dark:text-slate-500'
                                      : 'text-slate-800 dark:text-slate-100'
                                  }`}
                                  title="Haz clic para editar el texto"
                                >
                                  {action.title}
                                </span>

                                {/* Recurring Habit Days (L M X J V S D) Strip */}
                                {action.type === 'recurring' && (
                                  <div className="flex items-center gap-1 pt-1 sm:pt-0 shrink-0">
                                    <span className="text-[10px] font-mono text-slate-400 mr-0.5">Días:</span>
                                    {daysLabels.map((dayLabel, dIdx) => {
                                      const isDayDone = !!action.habitDays?.[dIdx];
                                      return (
                                        <button
                                          key={`habit-day-${action.id}-${dIdx}`}
                                          type="button"
                                          onClick={() => onToggleHabitDay(pIdx, actionIndex, dIdx)}
                                          className={`w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                                            isDayDone
                                              ? 'bg-amber-500 text-white shadow-2xs'
                                              : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                                          }`}
                                          title={`Alternar ${dayLabel}`}
                                        >
                                          {dayLabel}
                                        </button>
                                      );
                                    })}
                                    {action.streakCount > 0 && (
                                      <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center ml-1">
                                        🔥{action.streakCount}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: Function Buttons at the end of each line */}
                          <div className="flex items-center gap-1 sm:gap-1.5 self-end sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                            {/* Toggle Type (One-time vs Recurring) */}
                            <button
                              type="button"
                              onClick={() => onToggleActionType(pIdx, actionIndex)}
                              className={`p-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                                action.type === 'recurring'
                                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700/80'
                              }`}
                              title={
                                action.type === 'recurring'
                                  ? 'Tipo: Hábito recurrente. Clic para cambiar a Tarea Única'
                                  : 'Tipo: Tarea Única. Clic para cambiar a Hábito recurrente'
                              }
                            >
                              {action.type === 'recurring' ? (
                                <>
                                  <RotateCw className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                                  <span className="text-[10px]">Hábito</span>
                                </>
                              ) : (
                                <>
                                  <Target className="h-3 w-3 text-indigo-500" />
                                  <span className="text-[10px]">Única</span>
                                </>
                              )}
                            </button>

                            {/* Edit Action Title Button */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(pIdx, actionIndex, action.title)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Editar texto de la acción"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {/* Recalibrate with AI Button */}
                            <button
                              type="button"
                              onClick={() => onRequestRecalibrate(action, actionIndex, pIdx)}
                              className="p-1.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer text-[11px] font-semibold"
                              title="Recalibrar o desatascar esta acción con Gemini AI"
                            >
                              <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              <span className="hidden sm:inline">Recalibrar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};
